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

  dates: string[]; // YYYY-MM-DD[]

  startTime: string;
  endTime: string;
  pay: string;

  // UI-only
  workers: string;
  payType: "shift" | "hour";
  comment: string;

  // IMPORTANT
  published: boolean;

  // API
  type: TaskType;
  hot: boolean;
};

type Props = {
  mode: "create" | "edit";
  backHref?: string;
  initialValues?: Partial<ShiftFormValues>;
  onSubmit?: (values: ShiftFormValues) => void | Promise<void>;
  submitLabel?: string;
  submitting?: boolean;
  onCancel?: () => void;
};

type ApiObject = {
  id: string;
  name: string;
  city: string;
};

const defaultValues: ShiftFormValues = {
  objectId: "",
  title: "",
  dates: [],

  startTime: "",
  endTime: "",
  pay: "",

  workers: "",
  payType: "shift",
  comment: "",

  published: true, // 🔥 теперь честно

  type: "other",
  hot: false
};

function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_URL ??
    "https://smenuberu-api.onrender.com"
  );
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
  const [loadingObjects, setLoadingObjects] = useState(true);
  const [objectsError, setObjectsError] = useState<string | null>(null);

  function patch<K extends keyof ShiftFormValues>(
    key: K,
    val: ShiftFormValues[K]
  ) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  // =========================
  // 📅 ДАТЫ — ИСПРАВЛЕНО
  // =========================
  function addDate(date: string) {
    if (!date) return;

    setValues((v) => {
      if (v.dates.includes(date)) return v;

      const next = [...v.dates, date];
      next.sort(); // YYYY-MM-DD сортируется строкой корректно
      return { ...v, dates: next };
    });
  }

  function removeDate(date: string) {
    setValues((v) => ({
      ...v,
      dates: v.dates.filter((d) => d !== date)
    }));
  }

  // =========================
  // 🔄 ЗАГРУЗКА ОБЪЕКТОВ
  // =========================
  useEffect(() => {
    let cancelled = false;

    async function loadObjects() {
      try {
        const res = await fetch(`${getApiBaseUrl()}/objects`, {
          headers: { Accept: "application/json" },
          cache: "no-store"
        });

        if (!res.ok) throw new Error("Не удалось загрузить объекты");

        const data = (await res.json()) as ApiObject[];
        if (!cancelled) setObjects(data);
      } catch (e: any) {
        if (!cancelled) setObjectsError(e?.message ?? "Ошибка");
      } finally {
        if (!cancelled) setLoadingObjects(false);
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
    submitLabel ??
    (mode === "create" ? "Создать смену" : "Сохранить изменения");

  // =========================
  // 🧱 UI
  // =========================
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Тип + Hot */}
      <div className="rounded-xl border bg-white p-6 space-y-4">
        <div className="flex gap-4">
          <select
            value={values.type}
            onChange={(e) =>
              patch("type", e.target.value as TaskType)
            }
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="driver">driver</option>
            <option value="picker">picker</option>
            <option value="loader">loader</option>
            <option value="cook">cook</option>
            <option value="waiter">waiter</option>
            <option value="cleaner">cleaner</option>
            <option value="other">other</option>
          </select>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={values.hot}
              onChange={(e) => patch("hot", e.target.checked)}
            />
            <Flame className="h-4 w-4" /> Hot
          </label>
        </div>
      </div>

      {/* Основные поля */}
      <div className="rounded-xl border bg-white p-6 space-y-4">
        {/* Объект */}
        <select
          value={values.objectId}
          onChange={(e) => patch("objectId", e.target.value)}
          disabled={loadingObjects}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">
            {loadingObjects ? "Загрузка…" : "Выберите объект"}
          </option>
          {objects.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} — {o.city}
            </option>
          ))}
        </select>
        {objectsError && (
          <div className="text-sm text-red-600">{objectsError}</div>
        )}

        {/* Название */}
        <input
          type="text"
          placeholder="Название смены"
          value={values.title}
          onChange={(e) => patch("title", e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />

        {/* Даты */}
        <div>
          <input
            type="date"
            onChange={(e) => {
              addDate(e.target.value);
              e.currentTarget.value = ""; // 🔥 важно
            }}
            className="rounded-lg border px-3 py-2 text-sm"
          />

          <div className="flex flex-wrap gap-2 mt-2">
            {values.dates.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => removeDate(d)}
                className="px-3 py-1 rounded-full bg-gray-100 text-sm"
              >
                {d} ✕
              </button>
            ))}
          </div>
        </div>

        {/* Время */}
        <div className="grid grid-cols-2 gap-4">
          <input
            type="time"
            value={values.startTime}
            onChange={(e) => patch("startTime", e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            type="time"
            value={values.endTime}
            onChange={(e) => patch("endTime", e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        {/* Оплата */}
        <input
          type="number"
          placeholder="Оплата"
          value={values.pay}
          onChange={(e) => patch("pay", e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border p-2"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-black text-white px-4 py-2 flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {submitText}
        </button>
      </div>
    </form>
  );
}
