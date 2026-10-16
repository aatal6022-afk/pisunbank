import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Snowflake,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Calendar,
  Lock,
  CheckCircle2,
  X,
  FileText,
} from 'lucide-react';
import { BankCard } from '../types';

interface FreezeModalProps {
  card: BankCard;
  isOpen: boolean;
  onClose: () => void;
  onFreezeSuccess: (updatedCard: BankCard) => void;
}

export const FreezeModal: React.FC<FreezeModalProps> = ({
  card,
  isOpen,
  onClose,
  onFreezeSuccess,
}) => {
  const [freezeDays, setFreezeDays] = useState<number>(14);
  const [customDays, setCustomDays] = useState<string>('14');
  const [isAgreed, setIsAgreed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAlreadyFrozen = card.isFrozen || card.status === 'frozen';
  const frozenUntilDate = card.frozenUntil ? new Date(card.frozenUntil) : null;

  // Calculate target unfreeze date
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + (freezeDays || 14));

  const handleSelectDays = (days: number) => {
    setFreezeDays(days);
    setCustomDays(days.toString());
    setError(null);
  };

  const handleCustomDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomDays(val);
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      setFreezeDays(num);
    }
    setError(null);
  };

  const handleFreezeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (freezeDays < 14) {
      setError('По Указу НЯСР №2 минимальный срок заморозки — 14 календарных дней!');
      return;
    }

    if (!isAgreed) {
      setError('Необходимо подтвердить согласие с условиями Указа №2 (досрочная разморозка запрещена).');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/cards/freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: card.id,
          days: freezeDays,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Ошибка при заморозке счета');
      }

      setSuccessMsg(data.message);
      if (data.updatedCard) {
        onFreezeSuccess(data.updatedCard);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden"
      >
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-sky-900 via-cyan-900 to-indigo-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-sky-500/20 border border-sky-400/30 backdrop-blur-md">
              <Snowflake className="w-6 h-6 text-sky-300 animate-spin-slow" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-sky-300 font-extrabold flex items-center gap-1.5">
                <span>Указ НЯСР №2</span>
                <span className="w-1 h-1 rounded-full bg-sky-400"></span>
                <span>Писюн Банк</span>
              </div>
              <h2 className="text-xl font-black text-white">Заморозка Счета</h2>
            </div>
          </div>
          <p className="text-xs text-sky-100/80 leading-relaxed mt-1">
            Официальный государственный механизм защиты сбережений от 7% налога на бездействие средств.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* If already frozen */}
          {isAlreadyFrozen ? (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-sky-50 border border-sky-200 flex flex-col gap-3">
                <div className="flex items-center space-x-2 text-sky-900 font-extrabold text-sm">
                  <Lock className="w-5 h-5 text-sky-600" />
                  <span>Ваш счет находится в режиме глубокой заморозки</span>
                </div>

                <div className="text-xs text-sky-800 space-y-2">
                  <div className="flex justify-between py-1.5 border-b border-sky-100">
                    <span className="text-sky-600">Дата заморозки:</span>
                    <span className="font-semibold">
                      {card.frozenAt ? new Date(card.frozenAt).toLocaleDateString('ru-RU') : 'Ранее'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-sky-100">
                    <span className="text-sky-600">Срок заморозки:</span>
                    <span className="font-semibold">{card.freezeDays || 14} календарных дней</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-sky-100">
                    <span className="text-sky-600">Автоматическая разморозка:</span>
                    <span className="font-bold text-sky-950">
                      {frozenUntilDate
                        ? `${frozenUntilDate.toLocaleDateString('ru-RU')} в ${frozenUntilDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
                        : 'По истечении срока'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-sky-600">Налог на бездействие (7%):</span>
                    <span className="font-bold text-emerald-700">ОТКЛЮЧЕН (0%)</span>
                  </div>
                </div>
              </div>

              {/* Warning about no early unfreeze */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Досрочная разморозка строго запрещена!</div>
                  <div className="text-amber-800 mt-0.5">
                    В соответствии со статьей 3 Указа №2 счет откроется автоматически ровно в указанную дату. Все расходные и приходные операции временно заблокированы.
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-zinc-900 text-white font-bold text-sm hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Понятно
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleFreezeSubmit} className="space-y-4">
              {/* Decree Rules Box */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-2.5 text-zinc-700">
                <div className="font-bold text-zinc-900 flex items-center gap-1.5 text-xs">
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span>Правила заморозки по Указу НЯСР №2:</span>
                </div>
                <ul className="space-y-1.5 pl-1">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-sky-700">1️⃣</span>
                    <span>Заморозить счет можно только на срок <strong>от 14 календарных дней</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-sky-700">2️⃣</span>
                    <span>В период заморозки: <strong>Налог на бездействие НЕ взимается</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-sky-700">3️⃣</span>
                    <span>Все операции по счету <strong>ЗАБЛОКИРОВАНЫ</strong> (переводы, оплаты, кредиты).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-amber-700">4️⃣</span>
                    <span className="text-amber-900 font-semibold">ДОСРОЧНАЯ РАЗМОРОЗКА ЗАПРЕЩЕНА. Счет откроется ровно в срок.</span>
                  </li>
                </ul>
              </div>

              {/* Select Duration */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-2">
                  Выберите срок заморозки счета:
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2.5">
                  {[14, 21, 30, 60].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleSelectDays(d)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        freezeDays === d
                          ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                          : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                      }`}
                    >
                      {d} дней
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-zinc-500 whitespace-nowrap">Или укажите дней:</span>
                  <input
                    type="number"
                    min="14"
                    max="365"
                    value={customDays}
                    onChange={handleCustomDaysChange}
                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 text-xs font-bold text-zinc-900 focus:outline-none focus:border-sky-500"
                    placeholder="От 14 дней"
                  />
                </div>
              </div>

              {/* Calculated Reopening Date */}
              <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-sky-900">
                  <Calendar className="w-4 h-4 text-sky-600" />
                  <span className="font-medium">Дата автоматического открытия:</span>
                </div>
                <div className="font-extrabold text-sky-950">
                  {targetDate.toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>

              {/* Checkbox agreement */}
              <label className="flex items-start space-x-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isAgreed}
                  onChange={(e) => setIsAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-zinc-300 cursor-pointer"
                />
                <span className="text-xs text-zinc-600 leading-tight">
                  Я подтверждаю, что ознакомлен с <strong>Указом НЯСР №2</strong>. Я понимаю, что <strong>досрочная разморозка запрещена</strong>, и все операции по карте #{card.cardNumber} будут заблокированы до окончания срока.
                </span>
              </label>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Success Message */}
              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-3 rounded-xl border border-zinc-300 text-zinc-700 font-bold text-xs hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={loading || !isAgreed || freezeDays < 14}
                  className={`w-2/3 py-3 rounded-xl text-white font-extrabold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    loading || !isAgreed || freezeDays < 14
                      ? 'bg-zinc-400 opacity-60 cursor-not-allowed'
                      : 'bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/30'
                  }`}
                >
                  <Snowflake className="w-4 h-4" />
                  <span>{loading ? 'Заморозка...' : `Заморозить на ${freezeDays} дней`}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
