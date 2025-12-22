// src/lib/api.ts
function apiBase() {
  return (process.env.NEXT_PUBLIC_API_URL ?? "https://api.smenube.ru").replace(/\/+$/, "");
}

type ApiOptions = Omit<RequestInit, "body"> & { json?: unknown; body?: BodyInit };

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const url = `${apiBase()}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = new Headers(opts.headers);
  if (opts.json !== undefined) headers.set("Content-Type", "application/json");

  const res = await fetch(url, {
    ...opts,
    headers,
    credentials: "include",
    cache: "no-store",
    body: opts.json !== undefined ? JSON.stringify(opts.json) : opts.body,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? data?.message ?? `HTTP ${res.status}`);
  return data as T;
}
