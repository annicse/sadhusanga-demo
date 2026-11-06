# Sadhusanga Setlists

> **This is a public code showcase of a private app.**
> The real app is private and contains the band's real data. This repository
> has no real band data, no copyrighted songs and no secrets. It is not a
> hosted demo: there is no seeded data and no public login. It exists so the
> code can be read.

Sadhusanga Setlists is an offline-first progressive web app (PWA) a band uses
to manage songs, setlists and rehearsals. It is built for use on a phone on
stage, in the dark, with unreliable Wi-Fi.

## Features in this repository

- **Song library:** songs with artist, key, tempo, performance notes, a link,
  and lyrics with inline chords (`[C] Hello [Am] world`).
- **Chord sheets:** chord parsing, transposition (sharps or flats) and
  guitar chord diagrams opened from any chord.
- **Performance mode:** full-screen reading view with adjustable font size and
  a screen wake lock, so the display stays on during a song.
- **Setlists:** build a running order by drag and drop, add per-song notes, and
  print the setlist.
- **Offline-first data:** songs and setlists are cached in IndexedDB (Dexie)
  and read from there. Changes sync as deltas, with tombstones for deletions.
  Song creates, edits and deletes made offline are queued and replayed when the
  connection returns. Saving a setlist's running order needs a connection.
- **Rehearsals:** schedule single or recurring practices, RSVP, suggest a
  change to date, time or venue, vote on suggestions, and cancel with a reason.
- **Push notifications:** Web Push reminders (morning of practice, one hour
  before, cancellations, changes, RSVPs), triggered by a cron route.
- **Members:** credentials login with roles (`user`, `admin`). Only admins can
  create accounts; there is no public sign-up.
- **PWA:** web app manifest, Serwist service worker, install prompt.
- **Dark theme** by default, with print styles for setlists and songs.

### In the private app

Not in this repository: the band's real songs, setlists, members and rehearsal
history, the real venue and door code, and the production database, hosting
and push-notification keys.

## Tech stack

- [Next.js](https://nextjs.org/) 16 (App Router, Server Actions), React 19
- [Prisma](https://www.prisma.io/) 6 with PostgreSQL ([Neon](https://neon.tech/))
- [Auth.js](https://authjs.dev/) (NextAuth v5 beta), credentials provider, bcrypt
- Tailwind CSS 4, shadcn/ui on Base UI, Lucide icons
- Dexie (IndexedDB), Serwist (service worker), web-push
- Zod for validation, Vitest for unit tests

## Run locally

Requirements: Node.js 20+ and a PostgreSQL database (a free Neon project works).

```bash
npm install
cp .env.example .env      # then fill in the values, see below
```

Create the database tables:

```bash
npx prisma db push
```

> The committed migrations in `prisma/migrations` are behind `schema.prisma`:
> they do not yet create the practice, RSVP, suggestion, vote and push
> subscription tables. Use `prisma db push` for a fresh local database until a
> new migration is added. `npx prisma migrate deploy` alone will give an
> incomplete schema.

There is no seed script, because this repository ships no demo data. Create a
first admin yourself (after `npx prisma generate`):

```bash
node -e "const {PrismaClient}=require('@prisma/client');const b=require('bcryptjs');(async()=>{const p=new PrismaClient();await p.user.create({data:{email:'admin@example.com',name:'Admin',password:await b.hash('change-me-now',10),role:'admin'}});await p.\$disconnect()})()"
```

Then start the app and sign in at `/login`:

```bash
npm run dev
```

Open <http://localhost:3000>. Change the example password right away.

The service worker is disabled in development. To try offline mode, install and
install-prompt behaviour, use a production build:

```bash
npm run build
npm start
```

Other commands: `npm run lint`, `npm test`.

## Environment variables

Copy `.env.example` to `.env`. Never commit `.env`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `AUTH_SECRET` | yes | Auth.js session signing secret (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | for push | Web Push public key (`npx web-push generate-vapid-keys`) |
| `VAPID_PRIVATE_KEY` | for push | Web Push private key |
| `VAPID_SUBJECT` | for push | `mailto:` contact for the push service |
| `CRON_SECRET` | for cron | Bearer secret for `/api/cron/practice-reminders`; the route refuses all requests when unset |
| `BAND_TIMEZONE` | no | IANA timezone for "today" and start times (default `Europe/Oslo`) |
| `DEFAULT_VENUE` | no | Default rehearsal venue (default `Demo Studio`) |
| `DOOR_CODE_VENUE_MATCH` | no | Venue name text that gets the door code (default `demo studio`) |
| `DOOR_CODE` | no | Door code shown for matching venues; empty disables it |

## Screenshots

Screenshots are not included yet.

| | |
| --- | --- |
| ![Home screen](docs/screenshots/home.png) | ![Song with chords](docs/screenshots/song.png) |
| *Home (placeholder)* | *Song with chords (placeholder)* |
| ![Setlist builder](docs/screenshots/setlist.png) | ![Rehearsal details](docs/screenshots/practice.png) |
| *Setlist builder (placeholder)* | *Rehearsal details (placeholder)* |

## Accessibility and quality

An accessibility pass targeting WCAG 2.2 AA was done by code review, not with
automated tools or assistive technology. See [`docs/accessibility.md`](docs/accessibility.md)
for what was changed and what is still open.

Lighthouse has **not** been run on this project, so no scores are published.
Unit tests (`src/lib/__tests__`) cover time and chord logic.

## License

No license has been chosen. All rights reserved unless a license file is added.
