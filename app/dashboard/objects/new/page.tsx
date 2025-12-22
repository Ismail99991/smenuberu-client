"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { uploadObjectPhoto } from "@/lib/uploadObjectPhoto";

type ApiCreatedObject = { id?: string; object?: { id: string } };

export default function NewObjectPage() {
  const router = useRouter();

  const [objectId, setObjectId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  const [photos, setPhotos] = useState<string[]>([]);

  // “Условия и удобства” — пока UI-only, как у вас принято
  const [hasBuses, setHasBuses] = useState(false);
  const [hasLunch, setHasLunch] = useState(false);
  const [warmPlace, setWarmPlace] = useState(false);
  const [hasLockerRoom, setHasLockerRoom] = useState(false);
  const [hasBonuses, setHasBonuses] = useState(false);
  const [extra, setExtra] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSave = useMemo(() => {
    return name.trim().length > 0 && city.trim().length > 0 && address.trim().length > 0;
  }, [name, city, address]);

  async function createOrGetDraftId(): Promise<string> {
    if (objectId) return objectId;

    if (!canSave) {
      throw new Error("Заполни: название, город и адрес (нужно, чтобы создать объект перед загрузкой фото).");
    }

    // Создаём объект до загрузки фото, чтобы получить objectId
    const created = await api<ApiCreatedObject>("/objects", {
      method: "POST",
      json: {
        name: name.trim(),
        city: city.trim(),
        address: address.trim(),
        // photos можно отправить пустыми
        photos: [],
      },
    });

    const id = created?.id ?? created?.object?.id;
    if (!id) throw new Error("API не вернул id объекта");

    setObjectId(id);
    return id;
  }

  async function patchObject(id: string, nextPhotos?: string[]) {
    await api<any>(`/objects/${id}`, {
      method: "PATCH",
      json: {
        name: name.trim(),
        city: city.trim(),
        address: address.trim(),
        photos: nextPhotos ?? photos,

        // Эти поля пока не отправляем, чтобы не нарушать ваш принцип “логика в API”
        // Когда на backend появятся реальные поля — просто добавим сюда:
        // hasBuses, hasLunch, highRate, ...
      },
    });
  }

  async function onPickPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;

    setErr(null);
    setBusy(true);

    try {
      const id = await createOrGetDraftId();

      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadObjectPhoto(id, file);
        uploaded.push(url);
      }

      const next = [...photos, ...uploaded];
      setPhotos(next);

      // сохраняем URLs в объект
      await patchObject(id, next);
    } catch (e: any) {
      setErr(e?.message ?? "Не удалось загрузить фото");
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto(url: string) {
    const next = photos.filter((p) => p !== url);
    setPhotos(next);

    if (objectId) {
      try {
        setBusy(true);
        await patchObject(objectId, next);
      } catch (e: any) {
        setErr(e?.message ?? "Не удалось обновить фото");
      } finally {
        setBusy(false);
      }
    }
  }

  async function onSave() {
    setErr(null);
    setBusy(true);

    try {
      if (!canSave) throw new Error("Заполни: название, город и адрес");

      // Если объект ещё не создан (фото не загружали) — создаём сейчас
      if (!objectId) {
        const created = await api<ApiCreatedObject>("/objects", {
          method: "POST",
          json: {
            name: name.trim(),
            city: city.trim(),
            address: address.trim(),
            photos,
          },
        });

        const id = created?.id ?? created?.object?.id;
        if (!id) throw new Error("API не вернул id объекта");

        setObjectId(id);
      } else {
        await patchObject(objectId, photos);
      }

      router.push("/dashboard/objects");
    } catch (e: any) {
      setErr(e?.message ?? "Не удалось сохранить объект");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Создать объект</h1>
          <p className="text-sm text-gray-500">Добавьте объект, чтобы создавать смены</p>
        </div>

        <Link
          href="/dashboard/objects"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50"
        >
          Назад
        </Link>
      </div>

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        {/* Basic info */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Название объекта</label>
            <input
              type="text"
              placeholder="Например: Склад на Тверской"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Город</label>
            <input
              type="text"
              placeholder="Москва"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={busy}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Адрес</label>
            <input
              type="text"
              placeholder="Город, улица, дом"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={busy}
            />
          </div>
        </div>

        {/* Photos */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
          <div>
            <h2 className="text-sm font-medium mb-1">Фотографии объекта</h2>
            <p className="text-xs text-gray-500">Добавьте фото входа, территории или рабочего места</p>
          </div>

          <label className="flex items-center justify-center h-32 rounded-lg border border-dashed border-gray-300 cursor-pointer hover:bg-gray-50 text-sm text-gray-500">
            <span>{busy ? "Загрузка…" : "Нажмите, чтобы добавить фото"}</span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              disabled={busy}
              onChange={(e) => onPickPhotos(e.target.files)}
            />
          </label>

          {photos.length === 0 ? (
            <div className="text-sm text-gray-500">Фото пока нет</div>
          ) : (
            <div className="flex gap-3 flex-wrap">
              {photos.map((url) => (
                <div key={url} className="relative h-20 w-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-20 w-20 object-cover" />
                  <button
                    type="button"
                    className="absolute inset-x-0 bottom-0 bg-white/90 text-[11px] py-1 hover:bg-white"
                    onClick={() => removePhoto(url)}
                    disabled={busy}
                    title="Удалить"
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          )}

          {objectId ? (
            <div className="text-xs text-gray-500">ID объекта: {objectId}</div>
          ) : null}
        </div>

        {/* Features (UI-only пока) */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-medium">Условия и удобства</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-4 w-4 accent-black"
                checked={hasBuses}
                onChange={(e) => setHasBuses(e.target.checked)}
                disabled={busy}
              />
              <span>Есть развозка / автобусы</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-4 w-4 accent-black"
                checked={hasLunch}
                onChange={(e) => setHasLunch(e.target.checked)}
                disabled={busy}
              />
              <span>Есть обеды</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-4 w-4 accent-black"
                checked={warmPlace}
                onChange={(e) => setWarmPlace(e.target.checked)}
                disabled={busy}
              />
              <span>Тёплое помещение</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-4 w-4 accent-black"
                checked={hasLockerRoom}
                onChange={(e) => setHasLockerRoom(e.target.checked)}
                disabled={busy}
              />
              <span>Есть раздевалка</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-4 w-4 accent-black"
                checked={hasBonuses}
                onChange={(e) => setHasBonuses(e.target.checked)}
                disabled={busy}
              />
              <span>Есть акции / бонусы</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Дополнительно (необязательно)</label>
            <input
              type="text"
              placeholder="Например: бесплатный чай, парковка"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              disabled={busy}
            />
          </div>

          <div className="text-xs text-gray-500">
            Эти поля пока UI-only. Когда добавим реальные поля в Object на backend — сохраним их в API.
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
            className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
            disabled={busy || !canSave}
            onClick={onSave}
          >
            {busy ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      </form>
    </div>
  );
}
