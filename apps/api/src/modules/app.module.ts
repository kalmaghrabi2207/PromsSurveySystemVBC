import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { EmrModule } from "./emr/emr.module";
import { PrismaModule } from "./prisma/prisma.module";
import { SurveysModule } from "./surveys/surveys.module";
import { TenantModule } from "./tenant/tenant.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    TenantModule,
    AuthModule,
    SurveysModule,
    EmrModule
  ]
})
export class AppModule {}

