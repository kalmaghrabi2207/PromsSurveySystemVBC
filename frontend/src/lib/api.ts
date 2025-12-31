export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/v1";

export const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "";

export type ApiError = {
  error?: { code?: string; message?: string };
  message?: string;
};

export async function apiFetch<T>(
  path: string,
  opts: RequestInit & { token?: string; tenantId?: string } = {}
): Promise<T> {
  const headers = new Headers(opts.headers ?? {});
  const tenantId = opts.tenantId ?? TENANT_ID;
  if (tenantId) headers.set("X-Tenant-Id", tenantId);
  if (opts.token) headers.set("Authorization", `Bearer ${opts.token}`);
  if (!headers.has("Content-Type") && opts.body) headers.set("Content-Type", "application/json");

  const res = await fetch(`${API_BASE_URL}${path}`, { ...opts, headers, cache: "no-store" });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

