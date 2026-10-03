# Pacta — frontend: zasady i zakres pracy

> Ten plik jest instrukcją dla agenta (Claude Code) inicjującego i rozwijającego repozytorium frontendu.
> Skopiuj go do root repo frontendu jako `CLAUDE.md`. Program Solana (Anchor) i backend (Symfony) żyją w osobnych repozytoriach; frontend jest jedynym miejscem, w którym użytkownik podpisuje transakcje.

## 1. Czym jest Pacta i jaka jest Twoja rola

Pacta pozwala freelancerom, którzy się nie znają, wspólnie przyjąć zlecenie. Klient wpłaca pieniądze do escrow na Solanie, a po akceptacji każdego etapu program on-chain **sam** dzieli je między portfele zespołu według procentów uzgodnionych przed startem pracy.

Projekt hackathonowy: HackYeah 2026, wyzwanie Superteam Poland „Finance Without Intermediaries”. Jury ocenia **działającą aplikację pokazaną na żywo**: użytkownik wchodzi, łączy portfel, przechodzi pełny flow i widzi potwierdzoną transakcję w Solana Explorerze. Cytat z briefu: „wolimy prostą aplikację, w której wszystko działa, niż dopracowany design, pod którym nic się nie dzieje”.

Twoja rola:
- zbudować UI, w którym klient i zespół przechodzą cały cykl `CREATE → AGREE → FUND → WORK → ACCEPT → SPLIT`,
- **budować i wysyłać transakcje do programu Anchor**, podpisywane portfelem użytkownika (Phantom, Solflare, Backpack),
- czytać stan finansowy **bezpośrednio z chaina**, a opisy, profile i powiadomienia z backendu,
- w każdym kluczowym momencie pokazać link do Explorera, bo to jest dowód dla jury.

Frontend nie przechowuje danych, nie ma własnej bazy ani sekretów. Po odświeżeniu wszystko odczytuje z chaina i z API.

Grupa docelowa (brief wymaga jej nazwania wprost): **freelancerzy i ich klienci spoza świata krypto**. Język UI: angielski (demo dla jury), prosty, bez żargonu. Słowo „wallet” może zostać, ale „PDA”, „ATA”, „lamports”, „bump” nie mają prawa pojawić się na ekranie.

## 2. Stack

- **Vite + React 18 + TypeScript**. Nie Next.js: Wallet Adapter i Anchor są czysto klienckie, SSR tylko przeszkadza, a strona i tak jest aplikacją za logowaniem portfelem.
- Routing: `react-router`. Dane: `@tanstack/react-query`. Style: Tailwind. Formularze: `react-hook-form` + `zod`.
- Solana: `@solana/web3.js`, `@solana/spl-token`, `@solana/wallet-adapter-react`, `@solana/wallet-adapter-react-ui`, `@solana/wallet-adapter-wallets`, `@coral-xyz/anchor`.
- Powiadomienia na żywo: natywny `EventSource` do huba Mercure (bez biblioteki).

```bash
npm create vite@latest pacta-web -- --template react-ts
cd pacta-web && npm i
npm i @solana/web3.js @solana/spl-token @coral-xyz/anchor \
      @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets @solana/wallet-adapter-base \
      @tanstack/react-query react-router react-hook-form zod
npm i -D tailwindcss @tailwindcss/vite vite-plugin-node-polyfills
```

`vite-plugin-node-polyfills` (Buffer, process) jest potrzebny dla `@coral-xyz/anchor` w przeglądarce. Dodaj do `vite.config.ts` i sprawdź, że `window.Buffer` istnieje, zanim zaczniesz debugować dziwne błędy.

Struktura:

```
src/
  app/            router, providers (Wallet, QueryClient, Auth)
  lib/solana/     connection, program (IDL + Anchor Program), pda.ts (seeds), tx.ts (send + confirm + sync)
  lib/api/        client (fetch z JWT), auth.ts (SIWS), types.ts (zgodne z /api/doc.json)
  lib/mercure/    subscribe(wallet) → EventSource
  features/
    auth/         ConnectWallet, useAuth (nonce → signMessage → verify → JWT)
    projects/     CreateProject (wizard), ProjectDashboard, ContractSummary, Signing
    milestones/   MilestoneCard, Submit, ClientReview (Accept / Request changes / Dispute), PaymentResult
    disputes/     ArbiterScreen, Evidence
    profile/      ProfileForm, Avatar
  components/     ExplorerLink, TxButton (loading + błędy), StatusPill, AmountUsdc
```

## 3. Konfiguracja (zmienne środowiskowe)

Plik `.env.local` (gitignore). Klucz RPC jest publiczny w przeglądarce, więc u dostawcy ogranicz go do domeny frontendu.

