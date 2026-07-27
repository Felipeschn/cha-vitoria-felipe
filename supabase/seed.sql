insert into public.gifts (name, sort_order)
values
  ('Batedeira', 1),
  ('Torradeira', 2),
  ('Liquidificador', 3),
  ('Cafeteira', 4)
on conflict do nothing;

