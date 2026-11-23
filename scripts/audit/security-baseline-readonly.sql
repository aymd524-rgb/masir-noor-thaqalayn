-- Read-only Supabase security baseline checks.
-- Safe for catalog inspection: SELECT only; no user rows or contact values are read.
-- Run before and after any separately reviewed least-privilege migration.

WITH checks AS (
  SELECT 'all public base tables have RLS' AS test_name,
         NOT EXISTS (
           SELECT 1 FROM pg_class c
           JOIN pg_namespace n ON n.oid=c.relnamespace
           WHERE n.nspname='public' AND c.relkind IN ('r','p')
             AND NOT c.relrowsecurity
         ) AS passed,
         'Expected: true' AS expected
  UNION ALL
  SELECT 'anon cannot read profiles.phone',
         NOT has_column_privilege('anon','public.profiles','phone','SELECT'),
         'Expected: true'
  UNION ALL
  SELECT 'authenticated cannot read legacy profiles.phone',
         NOT has_column_privilege('authenticated','public.profiles','phone','SELECT'),
         'Expected: true after remediation; currently false'
  UNION ALL
  SELECT 'no anon TRUNCATE or TRIGGER on public base tables',
         NOT EXISTS (
           SELECT 1 FROM pg_class c
           JOIN pg_namespace n ON n.oid=c.relnamespace
           WHERE n.nspname='public' AND c.relkind IN ('r','p')
             AND (has_table_privilege('anon',c.oid,'TRUNCATE')
               OR has_table_privilege('anon',c.oid,'TRIGGER'))
         ),
         'Expected: true after remediation; currently false'
  UNION ALL
  SELECT 'no authenticated TRUNCATE or TRIGGER on public base tables',
         NOT EXISTS (
           SELECT 1 FROM pg_class c
           JOIN pg_namespace n ON n.oid=c.relnamespace
           WHERE n.nspname='public' AND c.relkind IN ('r','p')
             AND (has_table_privilege('authenticated',c.oid,'TRUNCATE')
               OR has_table_privilege('authenticated',c.oid,'TRIGGER'))
         ),
         'Expected: true after remediation; currently false'
  UNION ALL
  SELECT 'both dashboard views use security_invoker',
         (SELECT count(*)=2
          FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
          WHERE n.nspname='public' AND c.relkind='v'
            AND c.relname IN ('class_management_dashboard','enrollment_request_dashboard')
            AND coalesce(c.reloptions,'{}') @> ARRAY['security_invoker=true']),
         'Expected: true'
  UNION ALL
  SELECT 'contact RPCs are not executable by anon',
         NOT has_function_privilege('anon','public.admin_get_profile_contacts(uuid[])','EXECUTE')
         AND NOT has_function_privilege('anon','public.admin_list_profile_contacts(integer,integer)','EXECUTE'),
         'Expected: true'
)
SELECT test_name, passed, expected
FROM checks
ORDER BY test_name;
