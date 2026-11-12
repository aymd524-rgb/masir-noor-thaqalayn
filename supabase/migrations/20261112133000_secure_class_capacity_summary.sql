create or replace function public.get_active_class_availability()
returns table (
  class_id uuid,
  capacity integer,
  enrolled_count bigint,
  remaining_seats integer
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    c.id,
    c.capacity,
    count(e.id)::bigint as enrolled_count,
    case
      when c.capacity is null then null
      else greatest(c.capacity::bigint - count(e.id), 0)::integer
    end as remaining_seats
  from public.classes as c
  left join public.enrollments as e on e.class_id = c.id
  where c.is_active = true
    and (c.course_id is null or exists (
      select 1
      from public.courses as co
      where co.id = c.course_id
        and co.is_active = true
    ))
    and auth.uid() is not null
  group by c.id, c.capacity;
$$;

revoke all on function public.get_active_class_availability() from public;
revoke all on function public.get_active_class_availability() from anon;
grant execute on function public.get_active_class_availability() to authenticated;
