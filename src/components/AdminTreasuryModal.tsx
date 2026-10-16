import React, { useState, useEffect } from 'react';
import {
  Crown,
  Landmark,
  Coins,
  TrendingUp,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
  RefreshCw,
  FileText,
  Sparkles,
  CreditCard as CardIcon,
  X,
  PlusCircle,
  Copy,
  Check,
  DollarSign
} from 'lucide-react';
import { User, BankCard, TreasuryStats } from '../types';
import { formatPisiki, formatPisikiWord } from '../utils/formatCurrency';

interface AdminTreasuryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onEmissionSuccess?: () => void;
}

export const AdminTreasuryModal: React.FC<AdminTreasuryModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onEmissionSuccess,
}) => {
  const isSupremeAdmin = currentUser?.email === 'aatal6022@gmail.com' || currentUser?.email === 'pinkiscammerinfo@gmail.com' || Boolean(currentUser?.isAdmin);
  const [activeTab, setActiveTab] = useState<'overview' | 'emission' | 'citizens' | 'history' | 'staff'>('overview');
  const [stats, setStats] = useState<TreasuryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Emission form state
  const [emitAmount, setEmitAmount] = useState<string>('500000');
  const [targetCard, setTargetCard] = useState<string>('450000000001');
  const [decreeNumber, setDecreeNumber] = useState<string>('3-ЭМ/2026');
  const [reason, setReason] = useState<string>('Плановое пополнение государственного резерва и фондов развития');
  const [emitLoading, setEmitLoading] = useState(false);
  const [emitSuccessMessage, setEmitSuccessMessage] = useState<string | null>(null);

  // Citizens search
  const [searchCitizen, setSearchCitizen] = useState('');
  const [copiedCard, setCopiedCard] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!currentUser?.email) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/treasury-stats?adminEmail=${encodeURIComponent(currentUser.email)}`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.message || 'Ошибка загрузки данных Казны');
      }
    } catch (err: any) {
      setError(err.message || 'Сетевая ошибка при обращении к Казне');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();
      setEmitSuccessMessage(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleEmitCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.email) return;

    const amount = Number(emitAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Введите корректную сумму для выпуска валюты (> 0)');
      return;
    }

    setEmitLoading(true);
    setError(null);
    setEmitSuccessMessage(null);

    try {
      const res = await fetch('/api/admin/emit-currency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: currentUser.email,
          amount: amount,
          recipientCardNumber: targetCard,
          decreeNumber: decreeNumber,
          reason: reason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEmitSuccessMessage(data.message);
        fetchStats();
        if (onEmissionSuccess) onEmissionSuccess();
      } else {
        setError(data.message || 'Ошибка проведения эмиссии');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка отправки запроса');
    } finally {
      setEmitLoading(false);
    }
  };

  const handleCopyCard = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedCard(num);
    setTimeout(() => setCopiedCard(null), 2000);
  };

  const handleToggleFreeze = async (cardId: string, freeze: boolean) => {
    if (!currentUser?.email) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/toggle-freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffEmail: currentUser.email, cardId, freeze }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStats();
      } else {
        setError(data.message || 'Ошибка изменения статуса карты');
      }
    } catch (err: any) {
      setError(err.message || 'Сетевая ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEmployee = async (targetUserId: string, isEmployee: boolean) => {
    if (!currentUser?.email) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/toggle-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: currentUser.email, targetUserId, isEmployee }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStats();
      } else {
        setError(data.message || 'Ошибка изменения роли');
      }
    } catch (err: any) {
      setError(err.message || 'Сетевая ошибка');
    } finally {
      setLoading(false);
    }
  };

  const filteredCitizens = stats?.citizens?.filter((c) => {
    const q = searchCitizen.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.gameNickname.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      c.cards.some((card) => card.cardNumber.includes(q))
    );
  }) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Imperial Gold Header */}
        <div className="relative bg-gradient-to-r from-amber-950 via-zinc-900 to-amber-950 border-b border-amber-500/30 p-5 sm:p-6 text-white">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500" />
          
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-400/50 shadow-inner">
                <Crown className="w-7 h-7 text-amber-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                    ГОСУДАРСТВЕННАЯ КАЗНА • МИНФИН НЯСР
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    VERIFIED ADMIN
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Казначейство и Эмиссионный Центр
                </h2>
                <p className="text-xs sm:text-sm text-zinc-300">
                  Уполномоченный администратор: <span className="font-mono text-amber-300 font-semibold">{currentUser?.email}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 sm:space-x-4 mt-5 pt-2 border-t border-white/10 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/30'
                  : 'text-zinc-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              Сводка Казны
            </button>

            {isSupremeAdmin && (
              <button
                onClick={() => setActiveTab('emission')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'emission'
                    ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/30'
                    : 'text-zinc-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Выпуск Валюты (Эмиссия)
              </button>
            )}

            <button
              onClick={() => setActiveTab('citizens')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'citizens'
                  ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/30'
                  : 'text-zinc-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Балансы Граждан ({stats?.citizens?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/30'
                  : 'text-zinc-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              История Эмиссий
            </button>

            {isSupremeAdmin && (
              <button
                onClick={() => setActiveTab('staff')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'staff'
                    ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/30'
                    : 'text-zinc-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Сотрудники
              </button>
            )}

            <button
              onClick={fetchStats}
              disabled={loading}
              title="Обновить данные"
              className="ml-auto p-1.5 text-amber-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {emitSuccessMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{emitSuccessMessage}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-zinc-100 flex-1">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Metric Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Citizens Balance */}
                <div className="bg-zinc-800/80 border border-zinc-700/80 rounded-xl p-4 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Валюта у граждан</span>
                    <Users className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    {formatPisiki(stats?.citizensTotalBalance || 0)}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">
                    Сумма на счетах {stats?.totalCitizens || 0} граждан НЯСР
                  </div>
                </div>

                {/* Treasury Reserve */}
                <div className="bg-gradient-to-br from-amber-950/60 to-zinc-900 border border-amber-500/40 rounded-xl p-4 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between text-amber-300 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Резерв Казны</span>
                    <Crown className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-amber-300 font-mono">
                    {formatPisiki(stats?.treasuryBalance || 0)}
                  </div>
                  <div className="text-[11px] text-amber-200/70 mt-1">
                    Баланс карты Казны (№ 450000000001)
                  </div>
                </div>

                {/* Total Monetary Supply */}
                <div className="bg-zinc-800/80 border border-zinc-700/80 rounded-xl p-4 shadow-sm relative overflow-hidden sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Всего писиков в стране</span>
                    <Coins className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {formatPisiki(stats?.totalMonetarySupply || 0)}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">
                    Полная денежная масса Страны писюнов (НЯСР)
                  </div>
                </div>

              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-zinc-400">Собрано налога на бездействие (7%)</div>
                    <div className="text-lg font-bold text-amber-300 font-mono mt-0.5">
                      {formatPisiki(stats?.totalTaxCollected || 0)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-zinc-400">Государственных эмиссий проведено</div>
                    <div className="text-lg font-bold text-white font-mono mt-0.5">
                      {stats?.totalEmissionsCount || 0} актов
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Quick Action Banner */}
              <div className="p-5 bg-gradient-to-r from-amber-950/40 via-zinc-800 to-amber-950/40 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-amber-200 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Требуется выпустить дополнительную валюту?
                  </h4>
                  <p className="text-xs text-zinc-300">
                    Вы можете мгновенно напечатать писики в Казну или направить субсидию гражданину.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('emission')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs rounded-lg transition-all shadow-md shadow-amber-500/20 whitespace-nowrap"
                >
                  Перейти к Эмиссии →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: EMISSION */}
          {activeTab === 'emission' && (
            <div className="space-y-6">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-200">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Государственное полномочие эмиссии НЯСР
                </div>
                В соответствии с Конституцией Страны писюнов (НЯСР), Администратор обладает исключительным правом выпуска национальной валюты (писики). Все эмиссии фиксируются в открытом реестре транзакций.
              </div>

              <form onSubmit={handleEmitCurrency} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Amount */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Сумма выпуска (в писиках) <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        step="any"
                        required
                        value={emitAmount}
                        onChange={(e) => setEmitAmount(e.target.value)}
                        placeholder="Например, 1000000"
                        className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs text-amber-400 font-bold">писиков</span>
                    </div>
                  </div>

                  {/* Target Card */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Карта зачисления <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={targetCard}
                        onChange={(e) => setTargetCard(e.target.value)}
                        placeholder="450000000001 (Казна)"
                        className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      />
                    </div>
                    <div className="flex gap-2 text-[11px] text-zinc-400">
                      <span>Быстрый выбор:</span>
                      <button
                        type="button"
                        onClick={() => setTargetCard('450000000001')}
                        className="text-amber-400 hover:underline font-semibold"
                      >
                        [Карта Казны 450000000001]
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Шаблоны сумм:</span>
                  <div className="flex flex-wrap gap-2">
                    {['50000', '100000', '500000', '1000000', '5000000', '10000000'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setEmitAmount(preset)}
                        className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md border transition-colors ${
                          emitAmount === preset
                            ? 'bg-amber-500 text-zinc-950 border-amber-400'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                        }`}
                      >
                        +{formatPisiki(Number(preset))}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Decree Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Основание / Номер Указа
                  </label>
                  <input
                    type="text"
                    value={decreeNumber}
                    onChange={(e) => setDecreeNumber(e.target.value)}
                    placeholder="Указ Президента / Минфина №..."
                    className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Reason / Purpose */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Назначение средств
                  </label>
                  <textarea
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Опишите цель эмиссии (пополнение резервов, субсидия, стимулирование торговли)..."
                    className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={emitLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {emitLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Печать валюты в процессе...
                    </>
                  ) : (
                    <>
                      <Crown className="w-5 h-5 text-zinc-950" />
                      Произвести Государственную Эмиссию
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: CITIZENS REGISTRY */}
          {activeTab === 'citizens' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchCitizen}
                    onChange={(e) => setSearchCitizen(e.target.value)}
                    placeholder="Поиск гражданина по нику, имени, email или номеру карты..."
                    className="w-full pl-9 pr-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="text-xs text-zinc-400 whitespace-nowrap">
                  Найдено: <span className="text-white font-bold">{filteredCitizens.length}</span>
                </div>
              </div>

              {/* Citizens Table / Cards */}
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {filteredCitizens.length === 0 ? (
                  <div className="text-center py-10 text-zinc-500 text-sm">
                    Граждане не найдены
                  </div>
                ) : (
                  filteredCitizens.map((citizen) => (
                    <div
                      key={citizen.userId}
                      className="p-4 bg-zinc-800/60 border border-zinc-700/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-500/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm">{citizen.name}</span>
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-zinc-700 text-zinc-300">
                            @{citizen.gameNickname}
                          </span>
                        </div>
                        {citizen.email && (
                          <div className="text-xs text-zinc-400">{citizen.email}</div>
                        )}
                        
                        {/* Cards List */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {citizen.cards.map((c) => {
                            const isFrozen = c.isFrozen || c.status === 'frozen';
                            return (
                              <div
                                key={c.id}
                                className={`px-2 py-1 rounded text-[11px] font-mono flex items-center gap-1.5 border ${
                                  isFrozen
                                    ? 'bg-sky-950/60 text-sky-300 border-sky-500/40'
                                    : 'bg-zinc-900 text-zinc-300 border-zinc-700'
                                }`}
                              >
                                <span>{c.cardNumber}</span>
                                <button
                                  onClick={() => handleCopyCard(c.cardNumber)}
                                  title="Копировать номер"
                                  className="text-zinc-400 hover:text-white"
                                >
                                  {copiedCard === c.cardNumber ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                                <span className="font-bold text-amber-300">
                                  ({formatPisiki(c.balance || 0)})
                                </span>
                                {isFrozen && <span className="text-sky-400 font-sans text-[9px] font-bold mr-1">[ЗАМОРОЖЕНА]</span>}
                                <button
                                  onClick={() => handleToggleFreeze(c.id, !isFrozen)}
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border transition-colors ${
                                    isFrozen 
                                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40 hover:bg-emerald-900/60' 
                                      : 'bg-red-950/40 text-red-400 border-red-500/40 hover:bg-red-900/60'
                                  }`}
                                >
                                  {isFrozen ? 'Разморозить' : 'Заморозить'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right Total Balance & Actions */}
                      <div className="flex items-center sm:flex-col sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-700">
                        <div className="text-xs text-zinc-400">Общий капитал:</div>
                        <div className="text-base font-black text-amber-400 font-mono">
                          {formatPisiki(citizen.totalBalance)}
                        </div>
                        {isSupremeAdmin && (
                          <button
                            onClick={() => {
                              if (citizen.cards[0]) {
                                setTargetCard(citizen.cards[0].cardNumber);
                                setActiveTab('emission');
                              }
                            }}
                            className="mt-1 px-2.5 py-1 text-[11px] font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded border border-amber-500/30 transition-colors"
                          >
                            Эмиссия на карту →
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: EMISSIONS HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3 max-h-[440px] overflow-y-auto">
              {(!stats?.recentEmissions || stats.recentEmissions.length === 0) ? (
                <div className="text-center py-10 text-zinc-500 text-sm">
                  История государственных эмиссий пока пуста
                </div>
              ) : (
                stats.recentEmissions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 bg-zinc-800/50 border border-amber-500/20 rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
                          <Crown className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Государственный акт эмиссии
                        </span>
                      </div>
                      <span className="text-base font-black text-amber-400 font-mono">
                        +{formatPisiki(Number(tx.amount))}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300">
                      {tx.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono pt-1 border-t border-zinc-700/50">
                      <span>Получатель: {tx.recipientName} ({tx.toCardNumber})</span>
                      <span>{new Date(tx.createdAt).toLocaleString('ru-RU')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: STAFF */}
          {activeTab === 'staff' && isSupremeAdmin && (
            <div className="space-y-4 max-h-[440px] overflow-y-auto pr-1">
              <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-xl">
                <h3 className="text-sm font-bold text-white mb-1">Сотрудники Банка</h3>
                <p className="text-xs text-zinc-400">Сотрудники имеют доступ к мониторингу счетов граждан и могут применять/снимать заморозку (статус ❄️). Только верховный администратор может выпускать валюту.</p>
              </div>
              
              <div className="space-y-2">
                {stats?.citizens.map((citizen) => (
                  <div key={citizen.userId} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">{citizen.name}</span>
                        {citizen.isAdmin ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">Администратор</span>
                        ) : citizen.isEmployee ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">Сотрудник</span>
                        ) : null}
                      </div>
                      <div className="text-xs text-zinc-500">{citizen.email}</div>
                    </div>
                    
                    {!citizen.isAdmin && (
                      <button
                        onClick={() => handleToggleEmployee(citizen.userId, !citizen.isEmployee)}
                        className={`px-3 py-1 text-xs font-bold rounded border transition-colors ${
                          citizen.isEmployee 
                            ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20' 
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white'
                        }`}
                      >
                        {citizen.isEmployee ? 'Уволить' : 'Назначить сотрудником'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 text-center text-xs text-zinc-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-amber-400/90 font-semibold">
            <Landmark className="w-3.5 h-3.5" />
            Экономическая система Страны писюнов (НЯСР)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
};
