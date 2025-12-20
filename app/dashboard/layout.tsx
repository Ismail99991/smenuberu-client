import Link from "next/link";
import { Pencil } from "lucide-react";

type AdminShift = {
  id: string;
  title: string;
  company: string;
  date: string;
};

async function getAdminShifts(): Promise<AdminShift[]> {
  const res = await fetch("https://smenuberu-api.onrender.com/slots", {
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Failed to load shifts", res.status);
    return [];
  }

  const data = await res.json();

  return data.map((slot: any) => ({
    id: slot.id,
    title: slot.title,
    company: slot.company,
    date: slot.date,
  }));
}

export default async function ShiftsPage() {
  const shifts = await getAdminShifts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Смены</h1>

        <Link
          href="/dashboard/shifts/new"
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition"
        >
          Создать смену
        </Link>
      </div>

      {/* Content */}
      {shifts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <h2 className="text-lg font-medium mb-2">
            У вас пока нет смен
          </h2>
          <p className="text-sm text-gray-500">
            Создайте первую смену, чтобы начать поиск исполнителей
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className="rounded-xl bg-white p-6 border border-gray-200 hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{shift.title}</div>
                  <div className="text-sm text-gray-500">
                    {shift.company}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-500">
                    {shift.date}
                  </div>

                  <Link
                    href={`/dashboard/shifts/${shift.id}`}
                    className="
                      h-8
                      rounded-lg
                      border border-gray-200
                      flex items-center gap-1.5
                      px-3
                      text-xs
                      text-gray-700
                      hover:bg-gray-50
                      transition
                    "
                    title="Редактировать смену"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Редактировать</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
