"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import {
  Trash,
  Edit,
  Copy,
  Archive,
  Eye,
  MapPin,
  Calendar,
  Star,
  Plus,
  Search,
  Filter,
  X,
  Warehouse,
  Factory,
  Boxes,
  SplitSquareVertical,
  HelpCircle,
  Image as ImageIcon,
  Download,
  Share2,
  QrCode,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
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

type ObjectType = "production" | "warehouse" | "hub" | "sort" | "other";

type ObjectItem = {
  id: string;
  name: string;
  city: string;
  address: string | null;
  type: ObjectType | null;
  photos: string[];
  lat?: number | null;
  lng?: number | null;
  createdAt?: string;
  stats?: {
    totalSlots: number;
    activeSlots: number;
    completedSlots: number;
    rating: number;
  };
};

type TypeOption = {
  value: ObjectType;
  label: string;
  Icon: any;
};

const TYPE_OPTIONS: TypeOption[] = [
  { value: "production", label: "Производство", Icon: Factory },
  { value: "warehouse", label: "Склад", Icon: Warehouse },
  { value: "hub", label: "Хаб", Icon: Boxes },
  { value: "sort", label: "Сортировочный центр", Icon: SplitSquareVertical },
  { value: "other", label: "Другое", Icon: HelpCircle },
];

function getTypeIcon(type: ObjectType | null) {
  const option = TYPE_OPTIONS.find((t) => t.value === type);
  return option?.Icon ?? HelpCircle;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) return "Новый";
  return date.toLocaleDateString("ru-RU");
}

