create or replace function public.rotate_gift_invitation_code(
  p_invitation_id uuid,
  p_code_hash text,
  p_code_ciphertext text,
  p_code_hint text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session_version integer;
begin
  if p_code_hash is null or p_code_hash !~ '^[0-9a-f]{64}$'
    or p_code_ciphertext is null or char_length(p_code_ciphertext) < 20
    or p_code_hint is null
    or p_code_hint !~ '^[A-HJ-KM-NP-Z2-9]{4}$' then
    raise exception using
      errcode = '22023',
      message = 'invalid_invitation_code';
  end if;

  update public.gift_invitations
     set code_hash = p_code_hash,
         code_ciphertext = p_code_ciphertext,
         code_hint = p_code_hint,
         session_version = session_version + 1
   where id = p_invitation_id
  returning session_version into v_session_version;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'invitation_not_found';
  end if;

  update public.gift_invitation_sessions
     set revoked_at = coalesce(revoked_at, now())
   where invitation_id = p_invitation_id
     and revoked_at is null;

  return v_session_version;
end;
$$;

create or replace function public.set_gift_invitation_active(
  p_invitation_id uuid,
  p_is_active boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_active boolean;
begin
  if p_is_active is null then
    raise exception using
      errcode = '22023',
      message = 'invalid_invitation_status';
  end if;

  select invitation.is_active
    into v_current_active
    from public.gift_invitations as invitation
   where invitation.id = p_invitation_id
   for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'invitation_not_found';
  end if;

  if v_current_active is distinct from p_is_active then
    update public.gift_invitations
       set is_active = p_is_active,
           session_version = session_version + 1
     where id = p_invitation_id;

    update public.gift_invitation_sessions
       set revoked_at = coalesce(revoked_at, now())
     where invitation_id = p_invitation_id
       and revoked_at is null;
  end if;

  return p_is_active;
end;
$$;

revoke execute on function public.rotate_gift_invitation_code(
  uuid,
  text,
  text,
  text
) from public, anon, authenticated;

revoke execute on function public.set_gift_invitation_active(uuid, boolean)
  from public, anon, authenticated;

grant execute on function public.rotate_gift_invitation_code(
  uuid,
  text,
  text,
  text
) to service_role;

grant execute on function public.set_gift_invitation_active(uuid, boolean)
  to service_role;
