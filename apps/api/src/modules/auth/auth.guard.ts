import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import type { AuthenticatedRequest } from "./auth.types";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = singleHeader(request.headers.authorization);

    if (authorization?.startsWith("Bearer ")) {
      request.auth = await this.auth.verifyBearerToken(authorization.slice("Bearer ".length));
      return true;
    }

    const developmentUserId = singleHeader(request.headers["x-user-id"]);
    if (developmentUserId) {
      request.auth = await this.auth.principalForUser(developmentUserId);
      return true;
    }

    throw new UnauthorizedException("Authentication is required.");
  }
}

function singleHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
