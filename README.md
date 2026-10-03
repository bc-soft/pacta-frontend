# pacta-frontend

Pacta web app: freelancers who don't know each other take on a job together. The client funds a Solana escrow, and each accepted milestone is split on-chain between the team wallets as agreed up front.

Stack: Vite + React 18 + TypeScript, Tailwind v4, react-router 7, TanStack Query, Solana Wallet Adapter, Anchor.

## Running locally

```bash
npm install
cp .env.example .env.local   # fill in the values, see below
npm run dev
```

Before first use, open `VITE_API_URL` (https://localhost:8443) in the browser and accept the self-signed certificate. Otherwise every API call fails with a generic network error.

`/health` in the app checks RPC, backend, program, IDL and polyfills. Open it before a demo.

## Environment variables

| Variable | Description |
|---|---|
| `VITE_SOLANA_CLUSTER` | `devnet` |
| `VITE_SOLANA_RPC_URL` | Helius/other RPC. Don't use `api.devnet.solana.com` for the demo (429 rate limits) |
| `VITE_PACTA_PROGRAM_ID` | From the program repo after `anchor deploy` |
| `VITE_USDC_MINT` | Test USDC mint on devnet, same as the backend |
| `VITE_API_URL` | Backend, `https://localhost:8443` locally |
| `VITE_MERCURE_URL` | `https://localhost:8443/.well-known/mercure` |
| `VITE_USE_FAKE_API` | `true` = in-memory `fakeApi.ts` for the backend endpoints that are still being built |

## Program IDL

Copy `target/idl/pacta.json` and `target/types/pacta.ts` from the program repo to `src/lib/solana/idl/` (both are committed).

## Links

- Backend API docs: https://localhost:8443/api/doc
- Program repo: _TBD_

## Scripts

- `npm run dev`: dev server
- `npm run build`: typecheck + production build
- `npm run lint`: oxlint
