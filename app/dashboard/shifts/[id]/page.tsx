import Link from "next/link";
import ShiftForm, { type ShiftFormValues } from "../_components/ShiftForm";

type PageProps = {
  params: { id: string };
};

type ApiSlot = {
  id: string;
  date: string;   // YYYY-MM-DD
  title: string;
  company: string;
  city: string;
  address: string;
  time: string;   // "08:00–15:00"
  pay: number;
  hot?: boolean;
  tags: string[];
  type: string;
};

function parseTimeRange(time: string): { startTime: string; endTime: string } {
  // ожидаем "HH:MM–HH:MM" (en dash)
  const normalized = time.replace("-", "–");
  const [startTime, endTime] = normalized.split("–").map((s) => s.trim());
  return {
    startTime: startTime || "",
    endTime: endTime || ""
  };
}

async function getSlot(id: string): Promise<ApiSlot | null> {
  const res = await fetch(`https://smenuberu-api.onrender.com/slots/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function EditShiftPage({ params }: PageProps) {
  const slot = await getSlot(params.id);

  if (!slot) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Смена не найдена</h1>
            <p className="text-sm text-gray-500">
              ID: <span className="font-mono">{params.id}</span>
            </p>
          </div>

          <Link href="/dashboard/shifts" className="text-sm text-gray-600 hover:underline">
            ← Назад к списку
          </Link>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Проверь ID или обнови список смен.
        </div>
      </div>
    );
  }

  const { startTime, endTime } = parseTimeRange(slot.time);

  const initialValues: Partial<ShiftFormValues> = {
    // objectId пока нет в API — оставляем пустым до подключения objects
    title: slot.title,
    date: slot.date,
    startTime,
    endTime,
    pay: String(slot.pay ?? ""),
    published: true // пока UI-only, позже свяжем с полем в БД
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Редактировать смену</h1>
          <p className="text-sm text-gray-500">
            ID: <span className="font-mono">{slot.id}</span>
          </p>
        </div>

        <Link
          href="/dashboard/shifts"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 transition"
        >
          Назад
        </Link>
      </div>

      <ShiftForm
        mode="edit"
        backHref="/dashboard/shifts"
        initialValues={initialValues}
        onSubmit={(values) => {
          // пока UI-only (следующий шаг — PATCH)
          console.log("EDIT shift (UI-only):", params.id, values);
        }}
      />
    </div>
  );
}
