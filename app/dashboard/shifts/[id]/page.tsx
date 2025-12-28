import { notFound } from "next/navigation";
import ShiftForm, {
  ShiftFormValues,
} from "../_components/ShiftForm";

type SlotResponse = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  pay: number | null;
  type: string;
  hot: boolean;
  published: boolean;
};

function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_URL ??
    "https://smenuberu-api.onrender.com"
  );
}

async function loadSlot(id: string): Promise<SlotResponse> {
  const baseUrl = getApiBaseUrl();

  const res = await fetch(`${baseUrl}/slots/${id}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (res.status === 404) {
    notFound();
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to load slot ${id}: ${res.status}${
        text ? ` ${text}` : ""
      }`
    );
  }

  return (await res.json()) as SlotResponse;
}

export default async function ShiftDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const slot = await loadSlot(params.id);

  /**
   * ⚠️ ВАЖНО
   * Редактирование всегда = ОДНА дата
   * Поэтому dates: [slot.date]
   */
  const initialValues: Partial<ShiftFormValues> = {
    objectId: "", // объект НЕ редактируем здесь
    title: slot.title,
    dates: [slot.date],
    startTime: slot.startTime,
    endTime: slot.endTime,
    pay: slot.pay ? String(slot.pay) : "",
    type: slot.type as any,
    hot: slot.hot,
    published: slot.published,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Редактирование смены
        </h1>
        <p className="text-sm text-gray-500">
          ID: <span className="font-mono">{slot.id}</span>
        </p>
      </div>

      <ShiftForm
        mode="edit"
        backHref="/dashboard/shifts"
        initialValues={initialValues}
        submitLabel="Сохранить изменения"
        onSubmit={async (values) => {
          /**
           * ❗ Пока UI-only, как и было
           * Здесь позже будет PATCH /slots/:id
           */
          console.log(
            "EDIT SHIFT (not yet saved):",
            params.id,
            values
          );
        }}
      />
    </div>
  );
}
