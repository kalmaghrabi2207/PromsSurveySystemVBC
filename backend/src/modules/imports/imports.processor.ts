import { Processor, WorkerHost } from "@nestjs/bullmq";
import { InjectRepository } from "@nestjs/typeorm";
import { Job } from "bullmq";
import { Repository } from "typeorm";
import fs from "fs";
import path from "path";
import { parse as parseCsv } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { ImportJob } from "../../entities/import-job.entity";
import { Instrument } from "../../entities/instrument.entity";
import { InstrumentVersion } from "../../entities/instrument-version.entity";
import { Question } from "../../entities/question.entity";
import { SurveysService } from "../surveys/surveys.service";
import { QuestionType } from "../../common/enums";

type Row = {
  Domain?: string;
  Subdomain?: string;
  Instrument?: string;
  Section?: string;
  Group?: string;
  SubGroup?: string;
  QuestionCode?: string;
  QuestionText_EN?: string;
  QuestionText_AR?: string;
  Type?: string;
  Options?: string;
  Required?: string;
  Min?: string;
  Max?: string;
  ScoreWeight?: string;
  LogicJSON?: string;
};

function normKey(s: string) {
  return s.trim().replace(/\s+/g, " ");
}

function toBool(v: string | undefined) {
  const x = (v ?? "").trim().toLowerCase();
  if (!x) return false;
  return ["1", "true", "yes", "y"].includes(x);
}

function toNum(v: string | undefined) {
  if (v == null) return undefined;
  const t = String(v).trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

function parseOptions(options: string | undefined): Array<{ value: string; labelEn: string; labelAr?: string; score?: number }> {
  const raw = (options ?? "").trim();
  if (!raw) return [];
  if (raw.startsWith("[") || raw.startsWith("{")) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((o: any) => ({
        value: String(o.value),
        labelEn: o.label_en ?? o.labelEn ?? String(o.label ?? o.value),
        labelAr: o.label_ar ?? o.labelAr,
        score: o.score != null ? Number(o.score) : undefined
      }));
    }
  }
  // pipe-delimited "value=Label|value=Label"
  return raw.split("|").map((part) => {
    const [v, l] = part.split("=");
    return { value: String(v ?? "").trim(), labelEn: String(l ?? v ?? "").trim() };
  }).filter((o) => o.value.length > 0);
}

function mapType(t: string | undefined): QuestionType {
  const x = (t ?? "").trim().toLowerCase();
  switch (x) {
    case "single":
    case "single_choice":
    case "single choice":
      return QuestionType.SingleChoice;
    case "multi":
    case "multi_choice":
    case "multi choice":
      return QuestionType.MultiChoice;
    case "likert":
      return QuestionType.Likert;
    case "numeric":
    case "numeric_scale":
    case "numeric scale":
      return QuestionType.NumericScale;
    case "text":
    case "free_text":
    case "free text":
      return QuestionType.FreeText;
    case "date":
      return QuestionType.Date;
    case "nrs":
    case "nrs_pain":
      return QuestionType.NrsPain;
    case "promis":
    case "promis_tscore_placeholder":
      return QuestionType.PromisPlaceholder;
    default:
      return QuestionType.FreeText;
  }
}

@Processor("imports")
export class ImportsProcessor extends WorkerHost {
  constructor(
    @InjectRepository(ImportJob) private readonly jobs: Repository<ImportJob>,
    @InjectRepository(Instrument) private readonly instruments: Repository<Instrument>,
    @InjectRepository(InstrumentVersion) private readonly versions: Repository<InstrumentVersion>,
    @InjectRepository(Question) private readonly questions: Repository<Question>,
    private readonly surveys: SurveysService
  ) {
    super();
  }

  async process(job: Job<{ tenantId: string; importJobId: string }>) {
    const { tenantId, importJobId } = job.data;
    const importJob = await this.jobs.findOne({ where: { tenantId, id: importJobId } });
    if (!importJob) return;

    importJob.status = "processing";
    await this.jobs.save(importJob);

    try {
      const rows = await this.readRows(importJob.storagePath!, importJob.sourceType);
      const normalized = this.normalize(rows);

      const instrumentKey = normalized.instrumentKey;
      const instrumentDisplayName = normalized.instrumentKey;

      let instrument = await this.instruments.findOne({ where: { tenantId, instrumentKey } });
      if (!instrument) {
        const created = await this.surveys.createInstrument(tenantId, {
          instrumentKey,
          displayName: instrumentDisplayName,
          title: normalized.title,
          defaultLanguage: "en",
          version: "1.0"
        });
        instrument = created.instrument;
      }

      // Duplicate detection across the instrument (any version) by QuestionCode
      const codes = normalized.definition.sections.flatMap((s) =>
        s.groups.flatMap((g: any) => g.questions.map((q: any) => q.code))
      );
      const existing = codes.length
        ? await this.questions
            .createQueryBuilder("q")
            .where("q.tenantId = :tenantId", { tenantId })
            .andWhere("q.instrumentId = :instrumentId", { instrumentId: instrument.id })
            .andWhere("q.code = ANY(:codes)", { codes })
            .getMany()
        : [];
      const dupCodes = new Set(existing.map((q) => q.code));
      if (dupCodes.size > 0 && importJob.mode === "reject") {
        throw new Error(`Duplicate QuestionCode(s): ${Array.from(dupCodes).slice(0, 10).join(", ")}`);
      }

      const versionLabel = importJob.mode === "overwrite_draft" ? "draft" : new Date().toISOString().slice(0, 10) + "-draft";
      const iv = await this.versions.save({
        tenantId,
        instrumentId: instrument.id,
        version: versionLabel,
        status: "draft",
        defaultLanguage: "en",
        title: normalized.title,
        publishedAt: null
      });

      await this.surveys.persistDefinition(tenantId, instrument, iv, normalized.definition);

      importJob.status = "completed";
      importJob.completedAt = new Date();
      importJob.reportJson = {
        rowsProcessed: normalized.rowsProcessed,
        warnings: normalized.warnings,
        created: { instrumentId: instrument.id, instrumentVersionId: iv.id }
      };
      importJob.normalizedJson = normalized;
      await this.jobs.save(importJob);
    } catch (e: any) {
      importJob.status = "failed";
      importJob.error = e?.message ?? String(e);
      importJob.completedAt = new Date();
      await this.jobs.save(importJob);
    }
  }

