/**
 * Backend connection settings. Values come only from environment variables —
 * nothing is hard-coded. When both are present the app signs users in against
 * the real backend; otherwise it runs in demo mode with local sample data.
 */
const env = import.meta.env as Record<string, string | undefined>;

export const backendConfig = {
  url: env.VITE_SUPABASE_URL,
  publishableKey: env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY,
};

export const isBackendConfigured = Boolean(backendConfig.url && backendConfig.publishableKey);

/** Exact connection details the app expects (shown on the account page). */
export const REQUIRED_CONNECTION = [
  { name: "VITE_SUPABASE_URL", description: "آدرس پروژه (Project URL)" },
  { name: "VITE_SUPABASE_PUBLISHABLE_KEY", description: "کلید عمومی (anon / publishable key)" },
] as const;

/** Database objects the app reads. Existing ones are used as-is, never altered. */
export const EXPECTED_BACKEND_OBJECTS = [
  "جدول profiles با ستون‌های id و full_name و role و phone (موجود)",
  "تابع is_admin() برای تشخیص مدیر (موجود)",
  "سیاست‌های امنیتی profiles_select و profiles_admin (موجود — دست‌نخورده)",
] as const;