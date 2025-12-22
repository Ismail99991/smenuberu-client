"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, LogOut, UserCircle2, ExternalLink } from "lucide-react";

function apiBase() {
  return (process.env.NEXT_PUBLIC_API_URL ?? "https://api.smenube.ru").replace(/\/+$/, "");
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? data?.message ?? `HTTP ${res.status}`);
  return data as T;
}

type MeResponse = {
  ok: boolean;
  user: null | {
    id: string;
    displayName: string | null;
    yandexLogin: string | null;
    email: string | null;
    avatarUrl: string | null;
    createdAt: string;
  };
};

export default function AuthPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const [me, setMe] = useState<MeResponse["user"]>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const nextUrl = useMemo(() => {
    const n = sp.get("next");
    // only allow internal paths
    if (n && n.startsWith("/")) return n;
    return "/me";
  }, [sp]);

  async function refreshMe() {
    setErr(null);
    setLoading(true);
    try {
      const d = await api<MeResponse>("/auth/me");
      setMe(d.user ?? null);
    } catch (e: any) {
      setErr(e?.message ?? "Не удалось получить /auth/me");
      setMe(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startLogin() {
    // Важно: это НЕ fetch, а переход браузера (чтобы редиректы/куки отработали правильно)
    window.location.href = `${apiBase()}/auth/yandex/start`;
  }

  async function logout() {
    setErr(null);
    try {
      await api<{ ok: true }>("/auth/logout", { method: "POST" });
      await refreshMe();
    } catch (e: any) {
      setErr(e?.message ?? "Не удалось выйти");
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Авторизация</h1>
          <p className="text-sm text-gray-600">
            Вход через Яндекс. Сессия хранится на backend (cookie).
          </p>
        </div>

        <button
          type="button"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
          onClick={() => router.back()}
        >
          Назад
        </button>
      </div>

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        {loading ? (
          <div className="text-sm text-gray-500">Проверяем сессию…</div>
        ) : me ? (
          <div className="flex items-center gap-3">
            {me.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={me.avatarUrl}
                alt=""
                className="h-12 w-12 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="h-12 w-12 rounded-full border border-gray-200 flex items-center justify-center bg-gray-50">
                <UserCircle2 className="h-6 w-6 text-gray-500" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">
                {me.displayName ?? me.yandexLogin ?? "Пользователь"}
              </div>
              <div className="text-sm text-gray-500 truncate">
                {me.email ?? (me.yandexLogin ? `@${me.yandexLogin}` : me.id)}
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm text-white hover:bg-gray-800"
              onClick={() => router.push(nextUrl)}
              title="Перейти дальше"
            >
              <ExternalLink className="h-4 w-4" />
              Продолжить
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              Вы не вошли. Нажмите кнопку ниже, чтобы войти через Яндекс.
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
              onClick={startLogin}
            >
              <LogIn className="h-4 w-4" />
              Войти через Яндекс
            </button>

            <div className="text-xs text-gray-500">
              После входа вы вернётесь в приложение. Если передан параметр{" "}
              <code className="px-1 py-0.5 rounded bg-gray-100">?next=/...</code>,
              мы отправим вас туда.
            </div>
          </div>
        )}
      </div>

      {me ? (
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50"
          onClick={logout}
          disabled={loading}
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </button>
      ) : (
        <button
          type="button"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50"
          onClick={refreshMe}
          disabled={loading}
        >
          Обновить статус
        </button>
      )}
    </div>
  );
}
