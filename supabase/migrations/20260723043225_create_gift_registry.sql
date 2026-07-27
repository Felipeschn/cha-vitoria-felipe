create type public.gift_reservation_status as enum (
  'reserved',
  'purchased',
  'cancelled'
);

create table public.gifts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  quantity_total integer not null default 1,
  quantity_reserved integer not null default 0,
  quantity_purchased integer not null default 0,
  quantity_available integer generated always as (
    quantity_total - quantity_reserved - quantity_purchased
  ) stored,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gifts_name_length check (char_length(btrim(name)) between 2 and 80),
  constraint gifts_description_length check (
    description is null or char_length(description) <= 500
  ),
  constraint gifts_quantity_total_positive check (quantity_total > 0),
  constraint gifts_quantity_reserved_nonnegative check (quantity_reserved >= 0),
  constraint gifts_quantity_purchased_nonnegative check (quantity_purchased >= 0),
  constraint gifts_quantity_within_total check (
    quantity_reserved + quantity_purchased <= quantity_total
  ),
  constraint gifts_sort_order_nonnegative check (sort_order >= 0)
);

create unique index gifts_name_unique
  on public.gifts (lower(btrim(name)));

create index gifts_public_order_idx
  on public.gifts (is_active, sort_order, created_at);

create table public.gift_reservations (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references public.gifts(id) on delete restrict,
  quantity integer not null,
  status public.gift_reservation_status not null,
  claim_token_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  purchased_at timestamptz,
  cancelled_at timestamptz,
  constraint gift_reservations_quantity_positive check (quantity > 0),
  constraint gift_reservations_claim_token_hash_format check (
    claim_token_hash ~ '^[0-9a-f]{64}$'
  ),
  constraint gift_reservations_status_timestamps check (
    (status = 'reserved' and purchased_at is null and cancelled_at is null)
    or (status = 'purchased' and purchased_at is not null and cancelled_at is null)
    or (status = 'cancelled' and cancelled_at is not null)
  )
);

create unique index gift_reservations_claim_token_hash_unique
  on public.gift_reservations (claim_token_hash);

create index gift_reservations_gift_active_idx
  on public.gift_reservations (gift_id, status)
  where status in ('reserved', 'purchased');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger gifts_set_updated_at
before update on public.gifts
for each row execute function public.set_updated_at();

create trigger gift_reservations_set_updated_at
before update on public.gift_reservations
for each row execute function public.set_updated_at();

create or replace function public.create_gift_claim(
  p_gift_id uuid,
  p_quantity integer,
  p_claim_token_hash text,
  p_status public.gift_reservation_status default 'reserved'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_available integer;
  v_reservation_id uuid;
begin
  if p_quantity is null or p_quantity < 1 or p_quantity > 20 then
    raise exception using
      errcode = '22023',
      message = 'invalid_quantity';
  end if;

  if p_claim_token_hash is null
    or p_claim_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception using
      errcode = '22023',
      message = 'invalid_claim_token';
  end if;

  if p_status not in ('reserved', 'purchased') then
    raise exception using
      errcode = '22023',
      message = 'invalid_initial_status';
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

  if v_available < p_quantity then
    raise exception using
      errcode = 'P0001',
      message = 'insufficient_quantity';
  end if;

  insert into public.gift_reservations (
    gift_id,
    quantity,
    status,
    claim_token_hash,
    purchased_at
  )
  values (
    p_gift_id,
    p_quantity,
    p_status,
    p_claim_token_hash,
    case when p_status = 'purchased' then now() else null end
  )
  returning id into v_reservation_id;

  update public.gifts
     set quantity_reserved = quantity_reserved
       + case when p_status = 'reserved' then p_quantity else 0 end,
         quantity_purchased = quantity_purchased
       + case when p_status = 'purchased' then p_quantity else 0 end
   where id = p_gift_id;

  return v_reservation_id;
end;
$$;

create or replace function public.update_gift_claim(
  p_claim_token_hash text,
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
  if p_claim_token_hash is null
    or p_claim_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception using
      errcode = '22023',
      message = 'invalid_claim_token';
  end if;

  if p_action not in ('confirm', 'release') then
    raise exception using
      errcode = '22023',
      message = 'invalid_claim_action';
  end if;

  select reservation.*
    into v_reservation
    from public.gift_reservations as reservation
   where reservation.claim_token_hash = p_claim_token_hash
   for update;

  if not found or v_reservation.status = 'cancelled' then
    raise exception using
      errcode = 'P0002',
      message = 'claim_not_found';
  end if;

  perform 1
    from public.gifts
   where id = v_reservation.gift_id
   for update;

  if p_action = 'confirm' then
    if v_reservation.status = 'purchased' then
      return 'purchased';
    end if;

    update public.gifts
       set quantity_reserved = quantity_reserved - v_reservation.quantity,
           quantity_purchased = quantity_purchased + v_reservation.quantity
     where id = v_reservation.gift_id;

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
     where id = v_reservation.gift_id;

    update public.gift_reservations
       set status = 'cancelled',
           cancelled_at = now()
     where id = v_reservation.id;

    v_next_status := 'cancelled';
  end if;

  return v_next_status;
end;
$$;

alter table public.gifts enable row level security;
alter table public.gift_reservations enable row level security;

revoke all on table public.gifts from anon, authenticated;
revoke all on table public.gift_reservations from anon, authenticated;

grant select, insert, update, delete on table public.gifts to service_role;
grant select, insert, update, delete
  on table public.gift_reservations to service_role;

grant select (
  id,
  name,
  description,
  quantity_total,
  quantity_reserved,
  quantity_purchased,
  quantity_available,
  is_active,
  sort_order,
  created_at,
  updated_at
) on table public.gifts to anon, authenticated;

create policy "Public can read active gifts"
on public.gifts
for select
to anon, authenticated
using (is_active);

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.create_gift_claim(
  uuid,
  integer,
  text,
  public.gift_reservation_status
) from public, anon, authenticated;
revoke execute on function public.update_gift_claim(text, text)
  from public, anon, authenticated;

grant execute on function public.create_gift_claim(
  uuid,
  integer,
  text,
  public.gift_reservation_status
) to service_role;
grant execute on function public.update_gift_claim(text, text) to service_role;

do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
      from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'gifts'
  ) then
    alter publication supabase_realtime add table public.gifts;
  end if;
end
$$;
