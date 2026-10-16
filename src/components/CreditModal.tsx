import React, { useState, useEffect } from 'react';
import { Percent, X, AlertCircle, CheckCircle2, DollarSign, Calendar, Landmark, ArrowRight } from 'lucide-react';
import { BankCard, CreditLoan } from '../types';
import { formatPisiki } from '../utils/formatCurrency';

interface CreditModalProps {
  card: BankCard;
  isOpen: boolean;
  onClose: () => void;
  onCreditSuccess: (updatedCard: BankCard) => void;
}

export const CreditModal: React.FC<CreditModalProps> = ({
  card,
  isOpen,
  onClose,
  onCreditSuccess,
}) => {
  const [amount, setAmount] = useState('50000');
  const [termMonths, setTermMonths] = useState(12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Active credits state
  const [activeCredits, setActiveCredits] = useState<CreditLoan[]>([]);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [activeTab, setActiveTab] = useState<'apply' | 'my_loans'>('apply');

  const fetchCredits = async () => {
    setLoadingCredits(true);
    try {
      const res = await fetch(`/api/cards/credits/${card.id}`);
      const data = await res.json().catch(() => ({}));
      if (data.success && data.credits) {
        setActiveCredits(data.credits);
      }
    } catch (err) {
      console.error('Error fetching credits:', err);
    } finally {
      setLoadingCredits(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCredits();
    }
  }, [isOpen, card.id]);

  if (!isOpen) return null;

  // Calculation helpers
  const numAmount = Number(amount) || 0;
  const interestRate = 5; // 5% p.a.
  const years = termMonths / 12;
  const totalInterest = Math.round(numAmount * (interestRate / 100) * years);
  const totalRepay = numAmount + totalInterest;
  const monthlyPay = Math.round(totalRepay / termMonths);

  const handleApplyCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount < 1000) {
      setError('Минимальная сумма государственной ссуды: 1 000 писиков');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/cards/credit/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: card.id,
          amount: numAmount,
          termMonths,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Ошибка оформления кредита');
      }

      setSuccessMsg(data.message);
      if (data.updatedCard) {
        onCreditSuccess(data.updatedCard);
      }
      fetchCredits();

      setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при получении кредита');
    } finally {
      setLoading(false);
    }
  };

  const handleRepay = async (creditId: string, repayAmount: number) => {
    if (card.balance < repayAmount) {
      setError(`Недостаточно средств на карте. Баланс: ${formatPisiki(card.balance)}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/cards/credit/repay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditId,
          amount: repayAmount,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Ошибка погашения');
      }

      setSuccessMsg(data.message);
      if (data.updatedCard) {
        onCreditSuccess(data.updatedCard);
      }
      fetchCredits();
    } catch (err: any) {
      setError(err.message || 'Ошибка взаимодействия с банком');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in duration-200 max-h-[92dvh] sm:max-h-none flex flex-col">
        {/* Header */}
        <div className="bg-zinc-50 border-b border-zinc-200 p-4 sm:p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 sm:top-5 right-4 sm:right-5 text-zinc-400 hover:text-zinc-600 p-1.5 rounded-full hover:bg-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-emerald-600 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-0.5 sm:mb-1">
            <Landmark className="w-3.5 h-3.5" />
            <span>Льготное кредитование</span>
          </div>

          <h2 className="text-lg sm:text-2xl font-black text-zinc-900">Кредит 5% Годовых</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Моментальное зачисление средств на карту Банка номер один в НЯСР
          </p>

          {/* Sub Navigation Tabs */}
          <div className="flex space-x-2 mt-3 pt-2 sm:pt-3 border-t border-zinc-200/60">
            <button
              type="button"
              onClick={() => setActiveTab('apply')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'apply'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
              }`}
            >
              Оформить кредит
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('my_loans')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'my_loans'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
              }`}
            >
              <span>Мои кредиты</span>
              {activeCredits.filter((c) => c.status === 'active').length > 0 && (
                <span className="w-4 h-4 bg-emerald-500 text-white rounded-full text-[10px] flex items-center justify-center">
                  {activeCredits.filter((c) => c.status === 'active').length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'apply' ? (
            <form onSubmit={handleApplyCredit} className="space-y-5">
              {/* Credit Amount */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Сумма кредита (в писиках)
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    Фиксированная ставка 5%
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    required
                    min={1000}
                    max={10000000}
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setError('');
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 font-bold text-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <span className="absolute right-4 top-3.5 font-bold text-slate-400">писиков</span>
                </div>

                {/* Amount presets */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {[25000, 50000, 150000, 500000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(String(val))}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
                    >
                      {formatPisiki(val)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Term Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Срок кредитования
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { months: 3, label: '3 мес' },
                    { months: 6, label: '6 мес' },
                    { months: 12, label: '12 мес' },
                    { months: 24, label: '24 мес' },
                  ].map((t) => (
                    <button
                      key={t.months}
                      type="button"
                      onClick={() => setTermMonths(t.months)}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all ${
                        termMonths === t.months
                          ? 'bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-900'
                          : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border border-zinc-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculation Summary Box */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-500">
                  <span>Ставка по госпрограмме:</span>
                  <span className="font-bold text-emerald-600">5.0% годовых</span>
                </div>

                <div className="flex justify-between text-zinc-500">
                  <span>Переплата за весь срок:</span>
                  <span className="font-semibold text-zinc-700">
                    +{formatPisiki(totalInterest)}
                  </span>
                </div>

                <div className="flex justify-between text-zinc-500">
                  <span>Ежемесячный платеж:</span>
                  <span className="font-extrabold text-zinc-900 text-sm">
                    ~{formatPisiki(monthlyPay)} / мес
                  </span>
                </div>

                <div className="pt-2 border-t border-zinc-200 flex justify-between items-center text-sm">
                  <span className="font-bold text-zinc-800">К возврату:</span>
                  <span className="font-black text-emerald-600 text-base">
                    {formatPisiki(totalRepay)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-5 rounded-2xl bg-zinc-900 hover:bg-black active:bg-zinc-800 text-white font-extrabold text-base flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Оформление государственного кредита...' : 'Взять кредит 5%'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          ) : (
            /* MY ACTIVE LOANS TAB */
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {loadingCredits ? (
                <div className="text-center py-8 text-zinc-400 text-sm">Загрузка ваших кредитов...</div>
              ) : activeCredits.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-sm">
                  <Landmark className="w-12 h-12 mx-auto text-zinc-300 mb-2" />
                  У вас нет активных кредитов в Банке номер один в НЯСР
                </div>
              ) : (
                activeCredits.map((credit) => (
                  <div
                    key={credit.id}
                    className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 flex flex-col justify-between space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-bold text-zinc-500 uppercase">
                          Кредит #{credit.id.slice(-6)} • 5% годовых
                        </div>
                        <div className="text-lg font-black text-zinc-900 mt-0.5">
                          {formatPisiki(credit.principal)}
                        </div>
                        <div className="text-xs text-zinc-500">
                          Срок: {credit.termMonths} мес. • Ежемесячно: ~{formatPisiki(credit.monthlyPayment)}
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          credit.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-zinc-200 text-zinc-700'
                        }`}
                      >
                        {credit.status === 'paid' ? 'ПОГАШЕН' : 'АКТИВЕН'}
                      </span>
                    </div>

                    {credit.status === 'active' && (
                      <div className="pt-2 border-t border-zinc-200 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] text-zinc-500">Остаток долга:</div>
                          <div className="text-sm font-bold text-zinc-900">
                            {formatPisiki(credit.remainingAmount)}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleRepay(credit.id, credit.remainingAmount)}
                          className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white font-bold text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          Погасить полностью ({formatPisiki(credit.remainingAmount)})
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
