import React, { useState, useEffect } from 'react';
import { Send, X, CreditCard, ArrowRight, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { BankCard } from '../types';
import { formatPisiki } from '../utils/formatCurrency';

interface TransferModalProps {
  card: BankCard;
  isOpen: boolean;
  onClose: () => void;
  onTransferSuccess: (updatedCard: BankCard) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  card,
  isOpen,
  onClose,
  onTransferSuccess,
}) => {
  const [targetCardNumber, setTargetCardNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState<{ name: string; valid: boolean } | null>(null);
  const [checkingRecipient, setCheckingRecipient] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Format card number as typing
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
    setTargetCardNumber(raw);
    setError('');
  };

  // Check recipient details when 12 digits entered
  useEffect(() => {
    if (!isOpen) return;
    const clean = targetCardNumber.replace(/\D/g, '');
    if (clean.length === 12) {
      if (clean === card.cardNumber) {
        setRecipientInfo({ name: 'Нельзя переводить на свою карту', valid: false });
        return;
      }
      setCheckingRecipient(true);
      fetch(`/api/cards/number/${clean}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.success && data.card) {
            setRecipientInfo({ name: data.card.cardHolderName, valid: true });
          } else {
            setRecipientInfo({ name: 'Карта с таким номером не найдена', valid: false });
          }
        })
        .catch(() => {
          setRecipientInfo({ name: 'Ошибка проверки получателя', valid: false });
        })
        .finally(() => setCheckingRecipient(false));
    } else {
      setRecipientInfo(null);
    }
  }, [targetCardNumber, card.cardNumber, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToNum = targetCardNumber.replace(/\D/g, '');
    const numAmount = Number(amount);

    if (cleanToNum.length !== 12) {
      setError('Номер карты должен состоять ровно из 12 цифр');
      return;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Укажите корректную сумму для перевода');
      return;
    }

    if (numAmount > card.balance) {
      setError(`Недостаточно средств. Ваш баланс: ${formatPisiki(card.balance)}`);
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/cards/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromCardNumber: card.cardNumber,
          toCardNumber: cleanToNum,
          amount: numAmount,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Ошибка перевода');
      }

      setSuccessMsg(data.message);
      if (data.senderCard) {
        onTransferSuccess(data.senderCard);
      }
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
        setTargetCardNumber('');
        setAmount('');
        setNote('');
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при выполнении перевода');
    } finally {
      setLoading(false);
    }
  };

  const setShortcutCard = (num: string) => {
    setTargetCardNumber(num);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in duration-200 max-h-[92dvh] sm:max-h-none flex flex-col">
        {/* Header */}
        <div className="bg-zinc-50 border-b border-zinc-200 p-4 sm:p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 sm:top-5 right-4 sm:right-5 text-zinc-400 hover:text-zinc-600 p-1.5 rounded-full hover:bg-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 text-zinc-900 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-0.5 sm:mb-1">
            <Send className="w-3.5 h-3.5 text-amber-500" />
            <span>Мгновенный перевод НЯСР</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900">Перевод на другую карту</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Отправитель: {card.cardHolderName} ({card.cardNumber.replace(/(.{4})/g, '$1 ').trim()})
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Target Card Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-800">
                Номер карты получателя (12 цифр) <span className="text-rose-500">*</span>
              </label>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={targetCardNumber.replace(/(.{4})/g, '$1 ').trim()}
                onChange={handleCardNumberChange}
                placeholder="4500 0000 0000"
                maxLength={15}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-lg tracking-widest text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
              <CreditCard className="w-5 h-5 absolute right-3.5 top-3.5 text-slate-400" />
            </div>

            {/* Recipient Validation Status */}
            {checkingRecipient && (
              <p className="text-xs text-amber-600 mt-1.5 animate-pulse font-medium">
                Проверка номера карты в реестре Банка номер один в НЯСР...
              </p>
            )}

            {recipientInfo && !checkingRecipient && (
              <div
                className={`mt-2 p-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
                  recipientInfo.valid
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <span>{recipientInfo.valid ? '✓' : '✕'}</span>
                <span>Получатель: {recipientInfo.name}</span>
              </div>
            )}

            {/* Quick Test Recipients Shortcuts */}
            <div className="mt-3">
              <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
                Быстрый выбор получателя в Стране писюнов (НЯСР):
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShortcutCard('450000000001')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] text-slate-800 font-medium transition-colors border border-slate-200"
                >
                  🏛️ Казна НЯСР
                </button>
                <button
                  type="button"
                  onClick={() => setShortcutCard('450088889999')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] text-slate-800 font-medium transition-colors border border-slate-200"
                >
                  👤 Иван Гражданин (НЯСР)
                </button>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-800">
                Сумма перевода (в писиках) <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-500">
                Доступно: <strong className="text-slate-900">{formatPisiki(card.balance)}</strong>
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                required
                min={1}
                max={card.balance}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                placeholder="1000"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-lg font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
              <span className="absolute right-4 top-3 text-slate-400 font-bold">писиков</span>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex items-center space-x-2 mt-2">
              {[500, 1000, 5000, 25000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(String(val))}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 transition-colors"
                >
                  +{formatPisiki(val)}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Комментарий к переводу (опционально)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Например: За покупку авто / Подарок"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-5 rounded-2xl bg-zinc-900 hover:bg-black active:bg-zinc-800 text-white font-extrabold text-base flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Выполняется перевод...' : 'Подтвердить и перевести'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
