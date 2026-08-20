import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";

import { AuthService, type SafeUser } from "./auth.service.js";

export interface AuthenticatedRequest extends Request {
  user: SafeUser;
  sessionId: string;
}
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const result = await this.auth.authenticate(
      request.cookies?.postmade_session
    );
    if (!result)
      throw new UnauthorizedException({
        code: "UNAUTHENTICATED",
        message: "Authentication required",
      });
    request.user = result.user;
    request.sessionId = result.sessionId;
    return true;
  }
}
export const CurrentUser = createParamDecorator(
  (_data, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest<AuthenticatedRequest>().user
);
