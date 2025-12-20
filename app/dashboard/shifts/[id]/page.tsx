import Link from "next/link";

type PageProps = {
  params: {
    id: string;
  };
};

export default function EditShiftPage({ params }: PageProps) {
  const { id } = params;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Редактирование смены</h1>
          <p className="text-sm text-gray-500">
            ID смены: <span className="font-mono">{id}</span>
          </p>
        </div>

        <Link
          href="/dashboard/shifts"
          className="text-sm text-gray-600 hover:underline"
        >
          ← Назад к списку
        </Link>
      </div>

      {/* Content */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-600">
          Здесь будет форма редактирования смены.
        </p>
      </div>
    </div>
  );
}
