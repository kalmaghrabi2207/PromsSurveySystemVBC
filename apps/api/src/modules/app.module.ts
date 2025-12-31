import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bullmq";
import { TenantMiddleware } from "../common/tenant/tenant.middleware";
import { AuthModule } from "./auth/auth.module";
import { ImportsModule } from "./imports/imports.module";
import { AssignmentsModule } from "./assignments/assignments.module";
import { OutreachModule } from "./outreach/outreach.module";
import { ReportingModule } from "./reporting/reporting.module";
import { ResponsesModule } from "./responses/responses.module";
import { SurveysModule } from "./surveys/surveys.module";
import { TenantsModule } from "./tenants/tenants.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: "postgres",
        url: process.env.DATABASE_URL,
        autoLoadEntities: true,
        synchronize: process.env.NODE_ENV !== "production",
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
      })
    }),
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: { url: process.env.REDIS_URL }
      })
    }),
    TenantsModule,
    AuthModule,
    SurveysModule,
    ImportsModule,
    AssignmentsModule,
    OutreachModule,
    ResponsesModule,
    ReportingModule
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes("*");
  }
}

