"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, Clock, Building2, Tag, Flame, Info, TrendingUp, 
  Users, ShieldCheck, AlertCircle 
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type ApiObject = {
  id: string;
  name: string;
  city: string;
};

type TaskType = "driver" | "picker" | "loader" | "cook" | "waiter" | "cleaner" | "other";

type PayType = "shift" | "hour";

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "https://api.smenube.ru";
}

export default function NewShiftPage() {
  const router = useRouter();

  const [objects, setObjects] = useState<ApiObject[]>([]);
  const [loadingObjects] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Форма
  const [objectId, setObjectId] = useState("");
  const [title, setTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [startTime, setStartTime] = useState("09:00");
  const [durationHours, setDurationHours] = useState(9);
  const [payType, setPayType] = useState<PayType>("shift");
  const [hourlyRate, setHourlyRate] = useState(500);
  const [shiftTotal, setShiftTotal] = useState(4500);
  const [type, setType] = useState<TaskType>("picker");
  const [hot, setHot] = useState(false);
  const [published, setPublished] = useState(true);
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [slotsCount, setSlotsCount] = useState(1);

  // Статистика цен (заглушка)
  const [avgRate, setAvgRate] = useState<number | null>(null);

  // Загрузка объектов
  useEffect(() => {
    fetch(`${getApiBaseUrl()}/objects`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setObjects(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  // Загрузка средней ставки
  useEffect(() => {
    if (type) {
      const mockRates: Record<TaskType, number> = {
        driver: 550,
        picker: 480,
        loader: 520,
        cook: 600,
        waiter: 450,
        cleaner: 420,
        other: 450,
      };
      setAvgRate(mockRates[type]);
    }
  }, [type]);

  // Авто-расчёт полной стоимости смены
  useEffect(() => {
    if (payType === "hour") {
      setShiftTotal(hourlyRate * durationHours);
    }
  }, [hourlyRate, durationHours, payType]);

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!objectId) setError("Выберите объект");
    else if (!title.trim()) setError("Введите название смены");
    else if (!selectedDate) setError("Выберите дату");
    else if (isPastDate(selectedDate)) setError("Нельзя создать смену в прошлом");
    else if (!startTime) setError("Выберите время начала");
    else if (durationHours <= 0) setError("Укажите длительность смены");
    else if (payType === "hour" && hourlyRate <= 0) setError("Укажите часовую ставку");
    else if (shiftTotal <= 0) setError("Укажите оплату за смену");
    else if (slotsCount < 1) setError("Укажите количество мест от 1");

    if (error) {
      setSubmitting(false);
      return;
    }

    const [hour, minute] = startTime.split(":").map(Number);
    const endDate = new Date(2000, 0, 1, hour + durationHours, minute);
    const endTime = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`;

    const payload = {
      objectId,
      title,
      date: selectedDate!.toISOString().split("T")[0],
      startTime,
      endTime,
      pay: payType === "shift" ? shiftTotal : hourlyRate,
      type,
      hot,
      published,
      autoConfirm,
      slotsCount,
    };

    try {
      const res = await fetch(`${getApiBaseUrl()}/slots`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Ошибка создания");

      router.push("/shifts");
    } catch (err) {
      setError("Не удалось создать смену");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Шапка */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-semibold">Создать смену</h1>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Объект */}
        <div>
          <label className="block text-sm font-medium mb-1">Объект</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={objectId}
              onChange={(e) => setObjectId(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-white"
              required
            >
              <option value="">Выберите объект</option>
              {objects.map((obj) => (
                <option key={obj.id} value={obj.id}>
                  {obj.name} — {obj.city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Название */}
        <div>
          <label className="block text-sm font-medium mb-1">Название смены</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Комплектовщик подбора"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
          />
          <p className="text-xs text-gray-400 mt-1">Короткое понятное название для исполнителей</p>
        </div>

        {/* Количество мест */}
        <div>
          <label className="block text-sm font-medium mb-1">Количество мест</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="number"
              value={slotsCount}
              onChange={(e) => setSlotsCount(Math.max(1, Number(e.target.value)))}
              min={1}
              max={100}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-white"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Сколько исполнителей может записаться на эту смену</p>
        </div>

        {/* Дата */}
        <div>
          <label className="block text-sm font-medium mb-1">Дата смены</label>
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => setSelectedDate(date)}
            dateFormat="dd MMMM yyyy"
            locale="ru"
            minDate={new Date()}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
            wrapperClassName="w-full"
          />
          <p className="text-xs text-gray-400 mt-1">Нельзя выбрать прошедшую дату</p>
        </div>

        {/* Время */}
        <div>
          <label className="block text-sm font-medium mb-1">Время работы</label>
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-white"
              />
            </div>
            <span className="text-gray-400">—</span>
            <div className="flex-1 relative">
              <input
                type="number"
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                min={1}
                max={24}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">ч</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">Время начала и продолжительность смены</p>
        </div>

        {/* Оплата */}
        <div>
          <label className="block text-sm font-medium mb-1">Оплата</label>
          <div className="flex gap-3 mb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={payType === "shift"}
                onChange={() => setPayType("shift")}
              />
              <span>За смену</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={payType === "hour"}
                onChange={() => setPayType("hour")}
              />
              <span>Почасовая</span>
            </label>
          </div>

          {payType === "shift" ? (
            <div>
              <input
                type="number"
                value={shiftTotal}
                onChange={(e) => setShiftTotal(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                placeholder="4 500"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                placeholder="500 ₽/час"
              />
              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-xl">
                Итого за смену: <span className="font-semibold">{shiftTotal} ₽</span>
              </div>
            </div>
          )}
        </div>

        {/* Статистика */}
        {avgRate && (
          <div className="bg-blue-50 p-3 rounded-xl flex items-start gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <span className="font-medium">Средняя ставка на этом типе работ:</span> {avgRate} ₽/час
              <span className="text-xs text-gray-500 block mt-1">Данные за последние 30 дней</span>
            </div>
          </div>
        )}

        {/* Тип работы */}
        <div>
          <label className="block text-sm font-medium mb-1">Тип работы</label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TaskType)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-white"
            >
              <option value="picker">Комплектовщик</option>
              <option value="driver">Водитель</option>
              <option value="loader">Грузчик</option>
              <option value="cook">Повар</option>
              <option value="waiter">Официант</option>
              <option value="cleaner">Уборщик</option>
              <option value="other">Другое</option>
            </select>
          </div>
        </div>

        {/* Дополнительные настройки */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm">Горящая смена</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={hot}
                onChange={(e) => setHot(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#c29cf2] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c29cf2]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <span className="text-sm">Автоподтверждение записи</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoConfirm}
                onChange={(e) => setAutoConfirm(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#c29cf2] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c29cf2]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Опубликовать сразу</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#c29cf2] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c29cf2]"></div>
            </label>
          </div>
        </div>

        {/* Подсказка про автоподтверждение */}
        {autoConfirm ? (
          <div className="bg-green-50 p-3 rounded-xl text-xs text-green-700 flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5" />
            <span>Исполнители будут записываться автоматически без вашего подтверждения. Места займутся быстро.</span>
          </div>
        ) : (
          <div className="bg-amber-50 p-3 rounded-xl text-xs text-amber-700 flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5" />
            <span>Записи будут ожидать вашего подтверждения. Вы сможете принять или отклонить заявку.</span>
          </div>
        )}

        {/* Подсказки */}
        <div className="bg-gray-50 p-3 rounded-xl text-xs text-gray-500 flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5" />
          <span>Смена будет доступна исполнителям сразу после публикации. Вы можете отредактировать её позже.</span>
        </div>

        {/* Кнопки */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-2 bg-[#c29cf2] text-white rounded-xl hover:bg-[#b088e8] disabled:opacity-50"
          >
            {submitting ? "Создаём..." : "Создать смену"}
          </button>
        </div>
      </form>
    </div>
  );
}