```
VITE_SOLANA_CLUSTER=devnet
VITE_SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=...      # NIE api.devnet.solana.com (limity 429 na sali)
VITE_PACTA_PROGRAM_ID=...                                            # z repo programu po anchor deploy
VITE_USDC_MINT=...                                                   # testowy mint używany na devnecie, ten sam co w backendzie
VITE_API_URL=https://localhost:8443                                  # backend lokalnie
VITE_MERCURE_URL=https://localhost:8443/.well-known/mercure
```

Backend lokalnie działa na `https://localhost:8443` z certyfikatem self-signed. Przed pierwszym użyciem otwórz ten adres w przeglądarce i zaakceptuj certyfikat, inaczej `fetch` zwróci błąd sieci bez wyjaśnienia. CORS backendu dopuszcza `localhost` na dowolnym porcie.

## 4. Integracja z backendem

Dokumentacja na żywo: `https://localhost:8443/api/doc` (Swagger UI) i `/api/doc.json` (OpenAPI, z którego możesz wygenerować typy). Wszystkie błędy mają format `application/problem+json`: `{status, title, detail, violations?[{field, message}]}`. Pokaż `detail` użytkownikowi, `violations` przy polach formularza.

### 4.1 Logowanie portfelem (Sign-In With Solana)

Backend nie ma haseł. Tożsamość = portfel. Flow jest trzyetapowy i musi być wykonany dokładnie tak:

```ts
// 1. poproś o wiadomość
const { message } = await api.post('/api/auth/nonce', { wallet: publicKey.toBase58() });
// 2. podpisz DOKŁADNIE ten tekst (bez trim, bez zmiany końców linii)
const sig = await wallet.signMessage(new TextEncoder().encode(message));
// 3. wymień na JWT; podpis w base58
const { token } = await api.post('/api/auth/verify', { wallet, message, signature: bs58.encode(sig) });
```

Token (24 h) trzymaj w pamięci + `sessionStorage`, wysyłaj jako `Authorization: Bearer`. Przy 401 wyloguj i pokaż „Sign in again”. Nonce jest jednorazowy i ważny 5 minut; jeśli użytkownik zwleka z podpisem, pobierz nowy. Logowanie uruchamiaj dopiero, gdy użytkownik chce coś zapisać w backendzie (szkic projektu, profil), a nie przy samym podłączeniu portfela.

### 4.2 Endpointy dostępne dziś

| Metoda i ścieżka | Auth | Do czego |
|---|---|---|
| `GET /api/health` | nie | status backendu i RPC, do ekranu diagnostycznego |
| `POST /api/auth/nonce`, `POST /api/auth/verify` | nie | logowanie |
| `GET /api/me`, `PUT /api/me` | tak | własny profil (displayName, avatarUrl, bio, skills[], contact) |
| `GET /api/profiles/{wallet}` | nie | profil publiczny, 404 gdy brak |
| `GET /api/profiles?wallets=a,b,c` | nie | hurtowo dla listy zespołu; brakujące profile wracają jako puste obiekty, więc zawsze renderuj z `wallet` jako fallbackiem |

### 4.3 Endpointy w budowie (kontrakt uzgodniony, mogą się minimalnie zmienić)

| Metoda i ścieżka | Do czego |
|---|---|
| `POST /api/projects` | szkic: `{title, description, milestones:[{title, acceptanceCriteria}]}` → `{id, pda, seed}` |
| `GET /api/projects?wallet=` | moje projekty (jako klient lub członek), z metadanymi i kopią stanu on-chain |
| `GET /api/projects/{pda}` | metadane + ostatnia znana kopia stanu (`slot`, `syncedAt`, `stale`) |
| `PUT /api/projects/{pda}/milestones/{index}` | tytuł, opis, kryteria akceptacji |
| `POST /api/projects/{pda}/milestones/{index}/deliverables` | `{url, type, note}` linki do wyników |
| `POST /api/projects/{pda}/sync` | `{signature}` po każdej potwierdzonej transakcji; zwraca odświeżony stan |
| `GET /api/projects/{pda}/history` | oś czasu zdarzeń z sygnaturami do Explorera |
| `POST /api/projects/{pda}/milestones/{index}/dispute/evidence` | argumentacja i linki w sporze |
| `GET /api/notifications`, `POST /api/notifications/{id}/read` | lista i oznaczanie |

Do czasu, aż te endpointy powstaną, buduj ekrany na danych z chaina i zamockowanym API (`msw` albo prosty `fakeApi.ts`), z jednym przełącznikiem w konfiguracji.

### 4.4 Powiadomienia (Mercure)

