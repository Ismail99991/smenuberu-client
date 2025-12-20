"use client";

import Link from "next/link";
import ShiftForm from "../_components/ShiftForm";

export default function NewShiftPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Создать смену</h1>
          <p className="text-sm text-gray-500">Заполни параметры — дальше подключим сохранение в бэк</p>
        </div>

        <Link
          href="/dashboard/shifts"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 transition"
        >
          Назад
        </Link>
      </div>

      <ShiftForm
        mode="create"
        backHref="/dashboard/shifts"
        onSubmit={(values) => {
          // пока UI-only
          console.log("CREATE shift (UI-only):", values);
        }}
      />
    </div>
  );
}