export default function ObjectsPage() {
  const [objects, setObjects] = useState<ObjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Фильтрация и поиск
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ObjectType | "all">("all");
  const [withPhotosOnly, setWithPhotosOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Сортировка
  const [sortBy, setSortBy] = useState<"name" | "date" | "activeSlots" | "rating">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Выделенные объекты для массовых действий
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);

  useEffect(() => {
    let alive = true;

    setLoading(true);
    setErr(null);

    api<ObjectItem[]>("/objects")
      .then((list) => {
        if (alive) {
          const withStats = (Array.isArray(list) ? list : []).map((obj) => ({
            ...obj,
            stats: {
              totalSlots: Math.floor(Math.random() * 50),
              activeSlots: Math.floor(Math.random() * 10),
              completedSlots: Math.floor(Math.random() * 30),
              rating: 3 + Math.random() * 2,
            },
          }));
          setObjects(withStats);
        }
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
    const name = objects.find((o) => o.id === id)?.name;
    if (!confirm(`Удалить объект "${name}"? Это действие нельзя отменить.`)) return;

    setBusyId(id);
    setErr(null);

    try {
      await api(`/objects/${id}`, { method: "DELETE" });
      setObjects((prev) => prev.filter((o) => o.id !== id));
      selectedIds.delete(id);
      setSelectedIds(new Set(selectedIds));
    } catch (e: any) {
      setErr(e?.message ?? "Не удалось удалить объект");
    } finally {
      setBusyId(null);
    }
  }

  async function duplicateObject(obj: ObjectItem) {
    setBusyId(obj.id);
    try {
      const newObj = await api<ObjectItem>("/objects", { method: "POST" }, {
        name: `${obj.name} (копия)`,
        city: obj.city,
        address: obj.address,
        type: obj.type,
        logoUrl: obj.photos[0] ?? null,
        photos: obj.photos,
        lat: obj.lat,
        lng: obj.lng,
      });
      setObjects((prev) => [newObj, ...prev]);
    } catch (e: any) {
      setErr("Не удалось скопировать объект");
    } finally {
      setBusyId(null);
    }
  }

  async function archiveObject(id: string) {
    // В реальном API нужно отправить PATCH /objects/:id с { archived: true }
    setBusyId(id);
    try {
      await api(`/objects/${id}`, { method: "PATCH" }, { archived: true });
      setObjects((prev) => prev.filter((o) => o.id !== id));
    } catch (e: any) {
      setErr("Не удалось архивировать объект");
    } finally {
      setBusyId(null);
    }
  }

  async function batchDelete() {
    const count = selectedIds.size;
    if (!confirm(`Удалить ${count} объект${count === 1 ? "" : "а"}?`)) return;

    for (const id of selectedIds) {
      await api(`/objects/${id}`, { method: "DELETE" }).catch(() => {});
    }

    setObjects((prev) => prev.filter((o) => !selectedIds.has(o.id)));
    setSelectedIds(new Set());
    setBatchMode(false);
  }

  const filteredAndSorted = useMemo(() => {
    let filtered = [...objects];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (obj) =>
          obj.name.toLowerCase().includes(q) ||
          obj.city.toLowerCase().includes(q) ||
          (obj.address && obj.address.toLowerCase().includes(q))
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((obj) => obj.type === typeFilter);
    }

    if (withPhotosOnly) {
      filtered = filtered.filter((obj) => obj.photos && obj.photos.length > 0);
    }

    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case "name":
          aVal = a.name;
          bVal = b.name;
          break;
        case "date":
          aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        case "activeSlots":
          aVal = a.stats?.activeSlots ?? 0;
          bVal = b.stats?.activeSlots ?? 0;
          break;
        case "rating":
          aVal = a.stats?.rating ?? 0;
          bVal = b.stats?.rating ?? 0;
          break;
        default:
          aVal = a.name;
          bVal = b.name;
      }
      if (sortOrder === "asc") return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

    return filtered;
  }, [objects, searchQuery, typeFilter, withPhotosOnly, sortBy, sortOrder]);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSorted.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSorted.map((o) => o.id)));
    }
  };

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(full)].map((_, i) => (
          <Star key={`full-${i}`} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        ))}
        {half && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
        {[...Array(empty)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-3 w-3 text-gray-300" />
        ))}
        <span className="ml-1 text-xs text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопка создания */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Объекты</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredAndSorted.length} объект{getDeclension(filteredAndSorted.length)}
          </p>
        </div>

        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={batchDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition"
            >
              Удалить ({selectedIds.size})
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Фильтры
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <Link
            href="/dashboard/objects/new"
            className="px-4 py-2 bg-[#c29cf2] text-white rounded-xl text-sm font-medium hover:bg-[#b088e8] transition flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Создать объект
          </Link>
        </div>
      </div>

      {/* Ошибка */}
      {err && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
          <AlertCircle className="h-5 w-5 mt-0.5" />
          {err}
        </div>
      )}

      {/* Панель фильтров */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Поиск */}
            <div>
              <label className="block text-sm font-medium mb-2">Поиск</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Название, город, адрес..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Тип объекта */}
            <div>
              <label className="block text-sm font-medium mb-2">Тип объекта</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as ObjectType | "all")}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              >
                <option value="all">Все типы</option>
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Сортировка */}
            <div>
              <label className="block text-sm font-medium mb-2">Сортировка</label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm"
                >
                  <option value="name">По названию</option>
                  <option value="date">По дате создания</option>
                  <option value="activeSlots">По активным сменам</option>
                  <option value="rating">По рейтингу</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50"
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={withPhotosOnly}
                onChange={(e) => setWithPhotosOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm">Только с фото</span>
            </label>

            {batchMode && (
              <div className="flex gap-2">
                <button
                  onClick={toggleSelectAll}
                  className="text-sm text-gray-600 hover:text-black"
                >
                  {selectedIds.size === filteredAndSorted.length ? "Снять все" : "Выбрать все"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Список объектов */}
      {filteredAndSorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="flex justify-center mb-4">
            <Warehouse className="h-12 w-12 text-gray-300" />
          </div>
          <h2 className="text-lg font-medium mb-2">Нет объектов</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {searchQuery || typeFilter !== "all" || withPhotosOnly
              ? "Попробуйте изменить параметры фильтрации"
              : "Добавьте объект, чтобы создавать смены и находить исполнителей"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAndSorted.map((object) => {
            const Icon = getTypeIcon(object.type);
            const isNew = object.createdAt && (Date.now() - new Date(object.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
            const isSelected = selectedIds.has(object.id);

            return (
              <div
                key={object.id}
                className={`group relative bg-white rounded-xl border transition-all hover:shadow-md ${
                  isSelected ? "border-[#c29cf2] bg-[#c29cf2]/5" : "border-gray-200"
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Чекбокс для массовых действий */}
                    {batchMode && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(object.id)}
                        className="mt-1 w-4 h-4 rounded border-gray-300"
                      />
                    )}

                    {/* Фото превью */}
                    <div className="flex-shrink-0">
                      {object.photos && object.photos.length > 0 ? (
                        <img
                          src={object.photos[0]}
                          alt={object.name}
                          className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Основная информация */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold">{object.name}</h3>
                        {isNew && (
                          <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            <CheckCircle className="h-3 w-3" />
                            Новый
                          </span>
                        )}
                        {object.stats && object.stats.activeSlots > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {object.stats.activeSlots} активн{object.stats.activeSlots === 1 ? "ая смена" : "ых смен"}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Icon className="h-4 w-4" />
                          {TYPE_OPTIONS.find((t) => t.value === object.type)?.label || "Не указан"}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="h-4 w-4" />
                          {object.city}
                          {object.address ? `, ${object.address}` : ""}
                        </div>
                        {object.stats?.rating && renderStars(object.stats.rating)}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(object.createdAt)}
                        </span>
                        <span>📊 Всего смен: {object.stats?.totalSlots ?? 0}</span>
                        <span>✅ Завершено: {object.stats?.completedSlots ?? 0}</span>
                      </div>
                    </div>

                    {/* Действия */}
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                      <Link
                        href={`/dashboard/objects/${object.id}/edit`}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                        title="Редактировать"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>

                      <button
                        onClick={() => duplicateObject(object)}
                        disabled={busyId === object.id}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                        title="Копировать"
                      >
                        <Copy className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => archiveObject(object.id)}
                        disabled={busyId === object.id}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                        title="Архивировать"
                      >
                        <Archive className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => removeObject(object.id)}
                        disabled={busyId === object.id}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"
                        title="Удалить"
                      >
                        <Trash className="h-4 w-4" />
                      </button>

                      <div className="relative group/tooltip">
                        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                          <Share2 className="h-4 w-4" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 hidden group-hover/tooltip:block bg-gray-800 text-white text-xs rounded-lg py-1 px-2 whitespace-nowrap z-10">
                          Поделиться
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Быстрые действия под карточкой */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-100">
                    <Link
                      href={`/dashboard/objects/${object.id}/slots/new`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#c29cf2] hover:underline"
                    >
                      <Plus className="h-3 w-3" />
                      Создать смену
                    </Link>

                    <div className="flex items-center gap-3">
                      {object.lat && object.lng && (
                        <a
                          href={`https://yandex.ru/maps/?pt=${object.lng},${object.lat}&z=16`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        >
                          <MapPin className="h-3 w-3" />
                          Маршрут
                        </a>
                      )}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/dashboard/objects/${object.id}`);
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        <Share2 className="h-3 w-3" />
                        Поделиться
                      </button>
                      <button className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                        <QrCode className="h-3 w-3" />
                        QR-код
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Кнопка массового выделения (плавающая) */}
      {objects.length > 5 && !batchMode && (
        <div className="fixed bottom-24 right-6 z-20">
          <button
            onClick={() => setBatchMode(true)}
            className="px-4 py-2 bg-gray-800 text-white rounded-full text-sm shadow-lg hover:bg-gray-900 transition"
          >
            Массовое выделение
          </button>
        </div>
      )}

      {batchMode && (
        <div className="fixed bottom-6 right-6 z-20 flex gap-2">
          <button
            onClick={() => setBatchMode(false)}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm shadow-lg hover:bg-gray-900"
          >
            Отмена
          </button>
          <button
            onClick={batchDelete}
            disabled={selectedIds.size === 0}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm shadow-lg hover:bg-red-600 disabled:opacity-50"
          >
            Удалить ({selectedIds.size})
          </button>
        </div>
      )}
    </div>
  );
}

function getDeclension(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return "";
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return "а";
  return "ов";
}
