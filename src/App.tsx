import React, { useState, useEffect, useCallback } from 'react';
import { User, BankCard, Transaction } from './types';
import { Header } from './components/Header';
import { BankCardComponent } from './components/BankCard';
import { RegistrationFlow } from './components/RegistrationFlow';
import { TransferModal } from './components/TransferModal';
import { CreditModal } from './components/CreditModal';
import { TransactionList } from './components/TransactionList';
import { ApiDocsModal } from './components/ApiDocsModal';
import { SecurityModal } from './components/SecurityModal';
import { MerchantHubModal } from './components/MerchantHubModal';
import { CheckoutModal } from './components/CheckoutModal';
import { ExpressCheckoutModal, ExpressCheckoutParams } from './components/ExpressCheckoutModal';
import { FreezeModal } from './components/FreezeModal';
import { LawsModal } from './components/LawsModal';
import { InactivityStatusWidget } from './components/InactivityStatusWidget';
import { AdminTreasuryModal } from './components/AdminTreasuryModal';
import { formatPisiki, formatPisikiWord } from './utils/formatCurrency';
import {
  Send,
  Landmark,
  Code,
  PlusCircle,
  ShieldCheck,
  RefreshCw,
  Wallet,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Database,
  Building2,
  Receipt,
  Snowflake,
  Scale,
  Crown,
} from 'lucide-react';

