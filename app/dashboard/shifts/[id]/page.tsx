import { notFound } from "next/navigation";
import ShiftForm, {
  ShiftFormValues,
} from "../_components/ShiftForm";

type BookingUser = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
};

type Booking = {
  id: string;
  status: string;
  user: BookingUser | null;
};

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

  // ⬅️ может быть, а может нет
  bookings?: Booking[];
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
    headers: { Accept: "application/json" },
  });

  if (res.status === 404) notFound();

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

  const initialValues: Partial<ShiftFormValues> = {
    objectId: "",
    title: slot.title,
    dates: [slot.date], // ⬅️ одна дата
    startTime: slot.startTime,
    endTime: slot.endTime,
    pay: slot.pay ? String(slot.pay) : "",
    type: slot.type as any,
    hot: slot.hot,
    published: slot.published,
  };

  const bookings = slot.bookings ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">
          Управление сменой
        </h1>
        <p className="text-sm text-gray-500">
          ID: <span className="font-mono">{slot.id}</span>
        </p>
      </div>

      {/* Edit form */}
      <ShiftForm
        mode="edit"
        backHref="/dashboard/shifts"
        initialValues={initialValues}
        submitLabel="Сохранить изменения"
        onSubmit={async (values) => {
          // пока UI-only
          console.log(
            "EDIT SHIFT (not yet saved):",
            params.id,
            values
          );
        }}
      />

      {/* Bookings */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-medium">
          Исполнители ({bookings.length})
        </h2>

        {bookings.length === 0 ? (
          <div className="text-sm text-gray-500">
            Пока никто не записался на эту смену
          </div>
        ) : (
          <ul className="divide-y">
            {bookings.map((b) => (
              <li
                key={b.id}
                className="py-3 flex items-center gap-3"
              >
                {/* Avatar */}
                {b.user?.avatarUrl ? (
                  <img
                    src={b.user.avatarUrl}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200" />
                )}

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {b.user?.displayName ?? "Без имени"}
                  </div>
                </div>

                {/* Status */}
                <div className="text-sm text-gray-500">
                  {b.status}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
