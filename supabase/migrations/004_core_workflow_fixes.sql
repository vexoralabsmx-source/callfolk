-- Installs the complete contact + direct-message workflow in one idempotent
-- migration. Safe to run even if 003_contact_request_workflow.sql was applied.
create or replace function public.send_contact_request(target_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  result_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if target_user = auth.uid() then raise exception 'You cannot add yourself'; end if;
  if not exists (select 1 from public.profiles where id = target_user) then raise exception 'Account not found'; end if;
  if exists (select 1 from public.contacts where owner_id = auth.uid() and contact_id = target_user) then
    raise exception 'This person is already in your contacts';
  end if;
  if exists (select 1 from public.contact_requests where sender_id = target_user and receiver_id = auth.uid() and status = 'pending') then
    raise exception 'This person already sent you a request';
  end if;

  insert into public.contact_requests (sender_id, receiver_id, status, responded_at)
  values (auth.uid(), target_user, 'pending', null)
  on conflict (sender_id, receiver_id)
  do update set status = 'pending', responded_at = null, created_at = now()
  returning id into result_id;
  return result_id;
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
  select * into request_row from public.contact_requests
  where id = request_id and receiver_id = auth.uid() and status = 'pending'
  for update;
  if not found then raise exception 'Pending request not found'; end if;

  update public.contact_requests
  set status = case when accept_request then 'accepted'::public.contact_request_status else 'declined'::public.contact_request_status end,
      responded_at = now()
  where id = request_id;

  if accept_request then
    insert into public.contacts (owner_id, contact_id)
    values (request_row.sender_id, request_row.receiver_id), (request_row.receiver_id, request_row.sender_id)
    on conflict (owner_id, contact_id) do nothing;
  end if;
end;
$$;

create or replace function public.create_direct_conversation(target_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  result_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if target_user = auth.uid() then raise exception 'You cannot message yourself'; end if;
  if not exists (select 1 from public.profiles where id = target_user) then raise exception 'Account not found'; end if;
  if exists (
    select 1 from public.blocked_users
    where (blocker_id = auth.uid() and blocked_id = target_user)
       or (blocker_id = target_user and blocked_id = auth.uid())
  ) then raise exception 'Messaging is unavailable for this contact'; end if;

  select mine.conversation_id into result_id
  from public.conversation_members mine
  join public.conversation_members theirs on theirs.conversation_id = mine.conversation_id and theirs.user_id = target_user
  where mine.user_id = auth.uid()
    and (select count(*) from public.conversation_members all_members where all_members.conversation_id = mine.conversation_id) = 2
  order by mine.joined_at desc
  limit 1;

  if result_id is null then
    insert into public.conversations (created_by) values (auth.uid()) returning id into result_id;
    insert into public.conversation_members (conversation_id, user_id)
    values (result_id, auth.uid()), (result_id, target_user);
  end if;
  return result_id;
end;
$$;

revoke all on function public.send_contact_request(uuid) from public;
revoke all on function public.respond_to_contact_request(uuid, boolean) from public;
revoke all on function public.create_direct_conversation(uuid) from public;
grant execute on function public.send_contact_request(uuid) to authenticated;
grant execute on function public.respond_to_contact_request(uuid, boolean) to authenticated;
grant execute on function public.create_direct_conversation(uuid) to authenticated;
