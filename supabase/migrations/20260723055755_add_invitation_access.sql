create table public.gift_invitations (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  audience text not null,
  code_hash text not null,
  code_ciphertext text not null,
  code_hint text not null,
  session_version integer not null default 1,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gift_invitations_display_name_length check (
    char_length(btrim(display_name)) between 2 and 80
  ),
  constraint gift_invitations_audience_valid check (
    audience in ('amigos', 'familia')
  ),
  constraint gift_invitations_code_hash_format check (
    code_hash ~ '^[0-9a-f]{64}$'
  ),
  constraint gift_invitations_code_hint_format check (
    code_hint ~ '^[A-HJ-KM-NP-Z2-9]{4}$'
  ),
  constraint gift_invitations_session_version_positive check (
    session_version > 0
  )
);

create unique index gift_invitations_code_hash_unique
  on public.gift_invitations (code_hash);

create index gift_invitations_admin_order_idx
  on public.gift_invitations (is_active desc, audience, display_name);

create table public.gift_invitation_sessions (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null
    references public.gift_invitations (id) on delete cascade,
  token_hash text not null,
  session_version integer not null,
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gift_invitation_sessions_token_hash_format check (
    token_hash ~ '^[0-9a-f]{64}$'
  ),
  constraint gift_invitation_sessions_version_positive check (
    session_version > 0
  ),
  constraint gift_invitation_sessions_expiry_after_creation check (
    expires_at > created_at
  )
);

create unique index gift_invitation_sessions_token_hash_unique
  on public.gift_invitation_sessions (token_hash);

create index gift_invitation_sessions_active_invitation_idx
  on public.gift_invitation_sessions (invitation_id, expires_at)
  where revoked_at is null;

create table public.gift_invitation_access_attempts (
  fingerprint_hash text primary key,
  attempt_count integer not null default 1,
  window_started_at timestamptz not null default now(),
  blocked_until timestamptz,
  updated_at timestamptz not null default now(),
  constraint gift_invitation_access_attempts_fingerprint_format check (
    fingerprint_hash ~ '^[0-9a-f]{64}$'
  ),
  constraint gift_invitation_access_attempts_count_positive check (
    attempt_count > 0
  )
);

alter table public.gift_reservations
  add column invitation_id uuid
    references public.gift_invitations (id) on delete restrict;

alter table public.gift_reservations
  alter column claim_token_hash drop not null;

alter table public.gift_reservations
  add constraint gift_reservations_exactly_one_owner check (
    num_nonnulls(claim_token_hash, invitation_id) = 1
  );

create unique index gift_reservations_invitation_active_unique
  on public.gift_reservations (gift_id, invitation_id)
  where invitation_id is not null
    and status in ('reserved', 'purchased');

create index gift_reservations_invitation_history_idx
  on public.gift_reservations (invitation_id, created_at desc)
  where invitation_id is not null;

create trigger gift_invitations_set_updated_at
before update on public.gift_invitations
for each row execute function public.set_updated_at();

create trigger gift_invitation_sessions_set_updated_at
before update on public.gift_invitation_sessions
for each row execute function public.set_updated_at();

