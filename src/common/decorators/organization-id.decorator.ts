import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';

export const OrganizationId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Record<string, unknown>>();
    const user = request.user as Record<string, unknown> | undefined;
    const organizationId = user?.['organizationId'] as string | undefined;
    if (!organizationId) {
      throw new UnauthorizedException('Organization ID not found in token');
    }
    return organizationId;
  },
);
