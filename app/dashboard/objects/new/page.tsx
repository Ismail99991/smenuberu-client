"use client";

import Link from "next/link";

export default function NewObjectPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Создать объект</h1>
          <p className="text-sm text-gray-500">
            Добавьте объект, чтобы создавать смены
          </p>
        </div>

        <Link
          href="/dashboard/objects"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50"
        >
          Назад
        </Link>
      </div>

      <form className="space-y-6">
        {/* Basic info */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Название объекта
            </label>
            <input
              type="text"
              placeholder="Например: Склад на Тверской"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Адрес
            </label>
            <input
              type="text"
              placeholder="Город, улица, дом"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Photos */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
          <div>
            <h2 className="text-sm font-medium mb-1">
              Фотографии объекта
            </h2>
            <p className="text-xs text-gray-500">
              Добавьте фото входа, территории или рабочего места
            </p>
          </div>

          <label className="flex items-center justify-center h-32 rounded-lg border border-dashed border-gray-300 cursor-pointer hover:bg-gray-50 text-sm text-gray-500">
            <span>Нажмите, чтобы добавить фото</span>
            <input type="file" multiple className="hidden" />
          </label>

          <div className="flex gap-3 flex-wrap">
            <div className="h-20 w-20 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">
              Фото
            </div>
            <div className="h-20 w-20 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">
              Фото
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-medium">
            Условия и удобства
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {[
              "Есть развозка / автобусы",
              "Есть обеды",
              "Тёплое помещение",
              "Есть раздевалка",
              "Есть акции / бонусы",
            ].map((label) => (
              <label
                key={label}
                className="flex items-center gap-3"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-black"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Дополнительно (необязательно)
            </label>
            <input
              type="text"
              placeholder="Например: бесплатный чай, парковка"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/dashboard/objects"
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50"
          >
            Отмена
          </Link>

          <button
            type="button"
            className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            Сохранить
          </button>
        </div>
      </form>
    </div>
  );
}
