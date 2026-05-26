"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, Clock, Building2, Tag, Flame, Info, TrendingUp, 
  Users, ShieldCheck, AlertCircle, Bus, Utensils, Home, FlaskConical, TrendingDown
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

type BusStop = {
  id: string;
  name: string;
  time: string;
};

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "https://api.smenube.ru";
}

export default function NewShiftPage() {
  const router = useRouter();

  const [objects, setObjects] = useState<ApiObject[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Основные поля формы
  const [objectId, setObjectId] = useState("");
  const [title, setTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [startTime, setStartTime] = useState("09:00");
  const [durationHours, setDurationHours] = useState(9);
  const [payType, setPayType] = useState<PayType>("shift");
  const [hourlyRate, setHourlyRate] = useState(500);
  const [shiftTotal, setShiftTotal] = useState(4500);
  const [type, setType] = useState<TaskType>("picker");
  const [published, setPublished] = useState(true);
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [slotsCount, setSlotsCount] = useState(1);
  
  // Условия работы
  const [hasBuses, setHasBuses] = useState(false);
  const [busStops, setBusStops] = useState<BusStop[]>([]);
  const [hasMeals, setHasMeals] = useState(false);
  const [hasAccommodation, setHasAccommodation] = useState(false);

  // ТЕСТОВАЯ ЗАГЛУШКА WMS
  const [wmsTestMode, setWmsTestMode] = useState(false);

  const [avgRate, setAvgRate] = useState<number | null>(null);

  // Расчёт демо-данных для WMS
  const wmsMockData = {
    withoutWms: {
      hourly: hourlyRate,
      shift: shiftTotal,
    },
    withWms: {
      hourlyMin: Math.floor(hourlyRate * 1.2),
      hourlyMax: Math.floor(hourlyRate * 1.5),
      shiftMin: Math.floor(shiftTotal * 1.2),
      shiftMax: Math.floor(shiftTotal * 1.5),
    },
  };

  // Загрузка объектов
  useEffect(() => {
    fetch(`${getApiBaseUrl()}/objects`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setObjects(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  // Средняя ставка (заглушка)
  useEffect(() => {
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
  }, [type]);

  // Расчёт стоимости смены
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

  // Управление остановками
  const addBusStop = () => {
    setBusStops([...busStops, { id: Date.now().toString(), name: "", time: "" }]);
  };

  const removeBusStop = (id: string) => {
    setBusStops(busStops.filter(stop => stop.id !== id));
  };

  const updateBusStop = (id: string, field: keyof BusStop, value: string) => {
    setBusStops(busStops.map(stop => 
      stop.id === id ? { ...stop, [field]: value } : stop
    ));
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
    else if (hasBuses && busStops.some(stop => !stop.name || !stop.time)) {
      setError("Заполните все остановки (название и время)");
    }

    if (error) {
      setSubmitting(false);
      return;
    }

    const [hour, minute] = startTime.split(":").map(Number);
    const endDate = new Date(2000, 0, 1, hour + durationHours, minute);
    const endTime = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`;

    const payload: any = {
      objectId,
      title,
      date: selectedDate!.toISOString().split("T")[0],
      startTime,
      endTime,
      pay: payType === "shift" ? shiftTotal : hourlyRate,
      payType,
      type,
      published,
      autoConfirm,
      slotsCount,
      hasBuses,
      busStops: hasBuses ? busStops : [],
      hasMeals,
      hasAccommodation,
      wmsTestMode,
    };

    // Добавляем тестовые данные WMS, если режим включён
    if (wmsTestMode) {
      payload.wmsMockData = wmsMockData;
    }

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
        </div>

        {/* Оплата */}
        <div>
          <label className="block text-sm font-medium mb-1">Оплата</label>
          <div className="flex gap-3 mb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={payType === "shift"} onChange={() => setPayType("shift")} />
              <span>За смену</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={payType === "hour"} onChange={() => setPayType("hour")} />
              <span>Почасовая</span>
            </label>
          </div>

          {payType === "shift" ? (
            <input
              type="number"
              value={shiftTotal}
              onChange={(e) => setShiftTotal(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
            />
          ) : (
            <div className="space-y-2">
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
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
              <span className="font-medium">Средняя ставка:</span> {avgRate} ₽/час
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

        {/* Условия работы */}
        <div className="space-y-4 border-t border-gray-100 pt-4">
          <h3 className="text-sm font-medium text-gray-700">Условия работы</h3>
          
          {/* Автобусы */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasBuses}
                onChange={(e) => setHasBuses(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Bus className="h-4 w-4 text-green-600" />
              <span className="text-sm">Есть автобусы</span>
            </label>
            
            {hasBuses && (
              <div className="ml-6 space-y-2">
                <p className="text-xs text-gray-500">Остановки и время прибытия:</p>
                {busStops.map((stop) => (
                  <div key={stop.id} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={stop.name}
                        onChange={(e) => updateBusStop(stop.id, "name", e.target.value)}
                        placeholder="Название остановки"
                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg"
                      />
                    </div>
                    <div className="w-24">
                      <input
                        type="time"
                        value={stop.time}
                        onChange={(e) => updateBusStop(stop.id, "time", e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBusStop(stop.id)}
                      className="text-red-500 text-sm px-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addBusStop}
                  className="text-xs text-[#c29cf2] hover:text-[#b088e8]"
                >
                  + Добавить остановку
                </button>
              </div>
            )}
          </div>

          {/* Обеды */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasMeals}
              onChange={(e) => setHasMeals(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Utensils className="h-4 w-4 text-orange-600" />
            <span className="text-sm">Есть обеды</span>
          </label>

          {/* Проживание */}
          <label className="flex items-center gap-2 cursor-pointer opacity-60">
            <input
              type="checkbox"
              checked={hasAccommodation}
              onChange={(e) => setHasAccommodation(e.target.checked)}
              disabled
              className="rounded border-gray-300"
            />
            <Home className="h-4 w-4 text-blue-600" />
            <span className="text-sm">Проживание (партнёрское) — скоро</span>
          </label>
        </div>

        {/* ТЕСТОВАЯ ЗАГЛУШКА WMSaaS */}
        <div className="border border-dashed border-gray-300 bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium text-purple-700">🧪 WMS от Smena (тестовая заглушка)</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={wmsTestMode}
                onChange={(e) => setWmsTestMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
            </label>
          </div>

          {wmsTestMode && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="bg-white rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-gray-700">📊 Пример расчёта смены с WMS:</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Без WMS:</span>
                    <span className="font-medium">{hourlyRate} ₽/час → {shiftTotal} ₽ за смену</span>
                  </div>
                  <div className="flex justify-between text-purple-700">
                    <span>С WMS (динамические пики):</span>
                    <span className="font-medium">{wmsMockData.withWms.hourlyMin}–{wmsMockData.withWms.hourlyMax} ₽/час</span>
                  </div>
                  <div className="flex justify-between text-green-700 font-semibold">
                    <span>🔥 Потенциальный заработок:</span>
                    <span>{wmsMockData.withWms.shiftMin}–{wmsMockData.withWms.shiftMax} ₽</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  🔬 ТЕСТОВЫЙ РЕЖИМ: данные не отправляются на сервер. После внедрения реальной WMS ставки будут рассчитываться автоматически на основе загрузки склада.
                </p>
              </div>

              <div className="bg-purple-50 rounded-lg p-2 text-center">
                <p className="text-xs text-purple-600">
                  💡 Хотите подключить реальную WMS? <button type="button" className="underline font-medium">Оставьте заявку</button>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Информация о горящей смене */}
        <div className="bg-gray-50 p-3 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">Горящая смена</span>
          </div>
          <p className="text-xs text-gray-600">
            🔥 Смена автоматически станет "горящей", если за 6 часов до начала не наберётся достаточно исполнителей.
          </p>
        </div>

        {/* Дополнительные настройки */}
        <div className="space-y-3">
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
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c29cf2]"></div>
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
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c29cf2]"></div>
            </label>
          </div>
        </div>

        {/* Подсказки */}
        {autoConfirm ? (
          <div className="bg-green-50 p-3 rounded-xl text-xs text-green-700 flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5" />
            <span>Исполнители будут записываться автоматически</span>
          </div>
        ) : (
          <div className="bg-amber-50 p-3 rounded-xl text-xs text-amber-700 flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5" />
            <span>Записи будут ожидать вашего подтверждения</span>
          </div>
        )}

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
