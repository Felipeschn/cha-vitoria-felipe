# Padrão definitivo do projeto

## Arquitetura

- Use Next.js com App Router, React e TypeScript no runtime oficial do Next.js.
- Use Supabase como único backend: Postgres, migrations, RLS, funções de banco,
  Realtime e, quando necessário no futuro, Auth e Storage.
- Não adicione ORM. Acesse o Supabase com `@supabase/supabase-js` e os tipos
  gerados pelo schema.
- Não adicione Cloudflare Workers, D1, Wrangler, Vinext, Vite como runtime,
  Drizzle ou outro serviço de persistência.
- Mantenha toda mudança de banco em `supabase/migrations`.
- Depois de mudar o schema, aplique a migration e regenere
  `src/types/database.types.ts` com o Supabase CLI ou MCP.

## Segurança

- Nunca exponha `SUPABASE_SECRET_KEY` ou outra chave privilegiada ao navegador.
- Código privilegiado deve ficar em módulos `server-only` e Route Handlers.
- A chave publicável pode ser usada no cliente somente com RLS e grants mínimos.
- Tabelas expostas devem ter RLS. Funções `security definer` devem usar
  `set search_path = ''`, nomes totalmente qualificados e grants explícitos.
- Reservas e alterações de quantidade devem ser atômicas no Postgres.

## Fluxo de trabalho

- Prefira o Supabase MCP conectado e limitado ao projeto para inspeção,
  migrations, advisors e geração de tipos.
- Use o Supabase CLI para reproduzir o schema localmente e para CI.
- Preserve a arquitetura e as rotas existentes; faça mudanças pequenas e
  justificadas.

## Verificação obrigatória

Execute antes de concluir:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Quando o schema mudar, execute também:

```bash
pnpm db:push
pnpm db:types
```

