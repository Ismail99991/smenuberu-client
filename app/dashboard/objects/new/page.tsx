"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function apiBase() {
  return (process.env.NEXT_PUBLIC_API_URL ?? "https://api.smenube.ru").replace(/\/+$/, "");
}

async function api<T>(path: string, init?: RequestInit, json?: unknown): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    method: init?.method ?? (json !== undefined ? "POST" : "GET"),
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    body: json !== undefined ? JSON.stringify(json) : init?.body,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? data?.message ?? `HTTP ${res.status}`);
  return data as T;
}

type CreatedObject = {
  id: string;
  name: string;
  city: string;
  address: string | null;
  photos: string[];
};

export default function NewObjectPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  const [photoUrlInput, setPhotoUrlInput] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  // UI-only
  const [hasBuses, setHasBuses] = useState(false);
  const [hasLunch, setHasLunch] = useState(false);
  const [warmPlace, setWarmPlace] = useState(false);
  const [hasLockerRoom, setHasLockerRoom] = useState(false);
  const [hasBonuses, setHasBonuses] = useState(false);
  const [extra, setExtra] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSave = useMemo(() => {
    return name.trim().length > 0 && city.trim().length > 0 && address.trim().length > 0;
  }, [name, city, address]);

  function addPhotoUrl() {
    setErr(null);
    const u = photoUrlInput.trim();
    if (!u) return;

    try {
      new URL(u);
    } catch {
      setErr("Неверная ссылка на фото");
      return;
    }

    if (photos.length >= 3) {
      setErr("Можно добавить максимум 3 фото.");
      return;
    }

    setPhotos((prev) => [...prev, u]);
    setPhotoUrlInput("");
  }

  function removePhotoUrl(url: string) {
    setPhotos((prev) => prev.filter((p) => p !== url));
  }

  async function onSave() {
    setErr(null);
    setBusy(true);

    try {
      if (!canSave) throw new Error("Заполни: название, город и адрес");

      await api<CreatedObject>(
        "/objects",
        { method: "POST" },
        {
          name: name.trim(),
          city: city.trim(),
          address: address.trim(),
          photos,
        }
      );

      router.push("/dashboard/objects");
    } catch (e: any) {
      setErr(e?.message ?? "Не удалось сохранить объект");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Создать объект</h1>
          <p className="text-sm text-gray-500">Добавьте объект, чтобы создавать смены</p>
        </div>

        <Link
          href="/dashboard/objects"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50"
        >
          Назад
        </Link>
      </div>

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        {/* Basic info */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Название объекта</label>
            <input
              type="text"
              placeholder="Например: Склад на Тверской"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Город</label>
            <input
              type="text"
              placeholder="Москва"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={busy}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Адрес</label>
            <input
              type="text"
              placeholder="Город, улица, дом"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={busy}
            />
          </div>
        </div>

        {/* Photos */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
          <div>
            <h2 className="text-sm font-medium mb-1">Фотографии объекта</h2>
            <p className="text-xs text-gray-500">Пока добавляем ссылками (макс 3). Upload подключим после допила backend.</p>
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://... (ссылка на фото)"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={photoUrlInput}
              onChange={(e) => setPhotoUrlInput(e.target.value)}
              disabled={busy}
            />
            <button
              type="button"
              className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
              onClick={addPhotoUrl}
              disabled={busy || photos.length >= 3}
            >
              Добавить
            </button>
          </div>

          {photos.length === 0 ? (
            <div className="text-sm text-gray-500">Фото пока нет</div>
          ) : (
            <div className="flex gap-3 flex-wrap">
              {photos.map((url) => (
                <div key={url} className="rounded-lg border border-gray-200 p-2 text-xs">
                  <div className="max-w-[240px] truncate">{url}</div>
                  <button
                    type="button"
                    className="mt-2 w-full rounded-md border border-gray-200 py-1 hover:bg-gray-50"
                    onClick={() => removePhotoUrl(url)}
                    disabled={busy}
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Features */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-medium">Условия и удобства</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {[
              ["Есть развозка / автобусы", hasBuses, setHasBuses],
              ["Есть обеды", hasLunch, setHasLunch],
              ["Тёплое помещение", warmPlace, setWarmPlace],
              ["Есть раздевалка", hasLockerRoom, setHasLockerRoom],
              ["Есть акции / бонусы", hasBonuses, setHasBonuses],
            ].map(([label, val, setVal]: any) => (
              <label key={label} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-black"
                  checked={val}
                  onChange={(e) => setVal(e.target.checked)}
                  disabled={busy}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Дополнительно (необязательно)</label>
            <input
              type="text"
              placeholder="Например: бесплатный чай, парковка"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              disabled={busy}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/dashboard/objects"
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50"
          >
            Отмена
          </Link>

          <button
            type="button"
            className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
            disabled={busy || !canSave}
            onClick={onSave}
          >
            {busy ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      </form>
    </div>
  );
}
