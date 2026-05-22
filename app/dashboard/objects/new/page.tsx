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
  Building2,
  X,
  Upload,
  Check,
  ArrowLeft,
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
  lat?: number | null;
  lng?: number | null;
};

type SuggestItem = { title: string; subtitle: string; value: string };

type GeocodeResponse = {
  ok: true;
  lat: number | null;
  lng: number | null;
  address?: string;
};

type ObjectType = "production" | "warehouse" | "hub" | "sort" | "other";

const TYPE_OPTIONS: Array<{
  value: ObjectType;
  label: string;
  Icon: any;
  description: string;
}> = [
  { value: "production", label: "Производство", Icon: Factory, description: "Заводы, фабрики, цеха" },
  { value: "warehouse", label: "Склад", Icon: Warehouse, description: "Крупные склады, распределительные центры" },
  { value: "hub", label: "Хаб", Icon: Boxes, description: "Транспортные хабы, сортировочные узлы" },
  { value: "sort", label: "Сортировочный центр", Icon: SplitSquareVertical, description: "Почтовые и логистические центры" },
  { value: "other", label: "Другое", Icon: HelpCircle, description: "Офисы, магазины, другие объекты" },
];

export default function NewObjectPage() {
  const router = useRouter();

  const draftIdRef = useRef<string>(crypto.randomUUID());
  const draftId = draftIdRef.current;

  const [brandName, setBrandName] = useState("");
  const [objType, setObjType] = useState<ObjectType>("warehouse");

  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);

  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestItems, setSuggestItems] = useState<SuggestItem[]>([]);
  const suggestReqId = useRef(0);

  const suppressSuggestRef = useRef(false);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canCreate = useMemo(() => {
    return brandName.trim().length > 0 && city.trim().length > 0 && address.trim().length > 0;
  }, [brandName, city, address]);

  const TitleIcon = TYPE_OPTIONS.find((x) => x.value === objType)?.Icon ?? HelpCircle;

  async function uploadFileDirect(endpoint: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("draftId", draftId);
    formData.append("contentType", file.type || "application/octet-stream");

    const res = await fetch(`${apiBase()}${endpoint}`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error?.message ?? `Upload failed: ${res.status}`);
    }

    const data = await res.json();
    return data.publicUrl;
  }

  async function onPickLogo(file: File | null) {
    if (!file) return;
    setErr(null);
    setBusy(true);

    try {
      const publicUrl = await uploadFileDirect("/uploads/draft-logo", file);
      setLogoUrl(publicUrl);
    } catch (e: any) {
      setErr(e?.message ?? "Не удалось загрузить логотип");
    } finally {
      setBusy(false);
    }
  }

  async function onPickPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;

    if (photos.length >= 6) {
      setErr("Можно добавить максимум 6 фото.");
      return;
    }

    setErr(null);
    setBusy(true);

    try {
      const remaining = 6 - photos.length;
      const toUpload = Array.from(files).slice(0, remaining);

      const uploaded: string[] = [];
      for (const f of toUpload) {
        const publicUrl = await uploadFileDirect("/uploads/draft-photo", f);
        uploaded.push(publicUrl);
      }

      setPhotos((prev) => [...prev, ...uploaded].slice(0, 6));
    } catch (e: any) {
      setErr(e?.message ?? "Не удалось загрузить фото");
    } finally {
      setBusy(false);
    }
  }

  function removePhoto(url: string) {
    setPhotos((prev) => prev.filter((p) => p !== url));
  }

  async function geocodeAddress(fullAddress: string) {
    return api<GeocodeResponse>(`/geo/geocode?address=${encodeURIComponent(fullAddress)}`, { method: "GET" });
  }

  async function onSave() {
    setErr(null);
    setBusy(true);

    try {
      if (!canCreate) throw new Error("Заполните название, город и адрес");

      await api<CreatedObject>(
        "/objects",
        { method: "POST" },
        {
          name: brandName.trim(),
          city: city.trim(),
          address: address.trim(),
          type: objType,
          logoUrl: logoUrl ?? null,
          photos,
          lat: selectedLat,
          lng: selectedLng,
        }
      );

      setSuccess(true);
      setTimeout(() => router.push("/dashboard/objects"), 1500);
    } catch (e: any) {
      setErr(e?.message ?? "Не удалось сохранить объект");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (suppressSuggestRef.current) {
      suppressSuggestRef.current = false;
      return;
    }

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
          if (suggestReqId.current !== id) return;
          setSuggestItems([]);
          setSuggestOpen(false);
        });
    }, 250);

    return () => clearTimeout(t);
  }, [address]);

  async function onPickSuggestion(it: SuggestItem) {
    const nextAddress = (it.value || it.title).trim();

    setSuggestOpen(false);
    setSuggestItems([]);
    suppressSuggestRef.current = true;
    setAddress(nextAddress);

    setSelectedLat(null);
    setSelectedLng(null);

    const c = city.trim();
    if (!c || nextAddress.length < 3) return;

    setBusy(true);
    setErr(null);
    try {
      const full = `${c}, ${nextAddress}`;
      const g = await geocodeAddress(full);

      setSelectedLat(g.lat ?? null);
      setSelectedLng(g.lng ?? null);

      if (g.address && typeof g.address === "string" && g.address.trim()) {
        const normalized = g.address.trim();
        if (normalized !== nextAddress) {
          suppressSuggestRef.current = true;
          setAddress(normalized);
        }
      }
    } catch {
      setSelectedLat(null);
      setSelectedLng(null);
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold">Объект создан!</h2>
        <p className="text-gray-500">Перенаправляем в список объектов...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Шапка */}
        <div className="mb-6 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Создать объект</h1>
            <p className="text-sm text-gray-500 mt-1">Добавьте склад, производство или другой объект</p>
          </div>
        </div>

        {/* Ошибка */}
        {err && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {err}
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* Тип объекта — карточки */}
          <div>
            <label className="block text-sm font-semibold mb-3">Тип объекта</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {TYPE_OPTIONS.map((option) => {
                const Icon = option.Icon;
                const isActive = objType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setObjType(option.value)}
                    className={`
                      flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                      ${isActive 
                        ? "border-[#c29cf2] bg-[#c29cf2]/5" 
                        : "border-gray-200 bg-white hover:border-gray-300"}
                    `}
                  >
                    <Icon className={`h-6 w-6 ${isActive ? "text-[#c29cf2]" : "text-gray-500"}`} />
                    <span className={`text-sm font-medium ${isActive ? "text-[#c29cf2]" : "text-gray-700"}`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Основная информация */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Основная информация
            </h2>

            <div>
              <label className="block text-sm font-medium mb-2">Название объекта *</label>
              <input
                type="text"
                placeholder="Например: OZON, Wildberries, СберЛогистика"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-[#c29cf2] focus:ring-1 focus:ring-[#c29cf2]"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                disabled={busy}
              />
            </div>

            {/* Логотип */}
            <div>
              <label className="block text-sm font-medium mb-2">Логотип</label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <div className="relative">
                    <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-xl border border-gray-200 object-cover" />
                    <button
                      type="button"
                      onClick={() => setLogoUrl(null)}
                      className="absolute -top-2 -right-2 p-1 bg-white rounded-full border border-gray-200 hover:bg-gray-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 cursor-pointer hover:border-[#c29cf2] transition">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-xs text-gray-500 mt-2">Загрузить</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={busy}
                      onChange={(e) => onPickLogo(e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
                <p className="text-xs text-gray-500">PNG, JPG до 5 МБ</p>
              </div>
            </div>
          </div>

          {/* Адрес */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Адрес объекта
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Город *</label>
                <input
                  type="text"
                  placeholder="Москва"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-[#c29cf2] focus:ring-1 focus:ring-[#c29cf2]"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setSelectedLat(null);
                    setSelectedLng(null);
                  }}
                  disabled={busy}
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium mb-2">Улица и дом *</label>
                <input
                  type="text"
                  placeholder="Начните вводить адрес..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-[#c29cf2] focus:ring-1 focus:ring-[#c29cf2]"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setSelectedLat(null);
                    setSelectedLng(null);
                  }}
                  onFocus={() => setSuggestOpen(suggestItems.length > 0)}
                  onBlur={() => setTimeout(() => setSuggestOpen(false), 200)}
                  disabled={busy}
                />

                {suggestOpen && (
                  <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                    {suggestItems.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition text-sm"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => onPickSuggestion(item)}
                      >
                        <div className="font-medium">{item.title}</div>
                        {item.subtitle && <div className="text-xs text-gray-500">{item.subtitle}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedLat && selectedLng && (
              <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-3 rounded-lg">
                <Check className="h-4 w-4" />
                Координаты определены
              </div>
            )}
          </div>

          {/* Фотографии */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Фотографии объекта
            </h2>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {photos.map((url, idx) => (
                <div key={idx} className="relative group">
                  <img src={url} alt={`Фото ${idx + 1}`} className="h-24 w-full rounded-lg object-cover border border-gray-200" />
                  <button
                    type="button"
                    onClick={() => removePhoto(url)}
                    className="absolute top-1 right-1 p-1 bg-white rounded-full opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {photos.length < 6 && (
                <label className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-[#c29cf2] transition">
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-1">Добавить</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    disabled={busy}
                    onChange={(e) => onPickPhotos(e.target.files)}
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-500">Максимум 6 фото. Покажите объект с разных сторон</p>
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 justify-end">
            <Link
              href="/dashboard/objects"
              className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition"
            >
              Отмена
            </Link>
            <button
              type="button"
              onClick={onSave}
              disabled={busy || !canCreate}
              className="px-6 py-2.5 bg-[#c29cf2] text-white rounded-xl font-medium hover:bg-[#b088e8] disabled:opacity-50 transition"
            >
              {busy ? "Сохранение..." : "Создать объект"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}