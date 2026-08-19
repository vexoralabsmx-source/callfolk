-- Repairs auth sign-up on Supabase projects where pgcrypto lives outside the
-- public search path. The auth trigger previously failed while generating a
-- contact ID and surfaced as "Database error saving new user".
create or replace function public.make_contact_id(display_name text)
returns text
language sql
volatile
set search_path = public
as $$
  select upper(
    rpad(left(regexp_replace(coalesce(display_name, 'USR'), '[^a-zA-Z]', '', 'g'), 3), 3, 'X') || '-' ||
    left(md5(random()::text || clock_timestamp()::text), 6) || '-' ||
    left(md5(clock_timestamp()::text || random()::text), 4)
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_username text;
  safe_display_name text;
begin
  normalized_username := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', ''), '[^a-z0-9_]', '', 'g'));
  if char_length(normalized_username) < 3 then
    normalized_username := 'user_' || left(replace(new.id::text, '-', ''), 8);
  end if;

  safe_display_name := left(trim(coalesce(new.raw_user_meta_data->>'display_name', 'New user')), 40);
  if char_length(safe_display_name) < 2 then
    safe_display_name := 'New user';
  end if;

  insert into public.profiles (id, display_name, username, contact_id)
  values (new.id, safe_display_name, normalized_username, public.make_contact_id(safe_display_name));
  return new;
end;
$$;
