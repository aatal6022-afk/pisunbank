import React, { useState, useEffect } from 'react';
import { Invoice, BankCard } from '../types';
import { formatPisiki } from '../utils/formatCurrency';
import {
  ShieldCheck,
  Building2,
  CheckCircle2,
  Lock,
  CreditCard,
  X,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Receipt,
  RotateCw,
} from 'lucide-react';

interface CheckoutModalProps {
  invoiceId: string | null;
  onClose: () => void;
  currentUserCard?: BankCard;
  onPaymentSuccess?: (updatedCardBalance?: number) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  invoiceId,
  onClose,
  currentUserCard,
  onPaymentSuccess,
}) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [cardNumber, setCardNumber] = useState<string>(currentUserCard?.cardNumber || '');
  const [cvv, setCvv] = useState<string>(currentUserCard?.cvv || '');
  const [paying, setPaying] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    if (!invoiceId) return;

    const fetchInvoice = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/invoices/${invoiceId}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Счёт на оплату не найден');
        }

        setInvoice(data.invoice);
        if (data.invoice.status === 'paid') {
          setPaymentSuccess(true);
          setSuccessMessage('Этот счёт уже был успешно оплачен!');
        }
      } catch (err: any) {
        setError(err.message || 'Не удалось загрузить данные счёта');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  if (!invoiceId) return null;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || cardNumber.replace(/\s+/g, '').length !== 12) {
      setError('Введите корректный 12-значный номер карты Банка номер один в НЯСР');
      return;
    }
    if (!cvv || cvv.trim().length !== 3) {
      setError('Введите 3-значный CVV код');
      return;
    }

    setPaying(true);
    setError('');

    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardNumber: cardNumber.replace(/\s+/g, ''),
          cvv: cvv.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Ошибка оплаты счёта');
      }

      setPaymentSuccess(true);
      setSuccessMessage(data.message || 'Оплата счёта прошла успешно!');
      if (data.invoice) {
        setInvoice(data.invoice);
      }
      if (onPaymentSuccess && data.remainingBalance !== undefined) {
        onPaymentSuccess(data.remainingBalance);
      }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при проведении платежа');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden relative my-0 sm:my-8 animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[92dvh] sm:max-h-none flex flex-col">
        {/* Header */}
        <div className="bg-zinc-900 p-5 sm:p-6 text-white relative overflow-hidden shrink-0">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Страна писюнов (НЯСР) • Безопасный эквайринг</span>
          </div>

          <h2 className="text-2xl font-black text-white flex items-center space-x-2">
            <Receipt className="w-6 h-6 text-amber-400" />
            <span>Оплата счёта №{invoiceId.slice(-6).toUpperCase()}</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Шлюз моментальных платежей Банка номер один в НЯСР
          </p>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-8 overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-zinc-500 flex flex-col items-center justify-center space-y-3">
              <RotateCw className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-sm font-semibold">Загрузка реквизитов счёта...</p>
            </div>
          ) : error && !invoice ? (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center text-rose-700">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
              <h3 className="font-extrabold text-base">Ошибка загрузки счёта</h3>
              <p className="text-xs mt-1 text-rose-600">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 px-5 py-2.5 rounded-xl bg-zinc-900 text-white font-bold text-xs cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          ) : invoice ? (
            <div>
              {/* Order Details Card */}
              <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 mb-6">
                <div className="flex justify-between items-start mb-3 border-b border-zinc-200/80 pb-3">
                  <div>
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      Получатель
                    </div>
                    <div className="text-base font-extrabold text-zinc-900 flex items-center space-x-1.5 mt-0.5">
                      <Building2 className="w-4 h-4 text-amber-500" />
                      <span>{invoice.merchantName}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      К оплате
                    </div>
                    <div className="text-xl font-black text-emerald-600">
                      {formatPisiki(invoice.amount)}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-zinc-600 font-medium">
                  <span className="font-bold text-zinc-800">Назначение: </span>
                  {invoice.description}
                </div>
              </div>

              {paymentSuccess ? (
                /* SUCCESS STATE */
                <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-emerald-950">
                      Счёт успешно оплачен!
                    </h3>
                    <p className="text-xs font-medium text-emerald-800 mt-1">
                      {successMessage || 'Средства мгновенно зачислены продавцу.'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/80 border border-emerald-200/60 text-xs font-mono text-zinc-700 text-left space-y-1">
                    <div><span className="font-bold">ID счёта:</span> {invoice.id}</div>
                    <div><span className="font-bold">Сумма:</span> {formatPisiki(invoice.amount)}</div>
                    <div><span className="font-bold">Продавец:</span> {invoice.merchantName}</div>
                    {invoice.paidAt && (
                      <div><span className="font-bold">Время:</span> {new Date(invoice.paidAt).toLocaleString('ru-RU')}</div>
                    )}
                  </div>

                  <button
                    onClick={onClose}
                    className="w-full py-3.5 rounded-2xl bg-zinc-900 hover:bg-black text-white font-extrabold text-sm shadow-xl transition-all cursor-pointer"
                  >
                    Вернуться в банк
                  </button>
                </div>
              ) : (
                /* PAYMENT FORM */
                <form onSubmit={handlePay} className="space-y-4">
                  {error && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Card Number */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">
                      Номер карты Банка номер один в НЯСР
                    </label>
                    <div className="relative">
                      <CreditCard className="w-5 h-5 text-zinc-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        maxLength={12}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="450012345678"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-300 focus:ring-2 focus:ring-amber-500 font-mono font-bold text-zinc-900 outline-none"
                      />
                    </div>
                  </div>

                  {/* CVV */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">
                      CVV Код (3 цифры на обороте)
                    </label>
                    <div className="relative">
                      <Lock className="w-5 h-5 text-zinc-400 absolute left-3.5 top-3.5" />
                      <input
                        type="password"
                        maxLength={3}
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                        placeholder="738"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-300 focus:ring-2 focus:ring-amber-500 font-mono font-bold text-zinc-900 outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={paying}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-black text-base flex items-center justify-center space-x-2 shadow-xl shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {paying ? (
                        <>
                          <RotateCw className="w-5 h-5 animate-spin" />
                          <span>Проведение оплаты...</span>
                        </>
                      ) : (
                        <>
                          <span>Подтвердить и оплатить {formatPisiki(invoice.amount)}</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-zinc-400 text-center font-medium flex items-center justify-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>256-bit Шифрование Банка номер один в НЯСР</span>
                  </p>
                </form>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
