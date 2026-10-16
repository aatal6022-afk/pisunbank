import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const rawKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  rawUrl.startsWith('http') &&
  !rawUrl.includes('xxxxxxxxxxxxxxxxxxxx') &&
  !rawUrl.includes('placeholder') &&
  !rawUrl.includes('example.com')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(rawUrl, rawKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: (url, options: RequestInit = {}) => {
          // Add 4-second timeout to prevent hanging connections
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4000);
          return fetch(url, {
            ...options,
            signal: options.signal || controller.signal,
          }).finally(() => clearTimeout(timer));
        },
      },
    })
  : null;

if (isSupabaseConfigured) {
  console.log('[Database] Supabase client initialized:', rawUrl);
} else {
  console.log('[Database] Supabase not configured with active credentials. Using built-in storage.');
}

