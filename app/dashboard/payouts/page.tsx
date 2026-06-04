"use client";

import { useState } from "react";
import { 
  CreditCard, 
  ArrowUp, 
  ArrowDown,
  Plus,
  Wallet,
  TrendingUp,
  ShieldCheck,
  HelpCircle,
  X,
  Scale,
  Users,
  Banknote,
  Lock
} from "lucide-react";

// Типы данных
interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'commission';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: Date;
}

// Моковые данные
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    type: 'deposit',
    amount: 15000,
    status: 'completed',
    description: 'Пополнение счёта',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    type: 'withdrawal',
    amount: 4750,
    status: 'completed',
    description: 'Оплата смены #SM-001 (5 000 ₽ - 5% комиссия)',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    type: 'withdrawal',
    amount: 3800,
    status: 'completed',
    description: 'Оплата смены #SM-002 (4 000 ₽ - 5% комиссия)',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    type: 'deposit',
    amount: 10000,
    status: 'completed',
    description: 'Пополнение счёта',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: '5',
    type: 'withdrawal',
    amount: 1425,
    status: 'pending',
    description: 'Оплата смены #SM-004 (1 500 ₽ - 5% комиссия)',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
];

// Расчёт баланса на основе транзакций
const calculateBalance = (transactions: Transaction[]) => {
  return transactions.reduce((total, t) => {
    if (t.status !== 'completed') return total;
    if (t.type === 'deposit') return total + t.amount;
    return total - t.amount;
  }, 0);
};

// Расчёт зарезервированных средств (pending выплаты)
const calculateReserved = (transactions: Transaction[]) => {
  return transactions.reduce((total, t) => {
    if (t.status === 'pending' && t.type === 'withdrawal') {
      return total + t.amount;
    }
    return total;
  }, 0);
};

export default function PayoutsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(5000);
  const [isProcessing, setIsProcessing] = useState(false);

  // Пересчитываем баланс при изменении транзакций
  const balance = calculateBalance(transactions);
  const reserved = calculateReserved(transactions);
  const available = balance - reserved;

  // Обработчик пополнения
  const handleDeposit = async () => {
    if (depositAmount < 100) {
      alert("Минимальная сумма пополнения — 100 ₽");
      return;
    }

    setIsProcessing(true);
    
    // Имитация запроса к платёжному шлюзу
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Создаём новую транзакцию пополнения
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'deposit',
      amount: depositAmount,
      status: 'completed',
      description: `Пополнение счёта`,
      createdAt: new Date(),
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    setIsDepositModalOpen(false);
    setDepositAmount(5000);
    setIsProcessing(false);
    
    alert(`Счёт пополнен на ${depositAmount.toLocaleString()} ₽`);
  };

  // Форматирование суммы
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Форматирование даты
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7) return `${diffDays} дня(ей) назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Заголовок с кнопкой помощи */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Финансы</h1>
          <p className="text-gray-600 mt-1">
            Управление средствами для оплаты смен исполнителей
          </p>
        </div>
        <button
          onClick={() => setIsOnboardingOpen(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          <HelpCircle className="w-4 h-4" />
          Как это работает
        </button>
      </div>

      {/* Блок с балансом */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Доступный баланс */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-100">Доступно</span>
            <Wallet className="w-5 h-5 text-blue-200" />
          </div>
          <div className="text-3xl font-bold">
            {formatAmount(available)}
          </div>
          <button
            onClick={() => setIsDepositModalOpen(true)}
            className="mt-4 w-full bg-white/20 backdrop-blur text-white py-2 px-4 rounded-lg hover:bg-white/30 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Пополнить счёт
          </button>
        </div>

        {/* Общий баланс */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Общий баланс</span>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {formatAmount(balance)}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Всего средств на счету
          </p>
        </div>

        {/* В резерве */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">В резерве</span>
            <ShieldCheck className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {formatAmount(reserved)}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Зарезервировано под активные смены
          </p>
        </div>
      </div>

      {/* Инфоблок о комиссии */}
      <div className="bg-amber-50 rounded-xl p-4 mb-8 border border-amber-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
            <span className="text-amber-600 font-bold text-sm">%</span>
          </div>
          <div>
            <h3 className="font-semibold text-amber-800 text-sm">Комиссия платформы — 5%</h3>
            <p className="text-sm text-amber-700 mt-1">
              При оплате смены с вашего счёта списывается сумма с учётом комиссии. 
              Например, смена на 1 000 ₽ обойдётся в 1 050 ₽ (50 ₽ — комиссия).
            </p>
          </div>
        </div>
      </div>

      {/* История операций */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">История операций</h2>
        </div>
        
        <div className="divide-y divide-gray-100">
          {transactions.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              Нет операций
            </div>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {transaction.type === 'deposit' ? (
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <ArrowUp className="w-5 h-5 text-green-600" />
                      </div>
                    ) : transaction.type === 'withdrawal' ? (
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <ArrowDown className="w-5 h-5 text-red-600" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'deposit' ? '+' : '-'} {formatAmount(transaction.amount)}
                    </p>
                    <p className={`text-xs mt-1 ${
                      transaction.status === 'completed' ? 'text-green-600' : 
                      transaction.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {transaction.status === 'completed' ? 'Завершён' : 
                       transaction.status === 'pending' ? 'В обработке' : 'Ошибка'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Модальное окно пополнения */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Пополнение счёта</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Сумма пополнения
              </label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введите сумму"
                min={100}
                step={100}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeposit}
                disabled={isProcessing}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isProcessing ? 'Обработка...' : 'Перейти к оплате'}
              </button>
              <button
                onClick={() => setIsDepositModalOpen(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Отмена
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Средства поступят на номинальный счёт банка-провайдера.
              Комиссия платформы — 5% — списывается отдельно при оплате смен.
            </p>
          </div>
        </div>
      )}

      {/* Модальное окно онбординга с юридическим блоком */}
      {isOnboardingOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Как работает раздел «Финансы»</h2>
              </div>
              <button
                onClick={() => setIsOnboardingOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {/* 3 шага работы */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">
                    1
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Пополнение счёта</h3>
                  <p className="text-sm text-gray-600">
                    Вы пополняете номинальный счёт в банке-провайдере. Средства защищены и недоступны платформе до подтверждения смены.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">
                    2
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Создание смены</h3>
                  <p className="text-sm text-gray-600">
                    Вы публикуете смену, средства резервируются на счету. Исполнитель выходит на смену и отмечает выполнение.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">
                    3
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Автоматическая выплата</h3>
                  <p className="text-sm text-gray-600">
                    После подтверждения смены деньги автоматически переводятся исполнителю. Комиссия платформы — 5% — списывается отдельно.
                  </p>
                </div>
              </div>

              {/* Юридический блок — защита по закону */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-green-600" />
                  Юридическая защита ваших средств
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Lock className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Неприкосновенность:</span> Средства на номинальном счёте принадлежат вам как бенефициару. По долгам оператора платформы на них не может быть обращено взыскание (<span className="font-mono text-xs">ст. 860.5 ГК РФ</span>).
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Users className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Персональный учёт:</span> Учёт средств ведётся в разрезе каждого клиента (мерчанта). Ваши деньги не смешиваются с деньгами других заказчиков или платформы.
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Безопасное списание:</span> Средства списываются только после подтверждения оказания услуги. Вы платите только за реально выполненные смены.
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Banknote className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Страхование:</span> Банк-провайдер имеет лицензию ЦБ РФ. Ваши средства застрахованы в соответствии с законодательством о страховании вкладов.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}