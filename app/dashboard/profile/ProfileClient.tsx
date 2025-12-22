"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserCircle2,
  LogOut,
  Building2,
  CalendarDays,
} from "lucide-react";

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

export default function ProfileClient() {
  const router = useRouter();
  const [user, setUser] = useState<MeResponse["user"]>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const d = await api<MeResponse>("/auth/me");
      if (!d.user) {
        router.replace("/auth?next=/profile");
        return;
      }
      setUser(d.user);
    } catch (e: any) {
      setErr(e?.message ?? "Не удалось загрузить профиль");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await api("/auth/logout", { method: "POST" });
    router.replace("/auth");
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Загрузка…</div>;
  }

  if (err) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Профиль</h1>

      {/* User card */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 flex gap-4">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt=""
            className="h-16 w-16 rounded-full object-cover border"
          />
        ) : (
          <div className="h-16 w-16 rounded-full border flex items-center justify-center bg-gray-50">
            <UserCircle2 className="h-8 w-8 text-gray-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">
            {user.displayName ?? "Пользователь"}
          </div>

          <div className="text-sm text-gray-500 truncate">
            {user.email ??
              (user.yandexLogin ? `@${user.yandexLogin}` : user.id)}
          </div>

          <div className="text-xs text-gray-400 mt-1">
            В системе с {new Date(user.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-xl border border-gray-200 bg-white divide-y">
        <button
          onClick={() => router.push("/dashboard/objects")}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50"
        >
          <Building2 className="h-4 w-4 text-gray-500" />
          Мои объекты
        </button>

        <button
          onClick={() => router.push("/bookings")}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50"
        >
          <CalendarDays className="h-4 w-4 text-gray-500" />
          Мои смены
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </button>
      </div>
    </div>
  );
}
