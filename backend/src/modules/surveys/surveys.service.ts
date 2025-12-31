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
    const exists = await this.instruments.findOne({ where: { tenantId, instrumentKey: dto.instrumentKey } });
    if (exists) throw new BadRequestException("Instrument already exists");

    const instrument = await this.instruments.save({
      tenantId,
      instrumentKey: dto.instrumentKey,
      displayName: dto.displayName
    });

    const version = await this.versions.save({
      tenantId,
      instrumentId: instrument.id,
      version: dto.version ?? "1.0",
      status: "published",
      defaultLanguage: dto.defaultLanguage ?? "en",
      title: dto.title,
      publishedAt: new Date()
    });

    return { instrument, version };
  }

  async listInstruments(tenantId: string) {
    return this.instruments.find({ where: { tenantId }, order: { createdAt: "DESC" } });
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
      publishedAt: null
    });

    await this.persistDefinition(tenantId, instrument, version, dto.definition);
    return version;
  }

  async publishVersion(tenantId: string, instrumentKey: string, version: string) {
    const instrument = await this.instruments.findOne({ where: { tenantId, instrumentKey } });
    if (!instrument) throw new NotFoundException("Instrument not found");
    const iv = await this.versions.findOne({ where: { tenantId, instrumentId: instrument.id, version } });
    if (!iv) throw new NotFoundException("Version not found");
    if (iv.status === "published") return iv;
    iv.status = "published";
    iv.publishedAt = new Date();
    return this.versions.save(iv);
  }

  async getPublishedVersion(tenantId: string, instrumentKey: string) {
    const instrument = await this.instruments.findOne({ where: { tenantId, instrumentKey } });
    if (!instrument) throw new NotFoundException("Instrument not found");
    const iv = await this.versions.findOne({
      where: { tenantId, instrumentId: instrument.id, status: "published" as const },
      order: { publishedAt: "DESC" }
    });
    if (!iv) throw new NotFoundException("No published version");
    return { instrument, version: iv };
  }

  async getDefinition(
    tenantId: string,
    instrumentKey: string,
    instrumentVersionId: string,
    language: "en" | "ar"
  ) {
    const instrument = await this.instruments.findOne({ where: { tenantId, instrumentKey } });
    if (!instrument) throw new NotFoundException("Instrument not found");

    const iv = await this.versions.findOne({ where: { tenantId, id: instrumentVersionId } });
    if (!iv) throw new NotFoundException("Instrument version not found");

    const sections = await this.sections.find({
      where: { tenantId, instrumentVersionId: iv.id },
      order: { orderNo: "ASC" }
    });
    const groups = await this.groups.find({ where: { tenantId }, order: { orderNo: "ASC" } });
    const questions = await this.questions.find({ where: { tenantId, instrumentVersionId: iv.id } });
    const choices = await this.choices.find({ where: { tenantId } });
    const validations = await this.validations.find({ where: { tenantId } });
    const translations = await this.translations.find({
      where: { tenantId, instrumentVersionId: iv.id, language }
    });
    const tMap = new Map(translations.map((t) => [t.key, t.text]));

    return {
      instrumentKey: instrument.instrumentKey,
      title: iv.title,
      version: iv.version,
      language,
      sections: sections.map((s) => {
        const secGroups = groups.filter((g) => g.sectionId === s.id && !g.parentGroupId);
        return {
          id: s.id,
          title: tMap.get(s.titleKey) ?? s.titleKey,
          groups: secGroups.map((g) => {
            const childGroups = groups.filter((cg) => cg.parentGroupId === g.id);
            const packQuestions = (groupId: string) =>
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
                    validation: v
                      ? {
                          required: v.required,
                          minNumeric: v.minNumeric,
                          maxNumeric: v.maxNumeric,
                          regex: v.regex
                        }
                      : null
                  };
                });

            return {
              id: g.id,
              title: g.titleKey ? tMap.get(g.titleKey) ?? g.titleKey : null,
              subGroups: childGroups.map((cg) => ({
                id: cg.id,
                title: cg.titleKey ? tMap.get(cg.titleKey) ?? cg.titleKey : null,
                questions: packQuestions(cg.id)
              })),
              questions: packQuestions(g.id)
            };
          })
        };
      })
    };
  }

  async persistDefinition(
    tenantId: string,
    instrument: Instrument,
    iv: InstrumentVersion,
    def: SurveyDefinitionDto
  ) {
    if (!def?.sections?.length) throw new BadRequestException("definition.sections is required");

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

        const group = await this.groups.save({
          tenantId,
          sectionId: section.id,
          parentGroupId: null,
          orderNo: gIdx + 1,
          titleKey: groupTitleKey,
          subgroupKey: null
        });

        for (let qIdx = 0; qIdx < g.questions.length; qIdx++) {
          const q = g.questions[qIdx]!;
          const qTextKey = mkKey("q", [iv.version, sIdx + 1, gIdx + 1, qIdx + 1, q.code]);
          await this.upsertTranslation(tenantId, iv.id, qTextKey, q.text);

          const question = await this.questions.save({
            tenantId,
            instrumentId: instrument.id,
            instrumentVersionId: iv.id,
            questionGroupId: group.id,
            orderNo: qIdx + 1,
            code: q.code,
            type: q.type,
            textKey: qTextKey,
            isRequired: Boolean(q.required),
            scoreWeight: String(q.scoreWeight ?? 1)
          });

          await this.validations.save({
            tenantId,
            questionId: question.id,
            required: q.required ?? null,
            minNumeric: q.min != null ? String(q.min) : null,
            maxNumeric: q.max != null ? String(q.max) : null,
            regex: null,
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

