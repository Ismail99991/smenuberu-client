"use client";

import Link from "next/link";

export default function NewShiftPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Создать смену</h1>
          <p className="text-sm text-gray-500">
            Заполни параметры — дальше подключим сохранение в бэк
          </p>
        </div>

        <Link
          href="/dashboard/shifts"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 transition"
        >
          Назад
        </Link>
      </div>

      {/* Form (UI only) */}
      <form className="space-y-6">
        <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Объект</label>
            <select className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10">
              <option>Выберите объект…</option>
              <option>Объект #1 (пример)</option>
              <option>Объект #2 (пример)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Название смены
            </label>
            <input
              type="text"
              placeholder="Например: Грузчик на склад"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Дата</label>
              <input
                type="date"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Время начала
              </label>
              <input
                type="time"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Время окончания
              </label>
              <input
                type="time"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Оплата (₽/смена)
              </label>
              <input
                type="number"
                placeholder="Например: 3500"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Кол-во исполнителей
              </label>
              <input
                type="number"
                placeholder="Например: 5"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Тип оплаты
              </label>
              <select className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10">
                <option>За смену</option>
                <option>За час</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Комментарий (необязательно)
            </label>
            <textarea
              rows={4}
              placeholder="Например: форма одежды, пропуск, точка сбора…"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/dashboard/shifts"
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 transition"
          >
            Отмена
          </Link>

          <button
            type="button"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition"
          >
            Сохранить
          </button>
        </div>
      </form>
    </div>
  );
}
