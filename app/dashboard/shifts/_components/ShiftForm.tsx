"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type ShiftFormValues = {
  objectId: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  pay: string; // number as string for input
  workers: string; // number as string for input
  payType: "shift" | "hour";
  comment: string;
  published: boolean; // ✅ “снять с публикации” = false
};

type Props = {
  mode: "create" | "edit";
  backHref?: string;
  initialValues?: Partial<ShiftFormValues>;
  onSubmit?: (values: ShiftFormValues) => void | Promise<void>;
  submitLabel?: string;
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
  published: true
};

export default function ShiftForm({
  mode,
  backHref = "/dashboard/shifts",
  initialValues,
  onSubmit,
  submitLabel
}: Props) {
  const initial = useMemo<ShiftFormValues>(() => {
    return { ...defaultValues, ...(initialValues ?? {}) };
  }, [initialValues]);

  const [values, setValues] = useState<ShiftFormValues>(initial);

  function patch<K extends keyof ShiftFormValues>(key: K, val: ShiftFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (onSubmit) await onSubmit(values);
  }

  const submitText =
    submitLabel ?? (mode === "create" ? "Сохранить" : "Сохранить изменения");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Блок 1 */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Объект</label>
            <select
              value={values.objectId}
              onChange={(e) => patch("objectId", e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            >
              <option value="">Выберите объект…</option>
              {/* TODO: подгрузим реальные объекты из API */}
              <option value="demo-1">Объект #1 (пример)</option>
              <option value="demo-2">Объект #2 (пример)</option>
            </select>
          </div>

          {/* ✅ Публикация — показываем только в edit */}
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
          ) : null}
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
          <label className="block text-sm font-medium mb-2">
            Комментарий (необязательно)
          </label>
          <textarea
            rows={4}
            value={values.comment}
            onChange={(e) => patch("comment", e.target.value)}
            placeholder="Например: форма одежды, пропуск, точка сбора…"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Link
          href={backHref}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 transition"
        >
          Отмена
        </Link>

        <button
          type="submit"
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition"
        >
          {submitText}
        </button>
      </div>
    </form>
  );
}
