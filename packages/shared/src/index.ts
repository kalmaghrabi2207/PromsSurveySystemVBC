import { z } from "zod";

export const TenantId = z.string().min(1);

export const Language = z.enum(["en", "ar"]);
export type Language = z.infer<typeof Language>;

export const ContactMethod = z.enum(["sms", "email", "whatsapp", "none"]);
export type ContactMethod = z.infer<typeof ContactMethod>;

export const EmrAssignmentCreateRequest = z.object({
  patient: z.object({
    externalPatientId: z.string().min(1).optional(),
    mrnHash: z.string().min(10).optional(),
    nationalIdHash: z.string().min(10).optional()
  }),
  encounter: z.object({
    encounterId: z.string().min(1),
    encounterDate: z.string().min(1),
    clinic: z.string().min(1).optional(),
    department: z.string().min(1).optional(),
    provider: z.string().min(1).optional(),
    diagnosisIcd10: z.array(z.string().min(1)).default([]),
    procedureCodes: z.array(z.string().min(1)).default([])
  }),
  instrumentKey: z.string().min(1),
  preferredLanguage: Language.default("en"),
  preferredContact: z
    .object({
      method: ContactMethod.default("none"),
      destination: z.string().min(1).optional()
    })
    .default({ method: "none" })
});
export type EmrAssignmentCreateRequest = z.infer<
  typeof EmrAssignmentCreateRequest
>;

export const EmrAssignmentCreateResponse = z.object({
  assignmentId: z.string().min(1),
  surveyUrl: z.string().url(),
  expiresAt: z.string().min(1)
});
export type EmrAssignmentCreateResponse = z.infer<
  typeof EmrAssignmentCreateResponse
>;

export const PatientSurveyStartResponse = z.object({
  assignmentId: z.string().min(1),
  instrumentKey: z.string().min(1),
  language: Language,
  title: z.string().min(1),
  version: z.string().min(1),
  expiresAt: z.string().min(1),
  sections: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      groups: z.array(
        z.object({
          id: z.string(),
          title: z.string().optional(),
          questions: z.array(
            z.object({
              id: z.string(),
              type: z.enum(["single_choice", "multi_choice", "text", "number"]),
              text: z.string(),
              required: z.boolean().default(false),
              choices: z
                .array(
                  z.object({
                    id: z.string(),
                    label: z.string(),
                    value: z.string()
                  })
                )
                .default([])
            })
          )
        })
      )
    })
  )
});
export type PatientSurveyStartResponse = z.infer<
  typeof PatientSurveyStartResponse
>;

export const PatientSurveySubmitRequest = z.object({
  responses: z.array(
    z.object({
      questionId: z.string().min(1),
      answer: z.union([z.string(), z.array(z.string()), z.number()])
    })
  )
});
export type PatientSurveySubmitRequest = z.infer<
  typeof PatientSurveySubmitRequest
>;

