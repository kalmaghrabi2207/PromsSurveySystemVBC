import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { code: "demo" },
    update: {},
    create: { code: "demo", name: "Demo Facility" }
  });

  const passwordHash = await bcrypt.hash("admin1234", 12);
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "admin@demo.local" } },
    update: { passwordHash, isActive: true, role: "TENANT_ADMIN" },
    create: {
      tenantId: tenant.id,
      email: "admin@demo.local",
      passwordHash,
      role: "TENANT_ADMIN"
    }
  });

  const instrument = await prisma.instrument.upsert({
    where: { tenantId_key: { tenantId: tenant.id, key: "NPS_LITE" } },
    update: {},
    create: { tenantId: tenant.id, key: "NPS_LITE", isPublished: true }
  });

  const version = await prisma.surveyVersion.upsert({
    where: {
      tenantId_instrumentId_version: {
        tenantId: tenant.id,
        instrumentId: instrument.id,
        version: "1.0"
      }
    },
    update: { status: "published", publishedAt: new Date(), title: "Experience Survey" },
    create: {
      tenantId: tenant.id,
      instrumentId: instrument.id,
      version: "1.0",
      status: "published",
      publishedAt: new Date(),
      language: "en",
      title: "Experience Survey"
    }
  });

  const section = await prisma.surveySection.create({
    data: {
      tenantId: tenant.id,
      surveyVersionId: version.id,
      order: 1,
      titleKey: "section.main"
    }
  });

  const group = await prisma.questionGroup.create({
    data: { tenantId: tenant.id, sectionId: section.id, order: 1, titleKey: "group.main" }
  });

  const q1 = await prisma.question.create({
    data: {
      tenantId: tenant.id,
      groupId: group.id,
      order: 1,
      type: "single_choice",
      textKey: "q.nps",
      isRequired: true,
      scoreWeight: 1
    }
  });

  for (let i = 0; i <= 10; i++) {
    await prisma.answerChoice.create({
      data: {
        tenantId: tenant.id,
        questionId: q1.id,
        order: i + 1,
        labelKey: `choice.nps.${i}`,
        value: String(i),
        score: i
      }
    });
  }

  await prisma.question.create({
    data: {
      tenantId: tenant.id,
      groupId: group.id,
      order: 2,
      type: "text",
      textKey: "q.comment",
      isRequired: false
    }
  });

  const translations = [
    // English
    ["section.main", "Main"],
    ["group.main", "Your experience"],
    ["q.nps", "How likely are you to recommend our clinic to a friend or family member?"],
    ["q.comment", "Any additional comments?"],
    ...Array.from({ length: 11 }).map((_, i) => [`choice.nps.${i}`, String(i)] as const),
    // Arabic (basic placeholder)
    ["section.main", "الرئيسية"],
    ["group.main", "تجربتك"],
    ["q.nps", "ما مدى احتمالية أن توصي بعيادتنا لأحد أفراد العائلة أو الأصدقاء؟"],
    ["q.comment", "هل لديك أي ملاحظات إضافية؟"]
  ];

  for (const [key, text] of translations) {
    const language = /[؀-ۿ]/.test(text) ? "ar" : "en";
    await prisma.translation.upsert({
      where: {
        surveyVersionId_language_key: {
          surveyVersionId: version.id,
          language,
          key
        }
      },
      update: { text },
      create: { tenantId: tenant.id, surveyVersionId: version.id, language, key, text }
    });
  }

  // Example: store EMR API key hash as an AuditEvent record (MVP shortcut)
  // Production: dedicated table with rotation and mTLS.
  await prisma.auditEvent.create({
    data: {
      tenantId: tenant.id,
      action: "seed.emr_api_key_hash",
      entity: "system",
      metadata: { emrApiKeyHash: sha256(process.env.EMR_API_KEY ?? "dev_emr_api_key_change_me") }
    }
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

