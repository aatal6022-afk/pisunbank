-- ====================================================================
-- СХЕМА БАЗЫ ДАННЫХ ДЛЯ SUPABASE: БАНК НОМЕР ОДИН В НЯСР
-- Страна писюнов (НЯСР)
-- ====================================================================

-- 1. ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ (users)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT,
  password TEXT,
  google_id TEXT,
  name TEXT NOT NULL,
  full_name TEXT,
  game_nickname TEXT NOT NULL,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT FALSE,
  is_employee BOOLEAN DEFAULT FALSE
);

-- 2. ТАБЛИЦА БАНКОВСКИХ КАРТ (cards)
CREATE TABLE IF NOT EXISTS public.cards (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  card_number TEXT NOT NULL UNIQUE,
  card_holder_name TEXT NOT NULL,
  card_type TEXT NOT NULL DEFAULT 'regular', -- 'regular', 'business', 'treasury'
  color TEXT NOT NULL DEFAULT 'white',       -- 'white', 'black', 'gold'
  balance BIGINT NOT NULL DEFAULT 0,
  issue_date TEXT NOT NULL,
  cvv TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',     -- 'active', 'blocked', 'frozen'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_date TIMESTAMPTZ DEFAULT NOW(),
  is_frozen BOOLEAN DEFAULT FALSE,
  frozen_until TIMESTAMPTZ,
  frozen_at TIMESTAMPTZ,
  freeze_days INTEGER
);

-- 3. ТАБЛИЦА ТРАНЗАКЦИЙ (transactions)
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  card_id TEXT,
  card_number TEXT NOT NULL,
  from_card_number TEXT NOT NULL,
  to_card_number TEXT NOT NULL,
  sender_name TEXT,
  recipient_name TEXT,
  amount BIGINT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ТАБЛИЦА КРЕДИТОВ (credits)
CREATE TABLE IF NOT EXISTS public.credits (
  id TEXT PRIMARY KEY,
  card_id TEXT REFERENCES public.cards(id) ON DELETE CASCADE,
  principal BIGINT NOT NULL,
  interest_rate NUMERIC DEFAULT 5,
  total_repay_amount BIGINT NOT NULL,
  remaining_amount BIGINT NOT NULL,
  monthly_payment BIGINT NOT NULL,
  term_months INTEGER DEFAULT 12,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ТАБЛИЦА СЧЕТОВ И ЭКВАЙРИНГА (invoices)
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  merchant_user_id TEXT,
  merchant_name TEXT NOT NULL,
  recipient_card_number TEXT NOT NULL,
  amount BIGINT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
  paid_by_card_number TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ИНДЕКСЫ ДЛЯ БЫСТРОГО ПОИСКА
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_number ON public.cards(card_number);
CREATE INDEX IF NOT EXISTS idx_tx_card_number ON public.transactions(card_number);
CREATE INDEX IF NOT EXISTS idx_tx_from_to ON public.transactions(from_card_number, to_card_number);
CREATE INDEX IF NOT EXISTS idx_invoices_recipient ON public.invoices(recipient_card_number);

-- ====================================================================
-- НАЧАЛЬНЫЕ ДАННЫЕ (SEED DATA): КАЗНА И ПЕРВЫЙ ГРАЖДАНИН
-- ====================================================================

-- Главный казначей / Администратор
INSERT INTO public.users (id, email, google_id, name, full_name, game_nickname, avatar, is_admin, is_employee)
VALUES (
  'usr_govt',
  'pinkiscammerinfo@gmail.com',
  'google_treasury_admin',
  'Главный Казначей НЯСР',
  'Верховный Банкир НЯСР',
  'КАЗНА НЯСР',
  'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=100&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO NOTHING;

-- Демо-гражданин
INSERT INTO public.users (id, email, google_id, name, full_name, game_nickname, avatar, is_admin, is_employee)
VALUES (
  'usr_ivan',
  'ivan.nyasr@gmail.com',
  'google_ivan_demo',
  'Иван Гражданин',
  'Иван Гражданин НЯСР',
  'ИВАН НЯСР',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
  FALSE,
  FALSE
) ON CONFLICT (id) DO NOTHING;

-- Государственная Золотая Карта Казны (1,000,000,000 PUSH)
INSERT INTO public.cards (id, user_id, card_number, card_holder_name, card_type, color, balance, issue_date, cvv, status)
VALUES (
  'crd_treasury',
  'usr_govt',
  '450000000001',
  'КАЗНА НЯСР',
  'treasury',
  'gold',
  1000000000,
  '01/26',
  '777',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Карта демо-гражданина
INSERT INTO public.cards (id, user_id, card_number, card_holder_name, card_type, color, balance, issue_date, cvv, status)
VALUES (
  'crd_ivan',
  'usr_ivan',
  '450088889999',
  'ИВАН НЯСР',
  'regular',
  'white',
  75000,
  '03/26',
  '123',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Стартовая транзакция субсидии
INSERT INTO public.transactions (id, card_id, card_number, from_card_number, to_card_number, sender_name, recipient_name, amount, type, description)
VALUES (
  'tx_init_1',
  'crd_ivan',
  '450088889999',
  '450000000001',
  '450088889999',
  'Казна Государства НЯСР',
  'Иван Гражданин',
  75000,
  'transfer_in',
  'Подъемные субсидии от Минфина Страны писюнов (НЯСР)'
) ON CONFLICT (id) DO NOTHING;
