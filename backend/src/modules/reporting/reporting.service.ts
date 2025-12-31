import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SurveyAssignment } from "../../entities/survey-assignment.entity";
import { OutreachMessage } from "../../entities/outreach-message.entity";
import { SurveyResponse } from "../../entities/survey-response.entity";
import { Between } from "typeorm";

function parseRange(from?: string, to?: string) {
  const toDate = to ? new Date(to) : new Date();
  const fromDate = from ? new Date(from) : new Date(toDate.getTime() - 30 * 24 * 3600 * 1000);
  return { fromDate, toDate };
}

@Injectable()
export class ReportingService {
  constructor(
    @InjectRepository(SurveyAssignment) private readonly assignments: Repository<SurveyAssignment>,
    @InjectRepository(OutreachMessage) private readonly outreach: Repository<OutreachMessage>,
    @InjectRepository(SurveyResponse) private readonly responses: Repository<SurveyResponse>
  ) {}

  async dashboard(tenantId: string, from?: string, to?: string) {
    const { fromDate, toDate } = parseRange(from, to);

    const eligible = await this.assignments.count({
      where: {
        tenantId,
        encounterDateTime: Between(fromDate, toDate)
      } as any
    });

    const completed = await this.responses.count({
      where: { tenantId, completedAt: Between(fromDate, toDate) } as any
    });

    const delivered = await this.outreach
      .createQueryBuilder("m")
      .select("count(distinct m.assignmentId)", "delivered")
      .where("m.tenantId = :tenantId", { tenantId })
      .andWhere("m.deliveredAt >= :fromDate AND m.deliveredAt < :toDate", { fromDate, toDate })
      .andWhere("m.status = 'delivered'")
      .getRawOne<{ delivered: string }>();

    const deliveredCount = Number(delivered?.delivered ?? 0);

    const series = await this.responses
      .createQueryBuilder("r")
      .innerJoin(SurveyAssignment, "a", "a.id = r.assignmentId")
      .select("date_trunc('day', a.encounterDateTime)", "day")
      .addSelect("count(*) filter (where r.completedAt is not null)", "completed")
      .addSelect("count(*)", "started")
      .where("r.tenantId = :tenantId", { tenantId })
      .andWhere("a.encounterDateTime >= :fromDate AND a.encounterDateTime < :toDate", { fromDate, toDate })
      .groupBy("day")
      .orderBy("day", "ASC")
      .getRawMany<{ day: string; completed: string; started: string }>();

    const outreachByChannel = await this.outreach
      .createQueryBuilder("m")
      .select("m.channel", "channel")
      .addSelect("count(*)", "messages")
      .addSelect("count(*) filter (where m.status = 'delivered')", "delivered")
      .where("m.tenantId = :tenantId", { tenantId })
      .andWhere("m.createdAt >= :fromDate AND m.createdAt < :toDate", { fromDate, toDate })
      .groupBy("m.channel")
      .orderBy("m.channel", "ASC")
      .getRawMany<{ channel: string; messages: string; delivered: string }>();

    const recent = await this.assignments.find({
      where: { tenantId } as any,
      order: { createdAt: "DESC" },
      take: 20
    });

    return {
      kpis: {
        eligibleAssignments: eligible,
        deliveredAssignments: deliveredCount,
        completedResponses: completed,
        responseRateCreated: eligible ? completed / eligible : 0,
        responseRateDelivered: deliveredCount ? completed / deliveredCount : 0
      },
      charts: {
        responsesByDay: series.map((r) => ({
          day: r.day,
          started: Number(r.started),
          completed: Number(r.completed)
        })),
        outreachByChannel: outreachByChannel.map((r) => ({
          channel: r.channel,
          messages: Number(r.messages),
          delivered: Number(r.delivered)
        }))
      },
      table: {
        recentAssignments: recent.map((a) => ({
          id: a.id,
          instrumentKey: a.instrumentKey,
          status: a.status,
          encounterId: a.encounterId,
          encounterDateTime: a.encounterDateTime,
          providerId: a.providerId,
          department: a.department
        }))
      }
    };
  }
}

