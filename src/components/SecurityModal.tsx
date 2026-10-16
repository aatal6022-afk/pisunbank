import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Cpu,
  AlertTriangle,
  Key,
  Database,
  CheckCircle2,
  X,
  FileText,
  Activity,
  Globe,
  RefreshCw,
  Zap,
} from 'lucide-react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'status' | 'logs' | 'anti-fraud'>('status');

  if (!isOpen) return null;

  const mockAuditLogs = [
    { id: 'sec_1', type: 'SUCCESS', event: 'Вход через Google Auth (OAuth 2.0)', ip: '178.62.204.12', time: 'Только что' },
    { id: 'sec_2', type: 'SUCCESS', event: 'Проверка SSL/TLS сертификата 256-bit', ip: '0.0.0.0', time: '1 мин. назад' },
    { id: 'sec_3', type: 'PROTECT', event: 'Rate Limiter: Запрос /api/cards/transfer в пределах нормы', ip: '178.62.204.12', time: '3 мин. назад' },
    { id: 'sec_4', type: 'INFO', event: 'Синхронизация Firestore DB Security Rules', ip: 'internal', time: '5 мин. назад' },
    { id: 'sec_5', type: 'PROTECT', event: 'Антифрод: Транзакция валидирована (без аномалий)', ip: '178.62.204.12', time: '10 мин. назад' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-950/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl text-zinc-100 flex flex-col max-h-[92dvh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">Центр Безопасности</h3>
                <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  100%
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400">Система защиты данных Страны писюнов (НЯСР)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/50 px-6 pt-3 space-x-2">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'status'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Статус Защиты</span>
          </button>
          <button
            onClick={() => setActiveTab('anti-fraud')}
            className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'anti-fraud'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Антифрод & Ограничения</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Журнал Аудита</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-200 leading-relaxed">
                  Все протоколы безопасности Банка номер один в НЯСР функционируют в штатном режиме. Серверные API защищены встроенным лимитером запросов, база данных надёжно защищена правилами доступа.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <Lock className="w-4 h-4" />
                    <span className="text-xs font-bold text-white">SSL 256-bit AES</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Все запросы между клиентом и сервером шифруются по стандарту TLS 1.3
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center space-x-2 text-blue-400">
                    <Cpu className="w-4 h-4" />
                    <span className="text-xs font-bold text-white">Anti-DDoS & Flood Shield</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Автоматическая блокировка паразитного трафика и частых повторных запросов
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center space-x-2 text-amber-400">
                    <Key className="w-4 h-4" />
                    <span className="text-xs font-bold text-white">Google OAuth 2.0 Auth</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Подлинная авторизация Firebase Google popup без передачи паролей
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center space-x-2 text-purple-400">
                    <Database className="w-4 h-4" />
                    <span className="text-xs font-bold text-white">Firestore Rules Isolation</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Облачная база данных Страны писюнов (НЯСР) с проверкой целостности структуры
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'anti-fraud' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Правила Антифрод Мониторинга</span>
                </h4>
                <ul className="text-xs text-zinc-300 space-y-2 list-disc list-inside">
                  <li><strong className="text-white">Лимит попыток CVV:</strong> Блокировка операций с картой при 3 неверных вводах CVV.</li>
                  <li><strong className="text-white">Крупные суммы:</strong> Автоматический контроль транзакций свыше 100,000 PUSH.</li>
                  <li><strong className="text-white">Защита от овердрафта:</strong> Серверный контроль баланса перед списанием средств.</li>
                  <li><strong className="text-white">Проверка карт:</strong> Маскирование 12-значных номеров карт в логах сервера.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Защита API Эквайринга (/api/v1/payment)</div>
                  <div className="text-[11px] text-zinc-400">Ограничение: до 10 запросов списания в минуту на IP адрес</div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  ВКЛЮЧЕНО
                </span>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-zinc-400 mb-2 flex items-center justify-between">
                <span>События безопасности (Сервер)</span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Live Sync
                </span>
              </div>
              <div className="space-y-1.5 font-mono text-xs">
                {mockAuditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${
                        log.type === 'SUCCESS' ? 'bg-emerald-400' : log.type === 'PROTECT' ? 'bg-blue-400' : 'bg-zinc-400'
                      }`} />
                      <span className="text-zinc-200">{log.event}</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 flex items-center space-x-3">
                      <span>{log.ip}</span>
                      <span>{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Защита Банка номер один в НЯСР • Страна писюнов (НЯСР)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