```ts
const url = new URL(import.meta.env.VITE_MERCURE_URL);
url.searchParams.append('topic', `/wallets/${wallet}`);
const es = new EventSource(url, { withCredentials: false });
es.onmessage = (e) => { const n = JSON.parse(e.data); toast(n.title); queryClient.invalidateQueries(['project', n.pda]); };
```

Hub w dev pozwala na anonimową subskrypcję. Każde powiadomienie ma `type`, `pda`, `title`, `signature?`.

## 5. Integracja z programem Anchor

### 5.1 IDL i adresy

IDL (`pacta.json`) i typy (`pacta.ts`) kopiuj z repo programu (`target/idl`, `target/types`) do `src/lib/solana/idl/`. Po każdym `anchor deploy` z nowym adresem aktualizuj `VITE_PACTA_PROGRAM_ID`. Program ma stałe seedy PDA, licz je u siebie:

```ts
// project   = ["project",   client, seed_u64_le]
// milestone = ["milestone", project, index_u8]
// vault     = ["vault",     project]
export const projectPda = (client: PublicKey, seed: BN) =>
  PublicKey.findProgramAddressSync([Buffer.from('project'), client.toBuffer(), seed.toArrayLike(Buffer, 'le', 8)], PROGRAM_ID)[0];
export const milestonePda = (project: PublicKey, index: number) =>
  PublicKey.findProgramAddressSync([Buffer.from('milestone'), project.toBuffer(), Buffer.from([index])], PROGRAM_ID)[0];
export const vaultPda = (project: PublicKey) =>
  PublicKey.findProgramAddressSync([Buffer.from('vault'), project.toBuffer()], PROGRAM_ID)[0];
```

Backend wylicza dokładnie te same adresy, więc `seed` dla nowego projektu generuj losowo (u64) **po stronie frontendu** i przekaż go backendowi w szkicu, a potem do `create_project`.

### 5.2 Instrukcje, które wywołujesz

| Instrukcja | Kto klika | Uwagi |
|---|---|---|
| `createProject(seed, mint, arbiter, members[])` | klient | `members`: `{wallet, role}` bez klienta, max 8 |
| `createMilestone(index, amount, allocations[])` | klient | `amount` w jednostkach bazowych (USDC × 1 000 000); `allocations` `{wallet, bps}`, suma 10 000; jedna transakcja na milestone, można zbatchować z `createProject` |
| `acceptContract()` | każdy członek | po ostatnim podpisie projekt staje się `Active` |
| `fundMilestone(index)` | klient | przelewa z ATA klienta do vault; wcześniej upewnij się, że ATA klienta istnieje i ma saldo |
| `submitMilestone(index)` | członek | wcześniej zapisz linki do wyników w backendzie |
| `acceptMilestone(index)` | klient | **`remainingAccounts` = ATA każdego członka w kolejności `allocations`**; utwórz brakujące ATA w tej samej transakcji (`createAssociatedTokenAccountIdempotentInstruction`) |
| `requestChanges(index)` | klient | |
| `openDispute(index)` | klient lub członek | tylko gdy projekt ma arbitra |
| `resolveDispute(index, resolution)` | arbiter | `resolution` jedna z `Team100 / Team75 / Team50 / Team25 / Client100`; `remainingAccounts` jak przy accept + ATA klienta |
| `cancelUnstartedMilestone(index)` | klient | zwrot do klienta |

### 5.3 Wzorzec wysyłki transakcji (jeden hook dla wszystkich)

```ts
async function sendAndSync(build: () => Promise<Transaction>, pda: PublicKey) {
  const tx = await build();
  const sig = await wallet.sendTransaction(tx, connection);
  const bh = await connection.getLatestBlockhash('confirmed');
  await connection.confirmTransaction({ signature: sig, ...bh }, 'confirmed');
  await api.post(`/api/projects/${pda}/sync`, { signature: sig }).catch(() => {}); // backend może nie być gotowy; chain już jest
  queryClient.invalidateQueries(['chain', pda.toBase58()]);
  return sig;
}
```

Zasady:
- Stan finansowy czytaj z chaina: `program.account.project.fetch(pda)`, `program.account.milestone.fetch(...)`, saldo vault przez `getTokenAccountBalance`. Backendowa kopia jest wygodą, nie prawdą.
- Każdy przycisk transakcyjny to `TxButton` ze stanami: idle → „Confirm in wallet” → „Confirming…” → sukces z linkiem do Explorera lub błąd z czytelnym komunikatem. Odrzucenie w portfelu nie jest błędem aplikacji, pokaż „Cancelled in wallet”.
- Błędy programu (`AnchorError`) mapuj na zdania po angielsku: `InvalidStatus` → „This milestone is not ready for that action”, `Unauthorized` → „Only the client can do this”.
- Linki do Explorera zawsze z `?cluster=devnet`: `https://explorer.solana.com/tx/${sig}?cluster=devnet`, `/address/${pda}?cluster=devnet`.

