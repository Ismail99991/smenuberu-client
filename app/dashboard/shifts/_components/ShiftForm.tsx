"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Save, Flame } from "lucide-react";

export type TaskType =
  | "driver"
  | "picker"
  | "loader"
  | "cook"
  | "waiter"
  | "cleaner"
  | "other";

export type ShiftFormValues = {
  objectId: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  pay: string; // number as string for input

  // UI поля (пока не используются API, оставляем)
  workers: string;
  payType: "shift" | "hour";
  comment: string;

  // ✅ edit-only
  published: boolean;

  // ✅ то, что реально нужно API
  type: TaskType;
  hot: boolean;
};

type Props = {
  mode: "create" | "edit";
  initialValues?: Partial<ShiftFormValues>;
  onSubmit?: (values: ShiftFormValues) => void | Promise<void>;
  submitLabel?: string;
  submitting?: boolean;

  // вместо текстовой ссылки “Отмена” — иконка-кнопка
  onCancel?: () => void;
};

type ApiObject = {
  id: string;
  name: string;
  city: string;
  address: string | null;
  createdAt: string;
};

const defaultValues: ShiftFormValues = {
  objectId: "",
  title: "",
  date: "",
  startTime: "",
  endTime: "",
  pay: "",

  workers: "",
  payType: "shift",
  comment: "",
  published: true,

  type: "other",
  hot: false
};

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "https://smenuberu-api.onrender.com";
}

export default function ShiftForm({
  mode,
  initialValues,
  onSubmit,
  submitLabel,
  submitting = false,
  onCancel
}: Props) {
  const initial = useMemo<ShiftFormValues>(() => {
    return { ...defaultValues, ...(initialValues ?? {}) };
  }, [initialValues]);

  const [values, setValues] = useState<ShiftFormValues>(initial);

  const [objects, setObjects] = useState<ApiObject[]>([]);
  const [objectsLoading, setObjectsLoading] = useState<boolean>(true);
  const [objectsError, setObjectsError] = useState<string | null>(null);

  function patch<K extends keyof ShiftFormValues>(key: K, val: ShiftFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  useEffect(() => {
    let cancelled = false;

    async function loadObjects() {
      setObjectsLoading(true);
      setObjectsError(null);

      try {
        const baseUrl = getApiBaseUrl();
        const res = await fetch(`${baseUrl}/objects`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store"
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Failed to load objects: ${res.status}${text ? ` ${text}` : ""}`);
        }

        const data = (await res.json()) as ApiObject[];
        if (!cancelled) setObjects(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (!cancelled) {
          setObjects([]);
          setObjectsError(err?.message ?? "Failed to load objects");
        }
      } finally {
        if (!cancelled) setObjectsLoading(false);
      }
    }

    loadObjects();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (onSubmit) await onSubmit(values);
  }

  const submitText =
    submitLabel ?? (mode === "create" ? "Сохранить" : "Сохранить изменения");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Блок 0: API-обязательные поля */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Тип задачи</label>
            <select
              value={values.type}
              onChange={(e) => patch("type", e.target.value as TaskType)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            >
              <option value="driver">driver</option>
              <option value="picker">picker</option>
              <option value="loader">loader</option>
              <option value="cook">cook</option>
              <option value="waiter">waiter</option>
              <option value="cleaner">cleaner</option>
              <option value="other">other</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 select-none">
              <input
                type="checkbox"
                checked={values.hot}
                onChange={(e) => patch("hot", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 inline-flex items-center gap-2">
                <Flame className="h-4 w-4" />
                Hot
              </span>
            </label>
          </div>

          <div className="flex items-end md:justify-end">
            {mode === "edit" ? (
              <label className="flex items-center gap-2 select-none">
                <input
                  type="checkbox"
                  checked={values.published}
                  onChange={(e) => patch("published", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Опубликовано</span>
              </label>
            ) : (
              <div className="text-xs text-gray-500">Публикация на create не показывается</div>
            )}
          </div>
        </div>
      </div>

      {/* Блок 1 */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Объект</label>
          <select
            value={values.objectId}
            onChange={(e) => patch("objectId", e.target.value)}
            disabled={objectsLoading}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-60"
          >
            <option value="">
              {objectsLoading ? "Загрузка объектов…" : "Выберите объект…"}
            </option>

            {objects.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} — {o.city}
                {o.address ? `, ${o.address}` : ""}
              </option>
            ))}
          </select>

          {objectsError ? <p className="mt-2 text-sm text-red-600">{objectsError}</p> : null}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Название смены</label>
          <input
            type="text"
            value={values.title}
            onChange={(e) => patch("title", e.target.value)}
            placeholder="Например: Грузчик на склад"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Дата</label>
            <input
              type="date"
              value={values.date}
              onChange={(e) => patch("date", e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Время начала</label>
            <input
              type="time"
              value={values.startTime}
              onChange={(e) => patch("startTime", e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Время окончания</label>
            <input
              type="time"
              value={values.endTime}
              onChange={(e) => patch("endTime", e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
        </div>
      </div>

      {/* Блок 2 */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Оплата (₽/смена)</label>
            <input
              type="number"
              value={values.pay}
              onChange={(e) => patch("pay", e.target.value)}
              placeholder="Например: 3500"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Кол-во исполнителей</label>
            <input
              type="number"
              value={values.workers}
              onChange={(e) => patch("workers", e.target.value)}
              placeholder="Например: 5"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Тип оплаты</label>
            <select
              value={values.payType}
              onChange={(e) => patch("payType", e.target.value as ShiftFormValues["payType"])}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            >
              <option value="shift">За смену</option>
              <option value="hour">За час</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Комментарий (необязательно)</label>
          <textarea
            rows={4}
            value={values.comment}
            onChange={(e) => patch("comment", e.target.value)}
            placeholder="Например: форма одежды, пропуск, точка сбора…"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>
      </div>

      {/* Actions (без текстовых ссылок) */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={!onCancel || submitting}
          className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-800 hover:bg-gray-50 transition disabled:opacity-50"
          aria-label="Отмена"
          title="Отмена"
        >
          <X className="h-5 w-5" />
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {submitText}
        </button>
      </div>
    </form>
  );
}
