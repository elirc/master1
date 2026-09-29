import type { paths } from "./generated/schema";

export type HttpMethod = "get" | "post" | "patch" | "delete";

type JsonResponse<TPath extends keyof paths, TMethod extends keyof paths[TPath]> = paths[TPath][TMethod] extends {
  responses: {
    200: {
      content: {
        "application/json": infer TResponse;
      };
    };
  };
}
  ? TResponse
  : unknown;

export interface ApiClientOptions {
  baseUrl: string;
  getToken?: () => string | null | undefined;
}

export function createApiClient(options: ApiClientOptions) {
  async function request<TPath extends keyof paths & string, TMethod extends HttpMethod & keyof paths[TPath]>(
    method: TMethod,
    path: TPath | string,
    body?: unknown
  ): Promise<JsonResponse<TPath, TMethod>> {
    const headers: Record<string, string> = {
      "content-type": "application/json"
    };
    const token = options.getToken?.();
    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    const init: RequestInit = {
      method: method.toUpperCase(),
      headers
    };

    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    const response = await fetch(`${options.baseUrl}${path}`, init);
    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json() as Promise<JsonResponse<TPath, TMethod>>;
  }

  return {
    get: <TPath extends keyof paths & string>(path: TPath | string) => request<TPath, "get">("get", path),
    post: <TPath extends keyof paths & string>(path: TPath | string, body?: unknown) =>
      request<TPath, "post">("post", path, body),
    patch: <TPath extends keyof paths & string>(path: TPath | string, body?: unknown) =>
      request<TPath, "patch">("patch", path, body)
  };
}
