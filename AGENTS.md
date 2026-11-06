# AGENTS.md

Guidance for AI coding agents and new contributors.

## Overview

Sadhusanga Setlists is an offline-first PWA for a band: song library with chord
sheets, setlists, rehearsal scheduling with RSVPs, and push reminders. This
repository is a **public showcase of a private app**. Never add real band data,
real venues, door codes, copyrighted lyrics or secrets.

Stack: Next.js 16 (App Router, Server Actions), React 19, Prisma 6 +
PostgreSQL (Neon), Auth.js v5 (credentials), Tailwind 4 + shadcn/ui (Base UI),
Dexie (IndexedDB), Serwist (service worker), Zod, Vitest.

## Commands

```bash
npm install
cp .env.example .env        # fill in values; never commit .env
npx prisma db push          # migrations are behind schema.prisma, see README
npm run dev                 # service worker is disabled in dev
npm run lint
npm test                    # vitest run
npm run build               # prisma generate && next build --webpack
npm start                   # production server, needed to test the PWA
```

Run `npm run lint` and `npm run build` before committing.

## Structure

```
prisma/schema.prisma        data model (source of truth)
prisma/migrations/          SQL migrations (currently incomplete)
public/manifest.json        web app manifest and icons
src/app/sw.ts               service worker source (output: public/sw.js, git-ignored)
src/app/layout.tsx          root layout, metadata, skip link
src/app/(app)/              authenticated pages and their server actions
src/app/api/                REST routes: songs, setlists, sync/replay, cron
src/proxy.ts                auth redirect (Next 16 "proxy", formerly middleware)
src/auth.ts                 Auth.js config
src/components/             feature components; ui/ holds shadcn primitives
src/lib/db.ts               Dexie schema (IndexedDB)
src/lib/sync.ts             delta sync and offline mutation queue
src/lib/offline-songs.ts    offline song writes
src/lib/band-config.ts      env-driven band settings
src/lib/chords.ts           chord parsing and transposition
src/lib/validations/        Zod schemas shared by client and server
src/lib/__tests__/          unit tests
```

## Conventions

- TypeScript strict; path alias `@/*` maps to `src/*`.
- 4-space indent per `.editorconfig`/`.prettierrc`; LF line endings.
- Mutations are Server Actions in `actions.ts` next to the page. Check auth with
  `requireUser()` / `requireAdmin()` from `src/lib/auth-guards.ts`.
- Validate input with the Zod schemas in `src/lib/validations/` on both the
  client (offline path) and the server.
- Songs and setlists are read from Dexie on the client and synced from
  `/api/songs` and `/api/setlists`. Deletions create `DeletedRecord`
  tombstones. Never edit an existing Dexie `version()`; add a new one.
- Secrets come from `process.env` only. Add every new variable to
  `.env.example` and the README table.
- Do not hard-code a venue, timezone or door code; use `src/lib/band-config.ts`.
- Dark theme only. Use design tokens (`bg-card`, `text-muted-foreground`,
  `border-border`), not raw greys, and keep text at 4.5:1 contrast.

### Accessibility rules (WCAG 2.2 AA target)

- Icon-only buttons need `aria-label`.
- Every input needs a `<Label htmlFor>`; show errors with `role="alert"`.
- Anything draggable needs a button alternative.
- Do not remove the global `:focus-visible` outline in `globals.css`.
- Keep targets at least 24px (40px+ on coarse pointers) and respect
  `prefers-reduced-motion`.
- Each page exports `metadata.title`. Use one `<h1>` per page.
- Known gaps are listed in `docs/accessibility.md`.

## Testing

- Unit tests live in `src/lib/__tests__/` and run with `npm test` (Vitest).
  Existing tests cover time handling and chord logic; add a test for any new
  pure function in `src/lib/`.
- There are no component or end-to-end tests. For UI changes check keyboard
  operation, a narrow mobile viewport and offline mode (production build,
  DevTools > Network > Offline).
- Lighthouse has not been run on this project; do not publish scores that were
  not measured.
