import "reflect-metadata";
import { DataSource } from "typeorm";
import bcrypt from "bcryptjs";
import { UserRole, QuestionType } from "./common/enums";
import { Tenant } from "./entities/tenant.entity";
import { User } from "./entities/user.entity";
import { Instrument } from "./entities/instrument.entity";
import { InstrumentVersion } from "./entities/instrument-version.entity";
import { Section } from "./entities/section.entity";
import { QuestionGroup } from "./entities/question-group.entity";
import { Question } from "./entities/question.entity";
import { AnswerChoice } from "./entities/answer-choice.entity";
import { QuestionValidation } from "./entities/question-validation.entity";
import { TranslationText } from "./entities/translation-text.entity";

const ds = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [
    Tenant,
    User,
    Instrument,
    InstrumentVersion,
    Section,
    QuestionGroup,
    Question,
    AnswerChoice,
    QuestionValidation,
    TranslationText
  ],
  synchronize: true
});

async function upsertTranslation(
  repo: any,
  tenantId: string,
  instrumentVersionId: string,
  language: "en" | "ar",
  key: string,
  text: string
) {
  await repo.upsert({ tenantId, instrumentVersionId, language, key, text }, ["instrumentVersionId", "language", "key"]);
}

async function seedInstrument(params: {
  tenantId: string;
  instrumentKey: string;
  displayName: string;
  titleEn: string;
  titleAr: string;
  questions: Array<{
    code: string;
    textEn: string;
    textAr: string;
    type: QuestionType;
    required?: boolean;
    options?: Array<{ value: string; labelEn: string; labelAr: string; score?: number }>;
  }>;
}) {
  const instrumentRepo = ds.getRepository(Instrument);
  const versionRepo = ds.getRepository(InstrumentVersion);
  const sectionRepo = ds.getRepository(Section);
  const groupRepo = ds.getRepository(QuestionGroup);
  const questionRepo = ds.getRepository(Question);
  const choiceRepo = ds.getRepository(AnswerChoice);
  const validationRepo = ds.getRepository(QuestionValidation);
  const translationRepo = ds.getRepository(TranslationText);

  let instrument = await instrumentRepo.findOne({ where: { tenantId: params.tenantId, instrumentKey: params.instrumentKey } });
  if (!instrument) {
    instrument = await instrumentRepo.save({
      tenantId: params.tenantId,
      instrumentKey: params.instrumentKey,
      displayName: params.displayName
    });
  }

  let iv = await versionRepo.findOne({
    where: { tenantId: params.tenantId, instrumentId: instrument.id, version: "1.0" }
  });
  if (!iv) {
    iv = await versionRepo.save({
      tenantId: params.tenantId,
      instrumentId: instrument.id,
      version: "1.0",
      status: "published",
      defaultLanguage: "en",
      title: params.titleEn,
      publishedAt: new Date()
    });
  }

  const sectionKey = `${params.instrumentKey}.section.1`;
  const section = await sectionRepo.save({
    tenantId: params.tenantId,
    instrumentVersionId: iv.id,
    orderNo: 1,
    titleKey: sectionKey
  });
  await upsertTranslation(translationRepo, params.tenantId, iv.id, "en", sectionKey, "Main");
  await upsertTranslation(translationRepo, params.tenantId, iv.id, "ar", sectionKey, "الرئيسية");

  const groupKey = `${params.instrumentKey}.group.1`;
  const group = await groupRepo.save({
    tenantId: params.tenantId,
    sectionId: section.id,
    parentGroupId: null,
    orderNo: 1,
    titleKey: groupKey,
    subgroupKey: null
  });
  await upsertTranslation(translationRepo, params.tenantId, iv.id, "en", groupKey, "Questions");
  await upsertTranslation(translationRepo, params.tenantId, iv.id, "ar", groupKey, "الأسئلة");

  for (let i = 0; i < params.questions.length; i++) {
    const q = params.questions[i]!;
    const qKey = `${params.instrumentKey}.q.${q.code}`;
    const question = await questionRepo.save({
      tenantId: params.tenantId,
      instrumentId: instrument.id,
      instrumentVersionId: iv.id,
      questionGroupId: group.id,
      orderNo: i + 1,
      code: q.code,
      type: q.type,
      textKey: qKey,
      isRequired: Boolean(q.required),
      scoreWeight: "1"
    });
    await validationRepo.save({
      tenantId: params.tenantId,
      questionId: question.id,
      required: q.required ?? null,
      minNumeric: null,
      maxNumeric: null,
      regex: null,
      ruleJson: {}
    });
    await upsertTranslation(translationRepo, params.tenantId, iv.id, "en", qKey, q.textEn);
    await upsertTranslation(translationRepo, params.tenantId, iv.id, "ar", qKey, q.textAr);

    if (q.options?.length) {
      for (let j = 0; j < q.options.length; j++) {
        const o = q.options[j]!;
        const cKey = `${params.instrumentKey}.choice.${q.code}.${o.value}`;
        await choiceRepo.save({
          tenantId: params.tenantId,
          questionId: question.id,
          orderNo: j + 1,
          labelKey: cKey,
          value: o.value,
          scoreValue: o.score != null ? String(o.score) : null
        });
        await upsertTranslation(translationRepo, params.tenantId, iv.id, "en", cKey, o.labelEn);
        await upsertTranslation(translationRepo, params.tenantId, iv.id, "ar", cKey, o.labelAr);
      }
    }
  }

  return { instrument, version: iv };
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  await ds.initialize();

  const tenantRepo = ds.getRepository(Tenant);
  const userRepo = ds.getRepository(User);

  let tenant = await tenantRepo.findOne({ where: { code: "demo" } });
  if (!tenant) tenant = await tenantRepo.save({ code: "demo", name: "Demo Facility" });

  const passwordHash = await bcrypt.hash("admin1234", 12);
  const existingAdmin = await userRepo.findOne({ where: { tenantId: tenant.id, email: "admin@demo.local" } });
  if (!existingAdmin) {
    await userRepo.save({
      tenantId: tenant.id,
      email: "admin@demo.local",
      passwordHash,
      role: UserRole.TenantAdmin,
      isActive: true
    });
  }

  // PROM instrument
  await seedInstrument({
    tenantId: tenant.id,
    instrumentKey: "PROM_LITE",
    displayName: "PROM Lite",
    titleEn: "PROM Lite",
    titleAr: "مقياس النتائج (مبسط)",
    questions: [
      {
        code: "PROM_1",
        type: QuestionType.NumericScale,
        required: true,
        textEn: "Rate your health today (0-10).",
        textAr: "قيّم صحتك اليوم (0-10)."
      },
      {
        code: "PROM_2",
        type: QuestionType.NrsPain,
        required: true,
        textEn: "Pain level (0-10).",
        textAr: "مستوى الألم (0-10)."
      }
    ]
  });

  // PREM instrument
  await seedInstrument({
    tenantId: tenant.id,
    instrumentKey: "PREM_LITE",
    displayName: "PREM Lite",
    titleEn: "PREM Lite",
    titleAr: "مقياس تجربة المريض (مبسط)",
    questions: [
      {
        code: "NPS",
        type: QuestionType.SingleChoice,
        required: true,
        textEn: "How likely are you to recommend us? (0-10)",
        textAr: "ما مدى احتمالية أن توصي بنا؟ (0-10)",
        options: Array.from({ length: 11 }).map((_, i) => ({
          value: String(i),
          labelEn: String(i),
          labelAr: String(i),
          score: i
        }))
      },
      {
        code: "COMMENT",
        type: QuestionType.FreeText,
        required: false,
        textEn: "Any comments?",
        textAr: "هل لديك أي ملاحظات؟"
      }
    ]
  });

  // eslint-disable-next-line no-console
  console.log("Seed complete.");
  console.log(`TENANT_ID=${tenant.id}`);
  await ds.destroy();
}

main().catch(async (e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  try {
    await ds.destroy();
  } catch {}
  process.exit(1);
});

