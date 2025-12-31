# PROMs/PREMs Surveying Portal (VBHC) — MVP

This repository contains an MVP scaffold for a **multi-tenant** healthcare surveying portal supporting **PROMs/PREMs** for **Value-Based Healthcare (VBHC)**. It is designed for **Saudi healthcare** constraints (PDPL-aware, minimal PHI, on‑prem or cloud deployable).

## Assumptions (explicit)

- **Tenancy model**: every request is scoped to a `tenantId` (facility/customer) derived from `X-Tenant-Id` header (MVP); production can map from subdomain / mTLS cert.
- **Identity**:
  - Admin/clinical users authenticate via **JWT** (MVP). Production recommendation: OIDC (e.g., Keycloak / Azure AD) with MFA.
  - Patients access surveys via **opaque one-time token** (no PHI in URL).
- **PHI minimization**: portal stores **tokenized identifiers** (hashed MRN/National ID) and encounter metadata needed for stratified reporting; no names/phone/email are required to render the survey.
- **Channels**: SMS/email/WhatsApp are **pluggable providers**; MVP includes a “console provider” and job scheduling hooks.
- **Scoring**: initial scoring supports simple sum/average and instrument-specific custom scoring hooks; complex scoring libraries can be added later.
- **Languages**: English/Arabic (RTL) supported via i18n keys; content translations stored per survey version.
- **Compliance**: audit trail, RBAC, retention policies, encryption in transit; encryption at rest is assumed via DB/disk controls (plus optional application-layer field encryption later).

## Repo layout

- `apps/api`: NestJS API (OpenAPI, RBAC, survey engine, EMR assignment endpoints)
- `apps/web`: Next.js web app (Admin UI + Patient survey runner)
- `packages/shared`: shared TypeScript types/schemas
- `docs`: architecture, schema, API spec, roadmap

## Quickstart (local)

1) Start dependencies:

```bash
docker compose up -d
```

2) Install dependencies:

```bash
npm install
```

3) Configure environment:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

4) Run database migrations + seed (MVP):

```bash
npm run -w @app/api db:migrate
npm run -w @app/api db:seed
```

5) Run dev:

```bash
npm run dev
```

## Docs

- `docs/architecture.md`
- `docs/database-schema.md`
- `docs/api-spec.md`
- `docs/ui-pages.md`
- `docs/mvp-scope-roadmap.md`

# PromsSurveySystemVBC
Survey Management System for value Based Healthcare
