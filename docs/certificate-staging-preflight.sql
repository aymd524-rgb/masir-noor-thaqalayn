-- Read-only preflight for the certificate feature.
-- Run only against a staging project after the prerequisite institute migrations.
-- This script does not create, update, or delete any rows.

do $$
declare
  missing text[];
begin
  select array_agg(item) into missing
  from unnest(array[
    'public.institute_certificate_settings',
    'public.teacher_signatures',
    'public.issued_certificates'
  ]) item
  where to_regclass(item) is null;

  if missing is not null then
    raise exception 'Missing certificate tables: %', array_to_string(missing, ', ');
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.teacher_signatures'::regclass
      and tgname = 'teacher_signature_pointer_guard'
      and not tgisinternal
  ) then
    raise exception 'Missing teacher signature pointer guard trigger';
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.issued_certificates'::regclass
      and tgname = 'issued_certificates_guard_changes'
      and not tgisinternal
  ) then
    raise exception 'Missing issued certificate immutability/revocation trigger';
  end if;

  if not exists (
    select 1 from storage.buckets
    where id = 'teacher-signatures' and public is false
  ) then
    raise exception 'teacher-signatures bucket missing or unexpectedly public';
  end if;

  if not exists (
    select 1 from pg_proc
    where oid = 'public.issue_course_certificate(uuid,boolean,boolean)'::regprocedure
  ) then
    raise exception 'Missing issue_course_certificate RPC';
  end if;

  if not exists (
    select 1 from pg_proc
    where oid = 'public.revoke_course_certificate(uuid,text)'::regprocedure
  ) then
    raise exception 'Missing revoke_course_certificate RPC';
  end if;

  if has_table_privilege('authenticated', 'public.issued_certificates', 'INSERT')
     or has_table_privilege('authenticated', 'public.issued_certificates', 'UPDATE')
     or has_table_privilege('authenticated', 'public.issued_certificates', 'DELETE') then
    raise exception 'Direct authenticated writes to issued_certificates are still granted';
  end if;
end;
$$;

select
  'certificate_staging_preflight_passed' as result,
  (select count(*) from pg_policies
   where schemaname = 'public'
     and tablename in ('institute_certificate_settings','teacher_signatures','issued_certificates')) as public_policy_count,
  (select count(*) from pg_policies
   where schemaname = 'storage'
     and tablename = 'objects'
     and policyname like 'teacher_signature_%') as signature_storage_policy_count;
