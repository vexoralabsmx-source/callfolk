-- Atomic friendship workflow. These functions are required because accepting a
-- request creates contact rows for both users, which normal client RLS cannot do.
create or replace function public.send_contact_request(target_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  request_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if target_user = auth.uid() then
    raise exception 'You cannot add yourself';
  end if;
  if exists (
    select 1 from public.contacts
    where owner_id = auth.uid() and contact_id = target_user
  ) then
    raise exception 'This person is already in your contacts';
  end if;
  if exists (
    select 1 from public.contact_requests
    where sender_id = target_user and receiver_id = auth.uid() and status = 'pending'
  ) then
    raise exception 'This person already sent you a request';
  end if;

  insert into public.contact_requests (sender_id, receiver_id, status, responded_at)
  values (auth.uid(), target_user, 'pending', null)
  on conflict (sender_id, receiver_id)
  do update set status = 'pending', responded_at = null, created_at = now()
  returning id into request_id;

  return request_id;
end;
$$;

create or replace function public.respond_to_contact_request(request_id uuid, accept_request boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.contact_requests%rowtype;
begin
  select * into request_row
  from public.contact_requests
  where id = request_id and receiver_id = auth.uid() and status = 'pending'
  for update;

  if not found then
    raise exception 'Pending request not found';
  end if;

  update public.contact_requests
  set status = case when accept_request then 'accepted'::public.contact_request_status else 'declined'::public.contact_request_status end,
      responded_at = now()
  where id = request_id;

  if accept_request then
    insert into public.contacts (owner_id, contact_id)
    values
      (request_row.sender_id, request_row.receiver_id),
      (request_row.receiver_id, request_row.sender_id)
    on conflict (owner_id, contact_id) do nothing;
  end if;
end;
$$;

revoke all on function public.send_contact_request(uuid) from public;
revoke all on function public.respond_to_contact_request(uuid, boolean) from public;
grant execute on function public.send_contact_request(uuid) to authenticated;
grant execute on function public.respond_to_contact_request(uuid, boolean) to authenticated;
