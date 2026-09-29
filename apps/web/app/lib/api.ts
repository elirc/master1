import { createApiClient } from "@globalwork/contracts";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";
const client = createApiClient({
  baseUrl: API_BASE_URL,
  getToken: () => {
    if (typeof window === "undefined") {
      return null;
    }
    return window.localStorage.getItem("globalwork.authToken");
  }
});

export async function apiGet<T>(path: string): Promise<T> {
  return client.get(path) as Promise<T>;
}

export async function apiSend<T>(path: string, method: "POST" | "PATCH", body?: unknown): Promise<T> {
  return (method === "POST" ? client.post(path, body) : client.patch(path, body)) as Promise<T>;
}
