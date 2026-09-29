export interface RequestContext {
  actorId?: string;
  organizationId?: string;
}

export interface AuthenticatedRequestLike {
  auth?: {
    userId: string;
    organizationId?: string;
  };
  headers: Record<string, string | string[] | undefined>;
}

export function contextFromHeaders(headers: Record<string, string | string[] | undefined>): RequestContext {
  const actorId = singleHeader(headers["x-user-id"]);
  const organizationId = singleHeader(headers["x-organization-id"]);

  return {
    ...(actorId ? { actorId } : {}),
    ...(organizationId ? { organizationId } : {})
  };
}

export function contextFromRequest(request: AuthenticatedRequestLike): RequestContext {
  const fromHeaders = contextFromHeaders(request.headers);
  const actorId = request.auth?.userId ?? fromHeaders.actorId;
  const organizationId = request.auth?.organizationId ?? fromHeaders.organizationId;

  return {
    ...(actorId ? { actorId } : {}),
    ...(organizationId ? { organizationId } : {})
  };
}

function singleHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}