export const isSupremeAdmin = (u?: User | null) => {
  if (!u) return false;
  const email = u.email?.toLowerCase();
  return email === 'aatal6022@gmail.com' || email === 'pinkiscammerinfo@gmail.com' || Boolean(u.isAdmin);
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cards, setCards] = useState<BankCard[]>([]);
  const [activeCard, setActiveCard] = useState<BankCard | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [txLoading, setTxLoading] = useState<boolean>(false);

  // Modals state
  const [isTransferOpen, setIsTransferOpen] = useState<boolean>(false);
  const [isCreditOpen, setIsCreditOpen] = useState<boolean>(false);
  const [isApiDocsOpen, setIsApiDocsOpen] = useState<boolean>(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState<boolean>(false);
  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState<boolean>(false);
  const [isMerchantHubOpen, setIsMerchantHubOpen] = useState<boolean>(false);
  const [isFreezeOpen, setIsFreezeOpen] = useState<boolean>(false);
  const [isLawsOpen, setIsLawsOpen] = useState<boolean>(false);
  const [isTreasuryAdminOpen, setIsTreasuryAdminOpen] = useState<boolean>(false);
  const [invoiceIdToPay, setInvoiceIdToPay] = useState<string | null>(null);
  const [expressPayData, setExpressPayData] = useState<ExpressCheckoutParams | null>(null);

  // Check URL query params for ?invoice=inv_xxx or ?pay=true&merchantName=...&recipientCardNumber=...&amount=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inv = params.get('invoice');
    
    if (inv) {
      setInvoiceIdToPay(inv);
    }

    // Express Redirect Payment parameters
    const pay = params.get('pay') || params.get('checkout');
    const merchant =
      params.get('merchantName') ||
      params.get('merchant') ||
      params.get('seller');
    const recipient =
      params.get('recipientCardNumber') ||
      params.get('toCard') ||
      params.get('cardNumber') ||
      params.get('toCardNumber') ||
      params.get('recipientCard');
    const amountStr =
      params.get('amount') ||
      params.get('sum') ||
      params.get('price');
    const desc =
      params.get('description') ||
      params.get('desc') ||
      params.get('note') ||
      params.get('details');
    const returnUrl = params.get('returnUrl') || params.get('backUrl');

    if (recipient && amountStr) {
      const numAmount = Number(amountStr);
      if (!isNaN(numAmount) && numAmount > 0) {
        setExpressPayData({
          merchantName: merchant || 'Внешний Магазин',
          recipientCardNumber: recipient,
          amount: numAmount,
          description: desc || 'Оплата счёта через Писюн Банк Pay',
          returnUrl: returnUrl || undefined,
        });
      }
    }
  }, []);

  // Load user session from localStorage if exists
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('murbank_user');
      const savedCard = localStorage.getItem('murbank_active_card');
      if (savedUser) {
        let u: User | null = null;
        try {
          u = JSON.parse(savedUser);
        } catch {
          localStorage.removeItem('murbank_user');
        }

        if (u) {
          setCurrentUser(u);
          let preferredCardId: string | undefined;
          if (savedCard) {
            try {
              preferredCardId = JSON.parse(savedCard)?.id;
            } catch {
              localStorage.removeItem('murbank_active_card');
            }
          }
          fetchUserCards(u.id, preferredCardId);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error('Error loading session:', e);
      setLoading(false);
    }
  }, []);

  const fetchUserCards = async (userId: string, preferredCardId?: string) => {
    try {
      const res = await fetch(`/api/cards/user/${userId}`);
      if (!res.ok) {
        localStorage.removeItem('murbank_user');
        localStorage.removeItem('murbank_active_card');
        setCurrentUser(null);
        setCards([]);
        setActiveCard(null);
        setLoading(false);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data.success && data.cards && data.cards.length > 0) {
        setCards(data.cards);
        const selected =
          data.cards.find((c: BankCard) => c.id === preferredCardId) || data.cards[0];
        setActiveCard(selected);
        localStorage.setItem('murbank_active_card', JSON.stringify(selected));
        fetchTransactions(selected.cardNumber);
      } else {
        localStorage.removeItem('murbank_user');
        localStorage.removeItem('murbank_active_card');
        setCurrentUser(null);
        setCards([]);
        setActiveCard(null);
      }
    } catch (err) {
      console.error('Error fetching cards:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = useCallback(async (cardNumber: string) => {
    if (!cardNumber) return;
    setTxLoading(true);
    try {
      const res = await fetch(`/api/cards/transactions/${cardNumber}`);
      if (!res.ok) {
        setTxLoading(false);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data.success && data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setTxLoading(false);
    }
  }, []);

  const handleRegisterSuccess = (user: User, newCard?: BankCard | null) => {
    if (!user) return;
    setCurrentUser(user);
    localStorage.setItem('murbank_user', JSON.stringify(user));

    if (newCard && newCard.id && newCard.cardNumber) {
      setCards((prev) => [...prev.filter((c) => c.id !== newCard.id), newCard]);
      setActiveCard(newCard);
      localStorage.setItem('murbank_active_card', JSON.stringify(newCard));
      fetchTransactions(newCard.cardNumber);
    } else {
      fetchUserCards(user.id);
    }
    setIsNewCardModalOpen(false);
  };

  const handleSelectCard = (card: BankCard) => {
    if (!card) return;
    setActiveCard(card);
    localStorage.setItem('murbank_active_card', JSON.stringify(card));
    fetchTransactions(card.cardNumber);
  };

  const handleCardUpdated = (updatedCard: BankCard) => {
    if (!updatedCard) return;
    setActiveCard(updatedCard);
    setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
    localStorage.setItem('murbank_active_card', JSON.stringify(updatedCard));
    fetchTransactions(updatedCard.cardNumber);
  };

  const handleLogout = () => {
    localStorage.removeItem('murbank_user');
    localStorage.removeItem('murbank_active_card');
    setCurrentUser(null);
    setCards([]);
    setActiveCard(null);
    setTransactions([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 flex flex-col items-center justify-center p-4">
        <div className="p-4 rounded-xl bg-white border border-zinc-200 mb-4 animate-pulse shadow-sm">
          <ShieldCheck className="w-8 h-8 text-zinc-900" />
        </div>
        <h2 className="text-lg font-bold">Загрузка Банка номер один в НЯСР</h2>
        <p className="text-xs text-zinc-500 mt-1">Страна писюнов (НЯСР)</p>
      </div>
    );
  }

  // If no logged in user -> show initial card registration flow
  if (!currentUser || cards.length === 0 || !activeCard) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 flex items-center justify-center">
        <RegistrationFlow onRegisterSuccess={handleRegisterSuccess} />
        {expressPayData && (
          <ExpressCheckoutModal
            data={expressPayData}
            currentUser={null}
            userCards={[]}
            activeCard={null}
            onClose={() => setExpressPayData(null)}
            onPaymentSuccess={() => {}}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] text-zinc-900 font-sans antialiased flex flex-col pb-24 sm:pb-0">
      {/* Navigation Header */}
      <Header
        user={currentUser}
        activeCard={activeCard}
        allCards={cards}
        onSelectCard={handleSelectCard}
        onOpenApiDocs={() => setIsApiDocsOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        onOpenMerchantHub={() => setIsMerchantHubOpen(true)}
        onOpenNewCardFlow={() => setIsNewCardModalOpen(true)}
        onOpenLaws={() => setIsLawsOpen(true)}
        onOpenFreeze={() => setIsFreezeOpen(true)}
        onOpenTreasuryAdmin={() => setIsTreasuryAdminOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3.5 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* Minimalist Top Balance Banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-6 border-b border-zinc-200/60">
          <div>
            <div className="flex items-center space-x-2 text-[10px] sm:text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
              <Wallet className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {activeCard.cardType === 'treasury'
                  ? 'Баланс Государственной Казны Страны писюнов (НЯСР)'
                  : activeCard.cardType === 'business'
                  ? 'Баланс бизнес-счета'
                  : 'Баланс счета'}
              </span>
            </div>

            <div className="flex items-baseline space-x-2.5">
              <span className={`text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight ${
                activeCard.cardType === 'treasury' ? 'text-amber-600' : 'text-zinc-900'
              }`}>
                {activeCard.balance.toLocaleString('ru-RU')}
              </span>
              <span className="text-base sm:text-2xl font-black text-amber-600">
                {formatPisikiWord(activeCard.balance)}
              </span>
            </div>

            <div className="text-xs text-zinc-500 mt-2.5 flex flex-wrap items-center gap-2">
              <span>Владелец: <strong className="text-zinc-800">{activeCard.cardHolderName}</strong></span>
              <span className="text-zinc-300">•</span>
              <span className="font-mono text-zinc-700">••• {activeCard.cardNumber.slice(-4)}</span>
              {activeCard.cardType === 'treasury' && (
                <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-amber-100 text-amber-900 border border-amber-300">
                  👑 КАЗНА
                </span>
              )}
            </div>
          </div>

          {/* Action Quick Buttons */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            {/* Admin Treasury Emission Button */}
            {(isSupremeAdmin(currentUser) || currentUser.isEmployee || activeCard.cardType === 'treasury') && (
              <button
                onClick={() => setIsTreasuryAdminOpen(true)}
                className="col-span-2 sm:col-span-1 px-3.5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer active:scale-95 border border-amber-400"
              >
                {isSupremeAdmin(currentUser) ? (
                  <>
                    <Crown className="w-4 h-4 text-zinc-950 shrink-0" />
                    <span>Казна & Эмиссия</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-zinc-950 shrink-0" />
                    <span>Управление Банком</span>
                  </>
                )}
              </button>
            )}

            {/* Transfer Money Button */}
            <button
              onClick={() => setIsTransferOpen(true)}
              className="px-3.5 py-3 rounded-xl bg-zinc-900 hover:bg-black text-white font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Send className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Перевод</span>
            </button>

            {/* Merchant Hub Invoicing Button */}
            <button
              onClick={() => setIsMerchantHubOpen(true)}
              className="px-3.5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Receipt className="w-4 h-4 shrink-0" />
              <span>Счёт</span>
            </button>

            {/* Freeze Account Button (Decree #2) */}
            <button
              onClick={() => setIsFreezeOpen(true)}
              className="px-3.5 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Snowflake className="w-4 h-4 text-sky-200 shrink-0" />
              <span>Заморозка</span>
            </button>

            {/* Credit Button 5% */}
            <button
              onClick={() => setIsCreditOpen(true)}
              className="px-3.5 py-3 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-900 font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Landmark className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Кредит</span>
            </button>
          </div>
        </div>

        {/* Admin Treasury Quick Status Banner (If Admin) */}
        {(isSupremeAdmin(currentUser) || currentUser.isEmployee) && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950 via-zinc-900 to-amber-950 border border-amber-500/40 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-400/40 shrink-0">
                {isSupremeAdmin(currentUser) ? <Crown className="w-6 h-6 text-amber-400" /> : <ShieldCheck className="w-6 h-6 text-amber-400" />}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                    {isSupremeAdmin(currentUser) ? 'ПАНЕЛЬ ВЕРХОВНОГО АДМИНИСТРАТОРА' : 'ПАНЕЛЬ УПРАВЛЕНИЯ БАНКОМ'}
                  </span>
                  <span className="px-2 py-0.2 text-[9px] font-bold rounded-full bg-amber-400/20 text-amber-300">
                    ГОСУДАРСТВЕННЫЙ ДОСТУП
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  {isSupremeAdmin(currentUser) ? 'Казна Государства & Эмиссионный Центр' : 'Система Управления Банком'}
                </h3>
                <p className="text-xs text-zinc-300">
                  {isSupremeAdmin(currentUser) 
                    ? 'Вам доступен выпуск валюты (PUSH) и мониторинг балансов всех граждан Страны писюнов (НЯСР).'
                    : 'Вам доступен мониторинг балансов граждан Страны писюнов (НЯСР) и блокировка счетов.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsTreasuryAdminOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 whitespace-nowrap active:scale-95 transition-all"
            >
              Открыть Реестр →
            </button>
          </div>
        )}

        {/* State Law Inactivity & Freeze Widget */}
        <InactivityStatusWidget
          card={activeCard}
          onOpenFreezeModal={() => setIsFreezeOpen(true)}
          onOpenLawsModal={() => setIsLawsOpen(true)}
          onCardUpdated={handleCardUpdated}
        />

        {/* Two Column Layout: Card Visual View & Card Details / Cards Switcher */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Interactive Card Component */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-800">
                Мои карты
              </h2>
            </div>

            {/* Render Card */}
            <div className="max-w-[420px]">
              <BankCardComponent
                card={activeCard}
                onCopyCardNumber={() => {}}
              />
            </div>

            {/* Card Switcher / Secondary Cards list if multiple */}
            {cards.length > 1 && (
              <div className="grid grid-cols-2 gap-3 max-w-[420px] pt-4">
                {cards.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCard(c)}
                    className={`p-3.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                      activeCard.id === c.id
                        ? 'border-zinc-900 bg-zinc-50 text-zinc-900 shadow-sm ring-1 ring-zinc-900'
                        : 'border-zinc-200 hover:border-zinc-300 text-zinc-600 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${c.color === 'black' ? 'bg-zinc-900' : 'bg-zinc-200 border border-zinc-300'}`} />
                        {c.color === 'black' ? 'ЧЕРНАЯ' : 'БЕЛАЯ'}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-400">{c.cardNumber.slice(-4)}</span>
                    </div>
                    <div className="text-zinc-900 text-sm">{formatPisiki(c.balance)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Bank Card Attributes & Quick Actions Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-zinc-900">
                  Реквизиты
                </h3>
                <div className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Активна</span>
                </div>
              </div>

              {/* Details List (More minimal than grid) */}
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                  <span className="text-zinc-500">Тип</span>
                  <span className="font-semibold text-zinc-900">
                    {activeCard.cardType === 'business' ? 'Бизнес' : 'Стандарт'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                  <span className="text-zinc-500">Номер</span>
                  <span className="font-mono font-medium text-zinc-900">{activeCard.cardNumber}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                  <span className="text-zinc-500">Срок действия</span>
                  <span className="font-mono font-medium text-zinc-900">{activeCard.issueDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">CVC</span>
                  <span className="font-mono font-medium text-zinc-900">{activeCard.cvv}</span>
                </div>
              </div>
            </div>

            {/* API & Acquiring Banner */}
            <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col gap-3">
              <div className="flex items-center space-x-2 text-sm font-bold text-zinc-900">
                <Building2 className="w-4 h-4 text-amber-500" />
                <span>Эквайринг & Инструменты Продавца</span>
              </div>
              <p className="text-xs text-zinc-500">
                Выставляйте счета по ссылкам, генерируйте виджеты оплаты для сайтов и отслеживайте аналитику выручки.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => setIsMerchantHubOpen(true)}
                  className="py-2.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-extrabold text-xs transition-colors cursor-pointer text-center"
                >
                  Кабинет продавца
                </button>
                <button
                  onClick={() => setIsApiDocsOpen(true)}
                  className="py-2.5 px-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-900 font-semibold text-xs transition-colors cursor-pointer text-center"
                >
                  API Документация
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History Section */}
        <TransactionList
          transactions={transactions}
          onRefresh={() => fetchTransactions(activeCard.cardNumber)}
          loading={txLoading}
        />
      </main>

      {/* Footer */}
      <footer className="bg-[#FAFAFA] text-zinc-400 text-xs py-8 border-t border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-zinc-300" />
            <span className="font-bold text-zinc-600">Писюн Банк</span>
            <span>— Страна писюнов (НЯСР)</span>
          </div>

          <div className="text-[11px] flex flex-wrap items-center gap-2">
            <span>Лицензия №1</span>
            <span>•</span>
            <span className="text-emerald-600 font-medium flex items-center gap-1">
              <Database className="w-3 h-3" /> Firebase
            </span>
            <span>•</span>
            <span>REST API v1.0</span>
            <span>•</span>
            <span>Ставка 5%</span>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Bottom Navigation Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200/90 py-2 px-3 sm:hidden shadow-lg flex items-center justify-around">
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex flex-col items-center justify-center text-zinc-700 hover:text-zinc-900 active:scale-95 transition-transform"
        >
          <Wallet className="w-5 h-5 text-amber-500" />
          <span className="text-[10px] font-bold mt-0.5">Главная</span>
        </button>

        <button
          onClick={() => setIsTransferOpen(true)}
          className="flex flex-col items-center justify-center text-zinc-700 hover:text-zinc-900 active:scale-95 transition-transform"
        >
          <Send className="w-5 h-5 text-zinc-800" />
          <span className="text-[10px] font-bold mt-0.5">Перевод</span>
        </button>

        <button
          onClick={() => setIsMerchantHubOpen(true)}
          className="flex flex-col items-center justify-center text-zinc-700 hover:text-zinc-900 active:scale-95 transition-transform"
        >
          <Building2 className="w-5 h-5 text-amber-600" />
          <span className="text-[10px] font-bold mt-0.5">Эквайринг</span>
        </button>

        <button
          onClick={() => setIsSecurityOpen(true)}
          className="flex flex-col items-center justify-center text-zinc-700 hover:text-zinc-900 active:scale-95 transition-transform"
        >
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span className="text-[10px] font-bold mt-0.5">Защита</span>
        </button>

        <button
          onClick={() => setIsApiDocsOpen(true)}
          className="flex flex-col items-center justify-center text-zinc-700 hover:text-zinc-900 active:scale-95 transition-transform"
        >
          <Code className="w-5 h-5 text-zinc-900" />
          <span className="text-[10px] font-bold mt-0.5">API</span>
        </button>
      </div>

      {/* Modals */}
      <TransferModal
        card={activeCard}
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        onTransferSuccess={handleCardUpdated}
      />

      <CreditModal
        card={activeCard}
        isOpen={isCreditOpen}
        onClose={() => setIsCreditOpen(false)}
        onCreditSuccess={handleCardUpdated}
      />

      <ApiDocsModal
        isOpen={isApiDocsOpen}
        onClose={() => setIsApiDocsOpen(false)}
        userCardNumber={activeCard.cardNumber}
        userCvv={activeCard.cvv}
      />

      <SecurityModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
      />

      <FreezeModal
        card={activeCard}
        isOpen={isFreezeOpen}
        onClose={() => setIsFreezeOpen(false)}
        onFreezeSuccess={handleCardUpdated}
      />

      <LawsModal
        isOpen={isLawsOpen}
        onClose={() => setIsLawsOpen(false)}
        onOpenFreezeModal={() => {
          setIsLawsOpen(false);
          setIsFreezeOpen(true);
        }}
      />

      {/* Admin Treasury & Currency Emission Modal */}
      <AdminTreasuryModal
        isOpen={isTreasuryAdminOpen}
        onClose={() => setIsTreasuryAdminOpen(false)}
        currentUser={currentUser}
        onEmissionSuccess={() => {
          if (currentUser) {
            fetchUserCards(currentUser.id);
          }
          if (activeCard) {
            fetchTransactions(activeCard.cardNumber);
          }
        }}
      />

      <MerchantHubModal
        isOpen={isMerchantHubOpen}
        onClose={() => setIsMerchantHubOpen(false)}
        userCards={cards}
        activeCard={activeCard}
        onOpenTestInvoice={(invId) => setInvoiceIdToPay(invId)}
      />

      <CheckoutModal
        invoiceId={invoiceIdToPay}
        onClose={() => setInvoiceIdToPay(null)}
        currentUserCard={activeCard}
        onPaymentSuccess={() => {
          fetchUserCards(currentUser.id);
          fetchTransactions(activeCard.cardNumber);
        }}
      />

      {/* Express Redirect Payment Modal */}
      {expressPayData && (
        <ExpressCheckoutModal
          data={expressPayData}
          currentUser={currentUser}
          userCards={cards}
          activeCard={activeCard}
          onClose={() => setExpressPayData(null)}
          onPaymentSuccess={(updatedCard) => {
            handleCardUpdated(updatedCard);
          }}
        />
      )}

      {/* Additional Card Issuance Modal */}
      {isNewCardModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl">
            <button
              onClick={() => setIsNewCardModalOpen(false)}
              className="absolute top-4 right-4 z-10 text-white/80 hover:text-white bg-black/40 p-2 rounded-full"
            >
              ✕
            </button>
            <RegistrationFlow
              onRegisterSuccess={handleRegisterSuccess}
              isAdditionalCard={true}
              currentUser={currentUser}
              onClose={() => setIsNewCardModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 z-40 px-2 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
        <button 
          onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
          className="flex flex-col items-center justify-center flex-1 py-3 text-zinc-900"
        >
          <Wallet className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-semibold">Счет</span>
        </button>
        {(isSupremeAdmin(currentUser) || currentUser?.isEmployee) && (
          <button 
            onClick={() => setIsTreasuryAdminOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-3 text-amber-600 font-bold"
          >
            {isSupremeAdmin(currentUser) ? (
              <Crown className="w-5 h-5 mb-1 text-amber-500" />
            ) : (
              <ShieldCheck className="w-5 h-5 mb-1 text-amber-500" />
            )}
            <span className="text-[10px]">{isSupremeAdmin(currentUser) ? 'Казна' : 'Управление'}</span>
          </button>
        )}
        <button 
          onClick={() => setIsTransferOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-3 text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <Send className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-semibold">Перевод</span>
        </button>
        <button 
          onClick={() => setIsCreditOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-3 text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <Landmark className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-semibold">Кредит</span>
        </button>
        <button 
          onClick={() => setIsSecurityOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-3 text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ShieldCheck className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-semibold">Защита</span>
        </button>
        <button 
          onClick={() => setIsApiDocsOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-3 text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <Code className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-semibold">API</span>
        </button>
      </div>
    </div>
  );
}
