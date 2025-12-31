"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ShiftForm, { ShiftFormValues } from "../_components/ShiftForm";

type SlotResponse = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  pay: number | null;
  type: string;
  hot: boolean;
  published: boolean;
  bookings?: any[];
};

export default function ShiftDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [slot, setSlot] = useState<SlotResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    fetch(`/__api/slots/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) {
            router.replace("/dashboard/shifts");
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        setSlot(data.slot ?? data);
      })
      .catch((e) => {
        console.error(e);
        setError("Не удалось загрузить смену");
      });
  }, [id, router]);

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  if (!slot) {
    return <div className="p-6">Загрузка…</div>;
  }

  const initialValues: Partial<ShiftFormValues> = {
    title: slot.title,
    dates: [slot.date],
    startTime: slot.startTime,
    endTime: slot.endTime,
    pay: slot.pay ? String(slot.pay) : "",
    type: slot.type as any,
    hot: slot.hot,
    published: slot.published,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Управление сменой</h1>
        <p className="text-sm text-gray-500">
          ID: <span className="font-mono">{slot.id}</span>
        </p>
      </div>

      <ShiftForm
        mode="edit"
        backHref="/dashboard/shifts"
        initialValues={initialValues}
        submitLabel="Сохранить изменения"
      />
    </div>
  );
}
