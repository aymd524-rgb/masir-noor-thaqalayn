-- Optional contact email for accounts authenticated by verified phone OTP.
-- Keep it in the private contact table, not the broadly readable profiles row.
alter table public.profile_contacts
  add column if not exists email text;
