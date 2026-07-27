-- A confirmação de presença chega pelo WhatsApp e é registrada à mão pelo
-- casal. É só um marcador de RSVP: não interfere no acesso ao convite nem nas
-- sessões, por isso não mexe em session_version.

alter table public.gift_invitations
  add column is_confirmed boolean not null default false,
  add column confirmed_at timestamptz;

alter table public.gift_invitations
  add constraint gift_invitations_confirmed_timestamp check (
    (is_confirmed and confirmed_at is not null)
    or (not is_confirmed and confirmed_at is null)
  );

create index gift_invitations_confirmation_idx
  on public.gift_invitations (audience, is_confirmed)
  where not is_admin;

create or replace function public.set_gift_invitation_confirmed(
  p_invitation_id uuid,
  p_is_confirmed boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_is_confirmed is null then
    raise exception using
      errcode = '22023',
      message = 'invalid_confirmation_status';
  end if;

  -- O convite do casal não é um RSVP; recusar aqui evita que a interface o
  -- trate como convidado por engano.
  update public.gift_invitations as invitation
     set is_confirmed = p_is_confirmed,
         confirmed_at = case
           when p_is_confirmed then coalesce(invitation.confirmed_at, now())
           else null
         end
   where invitation.id = p_invitation_id
     and not invitation.is_admin;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'invitation_not_found';
  end if;

  return p_is_confirmed;
end;
$$;

revoke execute on function public.set_gift_invitation_confirmed(uuid, boolean)
  from public, anon, authenticated;

grant execute on function public.set_gift_invitation_confirmed(uuid, boolean)
  to service_role;
