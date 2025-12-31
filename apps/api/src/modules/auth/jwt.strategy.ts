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
      issuer: config.get("JWT_ISSUER"),
      secretOrKey: config.get("JWT_SECRET")
    });
  }

  async validate(payload: JwtPayload) {
    return { userId: payload.sub, tenantId: payload.tid, role: payload.role, email: payload.email };
  }
}

