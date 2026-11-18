create or replace function public.admin_create_game_question(
  p_game_type text,
  p_prompt text,
  p_options jsonb,
  p_explanation text,
  p_topic text,
  p_difficulty text,
  p_age_group text,
  p_answer_payload jsonb,
  p_is_published boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_question_id uuid;
  v_answer_index integer := 0;
begin
  if (select private.is_admin()) is not true then
    raise exception 'admin access required' using errcode = '42501';
  end if;
  if p_game_type not in ('multiple_choice', 'true_false', 'word_order', 'concept_guess') then
    raise exception 'نوع بازی معتبر نیست.';
  end if;
  if p_age_group not in ('kids', 'teens') then
    raise exception 'گروه سنی معتبر نیست.';
  end if;
  if p_difficulty not in ('easy', 'medium', 'hard') then
    raise exception 'سطح دشواری معتبر نیست.';
  end if;
  if p_prompt is null or length(btrim(p_prompt)) not between 1 and 1200 then
    raise exception 'متن پرسش باید بین ۱ تا ۱۲۰۰ نویسه باشد.';
  end if;
  if p_options is null or jsonb_typeof(p_options) is distinct from 'array'
     or jsonb_array_length(p_options) not between 2 and 8 then
    raise exception 'تعداد گزینه‌ها باید بین ۲ تا ۸ باشد.';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_options) as option_item(value)
    where jsonb_typeof(option_item.value) is distinct from 'string'
       or length(btrim(option_item.value #>> '{}')) = 0
  ) then
    raise exception 'همه گزینه‌ها باید متن غیرخالی باشند.';
  end if;
  if p_game_type = 'true_false' and jsonb_array_length(p_options) <> 2 then
    raise exception 'بازی درست و نادرست دقیقاً باید دو گزینه داشته باشد.';
  end if;
  if p_explanation is null or length(p_explanation) > 2000
     or p_topic is null or length(p_topic) > 120 then
    raise exception 'توضیح یا موضوع از حد مجاز بیشتر است.';
  end if;
  if p_answer_payload is null then
    raise exception 'پاسخ صحیح الزامی است.';
  end if;
  if p_game_type = 'word_order' then
    if jsonb_typeof(p_answer_payload) is distinct from 'array'
       or jsonb_array_length(p_answer_payload) <> jsonb_array_length(p_options) then
      raise exception 'پاسخ مرتب‌سازی باید آرایه‌ای هم‌اندازه گزینه‌ها باشد.';
    end if;
    if exists (
      select 1
      from jsonb_array_elements(p_answer_payload) as answer_item(value)
      where jsonb_typeof(answer_item.value) is distinct from 'string'
         or not exists (
           select 1 from jsonb_array_elements(p_options) as option_item(value)
           where option_item.value = answer_item.value
         )
    ) then
      raise exception 'پاسخ مرتب‌سازی باید از گزینه‌های همین پرسش تشکیل شود.';
    end if;
  else
    if jsonb_typeof(p_answer_payload) is distinct from 'number'
       or (p_answer_payload #>> '{}')::numeric <> trunc((p_answer_payload #>> '{}')::numeric) then
      raise exception 'پاسخ صحیح باید شماره یک گزینه باشد.';
    end if;
    v_answer_index := (p_answer_payload #>> '{}')::integer;
    if v_answer_index < 0 or v_answer_index >= jsonb_array_length(p_options) then
      raise exception 'شماره پاسخ صحیح خارج از محدوده گزینه‌هاست.';
    end if;
  end if;

  insert into public.game_questions (
    game_type, prompt, options, explanation, topic, difficulty,
    age_group, is_published, created_by, updated_at
  )
  values (
    p_game_type, btrim(p_prompt), p_options, btrim(p_explanation), btrim(p_topic),
    p_difficulty, p_age_group, coalesce(p_is_published, false), (select auth.uid()), now()
  )
  returning id into v_question_id;

  insert into private.game_answer_keys (
    question_id, correct_option_index, answer_payload, updated_at
  )
  values (v_question_id, v_answer_index, p_answer_payload, now());

  return v_question_id;
end;
$function$;

revoke all on function public.admin_create_game_question(text,text,jsonb,text,text,text,text,jsonb,boolean) from public, anon;
grant execute on function public.admin_create_game_question(text,text,jsonb,text,text,text,text,jsonb,boolean) to authenticated;
