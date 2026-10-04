# pacta-frontend

Pacta web app: freelancers who don't know each other take on a job together. The client funds a Solana escrow, and each accepted milestone is split on-chain between the team wallets as agreed up front.

Stack: Vite + React 18 + TypeScript, Tailwind v4, react-router 7, TanStack Query, Solana Wallet Adapter, Anchor.

## Running locally

```bash
npm install
cp .env.example .env.local   # fill in the values, see below
npm run dev
```

`npm run dev` proxies `/api` and `/.well-known/mercure` to the backend (`BACKEND_PROXY_TARGET`, default `https://localhost:8443`), so the browser never sees the backend's self-signed certificate and there is no CORS to configure.

`/health` in the app checks RPC, backend, program, IDL and polyfills. Open it before a demo.

## Environment variables

| Variable | Description |
|---|---|
| `VITE_SOLANA_CLUSTER` | `devnet` |
| `VITE_SOLANA_RPC_URL` | Any devnet RPC with your own key (Helius, Alchemy, ...). Websockets aren't needed: transactions are confirmed by polling `getSignatureStatuses`. Don't use `api.devnet.solana.com` (429 rate limits) |
| `VITE_PACTA_PROGRAM_ID` | `AgSfAvkXWBugaYg768AAZdpUT3oNYkx7JQGmZTrUwHWK` (devnet). Must match the IDL in `src/lib/solana/idl/` |
| `VITE_USDC_MINT` | `6VLBMnVsHDDmg6a4tDqo9X4hMiCAZuuVDYJrivMVjvF9`: test USDC (6 decimals) from the program repo's demo setup, same as the backend |
| `VITE_API_URL` | Empty locally (same origin through the dev proxy). Full backend URL only for a deployed build |
| `VITE_MERCURE_URL` | Empty locally (defaults to `<origin>/.well-known/mercure`). Full hub URL only for a deployed build |
| `BACKEND_PROXY_TARGET` | Dev proxy target, `https://localhost:8443` |

## Screens

| Route | Who | What |
|---|---|---|
| `/` | everyone | Connect wallet, list of my projects (from chain + backend titles) |
| `/projects/new` | client | Wizard: project → team → milestones & split → arbiter → “What exactly are you signing?” |
| `/projects/:pda` | everyone | Dashboard: signatures, escrow balance, milestones with role-based actions, activity |
| `/projects/:pda/milestones/:i/payment` | everyone | Payment result — who got what + one Explorer link |
| `/projects/:pda/milestones/:i/dispute` | arbiter | Both sides, agreed criteria, one of five decisions |
| `/profile` | everyone | Name, avatar, bio, skills |
| `/health` | dev | Pre-demo checklist |

Everything the UI knows about the on-chain layout (account fields, status enums, instruction account names) lives in
`src/lib/solana/accounts.ts` and `src/lib/solana/instructions.ts`, written against the IDL.

Team member roles are a fixed list (`src/lib/roles.ts`): on-chain they are a `u8` index (backend, frontend, design, qa,
other), in the backend the same names as strings.

## Program IDL

Copy `target/idl/pacta.json` and `target/types/pacta.ts` from the program repo to `src/lib/solana/idl/` after every `anchor build` (both are committed). `/health` warns when the IDL address differs from `VITE_PACTA_PROGRAM_ID`.

## Links

- Backend API docs: https://localhost:8443/api/doc
- Program repo: `../pacta-anchor` (README: devnet addresses, demo wallets, `scripts/demo-setup.ts`)

## Scripts

- `npm run dev`: dev server
- `npm run build`: typecheck + production build
- `npm run lint`: oxlint
