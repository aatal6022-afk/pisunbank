import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Scroll,
  Snowflake,
  ShieldCheck,
  Scale,
  Percent,
  Calendar,
  AlertCircle,
  HelpCircle,
  X,
  Play,
  CheckCircle,
} from 'lucide-react';
import { BankCard } from '../types';

interface LawsModalProps {
  isOpen: boolean;
  onClose: () => void;
  card?: BankCard;
  onOpenFreezeModal: () => void;
  onSimulateInactivity?: () => void;
}

export const LawsModal: React.FC<LawsModalProps> = ({
  isOpen,
  onClose,
  card,
  onOpenFreezeModal,
  onSimulateInactivity,
}) => {
  const [activeTab, setActiveTab] = useState<'tax' | 'freeze'>('tax');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden"
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md">
              <Scale className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-amber-200 font-extrabold flex items-center gap-1.5">
                <span>Законодательство Страны писюнов (НЯСР)</span>
                <span className="w-1 h-1 rounded-full bg-amber-300"></span>
                <span>Писюн Банк</span>
              </div>
              <h2 className="text-xl font-black text-white">Законы & Указы Государства</h2>
            </div>
          </div>
          <p className="text-xs text-amber-100/90 leading-relaxed">
            Официальные нормы экономической политики: Налог на бездействие валюты МУР и Указ №2 о заморозке счетов.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 bg-zinc-50 px-6 pt-3 gap-3">
          <button
            onClick={() => setActiveTab('tax')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'tax'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Закон о налоге 7% на бездействие</span>
          </button>

          <button
            onClick={() => setActiveTab('freeze')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'freeze'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Snowflake className="w-3.5 h-3.5" />
            <span>Указ №2: Заморозка счетов ❄️</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5 text-sm text-zinc-700">
          {activeTab === 'tax' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
                <h3 className="text-sm font-extrabold text-amber-900 mb-1 flex items-center gap-2">
                  <Scroll className="w-4 h-4 text-amber-700" />
                  Закон о налоговой ответственности средств
                </h3>
                <p className="text-xs text-amber-800 leading-relaxed">
                  В соответствии с экономической политикой Страны писюнов (НЯСР), Писюн Банк вводит налог на бездействие валюты (PUSH).
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-1.5">
                  <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <span className="p-1 rounded-md bg-amber-100 text-amber-800 font-extrabold text-[10px]">1</span>
                    <span>Что это значит?</span>
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed pl-6">
                    Если в течение <strong>7 (семи) календарных дней</strong> ваши средства на счете остаются нетронутыми (не было ни трат, ни пополнений, ни переводов), то Писюн Банк автоматически списывает <strong>7% от суммы</strong> в пользу Казны Страны писюнов (НЯСР).
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-1.5">
                  <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <span className="p-1 rounded-md bg-amber-100 text-amber-800 font-extrabold text-[10px]">2</span>
                    <span>Зачем это нужно?</span>
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed pl-6">
                    Чтобы деньги работали, экономика двигалась, а Страна писюнов (НЯСР) процветала! Не держите сбережения «мертвым грузом».
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-2">
                  <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <span className="p-1 rounded-md bg-amber-100 text-amber-800 font-extrabold text-[10px]">3</span>
                    <span>Как избежать списания налога?</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6 text-xs text-zinc-600">
                    <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                      💳 Совершать покупки у продавцов и торговцев
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                      🔄 Переводить средства друзьям и партнерам
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                      📚 Покупать книги в государственной библиотеке
                    </div>
                    <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-900 font-semibold">
                      ❄️ Заморозить счет на срок от 14 дней (Указ №2)
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onOpenFreezeModal();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Snowflake className="w-4 h-4" />
                  <span>Заморозить счет (Защита от налога)</span>
                </button>

                {onSimulateInactivity && (
                  <button
                    onClick={() => {
                      onSimulateInactivity();
                    }}
                    className="py-3 px-4 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Симулировать 7 дней отсутствия активности для проверки списания налога"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Симулировать 7 дней (Тест закона)</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200">
                <h3 className="text-sm font-extrabold text-sky-950 mb-1 flex items-center gap-2">
                  <Snowflake className="w-4 h-4 text-sky-600" />
                  ❄️ УКАЗ НЯСР №2: О ЗАМОРОЗКЕ СЧЕТОВ В БАНКЕ НОМЕР ОДИН В НЯСР
                </h3>
                <p className="text-xs text-sky-800 leading-relaxed">
                  Официальное положение о временной консервации банковских активов граждан и юридических лиц.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-sky-100 bg-sky-50/30 space-y-1.5">
                  <div className="text-xs font-bold text-sky-950 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-black">1</span>
                    <span>Минимальный срок заморозки — от 14 календарных дней</span>
                  </div>
                  <p className="text-xs text-zinc-600 pl-7 leading-relaxed">
                    Заморозить игровой счет можно только на срок <strong>от 14 дней и более</strong> (14, 21, 30, 60, 90 дней). Краткосрочная заморозка не предусмотрена государством.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-sky-100 bg-sky-50/30 space-y-1.5">
                  <div className="text-xs font-bold text-sky-950 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-black">2</span>
                    <span>Правила в период заморозки</span>
                  </div>
                  <ul className="text-xs text-zinc-600 pl-7 space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Налог на бездействие (7%) НЕ взимается</strong> — средства полностью защищены.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-rose-600 font-bold">✗</span>
                      <span><strong>Все операции по счету ЗАБЛОКИРОВАНЫ</strong> (переводы, оплаты счетов, кредиты).</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1.5">
                  <div className="text-xs font-bold text-amber-950 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-black">3</span>
                    <span>ДОСРОЧНАЯ РАЗМОРОЗКА ЗАПРЕЩЕНА</span>
                  </div>
                  <p className="text-xs text-amber-900 pl-7 leading-relaxed font-medium">
                    Счет откроется автоматически <strong>ровно через 14 (или выбранное вами число) дней</strong>. Никакие запросы в поддержку или досрочные отмены не принимаются в соответствии с Указом №2.
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    onClose();
                    onOpenFreezeModal();
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-sky-600/20"
                >
                  <Snowflake className="w-4 h-4" />
                  <span>Перейти к заморозке счета</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 text-center">
          <button
            onClick={onClose}
            className="text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
          >
            Закрыть окно
          </button>
        </div>
      </motion.div>
    </div>
  );
};
