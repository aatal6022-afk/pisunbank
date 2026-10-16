# Инструкция по деплою на Vercel с базой данных Supabase

Банк номер один в НЯСР (Страна писюнов — НЯСР) полностью готов к мгновенному деплою на **Vercel** и подключению к **Supabase**.

---

### Шаг 1: Создание проекта в Supabase
1. Перейдите на [supabase.com](https://supabase.com) и войдите в аккаунт.
2. Создайте новый проект (например, `nyasr-bank-1`).
3. Перейдите во вкладку **SQL Editor** в левом меню Supabase.
4. Откройте файл `supabase-schema.sql` из этого проекта, скопируйте всё его содержимое, вставьте в редактор SQL Supabase и нажмите **Run**.
   - Создадутся таблицы: `users`, `cards`, `transactions`, `credits`, `invoices`.
   - Автоматически внесутся данные Государственной Казны (карта `450000000001` на 1 000 000 000 PUSH) и демо-аккаунта.
5. Перейдите в **Project Settings -> API** и скопируйте:
   - **Project URL** (`SUPABASE_URL`)
   - **anon / public key** (`SUPABASE_ANON_KEY`)
   - **service_role secret key** (`SUPABASE_SERVICE_ROLE_KEY`)

---

### Шаг 2: Деплой на Vercel
1. Загрузите проект в ваш GitHub / GitLab репозиторий:
   ```bash
   git init
   git add .
   git commit -m "Банк номер один в НЯСР: Vercel + Supabase ready"
   git push -u origin main
   ```
2. Откройте [vercel.com](https://vercel.com) -> **Add New Project** -> выберите ваш репозиторий.
3. В настройках **Environment Variables** добавьте переменные:
   - `SUPABASE_URL` = `https://your-project.supabase.co`
   - `SUPABASE_ANON_KEY` = `ваш_anon_key`
   - `SUPABASE_SERVICE_ROLE_KEY` = `ваш_service_role_key` (рекомендуется для серверных операций)
   - `APP_URL` = `https://ваш-проект.vercel.app`
4. Нажмите **Deploy**.

Готово! Ваш банк работает на Vercel с базой данных в Supabase.
