# AGENTS.md

Instructions for AI coding agents (and humans) working in this repository.

## Project overview

Sadhusanga Setlists is an offline-first PWA for a band. It covers a song
library with chord sheets, setlists, rehearsal scheduling with RSVPs, and push
reminders.

This repository is a **public showcase of a private app**. It contains no real
band data. Never add real venues, door codes, member details, copyrighted
lyrics or secrets.

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Actions), React 19, TypeScript (strict) |
| Data | PostgreSQL (Neon) via Prisma 6 |
| Auth | Auth.js v5, credentials provider, bcrypt, roles `user` / `admin` |
| UI | Tailwind CSS 4, shadcn/ui on Base UI, Lucide icons, dark theme only |
| Offline | Dexie (IndexedDB), Serwist service worker, delta sync with a write queue |
| Validation | Zod, shared by client and server |
| Tests | Vitest |

## Setup

```bash
npm install
cp .env.example .env     # fill in values; never commit .env
npx prisma db push       # the SQL migrations are behind schema.prisma (see README)
```

Environment variables are documented in `.env.example` and the README. Add any
new variable to both.

## Commands

| Task | Command |
| --- | --- |
| Dev server (service worker disabled) | `npm run dev` |
| Lint | `npm run lint` |
| Unit tests | `npm test` (watch: `npm run test:watch`) |
| Production build | `npm run build` (`prisma generate && next build --webpack`) |
| Production server (needed to test the PWA) | `npm start` |

Run lint, tests and build before every commit.

## Project structure

```
prisma/schema.prisma         Data model (source of truth)
public/manifest.json         Web app manifest and icons
src/app/layout.tsx           Root layout: metadata, viewport, skip link
src/app/(app)/               Authenticated pages, each with its server actions
src/app/api/                 Route handlers: songs, setlists, sync/replay, cron
src/app/sw.ts                Service worker source (output public/sw.js, git-ignored)
src/proxy.ts                 Auth redirect (the Next 16 replacement for middleware)
src/auth.ts                  Auth.js configuration
src/components/              Feature components; ui/ holds shadcn primitives
src/lib/db.ts                Dexie schema
src/lib/sync.ts              Delta sync and offline mutation queue
src/lib/offline-songs.ts     Offline song writes
src/lib/chords.ts            Chord parsing and transposition
src/lib/band-config.ts       Env-driven band settings
src/lib/validations/         Zod schemas
src/lib/__tests__/           Unit tests
```

## Code style

- TypeScript strict. Use the `@/*` alias for imports from `src/`.
- 4 spaces, LF line endings (`.editorconfig`, `.prettierrc`).
- Use design tokens (`bg-card`, `text-muted-foreground`, `border-border`)
  rather than raw colours.
- Prefer server components. Add `'use client'` only when state, effects or
  browser APIs are needed.
- No `any` in new code, and no `console.log` left behind.

## Architecture rules

- Mutations are Server Actions in the `actions.ts` next to the page. Start each
  one with `requireUser()` or `requireAdmin()` from `src/lib/auth-guards.ts`.
- Validate with the schemas in `src/lib/validations/` on the client (offline
  path) and again on the server.
- Songs and setlists are read from Dexie on the client and synced from
  `/api/songs` and `/api/setlists`. Deletions write `DeletedRecord`
  tombstones.
- Never edit an existing Dexie `version()`. Add a new one.
- Do not hard-code a venue, timezone or door code. Use `src/lib/band-config.ts`.

## Accessibility (WCAG 2.2 AA target)

- Icon-only controls need an `aria-label`. Every input needs a `<Label htmlFor>`.
- Show form errors with `role="alert"`.
- Anything draggable needs a button alternative.
- Keep the global `:focus-visible` outline in `globals.css`. Targets must be at
  least 24px, and larger on coarse pointers.
- Respect `prefers-reduced-motion`.
- Every page exports `metadata.title` and has one `<h1>`.
- Known gaps are listed in `docs/accessibility.md`.

## Testing

- Unit tests live in `src/lib/__tests__/`. Add one for any new pure function in
  `src/lib/`.
- There are no component or end-to-end tests. For UI changes, check keyboard
  operation, a narrow mobile viewport and offline mode (production build, then
  DevTools > Network > Offline).
- Do not publish Lighthouse or accessibility scores that were not measured.

## Security

- Secrets come from `process.env` only. Never commit `.env`, print its
  contents, or put keys in code, tests or docs.
- `/api/cron/*` is protected by `CRON_SECRET` and must keep failing closed.
- Keep `src/proxy.ts` as the auth gate for everything except the listed public
  paths.

## Commits and pull requests

- Small, focused commits with an imperative subject line ("Add X", "Fix Y").
- Lint, tests and build must pass first.
- Do not rewrite or force-push shared history without the owner's approval.

## Boundaries

- **Ask first:** schema changes (they need a migration), new dependencies, and
  changes to auth or the service worker caching.
- **Never:** add real band data, copyrighted lyrics, secrets, or generated
  files (`public/sw.js`) to git.
