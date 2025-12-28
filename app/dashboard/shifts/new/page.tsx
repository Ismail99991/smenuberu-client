"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import ShiftForm, { ShiftFormValues } from "../_components/ShiftForm";
import { ArrowLeft, CheckCircle2, AlertTriangle, List } from "lucide-react";

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "https://smenuberu-api.onrender.com";
}

function addDaysISO(dateISO: string, daysToAdd: number) {
  // dateISO: "YYYY-MM-DD"
  const [y, m, d] = dateISO.split("-").map((x) => Number(x));
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + daysToAdd);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export default function NewShiftPage() {
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdIds, setCreatedIds] = useState<string[]>([]);

  // multi-day mode
  const [multiDay, setMultiDay] = useState(false);
  const [daysCount, setDaysCount] = useState<number>(3);

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

    // ✅ ИСПРАВЛЕНИЕ ЗДЕСЬ
    // API может вернуть { id } ИЛИ { slot: { id } }
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

      if (!values.objectId) throw new Error("Выбери объект.");
      if (!values.title.trim()) throw new Error("Введи название смены.");
      if (!values.date) throw new Error("Выбери дату.");
      if (!values.startTime) throw new Error("Выбери время начала.");
      if (!values.endTime) throw new Error("Выбери время окончания.");
      if (!Number.isFinite(pay) || pay <= 0) {
        throw new Error("Оплата должна быть числом больше 0.");
      }

      const n = multiDay
        ? Math.max(1, Math.min(30, Number(daysCount) || 1))
        : 1;

      const ids: string[] = [];
      for (let i = 0; i < n; i++) {
        const dateISO = addDaysISO(values.date, i);
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
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Создать смену</h1>
          <p className="text-sm text-gray-500">
            Смена создаётся в API и появится в списке
            {multiDay ? " (несколько дней подряд)" : ""}
          </p>
        </div>

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

      {/* Multi-day controls */}
      <div className="rounded-xl bg-white p-4 border border-gray-200 flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={multiDay}
            onChange={(e) => setMultiDay(e.target.checked)}
            disabled={submitting}
          />
          <span className="font-medium">
            Открыть слоты на несколько дней подряд
          </span>
        </label>

        <div className="sm:ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-500">Дней:</span>
          <input
            type="number"
            min={1}
            max={30}
            value={daysCount}
            onChange={(e) => setDaysCount(Number(e.target.value))}
            disabled={!multiDay || submitting}
            className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <span className="text-xs text-gray-500">(1–30)</span>
        </div>
      </div>

      {/* Error */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 mt-0.5" />
          <div className="min-w-0">
            <div className="font-medium">Ошибка</div>
            <div className="break-words">{error}</div>
          </div>
        </div>
      ) : null}

      {/* Success */}
      {createdIds.length > 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 mt-0.5" />
          <div className="min-w-0">
            <div className="font-medium">
              Создано смен: {createdIds.length}
            </div>
            <div className="break-words">
              ID:{" "}
              <span className="font-mono">
                {createdIds.join(", ")}
              </span>
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
          submitLabel={
            submitting
              ? "Сохранение…"
              : multiDay
              ? "Создать"
              : "Сохранить"
          }
        />
      </div>
    </div>
  );
}
