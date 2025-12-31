export enum UserRole {
  SuperAdmin = "SuperAdmin",
  TenantAdmin = "TenantAdmin",
  ClinicalManager = "ClinicalManager",
  Analyst = "Analyst",
  Support = "Support",
  ReadOnly = "ReadOnly"
}

export enum AssignmentStatus {
  Created = "created",
  Sent = "sent",
  Opened = "opened",
  InProgress = "in_progress",
  Completed = "completed",
  Expired = "expired",
  Revoked = "revoked"
}

export enum OutreachChannel {
  Sms = "sms",
  Email = "email",
  Whatsapp = "whatsapp"
}

export enum DeliveryStatus {
  Queued = "queued",
  Sent = "sent",
  Delivered = "delivered",
  Failed = "failed"
}

export enum QuestionType {
  SingleChoice = "single_choice",
  MultiChoice = "multi_choice",
  Likert = "likert",
  NumericScale = "numeric_scale",
  FreeText = "free_text",
  Date = "date",
  NrsPain = "nrs_pain",
  PromisPlaceholder = "promis_tscore_placeholder"
}

