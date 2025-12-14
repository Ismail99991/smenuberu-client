import Link from "next/link";

type Shift = {
  id: number;
  title: string;
  date: string;
  object: string;
};

const shifts: Shift[] = [];

export default function ShiftsPage() {
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
                    {shift.object}
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
