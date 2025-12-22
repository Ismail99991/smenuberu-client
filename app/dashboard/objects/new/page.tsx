"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Factory,
  Warehouse,
  Boxes,
  SplitSquareVertical,
  HelpCircle,
  Image as ImageIcon,
  MapPin,
} from "lucide-react";

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
  type: string | null;
  logoUrl: string | null;
  photos: string[];
};

type SuggestItem = { title: string; subtitle: string; value: string };

type ObjectType = "production" | "warehouse" | "hub" | "sort" | "other";

const TYPE_OPTIONS: Array<{
  value: ObjectType;
  label: string;
  Icon: any;
}> = [
  { value: "production", label: "Производство", Icon: Factory },
  { value: "warehouse", label: "Крупный склад", Icon: Warehouse },
  { value: "hub", label: "Хаб", Icon: Boxes },
  { value: "sort", label: "Сортировочный центр", Icon: SplitSquareVertical },
  { value: "other", label: "Другое", Icon: HelpCircle },
];

function typeLabel(t: ObjectType) {
  return TYPE_OPTIONS.find((x) => x.value === t)?.label ?? "Объект";
}

export default function NewObjectPage() {
  const router = useRouter();

  const [objectId, setObjectId] = useState<string | null>(null);

  const [brandName, setBrandName] = useState("");
  const [objType, setObjType] = useState<ObjectType>("warehouse");

  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);

  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestItems, setSuggestItems] = useState<SuggestItem[]>([]);
  const suggestReqId = useRef(0);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canCreate = useMemo(() => {
    return brandName.trim().length > 0 && city.trim().length > 0 && address.trim().length > 0;
  }, [brandName, city, address]);

  const TitleIcon = TYPE_OPTIONS.find((x) => x.value === objType)?.Icon ?? HelpCircle;

  async function ensureObject(): Promise<string> {
    if (objectId) return objectId;

    if (!canCreate) {
      throw new Error("Заполни: бренд (название), город и адрес — нужно, чтобы создать объект перед загрузкой картинок.");
    }

    const created = await api<CreatedObject>(
      "/objects",
      { method: "POST" },
      {
        name: brandName.trim(),
        city: city.trim(),
        address: address.trim(),
        type: objType,
        logoUrl: logoUrl ?? undefined,
        photos: photos,
      }
    );

    setObjectId(created.id);
    return created.id;
  }

  async function patchObject(id: string, patch: Partial<Pick<CreatedObject, "name" | "city" | "address" | "type" | "logoUrl" | "photos">>) {
    await api<CreatedObject>(`/objects/${id}`, { method: "PATCH" }, patch);
  }

  async function presignUpload(kind: "logo" | "photo", id: string, contentType: string) {
    const path = kind === "logo" ? "/uploads/object-logo" : "/uploads/object-photo";
    return api<{ ok: true; uploadUrl: string; publicUrl: string }>(
      path,
      { method: "POST" },
      { objectId: id, contentType }
    );
  }

  async function putFile(uploadUrl: string, file: File) {
    const r = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!r.ok) throw new Error(`Upload failed: ${r.status}`);
  }

  async function onPickLogo(file: File | null) {
    if (!file) return;
    setErr(null);
    setBusy(true);

    try {
      const id = await ensureObject();
      const presign = await presignUpload("logo", id, file.type);

      await putFile(presign.uploadUrl, file);

      setLogoUrl(presign.publicUrl);
      await patchObject(id, { logoUrl: presign.publicUrl });
    } catch (e: any) {
      setErr(e?.message ?? "Не удалось загрузить логотип");
    } finally {
      setBusy(false);
    }
  }

  async function onPickPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;

    if (photos.length >= 3) {
      setErr("Можно добавить максимум 3 фото.");
      return;
    }

    setErr(null);
    setBusy(true);

    try {
      const id = await ensureObject();

      const remaining = 3 - photos.length;
      const toUpload = Array.from(files).slice(0, remaining);

      const uploaded: string[] = [];
      for (const f of toUpload) {
        const presign = await presignUpload("photo", id, f.type);
        await putFile(presign.uploadUrl, f);
        uploaded.push(presign.publicUrl);
      }

      const next = [...photos, ...uploaded].slice(0, 3);
      setPhotos(next);

      await patchObject(id, { photos: next });
    } catch (e: any) {
      setErr(e?.message ?? "Не удалось загрузить фото");
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto(url: string) {
    const next = photos.filter((p) => p !== url);
    setPhotos(next);

    if (!objectId) return;

    setBusy(true);
    setErr(null);
    try {
      await patchObject(objectId, { photos: next });
    } catch (e: any) {
      setErr(e?.message ?? "Не удалось обновить фото");
    } finally {
      setBusy(false);
    }
  }

  async function onSave() {
    setErr(null);
    setBusy(true);

    try {
      if (!canCreate) throw new Error("Заполни: бренд (название), город и адрес");

      const id = await ensureObject();
      await patchObject(id, {
        name: brandName.trim(),
        city: city.trim(),
        address: address.trim(),
        type: objType,
        logoUrl: logoUrl ?? null,
        // photos уже синкаются по месту
      });

      router.push("/dashboard/objects");
    } catch (e: any) {
      setErr(e?.message ?? "Не удалось сохранить объект");
    } finally {
      setBusy(false);
    }
  }

  // --- Address suggestions (через /geo/suggest) ---
  useEffect(() => {
    const q = address.trim();
    if (q.length < 3) {
      setSuggestItems([]);
      setSuggestOpen(false);
      return;
    }

    const id = ++suggestReqId.current;

    const t = setTimeout(() => {
      api<{ ok: true; items: SuggestItem[] }>(`/geo/suggest?q=${encodeURIComponent(q)}`)
        .then((d) => {
          if (suggestReqId.current !== id) return;
          const items = Array.isArray(d?.items) ? d.items : [];
          setSuggestItems(items);
          setSuggestOpen(items.length > 0);
        })
        .catch(() => {
          // не ломаем UX если suggest недоступен
          if (suggestReqId.current !== id) return;
          setSuggestItems([]);
          setSuggestOpen(false);
        });
    }, 250);

    return () => clearTimeout(t);
  }, [address]);

  function onPickSuggestion(it: SuggestItem) {
    setAddress(it.value || it.title);
    setSuggestOpen(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Создать объект</h1>
          <p className="text-sm text-gray-500">
            <span className="inline-flex items-center gap-2">
              <TitleIcon className="h-4 w-4" />
              {typeLabel(objType)}{" "}
              {brandName.trim() ? (
                <>
                  «<span className="font-medium">{brandName.trim()}</span>»
                </>
              ) : null}
            </span>
          </p>
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
        {/* Basic */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Brand name</label>
            <input
              type="text"
              placeholder='Например: "Amazon" или "Adidas"'
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              disabled={busy}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Тип объекта</label>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm pr-10"
                value={objType}
                onChange={(e) => setObjType(e.target.value as ObjectType)}
                disabled={busy}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                <TitleIcon className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Logo */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Логотип</label>

            <div className="flex items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
                <ImageIcon className="h-4 w-4" />
                <span>{busy ? "Загрузка…" : "Загрузить логотип"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={busy}
                  onChange={(e) => onPickLogo(e.target.files?.[0] ?? null)}
                />
              </label>

              {logoUrl ? (
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt="" className="h-10 w-10 rounded-md border border-gray-200 object-cover" />
                  <button
                    type="button"
                    className="text-xs text-gray-600 hover:text-black"
                    onClick={async () => {
                      if (!objectId) {
                        setLogoUrl(null);
                        return;
                      }
                      setBusy(true);
                      setErr(null);
                      try {
                        setLogoUrl(null);
                        await patchObject(objectId, { logoUrl: null });
                      } catch (e: any) {
                        setErr(e?.message ?? "Не удалось удалить логотип");
                      } finally {
                        setBusy(false);
                      }
                    }}
                    disabled={busy}
                  >
                    Удалить
                  </button>
                </div>
              ) : (
                <div className="text-xs text-gray-500">Логотип пока не загружен</div>
              )}
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <div className="relative">
              <label className="block text-sm font-medium mb-2">Адрес</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Начни вводить адрес…"
                  className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onFocus={() => setSuggestOpen(suggestItems.length > 0)}
                  onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
                  disabled={busy}
                />
              </div>

              {suggestOpen ? (
                <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  {suggestItems.map((it, idx) => (
                    <button
                      key={`${it.value}-${idx}`}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-50"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onPickSuggestion(it)}
                    >
                      <div className="text-sm">{it.title || it.value}</div>
                      {it.subtitle ? <div className="text-xs text-gray-500">{it.subtitle}</div> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Позже добавим кнопку “Построить маршрут” → откроем Яндекс.Карты с этим адресом.
          </div>
        </div>

        {/* Photos */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
          <div>
            <h2 className="text-sm font-medium mb-1">Фотографии объекта</h2>
            <p className="text-xs text-gray-500">Максимум 3 фото</p>
          </div>

          <label className="flex items-center justify-center h-32 rounded-lg border border-dashed border-gray-300 cursor-pointer hover:bg-gray-50 text-sm text-gray-500">
            <span>{busy ? "Загрузка…" : "Нажмите, чтобы добавить фото"}</span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              disabled={busy || photos.length >= 3}
              onChange={(e) => onPickPhotos(e.target.files)}
            />
          </label>

          {photos.length === 0 ? (
            <div className="text-sm text-gray-500">Фото пока нет</div>
          ) : (
            <div className="flex gap-3 flex-wrap">
              {photos.map((url) => (
                <div key={url} className="relative h-20 w-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-20 w-20 object-cover" />
                  <button
                    type="button"
                    className="absolute inset-x-0 bottom-0 bg-white/90 text-[11px] py-1 hover:bg-white"
                    onClick={() => removePhoto(url)}
                    disabled={busy}
                    title="Удалить"
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          )}
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
            disabled={busy || !canCreate}
            onClick={onSave}
          >
            {busy ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      </form>
    </div>
  );
}
