import React from 'react';
import { ShieldCheck, Code, PlusCircle, LogOut, UserCheck, Database, Building2, Scale, Snowflake, Crown, Landmark } from 'lucide-react';
import { User, BankCard } from '../types';

interface HeaderProps {
  user: User;
  activeCard?: BankCard;
  allCards: BankCard[];
  onSelectCard: (card: BankCard) => void;
  onOpenApiDocs: () => void;
  onOpenSecurity: () => void;
  onOpenMerchantHub: () => void;
  onOpenNewCardFlow: () => void;
  onOpenLaws?: () => void;
  onOpenFreeze?: () => void;
  onOpenTreasuryAdmin?: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeCard,
  allCards,
  onSelectCard,
  onOpenApiDocs,
  onOpenSecurity,
  onOpenMerchantHub,
  onOpenNewCardFlow,
  onOpenLaws,
  onOpenFreeze,
  onOpenTreasuryAdmin,
  onLogout,
}) => {
  const isFrozen = activeCard?.isFrozen || activeCard?.status === 'frozen';
  const isTreasury = activeCard?.cardType === 'treasury' || activeCard?.color === 'gold' || activeCard?.cardNumber === '450000000001';
  const isSupremeAdmin = user.email === 'aatal6022@gmail.com' || user.email === 'pinkiscammerinfo@gmail.com' || Boolean(user.isAdmin);
  const isAdmin = user.isAdmin || isSupremeAdmin;
  const isStaff = isAdmin || user.isEmployee;

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        {/* Left: Bank Identity */}
        <div className="flex items-center space-x-2.5">
          <div className={`p-2 sm:p-2.5 rounded-xl text-white font-black flex items-center justify-center shrink-0 ${
            isFrozen
              ? 'bg-sky-950 border border-sky-400/40 text-sky-300'
              : isTreasury
              ? 'bg-amber-950 border border-amber-400/60 text-amber-300 shadow-md shadow-amber-500/20'
              : 'bg-zinc-900'
          }`}>
            {isFrozen ? (
              <Snowflake className="w-4 h-4 sm:w-5 sm:h-5 animate-spin-slow" />
            ) : isTreasury ? (
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
            ) : (
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[9px] sm:text-[10px] font-extrabold tracking-widest text-zinc-500 uppercase">
                СТРАНА ПИСЮНОВ • НЯСР
              </span>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                  <Crown className="w-2.5 h-2.5 text-amber-700" />
                  Администратор
                </span>
              )}
              {!isAdmin && isStaff && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-700" />
                  Сотрудник
                </span>
              )}
              {isFrozen && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-800 bg-sky-100 border border-sky-300 px-2 py-0.5 rounded-full">
                  ❄️ Заморожена
                </span>
              )}
            </div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-zinc-900 leading-tight flex items-center gap-2">
              Писюн Банк
              {isTreasury && (
                <span className="text-xs font-extrabold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  КАЗНА
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* Right Controls & Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Cards Quick Selector Dropdown on mobile & desktop */}
          {allCards.length > 1 && (
            <select
              value={activeCard?.id}
              onChange={(e) => {
                const found = allCards.find((c) => c.id === e.target.value);
                if (found) onSelectCard(found);
              }}
              className="bg-zinc-100 sm:bg-zinc-50 border border-zinc-200 text-[11px] sm:text-xs font-bold text-zinc-800 py-1.5 px-2 sm:px-3 rounded-lg focus:outline-none focus:border-zinc-400 max-w-[120px] sm:max-w-none truncate"
            >
              {allCards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.cardType === 'treasury' || c.cardNumber === '450000000001'
                    ? '👑 КАЗНА (ЗОЛОТАЯ)'
                    : c.isFrozen
                    ? '❄️ ЗАМОРОЖЕНА'
                    : c.cardType === 'business'
                    ? '⚫ ЧЕРНАЯ'
                    : '⚪ БЕЛАЯ'} (*{c.cardNumber.slice(-4)})
                </option>
              ))}
            </select>
          )}

          {/* Admin/Staff Treasury Button */}
          {(isStaff || isTreasury) && onOpenTreasuryAdmin && (
            <button
              onClick={onOpenTreasuryAdmin}
              title={isSupremeAdmin ? "Государственная Казна и Эмиссия Валюты" : "Управление Банком"}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 border border-amber-400 text-xs font-black transition-all cursor-pointer shadow-md shadow-amber-500/20"
            >
              <Crown className="w-4 h-4 text-zinc-950" />
              <span>{isSupremeAdmin ? 'Казна & Эмиссия' : 'Управление Банком'}</span>
            </button>
          )}

          {/* Laws & Decrees Button */}
          {onOpenLaws && (
            <button
              onClick={onOpenLaws}
              title="Законы Страны писюнов (НЯСР): Налог 7% и Указ №2"
              className="hidden md:inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-amber-50/80 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Scale className="w-4 h-4 text-amber-700" />
              <span>Законы НЯСР</span>
            </button>
          )}

          {/* Freeze Account Button */}
          {onOpenFreeze && (
            <button
              onClick={onOpenFreeze}
              title="Заморозка счета по Указу №2"
              className={`hidden sm:inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer shadow-sm ${
                isFrozen
                  ? 'bg-sky-100 text-sky-900 border-sky-300 hover:bg-sky-200'
                  : 'bg-sky-50/80 hover:bg-sky-100 text-sky-900 border-sky-200'
              }`}
            >
              <Snowflake className="w-4 h-4 text-sky-600" />
              <span>{isFrozen ? 'Счет заморожен' : 'Заморозка'}</span>
            </button>
          )}

          {/* Issue New Card Button */}
          <button
            onClick={onOpenNewCardFlow}
            title="Выпустить ещё карту"
            className="hidden lg:inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold transition-all border border-zinc-200 cursor-pointer shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-zinc-500" />
            <span>Новая карта</span>
          </button>

          {/* Merchant Acquiring Hub Button */}
          <button
            onClick={onOpenMerchantHub}
            title="Кабинет Продавца и Эквайринг Банка номер один в НЯСР"
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Building2 className="w-4 h-4 text-amber-600" />
            <span className="hidden md:inline">Эквайринг</span>
          </button>

          {/* Security Center Button */}
          <button
            onClick={onOpenSecurity}
            title="Центр Безопасности Банка номер один в НЯСР"
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Защита</span>
          </button>

          {/* API Developer Button */}
          <button
            onClick={onOpenApiDocs}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-black text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <Code className="w-4 h-4" />
            <span className="hidden sm:inline">API</span>
          </button>

          {/* User Profile info */}
          <div className="flex items-center space-x-2 pl-2 sm:pl-3 ml-1 sm:ml-2 border-l border-zinc-200">
            <img
              src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
              alt={user.name}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border shrink-0 ${
                isAdmin ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-zinc-200'
              }`}
            />
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-zinc-900 leading-tight">
                {user.gameNickname || user.name}
              </div>
              <div className="text-[10px] text-zinc-500 flex items-center space-x-1 mt-0.5">
                {isAdmin ? (
                  <span className="text-amber-700 font-bold flex items-center gap-0.5">
                    <Crown className="w-3 h-3 text-amber-600 inline" />
                    Администратор
                  </span>
                ) : isStaff ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 inline" />
                    Сотрудник Банка
                  </span>
                ) : (
                  <>
                    <UserCheck className="w-3 h-3 text-zinc-400 inline" />
                    <span>Гражданин</span>
                  </>
                )}
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              title="Выйти из аккаунта"
              className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

