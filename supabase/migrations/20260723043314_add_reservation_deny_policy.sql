create policy "Reservations are server only"
on public.gift_reservations
for all
to anon, authenticated
using (false)
with check (false);
