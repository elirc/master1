import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { OrganizationMemberRole } from "@prisma/client";
import { loadConfig } from "@globalwork/config";
import { PrismaService } from "../prisma/services/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { ImpersonateUserDto } from "./dto/impersonate-user.dto";
import { RegisterDto } from "./dto/register.dto";
import { hashPassword, verifyPassword } from "./password";
import { signAuthToken, verifyAuthToken } from "./token";

@Injectable()
export class AuthService {
  private readonly config = loadConfig();

  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException("A user with this email already exists.");
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name,
        passwordHash: hashPassword(dto.password),
        ...(dto.organizationId
          ? {
              memberships: {
                create: {
                  organizationId: dto.organizationId,
                  role: OrganizationMemberRole.CLIENT_HR_ADMIN
                }
              }
            }
          : {})
      },
      include: { memberships: true }
    });

    return this.authResponse(user.id);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() }
    });

    if (!user?.passwordHash || !verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    return this.authResponse(user.id);
  }

  async verifyBearerToken(token: string) {
    const payload = verifyAuthToken(token, this.config.JWT_SECRET);
    if (!payload) {
      throw new UnauthorizedException("Invalid or expired token.");
    }

    return this.principalForUser(payload.sub);
  }

  async impersonate(impersonatorId: string | undefined, dto: ImpersonateUserDto) {
    if (!impersonatorId) {
      throw new ForbiddenException("Impersonation requires an authenticated platform admin.");
    }

    const target = await this.prisma.user.findUniqueOrThrow({ where: { id: dto.targetUserId } });
    const now = Math.floor(Date.now() / 1000);
    const tokenId = randomUUID();
    const token = signAuthToken(
      {
        sub: target.id,
        email: target.email,
        iat: now,
        exp: now + 60 * 60
      },
      this.config.JWT_SECRET
    );

    const session = await this.prisma.impersonationSession.create({
      data: {
        impersonatorId,
        targetUserId: target.id,
        tokenId,
        reason: dto.reason
      }
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: impersonatorId,
        action: "auth.impersonation_started",
        entityType: "User",
        entityId: target.id,
        after: { sessionId: session.id, reason: dto.reason }
      }
    });

    return {
      token,
      user: await this.principalForUser(target.id),
      impersonation: {
        sessionId: session.id,
        impersonatorId,
        reason: session.reason
      }
    };
  }

  async principalForUser(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { memberships: true }
    });

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      platformRole: user.platformRole,
      memberships: user.memberships.map((membership) => ({
        organizationId: membership.organizationId,
        role: membership.role
      }))
    };
  }

  private async authResponse(userId: string) {
    const principal = await this.principalForUser(userId);
    const now = Math.floor(Date.now() / 1000);
    const token = signAuthToken(
      {
        sub: principal.userId,
        email: principal.email,
        iat: now,
        exp: now + 60 * 60 * 8
      },
      this.config.JWT_SECRET
    );

    return {
      token,
      user: principal
    };
  }
}
