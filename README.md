# finance-tracker

A local-first personal finance tracker for small businesses - bookkeeping across income, spending, operations, and projects, with multi-user workspaces, AI assistance, and export-ready reports.

## Features

- **Complete bookkeeping pages** - Dashboard, Income (Pemasukan), Spending (Belanja), Operations (Operasional), Projects (Proyek), and Book Closing (Tutup Buku) in a clean Indonesian-language UI
- **Local-first by design** - day-to-day data lives in the browser (localStorage hooks), so the app stays fast and works without a backend round-trip on every entry
- **Optional cloud sync with Supabase** - multi-workspace support with members and roles (`admin` / `secretary`), backed by SQL migrations for business tables and row-level security
- **AI-powered assistance** (optional, via Gemini) - all AI calls are proxied through the server so the API key never reaches the browser:
- Transaction auto-categorization with confidence scores
- Spending analysis and personalized financial insights
- A conversational financial assistant that reads your transaction data
- Receipt and invoice scanning (Gemini Vision) that extracts merchant, amount, category, and line items
- Graceful local-heuristic fallbacks when no API key is configured or the quota is exhausted
- **Reports & export** - Excel export buttons and a print-optimized stylesheet for clean print-to-PDF statements
- **Workspace setup flow** - onboarding for creating your first workspace, plus test-data seeding

## Architecture

```
.
├── server.ts # Express server: Gemini proxy routes + serves the app
├── src/
│ ├── pages/ # Dashboard, Pemasukan, Belanja, Operasional, Proyek, TutupBuku
│ ├── components/ # Auth, WorkspaceSetup, DatePicker, shared StatCard/ExportButtons/PrintHeader
│ ├── contexts/ # WorkspaceContext (current workspace, role, members)
│ ├── hooks/ # useLocalStorage - the local-first persistence layer
│ ├── lib/ # Supabase client, formatters
│ ├── services/ # Gemini client helpers
│ └── styles/ # Tailwind entry + print stylesheet
├── supabase/migrations/ # business tables, RLS policies, seed data
├── scratch/seed.ts # test-data seeding script
└── .env.example
```

**How it runs.** `server.ts` is the single backend process:

- **Development** - mounts Vite as middleware and serves the React app with hot reload (port 3000).
- **Production** - serves the static build from `dist/`.
- **AI proxy** - exposes `POST /api/gemini/categorize`, `/api/gemini/analyze`, `/api/gemini/chat`, and `/api/gemini/scan-receipt` (10 MB payload limit for receipt images). Requests fall back to deterministic local heuristics when `GEMINI_API_KEY` is absent or quota-limited, so the app is fully usable without AI.

**Data model.** The frontend keeps working state locally; Supabase (PostgreSQL) provides workspaces, workspace members, and shared business records, with migrations and RLS defined in `supabase/migrations/`.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, lucide-react, Motion |
| State | React Context + localStorage (local-first) |
| Cloud sync | Supabase (PostgreSQL, RLS) |
| Backend | Express 4, esbuild-bundled for production |
| AI | Gemini 2.5 Flash via @google/genai (server-side only) |
| Export | Excel export, print stylesheet (PDF via browser print) |

## Getting started

**Prerequisites:** Node.js 18+

```bash
git clone https://github.com/indraaryaLabs/finance-tracker.git
cd finance-tracker

npm install

# Configure environment (Gemini + Supabase)
cp .env.example .env
# GEMINI_API_KEY - optional; enables AI features
# VITE_SUPABASE_URL - optional; enables cloud workspaces
# VITE_SUPABASE_ANON_KEY

npm run dev
```

Open **http://localhost:3000**. The app works out of the box with local storage and built-in heuristics; AI and cloud-workspace features activate once the corresponding keys are provided.

Production build:

```bash
npm run build # vite build + esbuild bundle -> dist/
npm start # serves the app from dist/ on port 3000
```

Optional: seed demo data into your first Supabase workspace after signing up in the UI:

```bash
npx tsx scratch/seed.ts
```

## License

Released under the [MIT License](LICENSE).
