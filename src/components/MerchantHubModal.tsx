import React, { useState, useEffect } from 'react';
import { BankCard, Invoice, MerchantStats } from '../types';
import { formatPisiki } from '../utils/formatCurrency';
import {
  X,
  Building2,
  Receipt,
  Code,
  BarChart3,
  Copy,
  Check,
  PlusCircle,
  QrCode,
  ExternalLink,
  Sparkles,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCw,
  Palette,
  Layout,
  Layers,
  ShoppingBag,
} from 'lucide-react';

interface MerchantHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCards: BankCard[];
  activeCard?: BankCard;
  onOpenTestInvoice: (invoiceId: string) => void;
}

export const MerchantHubModal: React.FC<MerchantHubModalProps> = ({
  isOpen,
  onClose,
  userCards,
  activeCard,
  onOpenTestInvoice,
}) => {
  const [activeTab, setActiveTab] = useState<'invoicing' | 'widget' | 'analytics'>('invoicing');

  // Selected card for receiving payments
  const [selectedCardNumber, setSelectedCardNumber] = useState<string>(
    activeCard?.cardNumber || (userCards[0]?.cardNumber || '')
  );

  // Invoicing Form State
  const [merchantName, setMerchantName] = useState<string>(
    activeCard?.cardHolderName ? `Магазин «${activeCard.cardHolderName}»` : 'Торговая Лавка НЯСР'
  );
  const [invoiceAmount, setInvoiceAmount] = useState<string>('5000');
  const [invoiceDesc, setInvoiceDesc] = useState<string>('Счёт за товары / услуги №102');
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const [creating, setCreating] = useState<boolean>(false);
  const [invoiceError, setInvoiceError] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Widget Generator State
  const [widgetBtnText, setWidgetBtnText] = useState<string>('Оплатить через Писюн Банк');
  const [widgetColor, setWidgetColor] = useState<'black' | 'gold' | 'emerald' | 'white'>('black');
  const [widgetRadius, setWidgetRadius] = useState<'rounded-lg' | 'rounded-xl' | 'rounded-2xl' | 'rounded-full'>('rounded-2xl');
  const [widgetAmount, setWidgetAmount] = useState<string>('2500');
  const [widgetMerchantName, setWidgetMerchantName] = useState<string>(merchantName);
  const [copiedWidgetCode, setCopiedWidgetCode] = useState<boolean>(false);

  // Analytics & Invoices State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<MerchantStats>({
    totalRevenue: 0,
    paidCount: 0,
    pendingCount: 0,
    avgCheck: 0,
  });
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);

  const appUrl = window.location.origin;

  // Load Invoices when tab changes or card changes
  const loadMerchantInvoices = async () => {
    if (!selectedCardNumber) return;
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/invoices/merchant/${selectedCardNumber}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setInvoices(data.invoices || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching merchant invoices:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMerchantInvoices();
    }
  }, [isOpen, selectedCardNumber]);

  if (!isOpen) return null;

  // Create Invoice Handler
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceAmount || Number(invoiceAmount) <= 0) {
      setInvoiceError('Укажите корректную сумму счёта');
      return;
    }

    setCreating(true);
    setInvoiceError('');

    try {
      const res = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantName: merchantName.trim(),
          recipientCardNumber: selectedCardNumber,
          amount: Number(invoiceAmount),
          description: invoiceDesc.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Ошибка генерации счёта');
      }

      setCreatedInvoice(data.invoice);
      loadMerchantInvoices();
    } catch (err: any) {
      setInvoiceError(err.message || 'Не удалось выставить счёт');
    } finally {
      setCreating(false);
    }
  };

  const payUrl = createdInvoice ? `${appUrl}?invoice=${createdInvoice.id}` : '';

  const handleCopyText = (text: string, type: 'link' | 'widget') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedWidgetCode(true);
      setTimeout(() => setCopiedWidgetCode(false), 2000);
    }
  };

  // Generate Widget HTML Snippet
  const widgetCodeSnippet = `<script src="${appUrl}/murbank-pay-widget.js"></script>
<button 
  onclick="MURBANKPay.openCheckout({
    merchantName: '${widgetMerchantName || 'Мой Магазин'}',
    recipientCardNumber: '${selectedCardNumber}',
    amount: ${widgetAmount || '1000'},
    description: 'Оплата заказа на сайте'
  })"
  style="background: ${
    widgetColor === 'black' ? '#18181b' : widgetColor === 'gold' ? '#f59e0b' : widgetColor === 'emerald' ? '#10b981' : '#ffffff'
  }; color: ${widgetColor === 'white' || widgetColor === 'gold' ? '#000000' : '#ffffff'}; font-weight: 800; padding: 14px 28px; border-radius: ${
    widgetRadius === 'rounded-full' ? '9999px' : widgetRadius === 'rounded-2xl' ? '16px' : '12px'
  }; border: 1px solid rgba(0,0,0,0.1); cursor: pointer; display: inline-flex; align-items: center; gap: 8px; font-family: sans-serif;"
>
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  <span>${widgetBtnText} (${formatPisiki(Number(widgetAmount || 0))})</span>
</button>`;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-4xl bg-white rounded-t-3xl sm:rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden relative flex flex-col max-h-[92dvh] sm:max-h-[90vh] my-0 sm:my-6">
        {/* Header */}
        <div className="bg-zinc-900 p-5 sm:p-7 text-white relative shrink-0 overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute top-4 sm:top-5 right-4 sm:right-5 p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] sm:text-xs font-bold mb-2 sm:mb-3">
            <Building2 className="w-3.5 h-3.5" />
            <span>Эквайринг & Продавцы</span>
          </div>

          <h2 className="text-xl sm:text-3xl font-black text-white flex items-center space-x-2">
            <span>Торговый Эквайринг Банка номер один в НЯСР</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 hidden xs:block">
            Счета на оплату, виджеты для сайтов и аналитика выручки для бизнеса
          </p>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-4 sm:mt-6 p-1 bg-zinc-800/90 rounded-2xl border border-zinc-700/80">
            <button
              onClick={() => setActiveTab('invoicing')}
              className={`py-2 px-1.5 sm:py-2.5 sm:px-3 rounded-xl text-[11px] sm:text-sm font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                activeTab === 'invoicing'
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-extrabold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>1. Выставить счёт</span>
            </button>

            <button
              onClick={() => setActiveTab('widget')}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeTab === 'widget'
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-extrabold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>2. Виджет на сайт</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-extrabold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>3. Аналитика & Счета</span>
            </button>
          </div>
        </div>

        {/* Card Selector Header */}
        <div className="bg-zinc-50 border-b border-zinc-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs font-bold text-zinc-700 flex items-center space-x-1.5">
            <span>Карта зачисления выручки:</span>
          </div>

          <select
            value={selectedCardNumber}
            onChange={(e) => setSelectedCardNumber(e.target.value)}
            className="bg-white border border-zinc-300 text-xs font-bold text-zinc-900 py-1.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
          >
            {userCards.map((card) => (
              <option key={card.id} value={card.cardNumber}>
                {card.cardType === 'business' ? '⚫ ЧЕРНАЯ' : '⚪ БЕЛАЯ'} ({card.cardNumber}) — Баланс: {card.balance.toLocaleString('ru-RU')} PUSH
              </option>
            ))}
          </select>
        </div>

        {/* Scrollable Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: INVOICING */}
          {activeTab === 'invoicing' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form to Create Invoice */}
              <form onSubmit={handleCreateInvoice} className="space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900 flex items-center space-x-2">
                    <PlusCircle className="w-5 h-5 text-amber-500" />
                    <span>Создать счёт на оплату (Invoicing)</span>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Сгенерируйте прямую ссылку для клиента с предзаполненной суммой
                  </p>
                </div>

                {invoiceError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{invoiceError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    Название продавца / магазина
                  </label>
                  <input
                    type="text"
                    required
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    placeholder="Например: ИП Гражданин / Отель «Лагуна»"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm font-semibold text-zinc-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    Сумма счёта (PUSH)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    placeholder="5000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    Назначение платежа / Номер заказа
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={invoiceDesc}
                    onChange={(e) => setInvoiceDesc(e.target.value)}
                    placeholder="Оплата за бронирование №402..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs font-medium text-zinc-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-3.5 px-4 rounded-xl bg-zinc-900 hover:bg-black text-white font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg cursor-pointer disabled:opacity-50 transition-all"
                >
                  {creating ? (
                    <RotateCw className="w-4 h-4 animate-spin text-amber-400" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  )}
                  <span>Сгенерировать платёжную ссылку</span>
                </button>
              </form>

              {/* Created Invoice Preview Card */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                      Готовая ссылка на оплату
                    </span>
                    {createdInvoice && (
                      <span className="text-xs font-mono text-zinc-400">
                        {createdInvoice.id}
                      </span>
                    )}
                  </div>

                  {createdInvoice ? (
                    <div className="space-y-4 mt-4">
                      <div className="p-4 rounded-xl bg-white border border-zinc-200 space-y-2">
                        <div className="text-xs text-zinc-500 font-bold uppercase">Детали счёта</div>
                        <div className="text-xl font-black text-zinc-900">
                          {createdInvoice.amount.toLocaleString('ru-RU')} PUSH
                        </div>
                        <div className="text-xs font-bold text-zinc-800">
                          Продавец: {createdInvoice.merchantName}
                        </div>
                        <div className="text-xs text-zinc-600">
                          {createdInvoice.description}
                        </div>
                      </div>

                      {/* Pay URL Box */}
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">
                          Прямая ссылка для клиента:
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            readOnly
                            value={payUrl}
                            className="w-full bg-white border border-zinc-300 text-xs font-mono py-2 px-3 rounded-xl text-zinc-800 select-all"
                          />
                          <button
                            onClick={() => handleCopyText(payUrl, 'link')}
                            className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs shrink-0 cursor-pointer transition-all flex items-center space-x-1"
                          >
                            {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onOpenTestInvoice(createdInvoice.id)}
                          className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Протестировать оплату</span>
                        </button>

                        <a
                          href={payUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="py-2.5 px-3 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-900 font-extrabold text-xs flex items-center justify-center space-x-1.5 transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Открыть в новой вкладке</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-zinc-400 space-y-2">
                      <QrCode className="w-12 h-12 mx-auto text-zinc-300" />
                      <p className="text-xs font-semibold">
                        Заполните форму слева и нажмите «Сгенерировать», чтобы получить рабочую ссылку.
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 leading-tight">
                  💡 <strong>Подсказка:</strong> Отправив эту ссылку покупателю, он сможет внести деньги со своей карты Банка номер один в НЯСР за 5 секунд.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WIDGET GENERATOR */}
          {activeTab === 'widget' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customizer */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900 flex items-center space-x-2">
                    <Code className="w-5 h-5 text-amber-500" />
                    <span>Конструктор виджета «Оплатить через Писюн Банк»</span>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Настройте вид кнопки и скопируйте готовый HTML/JS код для любого сайта
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    Название вашего интернет-магазина
                  </label>
                  <input
                    type="text"
                    value={widgetMerchantName}
                    onChange={(e) => setWidgetMerchantName(e.target.value)}
                    placeholder="Маркетплейс НЯСР"
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">
                      Текст на кнопке
                    </label>
                    <input
                      type="text"
                      value={widgetBtnText}
                      onChange={(e) => setWidgetBtnText(e.target.value)}
                      placeholder="Купить за PUSH"
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">
                      Сумма товара (PUSH)
                    </label>
                    <input
                      type="number"
                      value={widgetAmount}
                      onChange={(e) => setWidgetAmount(e.target.value)}
                      placeholder="2500"
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs font-bold text-zinc-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                {/* Style Customizer */}
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1.5 flex items-center space-x-1">
                    <Palette className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Цвет и стиль кнопки</span>
                  </label>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'black', label: 'Черный VIP', bg: 'bg-zinc-900 text-white' },
                      { id: 'gold', label: 'Золотой', bg: 'bg-amber-500 text-zinc-950 font-bold' },
                      { id: 'emerald', label: 'Изумруд', bg: 'bg-emerald-600 text-white' },
                      { id: 'white', label: 'Белый', bg: 'bg-white text-zinc-900 border border-zinc-300' },
                    ].map((clr) => (
                      <button
                        key={clr.id}
                        type="button"
                        onClick={() => setWidgetColor(clr.id as any)}
                        className={`py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${clr.bg} ${
                          widgetColor === clr.id ? 'ring-2 ring-amber-500 scale-105' : 'opacity-80 hover:opacity-100'
                        }`}
                      >
                        {clr.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Radius */}
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                    Скругление углов
                  </label>
                  <div className="grid grid-cols-4 gap-2 text-[11px] font-bold">
                    {[
                      { id: 'rounded-lg', label: 'Прямые' },
                      { id: 'rounded-xl', label: 'Средние' },
                      { id: 'rounded-2xl', label: 'Мягкие' },
                      { id: 'rounded-full', label: 'Капсула' },
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setWidgetRadius(r.id as any)}
                        className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                          widgetRadius === r.id
                            ? 'bg-zinc-900 text-white border-zinc-900 font-extrabold'
                            : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Preview & Code */}
              <div className="bg-zinc-900 rounded-2xl p-5 text-white flex flex-col justify-between space-y-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-amber-400 mb-3 flex items-center justify-between">
                    <span>Интерактивный симулятор виджета</span>
                    <span className="text-[10px] text-zinc-400">Live Preview</span>
                  </div>

                  {/* Live Widget Button Simulator */}
                  <div className="p-8 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-center flex flex-col items-center justify-center space-y-3">
                    <p className="text-xs text-zinc-400">Так кнопка выглядит на стороннем сайте:</p>

                    <button
                      type="button"
                      onClick={async () => {
                        // Create a temporary invoice for the live widget simulator
                        try {
                          const res = await fetch('/api/invoices/create', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              merchantName: widgetMerchantName || 'Магазин НЯСР',
                              recipientCardNumber: selectedCardNumber,
                              amount: Number(widgetAmount || 1000),
                              description: `Оплата виджетом с внешнего сайта`,
                            }),
                          });
                          const data = await res.json();
                          if (data.success && data.invoice) {
                            onOpenTestInvoice(data.invoice.id);
                          }
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className={`px-6 py-3.5 ${widgetRadius} font-extrabold text-sm flex items-center space-x-2.5 transition-all shadow-xl cursor-pointer hover:scale-105 active:scale-95 ${
                        widgetColor === 'black'
                          ? 'bg-zinc-950 text-white border border-zinc-700'
                          : widgetColor === 'gold'
                          ? 'bg-amber-500 text-zinc-950 font-black'
                          : widgetColor === 'emerald'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-zinc-950'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{widgetBtnText} ({Number(widgetAmount || 0).toLocaleString('ru-RU')} PUSH)</span>
                    </button>

                    <p className="text-[10px] text-amber-400/90 font-medium pt-1">
                      ☝ Нажмите на кнопку, чтобы проверить как открывается эквайринг!
                    </p>
                  </div>

                  {/* Code Snippet Box */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-zinc-300">
                        HTML / JS Код для вставки на ваш сайт:
                      </span>
                      <button
                        onClick={() => handleCopyText(widgetCodeSnippet, 'widget')}
                        className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1 cursor-pointer"
                      >
                        {copiedWidgetCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedWidgetCode ? 'Скопировано!' : 'Копировать'}</span>
                      </button>
                    </div>

                    <pre className="p-3 rounded-xl bg-black/80 border border-zinc-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-36">
                      <code>{widgetCodeSnippet}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MERCHANT ANALYTICS & INVOICE LIST */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <div className="text-xs font-bold text-amber-800 flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                    <span>Выручка (PUSH)</span>
                  </div>
                  <div className="text-2xl font-black text-amber-950 mt-1">
                    {stats.totalRevenue.toLocaleString('ru-RU')}
                  </div>
                  <div className="text-[10px] text-amber-700 mt-0.5">За всё время</div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="text-xs font-bold text-emerald-800 flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Оплачено счетов</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-950 mt-1">
                    {stats.paidCount}
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">Успешные продажи</div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-100 border border-zinc-200">
                  <div className="text-xs font-bold text-zinc-700 flex items-center space-x-1">
                    <DollarSign className="w-4 h-4 text-zinc-600" />
                    <span>Средний чек</span>
                  </div>
                  <div className="text-2xl font-black text-zinc-900 mt-1">
                    {stats.avgCheck.toLocaleString('ru-RU')} PUSH
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">На 1 покупку</div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                  <div className="text-xs font-bold text-amber-900 flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Ожидают оплаты</span>
                  </div>
                  <div className="text-2xl font-black text-amber-950 mt-1">
                    {stats.pendingCount}
                  </div>
                  <div className="text-[10px] text-amber-700 mt-0.5">Активные ссылки</div>
                </div>
              </div>

              {/* Invoices List Table */}
              <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center">
                  <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center space-x-2">
                    <Receipt className="w-4 h-4 text-amber-500" />
                    <span>Журнал выставленных счетов</span>
                  </h4>
                  <button
                    onClick={loadMerchantInvoices}
                    className="p-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 transition-colors text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${loadingAnalytics ? 'animate-spin' : ''}`} />
                    <span>Обновить</span>
                  </button>
                </div>

                {loadingAnalytics ? (
                  <div className="py-12 text-center text-zinc-400 text-xs font-semibold">
                    Загрузка списка счетов...
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="py-12 text-center text-zinc-400 text-xs font-semibold">
                    Вы ещё не выставляли счета на эту карту. Воспользуйтесь первой вкладкой!
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100 max-h-72 overflow-y-auto">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-sm text-zinc-900">
                              {inv.description}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                inv.status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {inv.status === 'paid' ? 'ОПЛАЧЕН' : 'ОЖИДАЕТ'}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-500 flex items-center space-x-3">
                            <span>ID: <code className="font-mono">{inv.id}</code></span>
                            <span>{new Date(inv.createdAt).toLocaleString('ru-RU')}</span>
                            {inv.paidByCardNumber && (
                              <span>Карта плательщика: **** {inv.paidByCardNumber.slice(-4)}</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-black text-zinc-900">
                            +{inv.amount.toLocaleString('ru-RU')} PUSH
                          </div>
                          {inv.status === 'pending' && (
                            <button
                              onClick={() => onOpenTestInvoice(inv.id)}
                              className="text-[11px] font-bold text-amber-600 hover:text-amber-700 underline mt-0.5 cursor-pointer"
                            >
                              Оплатить по счёту
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
