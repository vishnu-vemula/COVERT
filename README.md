# COVERT

**Capture · OCR · Validate · Extract · Read · Tabulate**

COVERT turns photos, scans and PDFs into structured tables. People review and edit the result, listen to it, and export it as CSV. The mobile app is the product; the website is marketing only.

## Repository structure

```
apps/mobile       Expo (React Native) app — the product. Firebase Auth, capture, results, audio, export.
apps/web          Next.js marketing site. No accounts, no app features.
services/api      Fastify API for Cloud Run — token verification, Cloud Vision OCR, OpenAI structuring, Firestore.
packages/shared   Domain types, Zod schemas, error copy and CSV helpers used by the API and the app.
firebase/         Firestore security rules and indexes (deployed with firebase.json).
```

## Environment variables

**API** — `services/api/.env` (see `.env.example`)

| Variable | Purpose |
| --- | --- |
| `FIREBASE_PROJECT_ID` | Firebase / Google Cloud project for Auth and Firestore |
| `GOOGLE_APPLICATION_CREDENTIALS` | Local only: service-account key with Firestore and Cloud Vision access. Unset on Cloud Run. |
| `OPENAI_API_KEY` | Server-side key for structuring |
| `OPENAI_MODEL` | Optional, defaults to `gpt-5.4-mini` |
| `CONVERSIONS_PER_HOUR`, `REQUESTS_PER_MINUTE` | Optional rate limits (per user / per IP) |
| `CORS_ORIGINS` | Optional, only for running the app in a browser during development |

**Mobile** — `apps/mobile/.env` (see `.env.example`). Public client config only, never secrets.

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | API base URL |
| `EXPO_PUBLIC_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_APP_ID`, `_MESSAGING_SENDER_ID` | Firebase web app config |
| `EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST` | Optional, use the Auth emulator |

**Website** — `NEXT_PUBLIC_SITE_URL`, the production URL used for the canonical link, sitemap, robots.txt and social images (on Vercel it falls back to the production domain). Store, terms and repository links are placeholders in `apps/web/src/lib/links.ts`.

## Local setup

1. Node 22.12+. Run `npm install` at the repository root.
2. In Firebase: create a project, enable **Email/Password** sign-in, create a **Firestore** database, register a **Web app** for the mobile config.
3. In Google Cloud (same project): enable the **Cloud Vision API** and create a service account with *Cloud Datastore User* and *Cloud Vision* access for local development.
4. Deploy the Firestore rules and index: `npx firebase-tools deploy --only firestore --project <id>`.
5. Copy `services/api/.env.example` and `apps/mobile/.env.example` to `.env` and fill them in. On a physical phone, `EXPO_PUBLIC_API_URL` must be your computer's LAN address.

## Development commands

```bash
npm run dev:api        # API with reload on http://localhost:8080
npm run dev:mobile     # Expo dev server (camera and native modules need a development build or Expo Go)
npm run dev:web        # marketing site on http://localhost:3000
```

Without cloud credentials, the app can run against a local preview stack: the Firebase Auth emulator plus the real API routes with fixture OCR/structuring and in-memory storage.

```bash
npx firebase-tools emulators:start --only auth --project demo-covert
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 npm run preview -w @covert/api
```

Set `EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099` and `EXPO_PUBLIC_API_URL=http://localhost:8080` in the mobile `.env`.

## Tests and checks

```bash
npm test               # Vitest: shared, API (fixtures, auth, ownership, streaming, errors), mobile logic
npm run typecheck
npm run lint
npm run build          # API bundle and website
```

## Deployment notes

- **API → Cloud Run.** Build from the repository root: `docker build -f services/api/Dockerfile .` (or `gcloud run deploy --source .` with that Dockerfile). Attach a service account with Firestore and Vision access, put `OPENAI_API_KEY` in Secret Manager, and set `FIREBASE_PROJECT_ID`. A request timeout of 300 s covers long PDFs. Rate limits are kept per instance.
- **Firestore.** Deploy `firebase/firestore.rules` and `firebase/firestore.indexes.json` before first use; the index on `ownerUid` + `createdAt` powers History, and `tables`/`ocrText` are excluded from indexing.
- **Website → Vercel** (or any Next.js host) with `apps/web` as the root directory. Replace the placeholder links first.
- **Mobile → EAS Build.** Set the `EXPO_PUBLIC_*` variables as EAS environment variables and replace the placeholder bundle identifier `com.example.covert` in `app.json`.
