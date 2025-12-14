"use client";

export default function NotificationsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Уведомления</h1>

      <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
        {[
          "Новые заявки на смены",
          "Изменения по сменам",
          "Напоминания о начале смены",
          "Маркетинговые уведомления",
        ].map((label) => (
          <label
            key={label}
            className="flex items-center justify-between text-sm"
          >
            <span>{label}</span>
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 accent-black"
            />
          </label>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Сохранить
        </button>
      </div>
    </div>
  );
}
