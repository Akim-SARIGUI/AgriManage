import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@agrimanage/shared';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: { role?: Role } }>();
    const userRole = request.user?.role;

    // Pas d'utilisateur authentifié → session à renouveler (401), pas un refus de droits (403)
    if (!userRole) {
      throw new UnauthorizedException('Session expirée');
    }

    if (!roles.includes(userRole)) {
      throw new ForbiddenException('Permissions insuffisantes');
    }

    return true;
  }
}
