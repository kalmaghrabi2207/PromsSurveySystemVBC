import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { sha256Hex, randomTokenUrlSafe } from "../../common/crypto";
import { AssignmentStatus, DeliveryStatus, OutreachChannel } from "../../common/enums";
import { Instrument } from "../../entities/instrument.entity";
import { InstrumentVersion } from "../../entities/instrument-version.entity";
import { SurveyAssignment } from "../../entities/survey-assignment.entity";
import { AssignmentToken } from "../../entities/assignment-token.entity";
import { IdempotencyRecord } from "../../entities/idempotency-record.entity";
import { OutreachMessage } from "../../entities/outreach-message.entity";
import { EmrCreateAssignmentDto } from "./dto/emr-create-assignment.dto";

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Instrument) private readonly instruments: Repository<Instrument>,
    @InjectRepository(InstrumentVersion) private readonly versions: Repository<InstrumentVersion>,
    @InjectRepository(SurveyAssignment) private readonly assignments: Repository<SurveyAssignment>,
    @InjectRepository(AssignmentToken) private readonly tokens: Repository<AssignmentToken>,
    @InjectRepository(IdempotencyRecord) private readonly idempotency: Repository<IdempotencyRecord>,
    @InjectRepository(OutreachMessage) private readonly outreach: Repository<OutreachMessage>
  ) {}

  async createFromEmr(params: {
    tenantId: string;
    clientId: string;
    idempotencyKey: string;
    dto: EmrCreateAssignmentDto;
    publicBaseUrl: string;
  }) {
    const { tenantId, clientId, idempotencyKey, dto, publicBaseUrl } = params;
    if (!idempotencyKey) throw new BadRequestException("Idempotency-Key header is required");

    const requestHash = sha256Hex(JSON.stringify(dto));
    const existing = await this.idempotency.findOne({ where: { tenantId, clientId, key: idempotencyKey } });
    if (existing) {
      if (existing.requestHash !== requestHash) throw new BadRequestException("IDEMPOTENCY_KEY_REUSE");
      return existing.responseBody as any;
    }

    const instrument = await this.instruments.findOne({
      where: { tenantId, instrumentKey: dto.surveyInstrumentCode }
    });
    if (!instrument) throw new NotFoundException("Instrument not found");

    const iv = await this.versions.findOne({
      where: { tenantId, instrumentId: instrument.id, status: "published" as const },
      order: { publishedAt: "DESC" as const }
    });
    if (!iv) throw new BadRequestException("INSTRUMENT_NOT_PUBLISHED");

    const expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : new Date(Date.now() + 7 * 24 * 3600 * 1000);
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dueDate && expiryDate <= dueDate) throw new BadRequestException("expiryDate must be after dueDate");

    const assignment = await this.assignments.save({
      tenantId,
      instrumentId: instrument.id,
      instrumentVersionId: iv.id,
      instrumentKey: instrument.instrumentKey,
      status: AssignmentStatus.Created,
      preferredLanguage: dto.languagePreference ?? iv.defaultLanguage ?? "en",
      patientKey: dto.patientKey,
      mrnHash: null,
      nationalIdHash: null,
      encounterId: dto.encounterId,
      encounterDateTime: new Date(dto.encounterDateTime),
      facilityId: dto.facilityId ?? null,
      department: dto.department ?? null,
      providerId: dto.providerId ?? null,
      diagnosisCodes: dto.diagnosisCodes ?? [],
      procedureCodes: dto.procedureCodes ?? [],
      dueDate,
      expiryDate,
      sentAt: null,
      openedAt: null
    } as any);

    const token = randomTokenUrlSafe(32);
    const tokenHash = sha256Hex(token);
    await this.tokens.save({
      tenantId,
      assignmentId: assignment.id,
      tokenHash,
      expiresAt: expiryDate,
      usedAt: null,
      revokedAt: null
    });

    // MVP outreach: log queued messages, mark sent/delivered immediately (simulated)
    const channels = dto.contactChannels ?? [];
    const destinationsByChannel: Partial<Record<OutreachChannel, string | undefined>> = {
      [OutreachChannel.Sms]: dto.phone,
      [OutreachChannel.Whatsapp]: dto.phone,
      [OutreachChannel.Email]: dto.email
    };

    for (const ch of channels) {
      const dest = destinationsByChannel[ch];
      if (!dest) continue;
      await this.outreach.save({
        tenantId,
        assignmentId: assignment.id,
        channel: ch,
        destination: dest,
        status: DeliveryStatus.Delivered,
        providerMessageId: "mvp",
        error: null,
        sentAt: new Date(),
        deliveredAt: new Date()
      });
    }

    await this.assignments.update(
      { id: assignment.id, tenantId },
      { status: channels.length ? AssignmentStatus.Sent : AssignmentStatus.Created, sentAt: channels.length ? new Date() : null }
    );

    const secureSurveyUrl = `${publicBaseUrl.replace(/\/$/, "")}/s/${token}`;
    const response = {
      assignmentId: assignment.id,
      secureSurveyUrl,
      tokenExpiry: expiryDate.toISOString()
    };

    await this.idempotency.save({
      tenantId,
      clientId,
      key: idempotencyKey,
      requestHash,
      responseCode: 201,
      responseBody: response,
      expiresAt: new Date(Date.now() + 72 * 3600 * 1000)
    });

    return response;
  }

  async getStatus(tenantId: string, assignmentId: string) {
    const a = await this.assignments.findOne({ where: { tenantId, id: assignmentId } });
    if (!a) throw new NotFoundException("Assignment not found");
    return {
      assignmentId: a.id,
      surveyInstrumentCode: a.instrumentKey,
      status: a.status,
      createdAt: a.createdAt,
      sentAt: a.sentAt,
      openedAt: a.openedAt,
      completedAt: null,
      expiryDate: a.expiryDate
    };
  }

  async rotateToken(tenantId: string, token: string, publicBaseUrl: string) {
    const tokenHash = sha256Hex(token);
    const existing = await this.tokens.findOne({ where: { tokenHash } });
    if (!existing) throw new NotFoundException("Token not found");
    if (existing.revokedAt) throw new BadRequestException("Token revoked");

    const assignment = await this.assignments.findOne({
      where: { tenantId: existing.tenantId, id: existing.assignmentId }
    });
    if (!assignment) throw new NotFoundException("Assignment not found");
    if (assignment.status === AssignmentStatus.Completed) throw new BadRequestException("Assignment already completed");

    // simple throttling: if token created within last minute, reject
    const createdAgo = Date.now() - existing.createdAt.getTime();
    if (createdAgo < 60_000) throw new HttpException("Too many refresh attempts", HttpStatus.TOO_MANY_REQUESTS);

    existing.revokedAt = new Date();
    await this.tokens.save(existing);

    const newToken = randomTokenUrlSafe(32);
    const newHash = sha256Hex(newToken);
    await this.tokens.save({
      tenantId: existing.tenantId,
      assignmentId: assignment.id,
      tokenHash: newHash,
      expiresAt: assignment.expiryDate ?? new Date(Date.now() + 7 * 24 * 3600 * 1000),
      usedAt: null,
      revokedAt: null
    });

    return {
      assignmentId: assignment.id,
      secureSurveyUrl: `${publicBaseUrl.replace(/\/$/, "")}/s/${newToken}`,
      tokenExpiry: (assignment.expiryDate ?? new Date()).toISOString()
    };
  }
}

