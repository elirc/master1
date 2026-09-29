import { randomUUID } from "crypto";
import type { NextFunction, Request, Response } from "express";

export interface RequestWithId extends Request {
  requestId?: string;
}

export function requestIdMiddleware(request: RequestWithId, response: Response, next: NextFunction) {
  const incoming = request.header("x-request-id");
  const requestId = incoming && incoming.trim().length > 0 ? incoming : randomUUID();
  request.requestId = requestId;
  response.setHeader("x-request-id", requestId);
  next();
}
