export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        Дашборд
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl bg-white p-6 border border-gray-200">
          <div className="text-sm text-gray-500">Объекты</div>
          <div className="text-2xl font-semibold mt-2">0</div>
        </div>

        <div className="rounded-xl bg-white p-6 border border-gray-200">
          <div className="text-sm text-gray-500">Активные смены</div>
          <div className="text-2xl font-semibold mt-2">0</div>
        </div>

        <div className="rounded-xl bg-white p-6 border border-gray-200">
          <div className="text-sm text-gray-500">Заявки</div>
          <div className="text-2xl font-semibold mt-2">0</div>
        </div>
      </div>
    </div>
  );
}
