"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import ShiftForm, { ShiftFormValues } from "../_components/ShiftForm";
import { ArrowLeft, List, AlertTriangle, CheckCircle2 } from "lucide-react";

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "https://smenuberu-api.onrender.com";
}

export default function NewShiftPage() {
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdIds, setCreatedIds] = useState<string[]>([]);

  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);

  async function createOne(values: ShiftFormValues, dateISO: string) {
    const pay = Number(values.pay);

    const res = await fetch(`${apiBaseUrl}/slots`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        objectId: values.objectId,
        title: values.title,
        date: dateISO,
        startTime: values.startTime,
        endTime: values.endTime,
        pay: Math.round(pay),
        type: values.type,
        hot: values.hot,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API error: ${res.status}${text ? ` — ${text}` : ""}`);
    }

    const data = (await res.json()) as {
      id?: string;
      slot?: { id?: string };
    };

    const id = data.id ?? data.slot?.id;
    if (!id) throw new Error("API: slot created but id missing");

    return id;
  }

  async function handleCreate(values: ShiftFormValues) {
    setSubmitting(true);
    setError(null);
    setCreatedIds([]);

    try {
      const pay = Number(values.pay);

      if (!values.objectId) throw new Error("Выбери объект");
      if (!values.title.trim()) throw new Error("Введи название смены");
      if (!values.dates || values.dates.length === 0)
        throw new Error("Выбери хотя бы одну дату");
      if (!values.startTime) throw new Error("Выбери время начала");
      if (!values.endTime) throw new Error("Выбери время окончания");
      if (!Number.isFinite(pay) || pay <= 0)
        throw new Error("Оплата должна быть больше 0");

      const ids: string[] = [];

      for (const dateISO of values.dates) {
        const id = await createOne(values, dateISO);
        ids.push(id);
      }

      setCreatedIds(ids);
    } catch (e: any) {
      setError(e?.message ?? "Ошибка создания смены");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Создать смену</h1>
          <p className="text-sm text-gray-500">
            Можно выбрать любые даты
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push("/dashboard/shifts")}
            className="rounded-lg border p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => router.push("/dashboard/shifts")}
            className="rounded-lg border p-2"
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex gap-2">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      )}

      {createdIds.length > 0 && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 flex gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Создано смен: {createdIds.length}
        </div>
      )}

      <div className={submitting ? "opacity-60 pointer-events-none" : ""}>
        <ShiftForm
          mode="create"
          submitting={submitting}
          onCancel={() => router.push("/dashboard/shifts")}
          onSubmit={handleCreate}
          submitLabel={submitting ? "Сохранение…" : "Создать"}
        />
      </div>
    </div>
  );
}
