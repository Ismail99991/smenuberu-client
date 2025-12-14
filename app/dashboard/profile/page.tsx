"use client";

export default function ProfilePage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Профиль</h1>

      <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Название компании
          </label>
          <input
            type="text"
            placeholder="ООО Ромашка"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Контактное лицо
          </label>
          <input
            type="text"
            placeholder="Иван Иванов"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Email
          </label>
          <input
            type="email"
            placeholder="example@mail.ru"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
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
