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

  // ⬇️ БЫЛО: date: string
  dates: string[]; // YYYY-MM-DD[]

  startTime: string;
  endTime: string;
  pay: string;

  // UI поля (не используются API)
  workers: string;
  payType: "shift" | "hour";
  comment: string;

  // edit-only
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
  address: string | null;
  createdAt: string;
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
  published: true,

  type: "other",
  hot: false
};

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "https://smenuberu-api.onrender.com";
}

export default function ShiftForm({
  mode,
  backHref,
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

  function patch<K extends keyof ShiftFormValues>(
    key: K,
    val: ShiftFormValues[K]
  ) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  function addDate(d: string) {
    if (!d) return;
    setValues((v) =>
      v.dates.includes(d)
        ? v
        : { ...v, dates: [...v.dates, d].sort() }
    );
  }

  function removeDate(d: string) {
    setValues((v) => ({
      ...v,
      dates: v.dates.filter((x) => x !== d)
    }));
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
          throw new Error(
            `Failed to load objects: ${res.status}${text ? ` ${text}` : ""}`
          );
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

  const cancelHandler =
    onCancel ??
    (backHref
      ? () => {
          window.location.href = backHref;
        }
      : undefined);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Блок 0 */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Тип задачи</label>
            <select
              value={values.type}
              onChange={(e) => patch("type", e.target.value as TaskType)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
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
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={values.hot}
                onChange={(e) => patch("hot", e.target.checked)}
              />
              <span className="text-sm flex items-center gap-1">
                <Flame className="h-4 w-4" /> Hot
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Блок 1 */}
      <div className="rounded-xl bg-white border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Объект</label>
          <select
            value={values.objectId}
            onChange={(e) => patch("objectId", e.target.value)}
            disabled={objectsLoading}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">
              {objectsLoading ? "Загрузка…" : "Выберите объект…"}
            </option>
            {objects.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} — {o.city}
              </option>
            ))}
          </select>
          {objectsError && (
            <p className="mt-2 text-sm text-red-600">{objectsError}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Название смены
          </label>
          <input
            type="text"
            value={values.title}
            onChange={(e) => patch("title", e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        {/* 🔥 МУЛЬТИВЫБОР ДАТ */}
        <div>
          <label className="block text-sm font-medium mb-2">Даты смен</label>
          <input
            type="date"
            className="rounded-lg border px-3 py-2 text-sm"
            onChange={(e) => addDate(e.target.value)}
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
      </div>

      {/* Блок 2 */}
      <div className="rounded-xl bg-white border p-6 space-y-4">
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
        <button
          type="button"
          onClick={cancelHandler}
          disabled={!cancelHandler || submitting}
          className="rounded-lg border p-2"
        >
          <X className="h-5 w-5" />
        </button>

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
