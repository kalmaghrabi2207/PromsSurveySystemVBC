import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Instrument } from "../../entities/instrument.entity";
import { InstrumentVersion } from "../../entities/instrument-version.entity";
import { Section } from "../../entities/section.entity";
import { QuestionGroup } from "../../entities/question-group.entity";
import { Question } from "../../entities/question.entity";
import { AnswerChoice } from "../../entities/answer-choice.entity";
import { QuestionValidation } from "../../entities/question-validation.entity";
import { TranslationText } from "../../entities/translation-text.entity";
import { CreateInstrumentDto } from "./dto/create-instrument.dto";
import { CreateVersionDto, SurveyDefinitionDto } from "./dto/create-version.dto";

function mkKey(prefix: string, parts: Array<string | number>) {
  return `${prefix}.${parts.join(".")}`;
}

@Injectable()
export class SurveysService {
  constructor(
    @InjectRepository(Instrument) private readonly instruments: Repository<Instrument>,
    @InjectRepository(InstrumentVersion) private readonly versions: Repository<InstrumentVersion>,
    @InjectRepository(Section) private readonly sections: Repository<Section>,
    @InjectRepository(QuestionGroup) private readonly groups: Repository<QuestionGroup>,
    @InjectRepository(Question) private readonly questions: Repository<Question>,
    @InjectRepository(AnswerChoice) private readonly choices: Repository<AnswerChoice>,
    @InjectRepository(QuestionValidation) private readonly validations: Repository<QuestionValidation>,
    @InjectRepository(TranslationText) private readonly translations: Repository<TranslationText>
  ) {}

  async createInstrument(tenantId: string, dto: CreateInstrumentDto) {
    const exists = await this.instruments.findOne({
      where: { tenantId, instrumentKey: dto.instrumentKey }
    });
    if (exists) throw new BadRequestException("Instrument already exists");

    const instrument = await this.instruments.save({
      tenantId,
      instrumentKey: dto.instrumentKey,
      displayName: dto.displayName,
      subdomainId: null
    });

    const version = await this.versions.save({
      tenantId,
      instrumentId: instrument.id,
      version: dto.version ?? "1.0-draft",
      status: "draft",
      defaultLanguage: dto.defaultLanguage ?? "en",
      title: dto.title,
      publishedAt: null,
      validFrom: null,
      validTo: null
    });

    return { instrument, version };
  }

  async listInstruments(tenantId: string) {
    const rows = await this.instruments.find({ where: { tenantId }, order: { createdAt: "DESC" } });
    return rows;
  }

  async createVersion(tenantId: string, instrumentKey: string, dto: CreateVersionDto) {
    const instrument = await this.instruments.findOne({ where: { tenantId, instrumentKey } });
    if (!instrument) throw new NotFoundException("Instrument not found");

    const existing = await this.versions.findOne({
      where: { tenantId, instrumentId: instrument.id, version: dto.version }
    });
    if (existing) throw new BadRequestException("Version already exists");

    const version = await this.versions.save({
      tenantId,
      instrumentId: instrument.id,
      version: dto.version,
      status: "draft",
      defaultLanguage: dto.defaultLanguage ?? "en",
      title: dto.title,
      publishedAt: null,
      validFrom: null,
      validTo: null
    });

    await this.persistDefinition(tenantId, instrument, version, dto.definition);
    return version;
  }

  async getInstrumentVersionByKey(tenantId: string, instrumentKey: string, version?: string) {
    const instrument = await this.instruments.findOne({ where: { tenantId, instrumentKey } });
    if (!instrument) throw new NotFoundException("Instrument not found");

    const iv = version
      ? await this.versions.findOne({ where: { tenantId, instrumentId: instrument.id, version } })
      : await this.versions.findOne({
          where: { tenantId, instrumentId: instrument.id, status: "published" as const },
          order: { publishedAt: "DESC" as const }
        });
    if (!iv) throw new NotFoundException("Instrument version not found");
    return { instrument, version: iv };
  }

  async getDefinition(tenantId: string, instrumentKey: string, version?: string, language?: "en" | "ar") {
    const { instrument, version: iv } = await this.getInstrumentVersionByKey(
      tenantId,
      instrumentKey,
      version
    );

    const sections = await this.sections.find({
      where: { tenantId, instrumentVersionId: iv.id },
      order: { orderNo: "ASC" }
    });
    const groups = await this.groups.find({
      where: { tenantId },
      order: { orderNo: "ASC" }
    });
    const questions = await this.questions.find({ where: { tenantId, instrumentId: instrument.id } });
    const choices = await this.choices.find({ where: { tenantId } });
    const validations = await this.validations.find({ where: { tenantId } });
    const lang = language ?? iv.defaultLanguage;
    const translations = await this.translations.find({
      where: { tenantId, instrumentVersionId: iv.id, language: lang }
    });
    const tMap = new Map(translations.map((t) => [t.key, t.text]));

    const sectionObjs = sections.map((s) => {
      const secGroups = groups.filter((g) => g.sectionId === s.id && !g.parentGroupId);
      return {
        id: s.id,
        title: tMap.get(s.titleKey) ?? s.titleKey,
        groups: secGroups
          .sort((a, b) => a.orderNo - b.orderNo)
          .map((g) => {
            const childGroups = groups
              .filter((cg) => cg.parentGroupId === g.id)
              .sort((a, b) => a.orderNo - b.orderNo);

            const groupQuestions = (groupId: string) =>
              questions
                .filter((q) => q.questionGroupId === groupId)
                .sort((a, b) => a.orderNo - b.orderNo)
                .map((q) => {
                  const qChoices = choices
                    .filter((c) => c.questionId === q.id)
                    .sort((a, b) => a.orderNo - b.orderNo)
                    .map((c) => ({
                      id: c.id,
                      label: tMap.get(c.labelKey) ?? c.labelKey,
                      value: c.value
                    }));
                  const v = validations.find((vv) => vv.questionId === q.id);
                  return {
                    id: q.id,
                    code: q.code,
                    type: q.type,
                    text: tMap.get(q.textKey) ?? q.textKey,
                    required: q.isRequired,
                    choices: qChoices,
                    validation: v ?? null
                  };
                });

            const groupPayload = {
              id: g.id,
              title: g.titleKey ? tMap.get(g.titleKey) ?? g.titleKey : undefined,
              subgroupTitle: g.subgroupKey ? tMap.get(g.subgroupKey) ?? g.subgroupKey : undefined,
              questions: groupQuestions(g.id),
              subGroups: childGroups.map((cg) => ({
                id: cg.id,
                title: cg.titleKey ? tMap.get(cg.titleKey) ?? cg.titleKey : undefined,
                subgroupTitle: cg.subgroupKey ? tMap.get(cg.subgroupKey) ?? cg.subgroupKey : undefined,
                questions: groupQuestions(cg.id)
              }))
            };
            return groupPayload;
          })
      };
    });

    return {
      instrumentKey: instrument.instrumentKey,
      title: iv.title,
      version: iv.version,
      language: lang,
      sections: sectionObjs
    };
  }

