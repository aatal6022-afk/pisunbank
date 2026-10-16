import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  User as UserIcon,
  CreditCard,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Database,
  Crown,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';
import { CardType } from '../types';

interface RegistrationFlowProps {
  onRegisterSuccess: (user: any, card: any) => void;
  isAdditionalCard?: boolean;
  currentUser?: any;
  onClose?: () => void;
}

export const RegistrationFlow: React.FC<RegistrationFlowProps> = ({
  onRegisterSuccess,
  isAdditionalCard = false,
  currentUser = null,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(
    isAdditionalCard ? 'register' : 'login'
  );

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regNickname, setRegNickname] = useState(
    isAdditionalCard && currentUser ? currentUser.gameNickname || currentUser.name : ''
  );
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [cardType, setCardType] = useState<CardType>('regular');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showSupabaseHelp, setShowSupabaseHelp] = useState(false);

  // Handle Login via Supabase / Server
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanId = loginIdentifier.trim();
    const cleanPw = loginPassword.trim();

    if (!cleanId) {
      setError('Введите логин, игровой ник, email или 12-значный номер карты');
      return;
    }
    if (!cleanPw) {
      setError('Введите пароль');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/cards/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanId,
          password: cleanPw,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setError(data.message || 'Неверный логин или пароль');
        setLoading(false);
        return;
      }

      setSuccessMsg('Успешный вход в Писюн Банк!');
      setTimeout(() => {
        const primaryCard = data.card || (data.cards && data.cards[0]);
        onRegisterSuccess(data.user, primaryCard);
        if (onClose) onClose();
      }, 300);
    } catch (err: any) {
      setError(err.message || 'Ошибка подключения к серверу авторизации');
      setLoading(false);
    }
  };

  // Handle Register via Supabase / Server
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanNick = regNickname.trim();
    const cleanPw = regPassword.trim();

    if (!cleanNick) {
      setError('Укажите имя игрока (никнейм) для нанесения на карту');
      return;
    }

    if (cleanNick.length < 2) {
      setError('Имя должно содержать минимум 2 символа');
      return;
    }

    if (!cleanPw) {
      setError('Придумайте пароль для доступа к счёту');
      return;
    }

    if (cleanPw.length < 3) {
      setError('Пароль должен содержать не менее 3 символов');
      return;
    }

    if (cleanPw !== regConfirmPassword.trim()) {
      setError('Пароли не совпадают. Проверьте правильность ввода');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/cards/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameNickname: cleanNick,
          password: cleanPw,
          cardType,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setError(data.message || 'Ошибка регистрации карты. Попробуйте другое имя или проверьте данные.');
        setLoading(false);
        return;
      }

      const user = data.user;
      const card = data.card || (data.cards && data.cards[0]);

      if (!user || !card) {
        setError('Карта создана, но ответ сервера неполон. Попробуйте войти по логину и паролю.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Карта успешно выпущена!');
      setTimeout(() => {
        onRegisterSuccess(user, card);
        if (onClose) onClose();
      }, 300);
    } catch (err: any) {
      setError(err.message || 'Сбой связи при открытии карты');
      setLoading(false);
    }
  };

  // Handle Quick Demo Login
  const handleQuickDemoLogin = async (username: string, password: string) => {
    setLoginIdentifier(username);
    setLoginPassword(password);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/cards/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (data.success && data.user) {
        const primaryCard = data.card || (data.cards && data.cards[0]);
        onRegisterSuccess(data.user, primaryCard);
        if (onClose) onClose();
      } else {
        setError(data.message || 'Не удалось выполнить демо-вход');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка демо-входа');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google OAuth Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const googleUser = await signInWithGoogle();

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleUser }),
      });

      const data = await res.json().catch(() => ({}));
      if (data.success && data.user && data.card) {
        onRegisterSuccess(data.user, data.card);
        if (onClose) onClose();
      } else {
        setError(data.message || 'Ошибка авторизации через Google');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка авторизации Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center p-3 sm:p-6 min-h-[85vh]">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden transition-all">
        {/* Top Branding Banner */}
        <div className="bg-zinc-950 p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 -top-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between relative z-10 mb-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-zinc-900/90 text-amber-400 text-xs font-bold border border-zinc-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Страна писюнов (НЯСР)</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
              <Database className="w-3 h-3 text-amber-400" />
              <span>Firebase Firestore</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white relative z-10">
            {isAdditionalCard ? 'Выпуск новой карты' : 'Писюн Банк'}
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1.5 relative z-10">
            {isAdditionalCard
              ? 'Открытие дополнительного расчетного или коммерческого счета'
              : 'Официальный банк виртуального государства. Авторизация по логину и паролю.'}
          </p>

          {/* Mode Tabs Switcher (Only if not in sub-modal) */}
          {!isAdditionalCard && (
            <div className="flex bg-zinc-900/90 p-1 rounded-2xl border border-zinc-800 mt-5 relative z-10">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setError(null);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-white text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Вход в аккаунт</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setError(null);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-amber-400 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Регистрация</span>
              </button>
            </div>
          )}
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {/* Status and Error Messages */}
          {error && (
            <div className="flex items-start space-x-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start space-x-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMsg}</div>
            </div>
          )}

          {/* TAB 1: LOGIN FORM */}
          {activeTab === 'login' && !isAdditionalCard && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Логин, Email или номер карты
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Например: ИВАН НЯСР или 450088889999"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 text-sm font-medium transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Пароль
                  </label>
                  <span className="text-[11px] text-zinc-400 font-medium">От 3 символов</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 text-sm font-medium transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-zinc-950 hover:bg-black active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-zinc-950/20 disabled:opacity-60"
              >
                <span>{loading ? 'Проверка реквизитов...' : 'Войти в личный кабинет'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick Demo Logins Helper */}
              <div className="pt-2">
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 text-center">
                  Быстрый демо-вход для теста
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickDemoLogin('КАЗНА НЯСР', 'admin')}
                    className="p-2.5 rounded-xl border border-amber-300/80 bg-amber-50/70 hover:bg-amber-100 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center space-x-1.5 text-xs font-black text-amber-950">
                      <Crown className="w-3.5 h-3.5 text-amber-600" />
                      <span>Казна (Админ)</span>
                    </div>
                    <div className="text-[10px] text-amber-800 mt-0.5">Логин: КАЗНА НЯСР</div>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickDemoLogin('ИВАН НЯСР', '123')}
                    className="p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center space-x-1.5 text-xs font-black text-zinc-900">
                      <CreditCard className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Иван Гражданин</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">Баланс: 75 000 PUSH</div>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER FORM */}
          {(activeTab === 'register' || isAdditionalCard) && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Имя гражданина / Игровой никнейм
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regNickname}
                    onChange={(e) => setRegNickname(e.target.value)}
                    placeholder="Например: ALEX_NYASR или DMITRY"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 text-sm font-medium transition-all outline-none"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Будет выгравировано на вашей банковской карте заглавными буквами.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Пароль для входа
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Минимум 3 символа"
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 text-sm font-medium transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Повторите пароль
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Повторите пароль для проверки"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 text-sm font-medium transition-all outline-none"
                  />
                </div>
              </div>

              {/* Card Type Selector */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Выберите тариф и тип карты
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setCardType('regular')}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      cardType === 'regular'
                        ? 'border-zinc-900 bg-zinc-50/80 shadow-sm'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="w-7 h-5 rounded bg-zinc-200 border border-zinc-300 mb-2 shadow-xs" />
                    <div className="font-extrabold text-xs text-zinc-900">Белая карта</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">Гражданская • 0 PUSH</div>
                    <div className="text-[9px] text-emerald-700 font-semibold mt-1">
                      Переводы и кредиты 5%
                    </div>
                  </div>

                  <div
                    onClick={() => setCardType('business')}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      cardType === 'business'
                        ? 'border-zinc-900 bg-zinc-900 text-white shadow-md'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="w-7 h-5 rounded bg-zinc-800 border border-zinc-700 mb-2 shadow-xs" />
                    <div className={`font-extrabold text-xs ${cardType === 'business' ? 'text-white' : 'text-zinc-900'}`}>
                      Черная карта
                    </div>
                    <div className={`text-[10px] ${cardType === 'business' ? 'text-zinc-400' : 'text-zinc-500'} mt-0.5`}>
                      Бизнес • 0 PUSH
                    </div>
                    <div className={`text-[9px] font-semibold mt-1 ${cardType === 'business' ? 'text-amber-400' : 'text-amber-600'}`}>
                      Эквайринг & REST API
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-[0.99] text-zinc-950 font-black text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-60"
              >
                <span>{loading ? 'Эмиссия карты в Firebase...' : 'Выпустить карту и открыть счет'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Social Google Auth Alternative */}
          {!isAdditionalCard && (
            <>
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-zinc-400 font-bold">или через Google</span>
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="w-full py-3 px-4 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.99] text-zinc-700 font-bold text-xs sm:text-sm flex items-center justify-center space-x-2.5 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>{loading ? 'Ожидание...' : 'Войти через аккаунт Google'}</span>
              </button>
            </>
          )}

          {/* Security, Database Status & Cache Reset Footer */}
          <div className="pt-2 space-y-2 border-t border-zinc-100">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                <span>256-bit SSL шифрование</span>
              </span>
              <button
                type="button"
                onClick={() => setShowSupabaseHelp(!showSupabaseHelp)}
                className="flex items-center gap-1 font-semibold text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer underline decoration-dotted"
              >
                <Database className="w-3 h-3 text-amber-500 inline" />
                <span>База Firebase Firestore</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-400">
              <span>Писюн Банк • Государственный Банк</span>
              <button
                type="button"
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                title="Очистить сессию браузера и кэш"
              >
                Очистить кэш браузера
              </button>
            </div>

            {/* Firebase Database Status Info Accordion */}
            {showSupabaseHelp && (
              <div className="mt-3 p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs space-y-2 animate-in fade-in duration-200">
                <div className="font-bold text-zinc-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-amber-950 font-black">
                    <Database className="w-3.5 h-3.5 text-amber-600" />
                    <span>Статус Firebase Firestore:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSupabaseHelp(false)}
                    className="text-zinc-400 hover:text-zinc-700 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-zinc-700 text-[11px] leading-relaxed">
                  Банк подключен к официальной облачной базе данных Google Cloud / Firebase Firestore:
                </p>
                <div className="bg-white p-2 rounded-xl border border-amber-200 font-mono text-[10px] space-y-0.5 text-zinc-800">
                  <div>Проект: <span className="font-semibold text-zinc-950">gen-lang-client-0611142543</span></div>
                  <div>База данных: <span className="font-semibold text-zinc-950">ai-studio-murbank-8857abc3-123a-4a30-a290-f6382310bb57</span></div>
                  <div>Администратор: <span className="font-semibold text-zinc-950">aatal6022@gmail.com</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
