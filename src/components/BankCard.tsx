import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Check, ShieldCheck, Sparkles, Snowflake, Lock, Crown, Landmark, CreditCard as CardIcon } from 'lucide-react';
import { BankCard as BankCardType } from '../types';

interface BankCardProps {
  card: BankCardType;
  onCopyCardNumber?: () => void;
}

export const BankCardComponent: React.FC<BankCardProps> = ({ card, onCopyCardNumber }) => {
  const [showCvv, setShowCvv] = useState(false);
  const [copied, setCopied] = useState(false);

  const isFrozen = card.isFrozen || card.status === 'frozen';
  const isTreasury = card.cardType === 'treasury' || card.color === 'gold' || card.cardNumber === '450000000001';
  const isBlack = card.color === 'black' || card.cardType === 'business';

  const formatCardNumber = (num: string) => {
    const clean = num.replace(/\s+/g, '');
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(card.cardNumber);
    setCopied(true);
    if (onCopyCardNumber) onCopyCardNumber();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative group w-full max-w-md mx-auto aspect-[1.586/1] rounded-2xl p-6 sm:p-7 shadow-xl transition-all duration-300 transform hover:-translate-y-1 select-none overflow-hidden ${
      isFrozen
        ? 'ring-2 ring-sky-400/80 shadow-sky-500/10'
        : isTreasury
        ? 'ring-2 ring-amber-400/90 shadow-amber-500/20'
        : ''
    }`}>
      {/* Background Texture & Styles */}
      {isFrozen ? (
        // FROZEN FROST CARD DESIGN
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 text-white border border-sky-400/40">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#bae6fd_1px,transparent_1px)] [background-size:14px_14px]" />
          <div className="absolute -right-16 -bottom-16 w-60 h-60 bg-sky-500/20 rounded-full blur-2xl" />
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-80" />
        </div>
      ) : isTreasury ? (
        // IMPERIAL GOLD TREASURY CARD DESIGN
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-zinc-900 to-amber-900 text-amber-50 border border-amber-400/60 shadow-2xl">
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#fde047_1px,transparent_1px)] [background-size:14px_14px]" />
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-amber-500/30 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-200 to-amber-600 opacity-90" />
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-yellow-400/10 rounded-full blur-xl" />
        </div>
      ) : isBlack ? (
        // BLACK BUSINESS CARD DESIGN
        <div className="absolute inset-0 bg-zinc-950 text-white border border-zinc-800">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-zinc-800 rounded-full blur-3xl opacity-50" />
        </div>
      ) : (
        // WHITE REGULAR CARD DESIGN
        <div className="absolute inset-0 bg-white text-zinc-900 border border-zinc-200">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-zinc-100 rounded-full blur-3xl" />
        </div>
      )}

      {/* Card Content Overlay */}
      <div className="relative z-10 h-full flex flex-col justify-between">
        {/* Top Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={`p-1.5 rounded-lg ${
                isFrozen
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                  : isTreasury
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50'
                  : isBlack
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'bg-zinc-100 text-zinc-900 border border-zinc-200'
              }`}
            >
              {isFrozen ? (
                <Snowflake className="w-5 h-5 animate-spin-slow" />
              ) : isTreasury ? (
                <Crown className="w-5 h-5 text-amber-300 animate-pulse" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <div
                className={`text-[10px] font-bold tracking-widest uppercase ${
                  isFrozen
                    ? 'text-sky-300'
                    : isTreasury
                    ? 'text-amber-300/90'
                    : isBlack
                    ? 'text-zinc-400'
                    : 'text-zinc-500'
                }`}
              >
                {isTreasury ? 'КАЗНА • МИНФИН НЯСР' : 'СТРАНА ПИСЮНОВ • НЯСР'}
              </div>
              <div
                className={`text-sm font-extrabold tracking-tight ${
                  isFrozen || isBlack || isTreasury ? 'text-white' : 'text-zinc-900'
                }`}
              >
                {isTreasury ? 'ПИСЮН БАНК • КАЗНА' : 'ПИСЮН БАНК'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {isFrozen ? (
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider rounded-full uppercase bg-sky-500/30 text-sky-200 border border-sky-400/50 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> ЗАМОРОЖЕНА
              </span>
            ) : isTreasury ? (
              <span className="px-2.5 py-0.5 text-[10px] font-black tracking-wider rounded-full uppercase bg-amber-400/25 text-amber-200 border border-amber-300/60 shadow-sm flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-300" /> КАЗНА ГОСУДАРСТВА
              </span>
            ) : card.cardType === 'business' ? (
              <span className={`px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider rounded-full uppercase ${isBlack ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' : 'bg-zinc-100 text-zinc-600'}`}>
                BUSINESS
              </span>
            ) : (
              <span className={`px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider rounded-full uppercase ${isBlack ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' : 'bg-zinc-100 text-zinc-600'}`}>
                CITIZEN
              </span>
            )}
          </div>
        </div>

        {/* Chip & NFC Icon Row */}
        <div className="flex items-center justify-between my-2">
          <div className="flex items-center space-x-3">
            {/* SIM / Chip */}
            <div
              className={`w-10 h-7 rounded-md relative overflow-hidden border ${
                isFrozen
                  ? 'bg-sky-900 border-sky-400/50'
                  : isTreasury
                  ? 'bg-amber-800 border-amber-400/80 shadow-sm'
                  : isBlack
                  ? 'bg-zinc-700 border-zinc-600'
                  : 'bg-zinc-200 border-zinc-300'
              } flex flex-col justify-around p-1`}
            >
              <div className={`w-full h-[1px] ${isFrozen ? 'bg-sky-500' : isTreasury ? 'bg-amber-300' : isBlack ? 'bg-zinc-600' : 'bg-zinc-300'}`} />
              <div className={`w-full h-[1px] ${isFrozen ? 'bg-sky-500' : isTreasury ? 'bg-amber-300' : isBlack ? 'bg-zinc-600' : 'bg-zinc-300'}`} />
              <div className={`absolute left-1/2 top-0 bottom-0 w-[1px] ${isFrozen ? 'bg-sky-500' : isTreasury ? 'bg-amber-300' : isBlack ? 'bg-zinc-600' : 'bg-zinc-300'}`} />
            </div>
            {/* NFC Waves */}
            <svg
              className={`w-5 h-5 ${isFrozen ? 'text-sky-400' : isTreasury ? 'text-amber-400' : isBlack ? 'text-zinc-500' : 'text-zinc-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.117 10.325a5 5 0 010 3.35M10.95 8.11a8 8 0 010 7.78M13.78 5.895a11 11 0 010 12.21"
              />
            </svg>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            title="Скопировать номер карты"
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              isFrozen
                ? 'bg-sky-900/60 hover:bg-sky-800 text-sky-100 border border-sky-400/30'
                : isTreasury
                ? 'bg-amber-900/70 hover:bg-amber-800 text-amber-200 border border-amber-400/40'
                : isBlack
                ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200'
            }`}
          >
            {copied ? (
              <>
                <Check className={`w-3.5 h-3.5 ${isFrozen || isBlack || isTreasury ? 'text-white' : 'text-zinc-800'}`} />
                <span className={`text-[11px] font-semibold ${isFrozen || isBlack || isTreasury ? 'text-white' : 'text-zinc-800'}`}>Скопировано</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[11px]">Номер</span>
              </>
            )}
          </button>
        </div>

        {/* 12-Digit Card Number */}
        <div className="my-1">
          <div
            className={`font-mono text-xl sm:text-2xl font-bold tracking-[0.18em] ${
              isFrozen
                ? 'text-sky-100 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                : isTreasury
                ? 'text-amber-100 drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]'
                : isBlack
                ? 'text-white drop-shadow'
                : 'text-zinc-900 drop-shadow-sm'
            }`}
          >
            {formatCardNumber(card.cardNumber)}
          </div>
        </div>

        {/* Bottom Details Row */}
        <div className="flex items-end justify-between pt-2 border-t border-current/10">
          {/* Cardholder Name */}
          <div className="max-w-[65%]">
            <div
              className={`text-[9px] uppercase tracking-wider font-semibold ${
                isFrozen ? 'text-sky-300/80' : isTreasury ? 'text-amber-300/80' : isBlack ? 'text-zinc-400' : 'text-zinc-500'
              }`}
            >
              ДЕРЖАТЕЛЬ КАРТЫ
            </div>
            <div
              className={`text-sm font-bold tracking-wide truncate ${
                isFrozen || isBlack || isTreasury ? 'text-white' : 'text-zinc-900'
              }`}
            >
              {card.cardHolderName || (isTreasury ? 'КАЗНА НЯСР' : 'ГРАЖДАНИН НЯСР')}
            </div>
          </div>

          {/* Issue Date & CVV */}
          <div className="flex items-center space-x-4">
            <div>
              <div
                className={`text-[9px] uppercase tracking-wider font-semibold ${
                  isFrozen ? 'text-sky-300/80' : isTreasury ? 'text-amber-300/80' : isBlack ? 'text-zinc-400' : 'text-zinc-500'
                }`}
              >
                СОЗДАНА
              </div>
              <div
                className={`text-xs font-mono font-bold ${
                  isFrozen || isBlack || isTreasury ? 'text-white' : 'text-zinc-900'
                }`}
              >
                {card.issueDate}
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-1">
                <span
                  className={`text-[9px] uppercase tracking-wider font-semibold ${
                    isFrozen ? 'text-sky-300/80' : isTreasury ? 'text-amber-300/80' : isBlack ? 'text-zinc-400' : 'text-zinc-500'
                  }`}
                >
                  CVV
                </span>
                <button
                  type="button"
                  onClick={() => setShowCvv(!showCvv)}
                  className="focus:outline-none"
                  title="Показать/скрыть CVV"
                >
                  {showCvv ? (
                    <EyeOff className="w-3 h-3 text-zinc-400 hover:text-zinc-500" />
                  ) : (
                    <Eye className="w-3 h-3 text-zinc-400 hover:text-zinc-500" />
                  )}
                </button>
              </div>
              <div
                className={`text-xs font-mono font-bold ${
                  isFrozen ? 'text-sky-200' : isTreasury ? 'text-amber-200' : isBlack ? 'text-zinc-200' : 'text-zinc-900'
                }`}
              >
                {showCvv ? card.cvv : '•••'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

