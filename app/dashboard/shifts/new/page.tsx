"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import ShiftForm, { ShiftFormValues } from "../_components/ShiftForm";
import { ArrowLeft, CheckCircle2, AlertTriangle, List } from "lucide-react";

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "https://smenuberu-api.onrender.com";
}

export default function NewShiftPage() {
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);

  async function handleCreate(values: ShiftFormValues) {
    setSubmitting(true);
    setError(null);
    setCreatedId(null);

    try {
      const pay = Number(values.pay);

      if (!values.objectId) throw new Error("Выбери объект.");
      if (!values.title.trim()) throw new Error("Введи название смены.");
      if (!values.date) throw new Error("Выбери дату.");
      if (!values.startTime) throw new Error("Выбери время начала.");
      if (!values.endTime) throw new Error("Выбери время окончания.");
      if (!Number.isFinite(pay) || pay <= 0) throw new Error("Оплата должна быть числом больше 0.");

      const res = await fetch(`${apiBaseUrl}/slots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          objectId: values.objectId,
          title: values.title,
          date: values.date,
          startTime: values.startTime,
          endTime: values.endTime,
          pay: Math.round(pay),
          type: values.type, // ✅ из формы
          hot: values.hot // ✅ из формы
        })
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`API error: ${res.status}${text ? ` — ${text}` : ""}`);
      }

      const created = (await res.json()) as { id?: string };
      setCreatedId(created?.id ?? null);
    } catch (e: any) {
      setError(e?.message ?? "Ошибка создания смены");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Создать смену</h1>
          <p className="text-sm text-gray-500">Смена создаётся в API и появится в списке</p>
        </div>

        {/* Без текстовых ссылок */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/dashboard/shifts")}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-800 hover:bg-gray-50 transition"
            aria-label="Назад"
            title="Назад"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => router.push("/dashboard/shifts")}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-800 hover:bg-gray-50 transition"
            aria-label="Список смен"
            title="Список смен"
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 mt-0.5" />
          <div className="min-w-0">
            <div className="font-medium">Ошибка</div>
            <div className="break-words">{error}</div>
          </div>
        </div>
      ) : null}

      {createdId ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 mt-0.5" />
          <div className="min-w-0">
            <div className="font-medium">Смена создана</div>
            <div className="break-words">
              ID: <span className="font-mono">{createdId}</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Form */}
      <div className={submitting ? "opacity-60 pointer-events-none" : ""}>
        <ShiftForm
          mode="create"
          submitting={submitting}
          onCancel={() => router.push("/dashboard/shifts")}
          onSubmit={handleCreate}
          submitLabel={submitting ? "Сохранение…" : "Сохранить"}
        />
      </div>
    </div>
  );
}
