import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import bcrypt from "bcryptjs";
import { Repository } from "typeorm";
import { User } from "../../entities/user.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService
  ) {}

  async login(tenantId: string, email: string, password: string) {
    const user = await this.users.findOne({ where: { tenantId, email, isActive: true } });
    if (!user) throw new UnauthorizedException("Invalid credentials");

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      tid: user.tenantId,
      role: user.role,
      email: user.email
    });

    return {
      accessToken,
      user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId }
    };
  }
}

