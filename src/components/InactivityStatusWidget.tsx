import React, { useEffect, useState } from 'react';
import {
  Snowflake,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Scale,
  Sparkles,
  Info,
  Calendar,
  Lock,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { BankCard, InactivityTaxStatus } from '../types';
import { formatPisiki } from '../utils/formatCurrency';

interface InactivityStatusWidgetProps {
  card: BankCard;
  onOpenFreezeModal: () => void;
  onOpenLawsModal: () => void;
  onCardUpdated: (card: BankCard) => void;
}

export const InactivityStatusWidget: React.FC<InactivityStatusWidgetProps> = ({
  card,
  onOpenFreezeModal,
  onOpenLawsModal,
  onCardUpdated,
}) => {
  const [taxStatus, setTaxStatus] = useState<InactivityTaxStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simMsg, setSimMsg] = useState<string | null>(null);

  const fetchTaxStatus = async () => {
    try {
      const res = await fetch(`/api/cards/tax-status/${card.cardNumber}`);
      const data = await res.json();
      if (data.success && data.status) {
        setTaxStatus(data.status);
      }
    } catch (e) {
      console.error('Failed to fetch tax status', e);
    }
  };

  useEffect(() => {
    fetchTaxStatus();
  }, [card.id, card.balance, card.lastActivityDate, card.isFrozen, card.status]);

  const handleSimulateInactivity = async () => {
    setSimulating(true);
    setSimMsg(null);
    try {
      const res = await fetch('/api/cards/simulate-inactivity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id, days: 7 }),
      });
      const data = await res.json();
      if (data.success && data.updatedCard) {
        onCardUpdated(data.updatedCard);
        setSimMsg(data.message);
        fetchTaxStatus();
      } else {
        setSimMsg(data.message || 'Ошибка симуляции');
      }
    } catch (err: any) {
      setSimMsg(err.message);
    } finally {
      setSimulating(false);
      setTimeout(() => setSimMsg(null), 6000);
    }
  };

  const isFrozen = card.isFrozen || card.status === 'frozen';
  const daysInactive = taxStatus?.daysInactive ?? 0;
  const daysLeft = Math.max(0, 7 - daysInactive);
  const progressPercent = Math.min(100, Math.round((daysInactive / 7) * 100));

  if (isFrozen) {
    const frozenUntil = card.frozenUntil ? new Date(card.frozenUntil) : null;
    return (
      <div className="rounded-3xl p-5 bg-gradient-to-r from-sky-950 via-slate-900 to-cyan-950 border border-sky-500/30 text-white shadow-md relative overflow-hidden">
        {/* Frost decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 rounded-2xl bg-sky-500/20 border border-sky-400/40 text-sky-300 backdrop-blur-sm shrink-0 mt-0.5">
              <Snowflake className="w-6 h-6 animate-spin-slow" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-sky-500/30 text-sky-200 text-[10px] font-extrabold tracking-wider uppercase border border-sky-400/40">
                  ❄️ Указ №2: Счет Заморожен
                </span>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Налог 7% ОТКЛЮЧЕН
                </span>
              </div>
              <h4 className="text-sm font-black text-white">
                Защита от налога активна до{' '}
                {frozenUntil ? frozenUntil.toLocaleDateString('ru-RU') : 'конца срока'}
              </h4>
              <p className="text-xs text-sky-200/80 leading-tight">
                Все операции заблокированы. Досрочная разморозка запрещена Законом Страны писюнов (НЯСР).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenFreezeModal}
              className="py-2.5 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-sky-300" />
              <span>Детали заморозки</span>
            </button>
            <button
              onClick={onOpenLawsModal}
              className="py-2.5 px-3.5 rounded-xl bg-sky-500/30 hover:bg-sky-500/40 text-sky-100 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Scale className="w-3.5 h-3.5 text-sky-300" />
              <span>Указ №2</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl p-5 bg-white border border-zinc-200/90 shadow-sm space-y-4">
      {/* Simulation toast if active */}
      {simMsg && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{simMsg}</span>
          </div>
          <button onClick={() => setSimMsg(null)} className="text-amber-700 hover:text-amber-900">
            ✕
          </button>
        </div>
      )}

      {/* Main Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div
            className={`p-2.5 rounded-2xl shrink-0 ${
              daysInactive >= 5
                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                : daysInactive >= 3
                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
            }`}
          >
            {daysInactive >= 5 ? (
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            ) : daysInactive >= 3 ? (
              <Clock className="w-5 h-5" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                Закон об ответственности средств
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                Налог 7%
              </span>
            </div>
            <div className="text-sm font-extrabold text-zinc-900">
              {daysInactive === 0 ? (
                <span>Счет активен (движения зафиксированы)</span>
              ) : (
                <span>Дней без движения: {daysInactive} из 7</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenFreezeModal}
            className="py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            title="Заморозить счет по Указу №2 для защиты от налога"
          >
            <Snowflake className="w-3.5 h-3.5 text-sky-600" />
            <span>Заморозить счет (Указ №2)</span>
          </button>

          <button
            onClick={onOpenLawsModal}
            className="py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Scale className="w-3.5 h-3.5 text-zinc-600" />
            <span>Закон & Правила</span>
          </button>

          <button
            onClick={handleSimulateInactivity}
            disabled={simulating}
            className="py-2 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
            title="Тест закона: смоделировать 7 дней неактивности"
          >
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>{simulating ? 'Тест...' : 'Тест 7 дней'}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar & Countdown */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-zinc-500">
            {daysLeft > 0 ? (
              <>До списания 7% налога на бездействие: <strong className="text-zinc-900">{daysLeft} дн.</strong></>
            ) : (
              <span className="text-rose-600 font-bold">Срок 7 дней истек — налог подлежит списанию</span>
            )}
          </span>
          <span className="text-zinc-500">
            Ставка: <strong className="text-amber-700">7%</strong>
            {card.balance > 0 && ` (≈ ${formatPisiki(Math.max(1, Math.round(card.balance * 0.07)))})`}
          </span>
        </div>

        <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden p-0.5 border border-zinc-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressPercent >= 80
                ? 'bg-rose-500'
                : progressPercent >= 40
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.max(5, progressPercent)}%` }}
          ></div>
        </div>

        <div className="flex justify-between text-[10px] text-zinc-400 pt-0.5">
          <span>День 0 (Активность)</span>
          <span>День 3.5</span>
          <span>День 7 (Списание 7% в казну)</span>
        </div>
      </div>
    </div>
  );
};
