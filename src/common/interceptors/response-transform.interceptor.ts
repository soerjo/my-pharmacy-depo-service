import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Request, Response } from 'express';

export interface ResponseBody<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<
  T,
  ResponseBody<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseBody<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    return next.handle().pipe(
      map((data: T) => ({
        statusCode: response.statusCode,
        message: 'Success',
        data,
        timestamp: new Date().toISOString(),
        path: request.url,
      })),
    );
  }
}
