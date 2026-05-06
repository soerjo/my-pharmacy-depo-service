import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, unknown>): Promise<string> {
    const user = req.user as Record<string, unknown> | undefined;
    const tracker = (user?.id as string) ?? (req.ip as string);
    return Promise.resolve(tracker);
  }
}
