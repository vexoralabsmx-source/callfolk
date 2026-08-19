create extension if not exists pgcrypto;

create type public.contact_request_status as enum ('pending', 'accepted', 'declined');
create type public.message_kind as enum ('text', 'image', 'voice', 'file', 'system');
create type public.call_status as enum ('ringing', 'connected', 'ended', 'missed', 'failed');

create or replace function public.make_contact_id(display_name text)
returns text language sql volatile set search_path = public as $$
  select upper(
    rpad(left(regexp_replace(coalesce(display_name, 'USR'), '[^a-zA-Z]', '', 'g'), 3), 3, 'X') || '-' ||
    left(md5(random()::text || clock_timestamp()::text), 6) || '-' ||
    left(md5(clock_timestamp()::text || random()::text), 4)
  );
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  username text not null unique check (username = lower(username) and username ~ '^[a-z0-9_]{3,20}$'),
  contact_id text not null unique default public.make_contact_id('USR'),
  avatar_path text,
  bio text check (char_length(bio) <= 160),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contacts (
  owner_id uuid not null references public.profiles(id) on delete cascade,
  contact_id uuid not null references public.profiles(id) on delete cascade,
  alias text check (char_length(alias) <= 40),
  created_at timestamptz not null default now(),
  primary key (owner_id, contact_id),
  check (owner_id <> contact_id)
);

create table public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status public.contact_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (sender_id, receiver_id),
  check (sender_id <> receiver_id)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false check (is_group = false),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz,
  muted_until timestamptz,
  archived_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  kind public.message_kind not null default 'text',
  body text check (char_length(body) <= 4000),
  storage_path text,
  mime_type text,
  file_size integer check (file_size between 0 and 15728640),
  reply_to_id uuid references public.messages(id) on delete set null,
  edited_at timestamptz,
  deleted_at timestamptz,
  client_id uuid not null,
  created_at timestamptz not null default now(),
  unique (sender_id, client_id),
  check (
    (kind = 'text' and body is not null and storage_path is null) or
    (kind in ('image', 'voice', 'file') and storage_path is not null) or kind = 'system'
  )
);

create table public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 12),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

create table public.calls (
  id uuid primary key default gen_random_uuid(),
  caller_id uuid not null references public.profiles(id),
  callee_id uuid not null references public.profiles(id),
  room_name text not null unique,
  status public.call_status not null default 'ringing',
  started_at timestamptz not null default now(),
  answered_at timestamptz,
  ended_at timestamptz,
  ended_by uuid references public.profiles(id),
  check (caller_id <> callee_id)
);

create table public.blocked_users (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null check (platform in ('ios', 'android')),
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id),
  reported_id uuid not null references public.profiles(id),
  reason text not null check (char_length(reason) between 3 and 240),
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_id)
);

create index messages_conversation_created_idx on public.messages (conversation_id, created_at desc) where deleted_at is null;
create index conversation_members_user_idx on public.conversation_members (user_id, conversation_id);
create index contact_requests_receiver_status_idx on public.contact_requests (receiver_id, status, created_at desc);
create index calls_participants_started_idx on public.calls (caller_id, callee_id, started_at desc);
create index profiles_search_idx on public.profiles using gin (to_tsvector('simple', display_name || ' ' || username || ' ' || contact_id));

create or replace function public.is_conversation_member(target_conversation uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.conversation_members where conversation_id = target_conversation and user_id = auth.uid());
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare normalized_username text;
begin
  normalized_username := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', ''), '[^a-z0-9_]', '', 'g'));
  if char_length(normalized_username) < 3 then normalized_username := 'user_' || left(replace(new.id::text, '-', ''), 8); end if;
  insert into public.profiles (id, display_name, username, contact_id)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'display_name', 'New user'), 40), normalized_username, public.make_contact_id(new.raw_user_meta_data->>'display_name'));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.contact_requests enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.calls enable row level security;
alter table public.blocked_users enable row level security;
alter table public.devices enable row level security;
alter table public.reports enable row level security;

create policy "authenticated profiles are discoverable" on public.profiles for select to authenticated using (
  not exists(select 1 from public.blocked_users where blocker_id = profiles.id and blocked_id = auth.uid())
);
create policy "users update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "users manage own contacts" on public.contacts for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "participants view requests" on public.contact_requests for select to authenticated using (auth.uid() in (sender_id, receiver_id));
create policy "users send requests" on public.contact_requests for insert to authenticated with check (sender_id = auth.uid());
create policy "receivers update requests" on public.contact_requests for update to authenticated using (receiver_id = auth.uid()) with check (receiver_id = auth.uid());

create policy "members view conversations" on public.conversations for select to authenticated using (public.is_conversation_member(id));
create policy "users create conversations" on public.conversations for insert to authenticated with check (created_by = auth.uid());
create policy "members view membership" on public.conversation_members for select to authenticated using (public.is_conversation_member(conversation_id));
create policy "creators add members" on public.conversation_members for insert to authenticated with check (
  exists(select 1 from public.conversations where id = conversation_id and created_by = auth.uid())
);
create policy "users update own membership" on public.conversation_members for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "members view messages" on public.messages for select to authenticated using (public.is_conversation_member(conversation_id));
create policy "members send messages" on public.messages for insert to authenticated with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id));
create policy "senders edit messages" on public.messages for update to authenticated using (sender_id = auth.uid()) with check (sender_id = auth.uid());
create policy "members view reactions" on public.message_reactions for select to authenticated using (
  exists(select 1 from public.messages m where m.id = message_id and public.is_conversation_member(m.conversation_id))
);
create policy "users manage reactions" on public.message_reactions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "participants view calls" on public.calls for select to authenticated using (auth.uid() in (caller_id, callee_id));
create policy "users start calls" on public.calls for insert to authenticated with check (caller_id = auth.uid());
create policy "participants update calls" on public.calls for update to authenticated using (auth.uid() in (caller_id, callee_id));
create policy "users manage blocks" on public.blocked_users for all to authenticated using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());
create policy "users manage devices" on public.devices for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users submit reports" on public.reports for insert to authenticated with check (reporter_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('message-media', 'message-media', false, 15728640, array['image/jpeg','image/png','image/webp','audio/m4a','audio/mp4','application/pdf'])
on conflict (id) do nothing;

create policy "members read message media" on storage.objects for select to authenticated using (
  bucket_id = 'message-media' and public.is_conversation_member((storage.foldername(name))[1]::uuid)
);
create policy "members upload message media" on storage.objects for insert to authenticated with check (
  bucket_id = 'message-media' and public.is_conversation_member((storage.foldername(name))[1]::uuid) and owner_id = auth.uid()::text
);

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.message_reactions;
alter publication supabase_realtime add table public.calls;
