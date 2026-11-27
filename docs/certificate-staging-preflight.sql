-- Read-only preflight for the certificate feature.
-- Run only against a staging project after the prerequisite institute migrations.
-- This script does not create, update, or delete any rows.

do $$
declare
  missing text[];
begin
  select array_agg(item) into missing
  from unnest(array[
    'public.institutions',
    'public.institute_memberships',
    'public.classes',
    'public.enrollments',
    'public.profiles',
    'public.institute_certificate_settings',
    'public.teacher_signatures',
    'public.issued_certificates'
  ]) item
  where to_regclass(item) is null;

  if missing is not null then
    raise exception 'Missing certificate tables: %', array_to_string(missing, ', ');
  end if;

  if to_regprocedure('private.is_institute_member(uuid,text[])') is null
     or to_regprocedure('private.user_is_institute_member(uuid,uuid,text[])') is null
     or to_regprocedure('private.can_manage_class_certificates(uuid)') is null
     or to_regprocedure('private.is_admin()') is null then
    raise exception 'Required institute authorization helper functions are missing';
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.institute_certificate_settings'::regclass
      and tgname = 'certificate_settings_audit_guard'
      and not tgisinternal
  ) then
    raise exception 'Missing certificate settings audit guard trigger';
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

  if has_function_privilege('anon', 'public.issue_course_certificate(uuid,boolean,boolean)', 'EXECUTE')
     or has_function_privilege('anon', 'public.revoke_course_certificate(uuid,text)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.issue_course_certificate(uuid,boolean,boolean)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.revoke_course_certificate(uuid,text)', 'EXECUTE') then
    raise exception 'Certificate RPC execution grants are not restricted as expected';
  end if;

  -- SECURITY DEFINER RPCs and trigger functions must use an empty search_path.
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where (
      (n.nspname = 'public' and p.proname in ('issue_course_certificate','revoke_course_certificate'))
      or (n.nspname = 'private' and p.proname in ('guard_certificate_settings_audit','guard_teacher_signature_pointer','guard_issued_certificate_changes'))
    )
    and (
      not p.prosecdef
      or not coalesce(p.proconfig, array[]::text[]) @> array['search_path=""']::text[]
    )
  ) then
    raise exception 'A certificate SECURITY DEFINER function is missing an empty search_path';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'teacher_signature_object_boundary_update'
  ) or not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'teacher_signature_object_boundary_delete'
  ) then
    raise exception 'Missing restrictive Storage update/delete boundary policies';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'issued_certificates'
      and policyname = 'issued_certificates_read_scope'
  ) then
    raise exception 'Missing issued certificate read-scope policy';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'teacher_signature_certificate_recipient_read'
  ) then
    raise exception 'Missing certificate recipient signature policy';
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
