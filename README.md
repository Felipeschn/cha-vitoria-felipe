# Chá de Casa Nova — Vitória & Felipe

Convite digital construído com Next.js, React, TypeScript e App Router.

## Requisitos

- Node.js 20.9 ou superior
- pnpm

## Desenvolvimento local

```bash
pnpm install
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Validações locais

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

O comando `pnpm check` executa lint, verificação de tipos e build de produção.

## Rotas

- `/` — convite da família
- `/familia` — convite da família
- `/amigos` — convite dos amigos, com data em breve

## Estrutura

```text
src/
├── app/                    # Rotas, layout e estilos globais
├── components/invitation/ # Componentes visuais do convite
└── lib/                    # Dados tipados e funções puras
```

As páginas e componentes estáticos são Server Components. Somente a animação de
rolagem e o botão de copiar a chave Pix usam Client Components.

## Publicação futura

O projeto está preparado para ser conectado à Vercel posteriormente. Nenhum
deploy é executado pelos scripts locais.
