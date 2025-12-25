"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Trash } from "lucide-react";

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

type ObjectItem = {
  id: string;
  name: string;
  city: string;
  address: string | null;
  photos: string[];
};

export default function ObjectsPage() {
  const [objects, setObjects] = useState<ObjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    setLoading(true);
    setErr(null);

    api<ObjectItem[]>("/objects")
      .then((list) => {
        if (alive) setObjects(Array.isArray(list) ? list : []);
      })
      .catch((e: any) => {
        if (alive) setErr(e?.message ?? "Ошибка загрузки объектов");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  async function removeObject(id: string) {
    if (!confirm("Удалить объект? Это действие нельзя отменить.")) return;

    setBusyId(id);
    setErr(null);

    try {
      await api(`/objects/${id}`, { method: "DELETE" });
      setObjects((prev) => prev.filter((o) => o.id !== id));
    } catch (e: any) {
      setErr(e?.message ?? "Не удалось удалить объект");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Объекты</h1>

        <Link
          href="/dashboard/objects/new"
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition"
        >
          Создать объект
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Загрузка…</div>
      ) : err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      ) : objects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <h2 className="text-lg font-medium mb-2">У вас пока нет объектов</h2>
          <p className="text-sm text-gray-500">
            Добавьте объект, чтобы создавать смены и находить исполнителей
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {objects.map((object) => (
            <div
              key={object.id}
              className="flex items-center justify-between rounded-xl bg-white p-6 border border-gray-200 hover:shadow-sm transition"
            >
              <div>
                <div className="font-medium">{object.name}</div>
                <div className="text-sm text-gray-500">
                  {object.city}
                  {object.address ? `, ${object.address}` : ""}
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeObject(object.id)}
                disabled={busyId === object.id}
                title="Удалить объект"
                className="rounded-lg p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
              >
                <Trash className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
