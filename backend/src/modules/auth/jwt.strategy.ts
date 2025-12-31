import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

export type JwtPayload = {
  sub: string;
  tid: string;
  role: string;
  email: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      issuer: config.get<string>("JWT_ISSUER") ?? "proms-prems-portal",
      secretOrKey: config.get<string>("JWT_SECRET") ?? "dev_only_change_me"
    });
  }

  async validate(payload: JwtPayload) {
    return { userId: payload.sub, tenantId: payload.tid, role: payload.role, email: payload.email };
  }
}

