import React, { useState } from 'react';
import { User, BankCard } from '../types';
import { formatPisiki } from '../utils/formatCurrency';
import {
  ShieldCheck,
  Building2,
  CheckCircle2,
  Lock,
  X,
  ArrowRight,
  AlertCircle,
  Receipt,
  RotateCw,
  CreditCard,
  ExternalLink,
  Wallet,
  UserCheck,
} from 'lucide-react';

export interface ExpressCheckoutParams {
  merchantName: string;
  recipientCardNumber: string;
  amount: number;
  description: string;
  returnUrl?: string;
}

interface ExpressCheckoutModalProps {
  data: ExpressCheckoutParams;
  currentUser: User | null;
  userCards: BankCard[];
  activeCard: BankCard | null;
  onClose: () => void;
  onPaymentSuccess: (updatedCard: BankCard) => void;
  onOpenLogin?: () => void;
}

export const ExpressCheckoutModal: React.FC<ExpressCheckoutModalProps> = ({
  data,
  currentUser,
  userCards,
  activeCard,
  onClose,
  onPaymentSuccess,
  onOpenLogin,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string>(activeCard?.id || userCards[0]?.id || '');
  const [manualCardNumber, setManualCardNumber] = useState<string>('');
  const [manualCvv, setManualCvv] = useState<string>('');

  const [paying, setPaying] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [successDetails, setSuccessDetails] = useState<{
    txId?: string;
    remainingBalance?: number;
  }>({});

  const selectedCard = userCards.find((c) => c.id === selectedCardId) || activeCard || userCards[0];

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let fromNum = '';
    let fromCvv = '';

    if (currentUser && selectedCard) {
      fromNum = selectedCard.cardNumber;
      fromCvv = selectedCard.cvv;
    } else {
      fromNum = manualCardNumber.replace(/\s+/g, '');
      fromCvv = manualCvv.trim();

      if (!fromNum || fromNum.length !== 12) {
        setError('Введите корректный 12-значный номер карты списания');
        return;
      }
      if (!fromCvv || fromCvv.length !== 3) {
        setError('Введите 3-значный CVV код');
        return;
      }
    }

    if (selectedCard && selectedCard.balance < data.amount) {
      setError(
        `Недостаточно средств на карте. Баланс: ${formatPisiki(selectedCard.balance)}, требуется: ${formatPisiki(data.amount)}`
      );
      return;
    }

    setPaying(true);

    try {
      const res = await fetch('/api/v1/card/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromCardNumber: fromNum,
          fromCvv: fromCvv,
          toCardNumber: data.recipientCardNumber.replace(/\s+/g, ''),
          amount: Number(data.amount),
          senderName: currentUser?.fullName || selectedCard?.cardHolderName || 'Покупатель',
          description: `Оплата товара: ${data.description || data.merchantName}`,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Ошибка проведения платежа');
      }

      setSuccess(true);
      setSuccessDetails({
        txId: result.transactionId,
        remainingBalance: result.senderRemainingBalance,
      });

      if (selectedCard && result.senderRemainingBalance !== undefined) {
        const updatedCard = { ...selectedCard, balance: result.senderRemainingBalance };
        onPaymentSuccess(updatedCard);
      }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при оплате');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-zinc-900 text-zinc-100 rounded-t-3xl sm:rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden relative my-0 sm:my-8 animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[92dvh] sm:max-h-none flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500/20 via-zinc-900 to-zinc-900 p-5 sm:p-6 border-b border-zinc-800 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Писюн Банк Pay • Быстрый эквайринг</span>
          </div>

          <h2 className="text-2xl font-black text-white flex items-center space-x-2">
            <Receipt className="w-6 h-6 text-amber-400" />
            <span>Оплата заказа</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Переход со стороннего сайта магазина
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Order Details */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
            <div className="flex justify-between items-start mb-3 border-b border-zinc-800/80 pb-3">
              <div>
                <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  Магазин / Продавец
                </div>
                <div className="text-base font-extrabold text-white flex items-center space-x-1.5 mt-0.5">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>{data.merchantName || 'Внешний Продавец'}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  К оплате
                </div>
                <div className="text-xl font-black text-amber-400">
                  {formatPisiki(data.amount)}
                </div>
              </div>
            </div>

            <div className="text-xs text-zinc-300 font-medium">
              <span className="text-zinc-500">Назначение: </span>
              {data.description || 'Оплата по заказу'}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1 font-mono">
              Карта зачисления: {data.recipientCardNumber}
            </div>
          </div>

          {success ? (
            /* SUCCESS STATE */
            <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-black text-emerald-300">
                  Оплата прошла успешно!
                </h3>
                <p className="text-xs text-emerald-400/80 mt-1">
                  Деньги списаны с вашей карты и зачислены продавцу.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-emerald-500/20 text-xs font-mono text-zinc-300 text-left space-y-1">
                <div><span className="text-zinc-500">Сумма:</span> {formatPisiki(data.amount)}</div>
                <div><span className="text-zinc-500">Получатель:</span> {data.merchantName}</div>
                {successDetails.txId && (
                  <div><span className="text-zinc-500">ID операции:</span> {successDetails.txId}</div>
                )}
                {successDetails.remainingBalance !== undefined && (
                  <div><span className="text-zinc-500">Ваш остаток:</span> {formatPisiki(successDetails.remainingBalance)}</div>
                )}
              </div>

              {data.returnUrl ? (
                <a
                  href={
                    data.returnUrl +
                    (data.returnUrl.includes('?') ? '&' : '?') +
                    `status=success&paid=true&amount=${data.amount}` +
                    (successDetails.txId ? `&transactionId=${encodeURIComponent(successDetails.txId)}` : '')
                  }
                  className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer block"
                >
                  <span>Вернуться на сайт магазина (Оплачено)</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <button
                  onClick={onClose}
                  className="w-full py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold text-sm transition-all cursor-pointer"
                >
                  Вернуться в банк
                </button>
              )}
            </div>
          ) : (
            /* PAYMENT FORM */
            <form onSubmit={handlePay} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Logged in User state */}
              {currentUser && userCards.length > 0 ? (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                    <span className="flex items-center space-x-1.5">
                      <UserCheck className="w-4 h-4" />
                      <span>Вы авторизованы: {currentUser.fullName}</span>
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                      Автоматическая оплата
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      Выберите карту для списания:
                    </label>
                    <select
                      value={selectedCardId}
                      onChange={(e) => setSelectedCardId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {userCards.map((card) => (
                        <option key={card.id} value={card.id}>
                          {card.cardType === 'business' ? 'Бизнес' : 'Обычная'} карта ****{' '}
                          {card.cardNumber.slice(-4)} (Баланс: {formatPisiki(card.balance)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCard && (
                    <div className="text-xs text-zinc-400 flex justify-between items-center pt-1 font-mono">
                      <span>Доступный баланс:</span>
                      <span className="font-extrabold text-emerald-400">
                        {formatPisiki(selectedCard.balance)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Not Logged in state */
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
                    <span>У вас есть аккаунт в Банке номер один в НЯСР?</span>
                    {onOpenLogin && (
                      <button
                        type="button"
                        onClick={onOpenLogin}
                        className="text-amber-400 hover:underline font-bold"
                      >
                        Войти в аккаунт
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Номер карты списания (12 цифр)
                    </label>
                    <div className="relative">
                      <CreditCard className="w-5 h-5 text-zinc-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        maxLength={12}
                        required
                        value={manualCardNumber}
                        onChange={(e) => setManualCardNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="450012345678"
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      CVV код карты (3 цифры)
                    </label>
                    <div className="relative">
                      <Lock className="w-5 h-5 text-zinc-500 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        maxLength={3}
                        required
                        value={manualCvv}
                        onChange={(e) => setManualCvv(e.target.value.replace(/\D/g, ''))}
                        placeholder="123"
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* BIG Pay Button */}
              <button
                type="submit"
                disabled={paying}
                className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-base flex items-center justify-center space-x-2 shadow-xl shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {paying ? (
                  <>
                    <RotateCw className="w-5 h-5 animate-spin" />
                    <span>Обработка платежа...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Подтвердить и оплатить {formatPisiki(data.amount)}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-zinc-500 text-center flex items-center justify-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Защищено шифрованием Банка номер один в НЯСР</span>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