  private async readRows(filePath: string, sourceType: ImportJob["sourceType"]): Promise<Row[]> {
    const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    const buf = fs.readFileSync(abs);

    if (sourceType === "json") {
      const j = JSON.parse(buf.toString("utf8"));
      if (Array.isArray(j)) return j;
      if (Array.isArray(j.rows)) return j.rows;
      throw new Error("Invalid JSON import format");
    }

    if (sourceType === "csv") {
      const records = parseCsv(buf, { columns: true, skip_empty_lines: true, bom: true });
      return records as Row[];
    }

    // excel
    const workbook = XLSX.read(buf, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName!];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Row[];
    return json;
  }

  private normalize(rows: Row[]) {
    const warnings: string[] = [];
    let instrumentKey = "";
    let title = "Imported Survey";

    const ordered = rows
      .map((r, idx) => ({ r, idx }))
      .filter(({ r }) => (r.QuestionCode ?? "").trim().length > 0);

    if (ordered.length === 0) throw new Error("No rows with QuestionCode found");

    instrumentKey = normKey(String(ordered[0]!.r.Instrument ?? "IMPORTED")).toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    title = `${instrumentKey} (Imported)`;

    const sectionOrder = new Map<string, number>();
    const groupOrder = new Map<string, number>(); // key: section|group

    function getOrAdd(map: Map<string, number>, key: string) {
      if (!map.has(key)) map.set(key, map.size + 1);
      return map.get(key)!;
    }

    const sections: any[] = [];
    const sectionMap = new Map<string, any>();

    for (const { r, idx } of ordered) {
      const sectionName = normKey(String(r.Section ?? "Main"));
      const groupName = normKey(String(r.Group ?? "__AUTO__"));
      const subGroupName = (r.SubGroup ?? "").trim() ? normKey(String(r.SubGroup)) : "";

      const code = normKey(String(r.QuestionCode));
      const qTextEn = String(r.QuestionText_EN ?? "").trim();
      if (!qTextEn) throw new Error(`Row ${idx + 2}: QuestionText_EN is required for ${code}`);

      const qTextAr = String(r.QuestionText_AR ?? "").trim() || undefined;
      const type = mapType(r.Type);
      const required = toBool(r.Required);
      const min = toNum(r.Min);
      const max = toNum(r.Max);
      const scoreWeight = toNum(r.ScoreWeight) ?? 1;

      const options = parseOptions(r.Options);
      if ([QuestionType.SingleChoice, QuestionType.MultiChoice, QuestionType.Likert].includes(type) && options.length < 2) {
        warnings.push(`Row ${idx + 2} (${code}): options missing/too small for ${type}`);
      }

      const sectionIdx = getOrAdd(sectionOrder, sectionName);
      let sec = sectionMap.get(sectionName);
      if (!sec) {
        sec = { title: { en: sectionName, ar: undefined }, groups: [] };
        sectionMap.set(sectionName, sec);
        sections.push(sec);
      }

      const groupKey = `${sectionName}||${groupName}`;
      const gIdx = getOrAdd(groupOrder, groupKey);
      let grp = sec.groups.find((g: any) => g.__key === groupKey);
      if (!grp) {
        grp = { __key: groupKey, title: { en: groupName, ar: undefined }, questions: [], subgroups: new Map<string, any>() };
        sec.groups.push(grp);
      }

      if (subGroupName) {
        let sg = grp.subgroups.get(subGroupName);
        if (!sg) {
          sg = { title: { en: subGroupName, ar: undefined }, questions: [] };
          grp.subgroups.set(subGroupName, sg);
        }
        sg.questions.push({
          code,
          type,
          text: { en: qTextEn, ar: qTextAr },
          required,
          min,
          max,
          scoreWeight,
          options: options.map((o, i) => ({
            value: o.value || String(i),
            label: { en: o.labelEn, ar: o.labelAr },
            score: o.score
          }))
        });
      } else {
        grp.questions.push({
          code,
          type,
          text: { en: qTextEn, ar: qTextAr },
          required,
          min,
          max,
          scoreWeight,
          options: options.map((o, i) => ({
            value: o.value || String(i),
            label: { en: o.labelEn, ar: o.labelAr },
            score: o.score
          }))
        });
      }
    }

    // Flatten subgroups into nested QuestionGroup behavior by representing as separate groups in MVP definition
    const definition = {
      sections: sections.map((sec: any) => ({
        title: sec.title,
        groups: sec.groups.flatMap((g: any) => {
          const out: any[] = [];
          out.push({ title: g.title, questions: g.questions });
          for (const sg of g.subgroups.values()) {
            out.push({ title: { en: `${g.title.en} / ${sg.title.en}`, ar: undefined }, questions: sg.questions });
          }
          return out;
        })
      }))
    };

    return {
      instrumentKey,
      title,
      rowsProcessed: ordered.length,
      warnings,
      definition
    };
  }
}