create or replace function public.consume_invitation_access_attempt(
  p_fingerprint_hash text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt_count integer;
  v_blocked_until timestamptz;
begin
  if p_fingerprint_hash is null
    or p_fingerprint_hash !~ '^[0-9a-f]{64}$' then
    raise exception using
      errcode = '22023',
      message = 'invalid_fingerprint';
  end if;

  insert into public.gift_invitation_access_attempts as attempt (
    fingerprint_hash,
    attempt_count,
    window_started_at,
    blocked_until
  )
  values (
    p_fingerprint_hash,
    1,
    now(),
    null
  )
  on conflict (fingerprint_hash) do update
     set attempt_count = case
           when attempt.window_started_at < now() - interval '15 minutes'
             then 1
           else attempt.attempt_count + 1
         end,
         window_started_at = case
           when attempt.window_started_at < now() - interval '15 minutes'
             then now()
           else attempt.window_started_at
         end,
         blocked_until = case
           when attempt.blocked_until > now()
             then attempt.blocked_until
           when attempt.window_started_at >= now() - interval '15 minutes'
             and attempt.attempt_count + 1 > 12
             then now() + interval '15 minutes'
           else null
         end,
         updated_at = now()
  returning attempt_count, blocked_until
       into v_attempt_count, v_blocked_until;

  return v_attempt_count <= 12
    and (v_blocked_until is null or v_blocked_until <= now());
end;
$$;

create or replace function public.set_gift_reservation_quantity(
  p_gift_id uuid,
  p_invitation_id uuid,
  p_quantity integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_available integer;
  v_delta integer;
  v_previous_quantity integer;
  v_reservation_id uuid;
  v_status public.gift_reservation_status;
begin
  if p_quantity is null or p_quantity < 1 or p_quantity > 20 then
    raise exception using
      errcode = '22023',
      message = 'invalid_quantity';
  end if;

  perform 1
    from public.gift_invitations as invitation
   where invitation.id = p_invitation_id
     and invitation.is_active
     and (
       invitation.expires_at is null
       or invitation.expires_at > now()
     );

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'invitation_not_found';
  end if;

  select gift.quantity_available
    into v_available
    from public.gifts as gift
   where gift.id = p_gift_id
     and gift.is_active
   for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'gift_not_found';
  end if;

  select
    reservation.id,
    reservation.quantity,
    reservation.status
    into
      v_reservation_id,
      v_previous_quantity,
      v_status
    from public.gift_reservations as reservation
   where reservation.gift_id = p_gift_id
     and reservation.invitation_id = p_invitation_id
     and reservation.status in ('reserved', 'purchased')
   for update;

  if not found then
    if v_available < p_quantity then
      raise exception using
        errcode = 'P0001',
        message = 'insufficient_quantity';
    end if;

    insert into public.gift_reservations (
      gift_id,
      invitation_id,
      quantity,
      status
    )
    values (
      p_gift_id,
      p_invitation_id,
      p_quantity,
      'reserved'
    )
    returning id into v_reservation_id;

    update public.gifts
       set quantity_reserved = quantity_reserved + p_quantity
     where id = p_gift_id;

    return v_reservation_id;
  end if;

  if v_status = 'purchased' then
    raise exception using
      errcode = '55000',
      message = 'purchased_reservation_locked';
  end if;

  v_delta := p_quantity - v_previous_quantity;

  if v_delta > 0 and v_available < v_delta then
    raise exception using
      errcode = 'P0001',
      message = 'insufficient_quantity';
  end if;

  update public.gift_reservations
     set quantity = p_quantity
   where id = v_reservation_id;

  update public.gifts
     set quantity_reserved = quantity_reserved + v_delta
   where id = p_gift_id;

  return v_reservation_id;
end;
$$;

create or replace function public.update_invitation_gift_reservation(
  p_gift_id uuid,
  p_invitation_id uuid,
  p_action text
)
returns public.gift_reservation_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reservation public.gift_reservations%rowtype;
  v_next_status public.gift_reservation_status;
begin
  if p_action not in ('confirm', 'release') then
    raise exception using
      errcode = '22023',
      message = 'invalid_claim_action';
  end if;

  perform 1
    from public.gift_invitations as invitation
   where invitation.id = p_invitation_id
     and invitation.is_active
     and (
       invitation.expires_at is null
       or invitation.expires_at > now()
     );

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'invitation_not_found';
  end if;

  perform 1
    from public.gifts
   where id = p_gift_id
   for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'gift_not_found';
  end if;

  select reservation.*
    into v_reservation
    from public.gift_reservations as reservation
   where reservation.gift_id = p_gift_id
     and reservation.invitation_id = p_invitation_id
     and reservation.status in ('reserved', 'purchased')
   for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'claim_not_found';
  end if;

  if p_action = 'confirm' then
    if v_reservation.status = 'purchased' then
      return 'purchased';
    end if;

    update public.gifts
       set quantity_reserved = quantity_reserved - v_reservation.quantity,
           quantity_purchased = quantity_purchased + v_reservation.quantity
     where id = p_gift_id;

    update public.gift_reservations
       set status = 'purchased',
           purchased_at = now()
     where id = v_reservation.id;

    v_next_status := 'purchased';
  else
    update public.gifts
       set quantity_reserved = quantity_reserved
         - case when v_reservation.status = 'reserved'
             then v_reservation.quantity else 0 end,
           quantity_purchased = quantity_purchased
         - case when v_reservation.status = 'purchased'
             then v_reservation.quantity else 0 end
     where id = p_gift_id;

    update public.gift_reservations
       set status = 'cancelled',
           cancelled_at = now()
     where id = v_reservation.id;

    v_next_status := 'cancelled';
  end if;

  return v_next_status;
end;
$$;

alter table public.gift_invitations enable row level security;
alter table public.gift_invitation_sessions enable row level security;
alter table public.gift_invitation_access_attempts enable row level security;

create policy gift_invitations_deny_public_access
  on public.gift_invitations
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy gift_invitation_sessions_deny_public_access
  on public.gift_invitation_sessions
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy gift_invitation_access_attempts_deny_public_access
  on public.gift_invitation_access_attempts
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

revoke all on table public.gift_invitations
  from public, anon, authenticated;
revoke all on table public.gift_invitation_sessions
  from public, anon, authenticated;
revoke all on table public.gift_invitation_access_attempts
  from public, anon, authenticated;

grant select, insert, update, delete
  on table public.gift_invitations
  to service_role;
grant select, insert, update, delete
  on table public.gift_invitation_sessions
  to service_role;
grant select, insert, update, delete
  on table public.gift_invitation_access_attempts
  to service_role;

revoke execute on function public.consume_invitation_access_attempt(text)
  from public, anon, authenticated;
revoke execute on function public.set_gift_reservation_quantity(uuid, uuid, integer)
  from public, anon, authenticated;
revoke execute on function public.update_invitation_gift_reservation(uuid, uuid, text)
  from public, anon, authenticated;

grant execute on function public.consume_invitation_access_attempt(text)
  to service_role;
grant execute on function public.set_gift_reservation_quantity(uuid, uuid, integer)
  to service_role;
grant execute on function public.update_invitation_gift_reservation(uuid, uuid, text)
  to service_role;