## 6. Ekrany (MVP) i co pokazują

1. **Connect wallet**: przycisk Wallet Adapter, po połączeniu lista moich projektów (`GET /api/projects?wallet=` lub `getProgramAccounts` z filtrem po kliencie/członku).
2. **Create project (wizard)**: nazwa i opis → **Team builder** (adres portfela, rola; podgląd profilu z `/api/profiles?wallets=`) → **Milestone builder** (nazwa, kwota USDC, kryteria akceptacji, podział w procentach z walidacją sumy 100% i podglądem kwot per osoba) → arbiter (adres) → **Contract summary**.
3. **Contract summary / „What exactly are you signing?”**: pełny podgląd kwot, procentów, warunków zmian i sporu. Z tego ekranu klient wysyła `createProject` + `createMilestone`, a każdy członek `acceptContract`. Lista podpisów z fajkami.
4. **Project dashboard**: saldo escrow („1,000 USDC locked, secured on-chain”), zespół z avatarami, milestone'y ze statusami i podziałem, oś czasu z linkami do Explorera, przyciski zależne od roli i statusu.
5. **Fund**: klient, pokazuje saldo USDC w portfelu i kwotę do zablokowania, po sukcesie „Funds secured on-chain” + link.
6. **Submit**: członek, linki do wyników (Figma, PR, preview) zapisywane w backendzie, potem `submitMilestone`.
7. **Client review**: trzy przyciski Accept / Request changes / Dispute. Przy Request changes pole komentarza (backend). Przy Dispute formularz argumentacji.
8. **Payment result**: „1,000 USDC distributed” z rozbiciem 400 / 350 / 250 i jednym linkiem do transakcji, gdzie widać trzy przelewy. **To jest slajd kulminacyjny demo, dopieść go.**
9. **Arbiter screen**: argumenty obu stron, kryteria akceptacji zapisane przed startem, wybór z pięciu dozwolonych decyzji, `resolveDispute`.
10. **Profile**: nazwa, avatar (URL), bio, umiejętności.

Role w UI wynikają z porównania adresu podłączonego portfela z `Project.client`, `members[]`, `arbiter`. Jedna osoba na demo przełącza konta w Phantomie, więc nagłówek musi zawsze pokazywać „You are: Client / Team member / Arbiter”.

## 7. Przygotowanie demo

- Trzy do pięciu portfeli w Phantomie (klient, dwóch-trzech członków, arbiter) z SOL devnetowym i testowym USDC u klienta. Keypairy i skrypt zasilania są w repo programu (`scripts/demo-setup.ts`); użyj tych samych.
- Przejdź pełny flow dzień wcześniej na docelowym RPC i zapisz sygnatury. Nagraj wideo zapasowe (brief wymaga filmu do 3 minut i tak).
- Strona ma działać z pustym cache i po odświeżeniu w środku flow. Żadnego stanu tylko w pamięci, który po F5 psuje ekran.
- Deploy: Vercel lub Netlify ze zmiennymi `VITE_*`; `VITE_API_URL` na publiczny adres backendu. Lokalnie `npm run dev` + backend w Dockerze wystarczy na prezentację, ale miej publiczny URL dla jury w HackTribe.

## 8. Priorytety, gdy brakuje czasu

1. Connect wallet + Create project + Team builder + podział + Contract signing. Bez tego nie ma „tymczasowego zespołu”.
2. Fund + widok escrow.
3. Submit + Accept + **Payment result** z Explorerem. Absolutne minimum kompletnego demo.
4. Request changes, dashboard z historią, profile.
5. Dispute + ekran arbitra.
6. Powiadomienia Mercure, polish, animacje.

Buduj pionowo: jeden ekran działający end-to-end z prawdziwą transakcją jest wart więcej niż pięć makiet.

## 9. Git i porządek

- Commituj po każdym domkniętym kroku (ekran, hook, integracja instrukcji). Conventional Commits: `feat(projects): add milestone builder with bps validation`, `feat(solana): wire acceptMilestone with remaining accounts`, `fix(auth): resign when nonce expired`, `chore: pin program id after devnet deploy`.
- Nie commituj `.env.local`. IDL i typy programu commituj (są publiczne i potrzebne do builda).
- README: jak uruchomić, jakie zmienne, link do backendowego `/api/doc`, link do repo programu, lista ekranów ze screenshotami na koniec.

## 10. Czego NIE robimy

Marketplace freelancerów, reputacja, chat, KYC, fiat, mainnet, własny backend/BFF w Next.js, własna baza. Interfejs może być surowy. Ma działać na żywo, od wejścia do transakcji widocznej w Explorerze.
