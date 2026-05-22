import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Pencil, Trash2, Users, Eye, Archive, Clock, CheckCircle, XCircle } from "lucide-react";

type Shift = {
  id: string;
  title: string;
  object?: { name: string } | null;
  date: string;
  startTime: string;
  endTime: string;
  published: boolean;
  hot: boolean;
  bookings: {
    id: string;
    status: string;
    user: { displayName: string };
  }[];
};

async function getShifts() {
  const cookieStore = await cookies();
  const session = cookieStore.get("smenuberu_session");

  if (!session) redirect("/login");

  const res = await fetch("https://api.smenube.ru/slots/created", {
    cache: "no-store",
    headers: { Cookie: `smenuberu_session=${session.value}` },
  });

  if (res.status === 401 || res.status === 403) redirect("/login");
  if (!res.ok) throw new Error("Ошибка загрузки смен");

  const data = await res.json();
  return data.slots ?? [];
}

function isPast(date: string): boolean {
  return new Date(date) < new Date();
}

function isWithin6Hours(date: string, startTime: string): boolean {
  const shiftStart = new Date(`${date}T${startTime}`);
  const now = new Date();
  const diffHours = (shiftStart.getTime() - now.getTime()) / (1000 * 60 * 60);
  return diffHours < 6;
}

export default async function ShiftsPage() {
  const shifts: Shift[] = await getShifts();

  const upcoming = shifts.filter(
    (s) => !isPast(s.date) && s.published
  );
  const awaiting = shifts.filter((s) =>
    s.bookings.some((b) => b.status === "pending")
  );
  const draft = shifts.filter((s) => !s.published && !isPast(s.date));
  const archived = shifts.filter((s) => isPast(s.date));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Управление сменами</h1>
        <Link
          href="/dashboard/shifts/new"
          className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800"
        >
          + Создать смену
        </Link>
      </div>

      {/* Предстоящие смены (основной блок) */}
      <section>
        <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Предстоящие смены
        </h2>
        {upcoming.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500 text-sm">
            Нет активных смен. Создайте новую.
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((shift) => (
              <ShiftCard key={shift.id} shift={shift} />
            ))}
          </div>
        )}
      </section>

      {/* Ожидают подтверждения */}
      {awaiting.length > 0 && (
        <section>
          <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-600" />
            Ожидают подтверждения
          </h2>
          <div className="space-y-3">
            {awaiting.map((shift) => (
              <ShiftCard key={shift.id} shift={shift} highlight />
            ))}
          </div>
        </section>
      )}

      {/* Черновики (не опубликованные) */}
      {draft.length > 0 && (
        <section>
          <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
            <Eye className="h-5 w-5 text-gray-500" />
            Черновики
          </h2>
          <div className="space-y-3">
            {draft.map((shift) => (
              <ShiftCard key={shift.id} shift={shift} draft />
            ))}
          </div>
        </section>
      )}

      {/* Архив (прошедшие смены) */}
      {archived.length > 0 && (
        <section>
          <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Архив смен
          </h2>
          <div className="space-y-3">
            {archived.map((shift) => (
              <ShiftCard key={shift.id} shift={shift} archived />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Компонент карточки смены
function ShiftCard({
  shift,
  highlight = false,
  draft = false,
  archived = false,
}: {
  shift: Shift;
  highlight?: boolean;
  draft?: boolean;
  archived?: boolean;
}) {
  const pendingBookings = shift.bookings.filter((b) => b.status === "pending");
  const confirmedBookings = shift.bookings.filter((b) => b.status === "confirmed");

  const canEdit = !archived && (!shift.published || pendingBookings.length === 0);
  const canUnpublish = !archived && shift.published && !isWithin6Hours(shift.date, shift.startTime);

  return (
    <div
      className={`
        relative rounded-xl border p-4 transition-all
        ${highlight ? "border-amber-300 bg-amber-50/30" : ""}
        ${draft ? "border-dashed border-gray-300 bg-gray-50" : ""}
        ${archived ? "opacity-70 bg-gray-50" : "bg-white hover:shadow-sm"}
      `}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium">{shift.title}</h3>
            {shift.hot && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">🔥 Горящая</span>
            )}
            {!shift.published && !archived && (
              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">Черновик</span>
            )}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {shift.object?.name} • {shift.date} {shift.startTime}–{shift.endTime}
          </div>

          {/* Заявки на подтверждение */}
          {pendingBookings.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-sm text-amber-700">
              <Users className="h-4 w-4" />
              <span>
                {pendingBookings.length} заявк{getDeclension(pendingBookings.length)}
              </span>
              <Link
                href={`/dashboard/shifts/${shift.id}/confirm`}
                className="text-xs underline hover:no-underline"
              >
                Подтвердить
              </Link>
            </div>
          )}

          {/* Подтверждённые записи */}
          {confirmedBookings.length > 0 && (
            <div className="mt-1 text-sm text-green-700 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              {confirmedBookings.length} подтверждён{confirmedBookings.length === 1 ? "" : "о"}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!archived && (
            <>
              <Link
                href={`/dashboard/shifts/${shift.id}`}
                className="p-2 rounded-lg border hover:bg-gray-50"
                title="Редактировать"
              >
                <Pencil className="h-4 w-4" />
              </Link>

              {canUnpublish && (
                <button className="p-2 rounded-lg border hover:bg-red-50 text-red-600">
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function getDeclension(n: number): string {
  return n === 1 ? "а" : "и";
}

function isWithin6Hours(date: string, startTime: string): boolean {
  const shiftStart = new Date(`${date}T${startTime}`);
  const now = new Date();
  const diffHours = (shiftStart.getTime() - now.getTime()) / (1000 * 60 * 60);
  return diffHours < 6;
}