import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  Receipt,
  ShoppingBag,
  Landmark,
  CreditCard,
  Send,
  Snowflake,
  Scale,
  Percent,
} from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { formatPisiki } from '../utils/formatCurrency';

interface TransactionListProps {
  transactions: Transaction[];
  onRefresh: () => void;
  loading?: boolean;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onRefresh,
  loading,
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = transactions.filter((t) => {
    // Search match
    const term = search.toLowerCase();
    const matchSearch =
      t.description.toLowerCase().includes(term) ||
      (t.senderName && t.senderName.toLowerCase().includes(term)) ||
      (t.recipientName && t.recipientName.toLowerCase().includes(term)) ||
      t.fromCardNumber.includes(term) ||
      t.toCardNumber.includes(term);

    if (!matchSearch) return false;

    // Filter type match
    if (filterType === 'in') return t.type === 'transfer_in' || t.type === 'credit_draw';
    if (filterType === 'out')
      return (
        t.type === 'transfer_out' ||
        t.type === 'credit_repay' ||
        t.type === 'merchant_payment' ||
        t.type === 'tax_inactivity'
      );
    if (filterType === 'merchant') return t.type === 'merchant_payment';
    if (filterType === 'laws') return t.type === 'tax_inactivity' || t.type === 'account_freeze';

    return true;
  });

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case 'transfer_in':
        return <ArrowDownLeft className="w-5 h-5 text-emerald-600" />;
      case 'transfer_out':
        return <ArrowUpRight className="w-5 h-5 text-rose-600" />;
      case 'credit_draw':
        return <Landmark className="w-5 h-5 text-amber-600" />;
      case 'credit_repay':
        return <Receipt className="w-5 h-5 text-sky-600" />;
      case 'merchant_payment':
        return <ShoppingBag className="w-5 h-5 text-purple-600" />;
      case 'tax_inactivity':
        return <Scale className="w-5 h-5 text-amber-600" />;
      case 'account_freeze':
        return <Snowflake className="w-5 h-5 text-sky-600 animate-spin-slow" />;
      default:
        return <CreditCard className="w-5 h-5 text-zinc-600" />;
    }
  };

  const isPositive = (type: TransactionType) => {
    return type === 'transfer_in' || type === 'credit_draw';
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm overflow-hidden p-4 sm:p-8">
      {/* Title & Refresh Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-zinc-900 flex items-center space-x-2">
            <span>История транзакций</span>
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Все поступления, переводы, налоги, кредиты и выписки по счету
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center space-x-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold transition-all cursor-pointer border border-zinc-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Обновить</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 sm:mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-400 bg-zinc-50"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex space-x-1.5 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'Все' },
            { id: 'in', label: 'Поступления' },
            { id: 'out', label: 'Списания' },
            { id: 'merchant', label: 'Оплаты API' },
            { id: 'laws', label: '🏛️ Налоги & Указы' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === f.id
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border border-zinc-200/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2.5 sm:space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
            <Receipt className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-zinc-600">Транзакции не найдены</p>
          </div>
        ) : (
          filtered.map((tx) => {
            const positive = isPositive(tx.type);
            const isTax = tx.type === 'tax_inactivity';
            const isFreeze = tx.type === 'account_freeze';

            return (
              <div
                key={tx.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isTax
                    ? 'border-amber-200 bg-amber-50/30 hover:bg-amber-50/60'
                    : isFreeze
                    ? 'border-sky-200 bg-sky-50/30 hover:bg-sky-50/60'
                    : 'border-zinc-100 bg-white hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div
                    className={`p-2.5 sm:p-3 rounded-2xl shrink-0 ${
                      isTax
                        ? 'bg-amber-100 text-amber-700'
                        : isFreeze
                        ? 'bg-sky-100 text-sky-700'
                        : positive
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {getTransactionIcon(tx.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-zinc-900 text-xs sm:text-sm truncate flex items-center gap-1.5">
                      <span>{tx.description}</span>
                      {isTax && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-extrabold uppercase">
                          7% Налог
                        </span>
                      )}
                      {isFreeze && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-extrabold uppercase">
                          Указ №2
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5 truncate">
                      {tx.senderName && tx.type === 'transfer_in' && `От: ${tx.senderName}`}
                      {tx.recipientName && tx.type === 'transfer_out' && `Кому: ${tx.recipientName}`}
                      {!tx.senderName && !tx.recipientName && `Карта: ${tx.cardNumber}`}
                      {' • '}
                      {formatDate(tx.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`font-black text-sm sm:text-base ${
                      isTax
                        ? 'text-amber-700'
                        : isFreeze
                        ? 'text-sky-700'
                        : positive
                        ? 'text-emerald-600'
                        : 'text-zinc-900'
                    }`}
                  >
                    {isFreeze ? '❄️ 0 писиков' : `${positive ? '+' : '-'}${formatPisiki(tx.amount)}`}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
