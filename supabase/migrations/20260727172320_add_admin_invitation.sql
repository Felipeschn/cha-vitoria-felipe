-- O fluxo antigo de reserva por token de navegador foi substituído pelo convite
-- em 20260723055755. As funções e a coluna abaixo ficaram órfãs: nenhum código
-- da aplicação as referencia e as reservas criadas por elas não podem mais ser
-- liberadas por ninguém. Aqui elas são removidas e as unidades presas voltam ao
-- estoque.

drop function if exists public.create_gift_claim(
  uuid,
  integer,
  text,
  public.gift_reservation_status
);

drop function if exists public.update_gift_claim(text, text);

update public.gifts as gift
   set quantity_reserved = gift.quantity_reserved - legacy.total
  from (
    select reservation.gift_id, sum(reservation.quantity) as total
      from public.gift_reservations as reservation
     where reservation.claim_token_hash is not null
       and reservation.status = 'reserved'
     group by reservation.gift_id
  ) as legacy
 where gift.id = legacy.gift_id;

update public.gifts as gift
   set quantity_purchased = gift.quantity_purchased - legacy.total
  from (
    select reservation.gift_id, sum(reservation.quantity) as total
      from public.gift_reservations as reservation
     where reservation.claim_token_hash is not null
       and reservation.status = 'purchased'
     group by reservation.gift_id
  ) as legacy
 where gift.id = legacy.gift_id;

delete from public.gift_reservations
 where claim_token_hash is not null;

alter table public.gift_reservations
  drop constraint if exists gift_reservations_exactly_one_owner;

-- Remove junto a constraint de formato e o índice único do token.
alter table public.gift_reservations
  drop column if exists claim_token_hash;

alter table public.gift_reservations
  alter column invitation_id set not null;

-- O casal usa um convite como qualquer outro; a marca abaixo é o que concede o
-- painel administrativo por cima do acesso normal. O índice parcial garante que
-- exista no máximo uma linha administrativa.
alter table public.gift_invitations
  add column is_admin boolean not null default false;

create unique index gift_invitations_single_admin
  on public.gift_invitations (is_admin)
  where is_admin;

-- Sessões e tentativas de acesso só crescem. A limpeza é chamada pelo servidor
-- depois de cada acesso bem-sucedido, que é raro o bastante para o custo ser
-- irrelevante e frequente o bastante para as tabelas não acumularem lixo.
create or replace function public.purge_expired_invitation_state()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.gift_invitation_sessions
   where expires_at < now() - interval '30 days'
      or (revoked_at is not null and revoked_at < now() - interval '30 days');

  delete from public.gift_invitation_access_attempts
   where window_started_at < now() - interval '1 day'
     and (blocked_until is null or blocked_until < now());
end;
$$;

revoke execute on function public.purge_expired_invitation_state()
  from public, anon, authenticated;

grant execute on function public.purge_expired_invitation_state()
  to service_role;
