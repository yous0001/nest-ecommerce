import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './../../../node_modules/@types/jsonwebtoken/index.d';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class GuardsGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const isPublic: boolean = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) {
      return true;
    }
    const token: string = this.extractTokenFromHeader(request) || '';

    if (!token) {
      throw new UnauthorizedException('Unauthorized');
    }
    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      const allowedRoles: string[] = this.reflector.getAllAndOverride<string[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
        throw new ForbiddenException('Forbidden');
      }
      request['user'] = payload;
    } catch (error) {
      throw new UnauthorizedException(
        (error as Error).message || 'Unauthorized',
      );
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
