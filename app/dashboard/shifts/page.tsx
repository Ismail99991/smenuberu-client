import Link from "next/link";

type AdminShift = {
  id: string;
  title: string;
  company: string;
  date: string;
};

async function getAdminShifts(): Promise<AdminShift[]> {
  const res = await fetch("https://smenuberu-api.onrender.com/slots", {
    // важно: без кеша, чтобы админка видела актуальные данные
    cache: "no-store"
  });

  if (!res.ok) {
    console.error("Failed to load shifts", res.status);
    return [];
  }

  const data = await res.json();

  // минимальное приведение под admin UI
  return data.map((slot: any) => ({
    id: slot.id,
    title: slot.title,
    company: slot.company,
    date: slot.date
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

                <div className="text-sm text-gray-500">
                  {shift.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