  private async persistDefinition(
    tenantId: string,
    instrument: Instrument,
    iv: InstrumentVersion,
    def: SurveyDefinitionDto
  ) {
    if (!def?.sections?.length) throw new BadRequestException("definition.sections is required");

    // Build entities in-order. Keep keys stable based on indices.
    for (let sIdx = 0; sIdx < def.sections.length; sIdx++) {
      const s = def.sections[sIdx]!;
      const sectionTitleKey = mkKey("section", [iv.version, sIdx + 1, "title"]);
      const section = await this.sections.save({
        tenantId,
        instrumentVersionId: iv.id,
        orderNo: sIdx + 1,
        titleKey: sectionTitleKey
      });
      await this.upsertTranslation(tenantId, iv.id, sectionTitleKey, s.title);

      for (let gIdx = 0; gIdx < s.groups.length; gIdx++) {
        const g = s.groups[gIdx]!;
        const groupTitleKey = g.title ? mkKey("group", [iv.version, sIdx + 1, gIdx + 1, "title"]) : null;
        if (groupTitleKey && g.title) await this.upsertTranslation(tenantId, iv.id, groupTitleKey, g.title);

        const subgroupKey = g.subgroupTitle
          ? mkKey("group", [iv.version, sIdx + 1, gIdx + 1, "subgroup"])
          : null;
        if (subgroupKey && g.subgroupTitle) await this.upsertTranslation(tenantId, iv.id, subgroupKey, g.subgroupTitle);

        const group = await this.groups.save({
          tenantId,
          sectionId: section.id,
          parentGroupId: null,
          orderNo: gIdx + 1,
          titleKey: groupTitleKey,
          subgroupKey
        });

        await this.persistQuestions(tenantId, instrument, iv, group.id, sIdx, gIdx, g.questions);
      }
    }
  }

  private async persistQuestions(
    tenantId: string,
    instrument: Instrument,
    iv: InstrumentVersion,
    groupId: string,
    sIdx: number,
    gIdx: number,
    qs: CreateVersionDto["definition"]["sections"][0]["groups"][0]["questions"]
  ) {
    for (let qIdx = 0; qIdx < qs.length; qIdx++) {
      const q = qs[qIdx]!;
      const qTextKey = mkKey("q", [iv.version, sIdx + 1, gIdx + 1, qIdx + 1, q.code]);
      await this.upsertTranslation(tenantId, iv.id, qTextKey, q.text);

      const question = await this.questions.save({
        tenantId,
        instrumentId: instrument.id,
        questionGroupId: groupId,
        orderNo: qIdx + 1,
        code: q.code,
        type: q.type,
        textKey: qTextKey,
        helpTextKey: null,
        isRequired: Boolean(q.required),
        scoreWeight: String(q.scoreWeight ?? 1)
      });

      await this.validations.save({
        tenantId,
        questionId: question.id,
        required: q.required ?? null,
        minNumeric: q.min != null ? String(q.min) : null,
        maxNumeric: q.max != null ? String(q.max) : null,
        minDate: null,
        maxDate: null,
        regex: null,
        maxLength: null,
        ruleJson: {}
      });

      if (q.options?.length) {
        for (let oIdx = 0; oIdx < q.options.length; oIdx++) {
          const o = q.options[oIdx]!;
          const cKey = mkKey("choice", [iv.version, q.code, oIdx + 1, o.value]);
          await this.upsertTranslation(tenantId, iv.id, cKey, o.label);
          await this.choices.save({
            tenantId,
            questionId: question.id,
            orderNo: oIdx + 1,
            labelKey: cKey,
            value: o.value,
            scoreValue: o.score != null ? String(o.score) : null
          });
        }
      }
    }
  }

  private async upsertTranslation(
    tenantId: string,
    instrumentVersionId: string,
    key: string,
    text: { en: string; ar?: string }
  ) {
    await this.translations.upsert(
      { tenantId, instrumentVersionId, language: "en", key, text: text.en },
      ["instrumentVersionId", "language", "key"]
    );
    if (text.ar) {
      await this.translations.upsert(
        { tenantId, instrumentVersionId, language: "ar", key, text: text.ar },
        ["instrumentVersionId", "language", "key"]
      );
    }
  }
}

