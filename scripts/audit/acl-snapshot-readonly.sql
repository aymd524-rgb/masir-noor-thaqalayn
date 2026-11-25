-- READ-ONLY ACL snapshot for pre-change rollback planning.
-- Run immediately before a separately approved migration, and securely retain the output.
-- Catalog metadata only: no application rows, contact values, credentials, or secrets.
-- This script does not change ACLs and does not itself perform a rollback.

WITH target_tables AS (
  SELECT c.oid, n.nspname, c.relname, c.relowner, c.relacl
  FROM pg_class c
  JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public'
    AND c.relkind IN ('r','p')
    AND c.relname IN (
      'profiles','profile_contacts','content_entries','enrollment_requests',
      'game_questions','hifz_assignment_completions','hifz_assignments','hifz_records'
    )
),
table_snapshot AS (
  SELECT jsonb_agg(jsonb_build_object(
    'schema', nspname,
    'table', relname,
    'owner', pg_get_userbyid(relowner),
    'relacl_raw', relacl::text,
    'anon_select', has_table_privilege('anon', oid, 'SELECT'),
    'anon_insert', has_table_privilege('anon', oid, 'INSERT'),
    'anon_update', has_table_privilege('anon', oid, 'UPDATE'),
    'anon_delete', has_table_privilege('anon', oid, 'DELETE'),
    'anon_truncate', has_table_privilege('anon', oid, 'TRUNCATE'),
    'anon_references', has_table_privilege('anon', oid, 'REFERENCES'),
    'anon_trigger', has_table_privilege('anon', oid, 'TRIGGER'),
    'authenticated_select', has_table_privilege('authenticated', oid, 'SELECT'),
    'authenticated_insert', has_table_privilege('authenticated', oid, 'INSERT'),
    'authenticated_update', has_table_privilege('authenticated', oid, 'UPDATE'),
    'authenticated_delete', has_table_privilege('authenticated', oid, 'DELETE'),
    'authenticated_truncate', has_table_privilege('authenticated', oid, 'TRUNCATE'),
    'authenticated_references', has_table_privilege('authenticated', oid, 'REFERENCES'),
    'authenticated_trigger', has_table_privilege('authenticated', oid, 'TRIGGER')
  ) ORDER BY relname) AS rows
  FROM target_tables
),
column_snapshot AS (
  SELECT jsonb_agg(jsonb_build_object(
    'schema', n.nspname,
    'table', c.relname,
    'column', a.attname,
    'attacl_raw', a.attacl::text
  ) ORDER BY c.relname, a.attnum) AS rows
  FROM pg_attribute a
  JOIN pg_class c ON c.oid=a.attrelid
  JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public'
    AND c.relkind IN ('r','p')
    AND a.attnum > 0 AND NOT a.attisdropped
    AND a.attacl IS NOT NULL
),
default_snapshot AS (
  SELECT jsonb_agg(jsonb_build_object(
    'owner_role', pg_get_userbyid(d.defaclrole),
    'schema', coalesce(n.nspname, '<global>'),
    'object_type', d.defaclobjtype,
    'defaclacl_raw', d.defaclacl::text
  ) ORDER BY pg_get_userbyid(d.defaclrole), n.nspname, d.defaclobjtype) AS rows
  FROM pg_default_acl d
  LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace
  WHERE d.defaclobjtype='r'
    AND pg_get_userbyid(d.defaclrole) IN ('postgres','supabase_admin')
)
SELECT jsonb_build_object(
  'captured_at_utc', now() AT TIME ZONE 'UTC',
  'database', current_database(),
  'tables', coalesce((SELECT rows FROM table_snapshot), '[]'::jsonb),
  'column_acl_entries', coalesce((SELECT rows FROM column_snapshot), '[]'::jsonb),
  'table_default_acl_entries', coalesce((SELECT rows FROM default_snapshot), '[]'::jsonb),
  'warning', 'Store this complete output before changes. Do not use generic GRANT statements as rollback.'
) AS acl_snapshot;
