import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-950 space-y-3">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Дашборд заказчика
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Дальше сюда подключим: первовведение, объекты, смены, заявки, акции, профиль, статистику.
        </p>
        <Link className="text-zinc-900 underline dark:text-zinc-50" href="/onboarding">
          Открыть онбординг
        </Link>
      </div>
    </div>
  );
}
