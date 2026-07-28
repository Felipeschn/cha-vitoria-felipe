-- O convite é entregue à mão, pelo WhatsApp pessoal do casal. Sem registro de
-- quem já recebeu, o controle vira memória: numa lista que cresce, alguém acaba
-- ficando sem convite ou recebendo duas vezes. A marcação é manual e vale como
-- "já mandei", não como "a pessoa abriu" — é só um marcador operacional, e não
-- toca no acesso, nas sessões nem no RSVP.

alter table public.gift_invitations
  add column is_sent boolean not null default false,
  add column sent_at timestamptz;

alter table public.gift_invitations
  add constraint gift_invitations_sent_timestamp check (
    (is_sent and sent_at is not null)
    or (not is_sent and sent_at is null)
  );

create index gift_invitations_sent_idx
  on public.gift_invitations (audience, is_sent)
  where not is_admin;

create or replace function public.set_gift_invitation_sent(
  p_invitation_id uuid,
  p_is_sent boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_is_sent is null then
    raise exception using
      errcode = '22023',
      message = 'invalid_sent_status';
  end if;

  -- O convite do casal não é enviado a ninguém; recusar aqui evita que a
  -- interface o trate como convidado por engano.
  update public.gift_invitations as invitation
     set is_sent = p_is_sent,
         sent_at = case
           when p_is_sent then coalesce(invitation.sent_at, now())
           else null
         end
   where invitation.id = p_invitation_id
     and not invitation.is_admin;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'invitation_not_found';
  end if;

  return p_is_sent;
end;
$$;

revoke execute on function public.set_gift_invitation_sent(uuid, boolean)
  from public, anon, authenticated;

grant execute on function public.set_gift_invitation_sent(uuid, boolean)
  to service_role;
