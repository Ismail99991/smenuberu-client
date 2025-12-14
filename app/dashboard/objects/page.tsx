import Link from "next/link";

const objects: { id: number; name: string; address: string }[] = [];

export default function ObjectsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Объекты</h1>

        <Link
          href="/dashboard/objects/new"
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition"
        >
          Создать объект
        </Link>
      </div>

      {/* Content */}
      {objects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <h2 className="text-lg font-medium mb-2">
            У вас пока нет объектов
          </h2>
          <p className="text-sm text-gray-500">
            Добавьте объект, чтобы создавать смены и находить исполнителей
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {objects.map((object) => (
            <div
              key={object.id}
              className="rounded-xl bg-white p-6 border border-gray-200 hover:shadow-sm transition"
            >
              <div className="font-medium">{object.name}</div>
              <div className="text-sm text-gray-500">{object.address}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
