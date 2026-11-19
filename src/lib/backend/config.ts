/**
 * Backend connection settings. Values come only from environment variables —
 * nothing is hard-coded. Demo authentication is available only in development.
 */
const env = import.meta.env as Record<string, string | undefined>;

export const backendConfig = {
  url: env.VITE_SUPABASE_URL,
  publishableKey: env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY,
};

export const isBackendConfigured = Boolean(backendConfig.url && backendConfig.publishableKey);

/** Local demo accounts must never be enabled in a production build. */
export const isDemoMode = import.meta.env.DEV && !isBackendConfigured;

/** Exact connection details the app expects (shown on the account page). */
export const REQUIRED_CONNECTION = [
  { name: "VITE_SUPABASE_URL", description: "آدرس پروژه (Project URL)" },
  { name: "VITE_SUPABASE_PUBLISHABLE_KEY", description: "کلید عمومی (anon / publishable key)" },
] as const;

/** Database objects the app reads. Existing ones are used as-is, never altered. */
export const EXPECTED_BACKEND_OBJECTS = [
  "جدول profiles با ستون‌های id و full_name و role (موجود)",
  "جدول خصوصی profile_contacts برای شماره تماس هر کاربر (موجود)",
  "توابع مدیریتی admin_get_profile_contacts و admin_list_profile_contacts (موجود)",
  "تابع private.is_admin() و سیاست‌های امنیتی مربوط (موجود)",
] as const;
