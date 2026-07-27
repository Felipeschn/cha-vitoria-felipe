-- Link opcional para o item que o casal tem em mente. É uma sugestão de
-- referência, não um lugar obrigatório de compra: o convidado continua livre
-- para comprar onde quiser.

alter table public.gifts
  add column reference_url text;

-- A coluna vira href na página do convidado, então o protocolo é validado já
-- aqui: sem isso, um `javascript:` gravado por engano viraria script na página.
alter table public.gifts
  add constraint gifts_reference_url_format check (
    reference_url is null
    or (
      reference_url ~ '^https?://[^[:space:]]+$'
      and char_length(reference_url) <= 2048
    )
  );

grant select (reference_url) on table public.gifts to anon, authenticated;
