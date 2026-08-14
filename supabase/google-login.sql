-- ============================================================
-- Google login helper (run once in SQL Editor)
-- Saves the name of users signing in with Google to their profile.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',  -- Google login provides 'name'
      ''
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
