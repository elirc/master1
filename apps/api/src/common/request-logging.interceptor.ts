import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import type { Response } from "express";
import { Observable, tap } from "rxjs";
import type { RequestWithId } from "./request-id.middleware";

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithId>();
    const response = http.getResponse<Response>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.log(request, response, startedAt),
        error: () => this.log(request, response, startedAt)
      })
    );
  }

  private log(request: RequestWithId, response: Response, startedAt: number) {
    const durationMs = Date.now() - startedAt;
    console.log(
      JSON.stringify({
        event: "http.request",
        requestId: request.requestId,
        method: request.method,
        path: request.originalUrl,
        statusCode: response.statusCode,
        durationMs
      })
    );
  }
}
