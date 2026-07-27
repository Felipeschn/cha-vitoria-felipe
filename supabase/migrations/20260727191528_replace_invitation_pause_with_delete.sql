-- Pausar um convite não resolvia nenhum problema real: era irreversível para
-- quem já estava dentro (revogava as sessões sem devolvê-las na reativação) e
-- deixava o convite errado na lista para sempre. Some em favor da exclusão.
--
-- A coluna is_active continua no schema como interruptor de emergência via SQL
-- — o acesso e a leitura de sessão ainda a respeitam —, mas nenhuma tela a
-- altera.

drop function if exists public.set_gift_invitation_active(uuid, boolean);

create or replace function public.delete_gift_invitation(
  p_invitation_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_admin boolean;
  v_reservation record;
begin
  select invitation.is_admin
    into v_is_admin
    from public.gift_invitations as invitation
   where invitation.id = p_invitation_id
   for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'invitation_not_found';
  end if;

  -- Apagar o convite do casal tiraria o acesso ao próprio painel.
  if v_is_admin then
    raise exception using
      errcode = '55000',
      message = 'admin_invitation_locked';
  end if;

  -- As linhas dos presentes são travadas em ordem estável antes de qualquer
  -- alteração, para que exclusões simultâneas não se atropelem.
  perform 1
    from public.gifts
   where id in (
     select reservation.gift_id
       from public.gift_reservations as reservation
      where reservation.invitation_id = p_invitation_id
   )
   order by id
   for update;

  -- Tudo que este convite ainda segurava volta ao estoque.
  for v_reservation in
    select reservation.gift_id, reservation.quantity, reservation.status
      from public.gift_reservations as reservation
     where reservation.invitation_id = p_invitation_id
       and reservation.status in ('reserved', 'purchased')
  loop
    update public.gifts
       set quantity_reserved = quantity_reserved
             - case when v_reservation.status = 'reserved'
                 then v_reservation.quantity else 0 end,
           quantity_purchased = quantity_purchased
             - case when v_reservation.status = 'purchased'
                 then v_reservation.quantity else 0 end
     where id = v_reservation.gift_id;
  end loop;

  delete from public.gift_reservations
   where invitation_id = p_invitation_id;

  -- As sessões saem por cascade na chave estrangeira.
  delete from public.gift_invitations
   where id = p_invitation_id;
end;
$$;

revoke execute on function public.delete_gift_invitation(uuid)
  from public, anon, authenticated;

grant execute on function public.delete_gift_invitation(uuid)
  to service_role;
