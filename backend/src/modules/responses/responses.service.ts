import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { sha256Hex } from "../../common/crypto";
import { AssignmentStatus } from "../../common/enums";
import { AnswerChoice } from "../../entities/answer-choice.entity";
import { AssignmentToken } from "../../entities/assignment-token.entity";
import { InstrumentVersion } from "../../entities/instrument-version.entity";
import { Question } from "../../entities/question.entity";
import { SurveyAssignment } from "../../entities/survey-assignment.entity";
import { SurveyResponse } from "../../entities/survey-response.entity";
import { SurveyResponseItem } from "../../entities/survey-response-item.entity";
import { SurveysService } from "../surveys/surveys.service";

@Injectable()
export class ResponsesService {
  constructor(
    @InjectRepository(AssignmentToken) private readonly tokens: Repository<AssignmentToken>,
    @InjectRepository(SurveyAssignment) private readonly assignments: Repository<SurveyAssignment>,
    @InjectRepository(SurveyResponse) private readonly responses: Repository<SurveyResponse>,
    @InjectRepository(SurveyResponseItem) private readonly items: Repository<SurveyResponseItem>,
    @InjectRepository(Question) private readonly questions: Repository<Question>,
    @InjectRepository(AnswerChoice) private readonly choices: Repository<AnswerChoice>,
    @InjectRepository(InstrumentVersion) private readonly versions: Repository<InstrumentVersion>,
    private readonly surveys: SurveysService
  ) {}

  async start(token: string) {
    const tokenHash = sha256Hex(token);
    const at = await this.tokens.findOne({ where: { tokenHash } });
    if (!at || at.revokedAt) throw new NotFoundException("Link invalid");
    if (at.expiresAt.getTime() < Date.now()) throw new BadRequestException("Link expired");

    const assignment = await this.assignments.findOne({ where: { id: at.assignmentId, tenantId: at.tenantId } });
    if (!assignment) throw new NotFoundException("Assignment not found");

    if (!assignment.openedAt) assignment.openedAt = new Date();
    if (assignment.status === AssignmentStatus.Created || assignment.status === AssignmentStatus.Sent) {
      assignment.status = AssignmentStatus.Opened;
    }
    await this.assignments.save(assignment);

    if (!at.usedAt) {
      at.usedAt = new Date();
      await this.tokens.save(at);
    }

    const lang = assignment.preferredLanguage ?? "en";
    const def = await this.surveys.getDefinition(at.tenantId, assignment.instrumentKey, assignment.instrumentVersionId, lang);

    const existingResponse = await this.responses.findOne({ where: { tenantId: at.tenantId, assignmentId: assignment.id } });
    const existingItems = existingResponse
      ? await this.items.find({ where: { tenantId: at.tenantId, responseId: existingResponse.id } })
      : [];

    return {
      assignmentId: assignment.id,
      instrumentKey: assignment.instrumentKey,
      instrumentVersionId: assignment.instrumentVersionId,
      expiresAt: at.expiresAt.toISOString(),
      status: assignment.status,
      survey: def,
      existingAnswers: existingItems.map((i) => ({ questionId: i.questionId, answer: i.answerJson }))
    };
  }

  async save(token: string, payload: { responses: Array<{ questionId: string; answer: any }> }) {
    const tokenHash = sha256Hex(token);
    const at = await this.tokens.findOne({ where: { tokenHash } });
    if (!at || at.revokedAt) throw new NotFoundException("Link invalid");
    if (at.expiresAt.getTime() < Date.now()) throw new BadRequestException("Link expired");

    const assignment = await this.assignments.findOne({ where: { id: at.assignmentId, tenantId: at.tenantId } });
    if (!assignment) throw new NotFoundException("Assignment not found");
    if (assignment.status === AssignmentStatus.Completed) throw new BadRequestException("Already completed");

    let response = await this.responses.findOne({ where: { tenantId: at.tenantId, assignmentId: assignment.id } });
    if (!response) {
      response = await this.responses.save({
        tenantId: at.tenantId,
        assignmentId: assignment.id,
        completedAt: null,
        totalSeconds: null,
        scoreJson: {},
        freeText: null,
        sentiment: null
      });
    }

    for (const r of payload.responses) {
      await this.items.upsert(
        {
          tenantId: at.tenantId,
          responseId: response.id,
          questionId: r.questionId,
          answerJson: r.answer
        },
        ["responseId", "questionId"]
      );
    }

    assignment.status = AssignmentStatus.InProgress;
    await this.assignments.save(assignment);

    return { ok: true, responseId: response.id };
  }

  async submit(token: string, payload: { responses: Array<{ questionId: string; answer: any }> }) {
    const started = Date.now();
    const tokenHash = sha256Hex(token);
    const at = await this.tokens.findOne({ where: { tokenHash } });
    if (!at || at.revokedAt) throw new NotFoundException("Link invalid");
    if (at.expiresAt.getTime() < Date.now()) throw new BadRequestException("Link expired");

    const assignment = await this.assignments.findOne({ where: { id: at.assignmentId, tenantId: at.tenantId } });
    if (!assignment) throw new NotFoundException("Assignment not found");

    const version = await this.versions.findOne({ where: { tenantId: at.tenantId, id: assignment.instrumentVersionId } });
    if (!version) throw new NotFoundException("Instrument version not found");

    // Ensure response exists + upsert items
    const saveRes = await this.save(token, payload);
    const response = await this.responses.findOne({ where: { tenantId: at.tenantId, id: saveRes.responseId } });
    if (!response) throw new NotFoundException("Response not found");

    // Minimal scoring: sum of numeric answers or choice scores when available
    const qs = await this.questions.find({ where: { tenantId: at.tenantId, instrumentVersionId: assignment.instrumentVersionId } });
    const qSet = new Set(qs.map((q) => q.id));
    const items = await this.items.find({ where: { tenantId: at.tenantId, responseId: response.id } });
    const relevant = items.filter((i) => qSet.has(i.questionId));

    const choiceMap = new Map<string, AnswerChoice[]>();
    const allChoices = await this.choices.find({ where: { tenantId: at.tenantId } });
    for (const c of allChoices) {
      const arr = choiceMap.get(c.questionId) ?? [];
      arr.push(c);
      choiceMap.set(c.questionId, arr);
    }

    let total = 0;
    for (const it of relevant) {
      const ans = it.answerJson as any;
      if (typeof ans === "number") total += ans;
      if (typeof ans === "string") {
        const cs = choiceMap.get(it.questionId) ?? [];
        const matched = cs.find((c) => c.value === ans);
        if (matched?.scoreValue != null) total += Number(matched.scoreValue);
        else if (/^-?\d+(\.\d+)?$/.test(ans)) total += Number(ans);
      }
      if (Array.isArray(ans)) {
        for (const v of ans) {
          const cs = choiceMap.get(it.questionId) ?? [];
          const matched = cs.find((c) => c.value === v);
          if (matched?.scoreValue != null) total += Number(matched.scoreValue);
        }
      }
    }

    response.completedAt = new Date();
    response.totalSeconds = response.totalSeconds ?? Math.max(1, Math.round((Date.now() - started) / 1000));
    response.scoreJson = { TOTAL: total };
    await this.responses.save(response);

    assignment.status = AssignmentStatus.Completed;
    await this.assignments.save(assignment);

    return { ok: true, assignmentId: assignment.id, scores: response.scoreJson };
  }
}

