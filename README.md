# COVERT

**Capture · OCR · Validate · Extract · Read · Tabulate**

COVERT turns images and documents into structured, editable tables.

Upload or capture a document, extract its text with OCR, convert the result into structured data, review or edit the generated table, listen to the extracted information, and export it for further use.

## Overview

Documents often contain useful information locked inside images, scans, PDFs, receipts, statements, forms, and reports.

COVERT provides a simple pipeline for turning that information into structured data:

```
Document
   ↓
OCR
   ↓
Text normalization
   ↓
LLM structured extraction
   ↓
Schema validation
   ↓
Editable table
   ↓
Read · Edit · Export
```

The project includes:

- a React Native mobile application
- Firebase authentication
- an authenticated TypeScript API
- OCR processing
- LLM-based structured extraction
- editable tables
- text-to-speech
- document history
- CSV export
- a separate marketing website

## Features

### Document processing

- Capture documents using the camera
- Import images and PDFs
- Extract text using OCR
- Convert OCR output into structured table data
- Support multiple tables within a document
- Flag uncertain extracted values
- Preserve original OCR text for review

### Table tools

- View structured results
- Edit extracted cells
- Copy table data
- Export to CSV
- Reopen previous conversions

### Audio

COVERT can read extracted information using device text-to-speech.

Users can:

- read document summaries
- read full tables
- navigate between rows
- change speech speed
- optionally include column names

### Authentication

Mobile authentication is handled with Firebase Authentication.

Supported flows include:

- account creation
- sign in
- sign out
- password reset
- persisted sessions

User-owned data is scoped to the authenticated Firebase UID.

## Tech Stack

### Mobile

- React Native
- Expo
- TypeScript
- Expo Router
- Firebase Authentication
- Zustand
- Zod
- Expo Speech

### Backend

- Node.js
- TypeScript
- Fastify
- Firebase Admin SDK
- Google Cloud Vision
- OpenAI API
- Zod

### Data

- Cloud Firestore

### Website

- Next.js
- TypeScript
- Tailwind CSS

### Deployment

- Google Cloud Run
- Firebase
- Vercel

## Architecture

```
                           COVERT

              ┌──────────────┴──────────────┐
              │                             │
        Mobile Application            Landing Website
       React Native / Expo                Next.js
              │
              │ Firebase Authentication
              ▼
          COVERT API
       Node.js + Fastify
              │
       Firebase ID Token
          Verification
              │
              ▼
       Document Processing
              │
        Google Cloud Vision
              │
              ▼
         Normalized OCR
              │
              ▼
      Structured Extraction
           OpenAI API
              │
              ▼
        Zod Validation
              │
        ┌─────┴─────┐
        │           │
    Firestore    Mobile Result
                    │
             ┌──────┼──────┐
             │      │      │
           Edit   Audio   Export
```

The mobile client never receives privileged backend credentials.

Authenticated API routes verify Firebase ID tokens server-side before accessing user-owned resources.

## Repository Structure

```
covert/
├── apps/
│   ├── mobile/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   │
│   └── web/
│       ├── app/
│       ├── components/
│       └── public/
│
├── services/
│   └── api/
│       ├── src/
│       │   ├── routes/
│       │   ├── services/
│       │   ├── middleware/
│       │   ├── schemas/
│       │   └── utils/
│       └── tests/
│
├── packages/
│   └── shared/
│
├── .env.example
└── README.md
```

The exact structure may evolve as the project grows.

## Processing Pipeline

### 1. Input

The user captures or imports a supported document.

Initial formats include:

```
JPG
JPEG
PNG
PDF
```

### 2. OCR

Document content is extracted using Google Cloud Vision.

OCR output is normalized before being passed further through the pipeline.

### 3. Structured extraction

The normalized OCR text is processed by an LLM using schema-constrained structured output.

The extraction layer attempts to identify:

- document title
- logical columns
- rows
- multiple independent tables
- ambiguous values
- a concise summary

The model is instructed not to fabricate missing values.

### 4. Validation

Generated output is validated against the application's Zod schemas before being accepted.

Invalid model responses are rejected or retried rather than directly reaching the client.

### 5. Result

Validated data is displayed as an editable table.

Users can then:

```
Review
Edit
Listen
Copy
Export
Save
```

## Getting Started

### Prerequisites

Install:

- Node.js
- npm / pnpm
- Expo tooling
- Firebase project
- Google Cloud project
- OpenAI API access

### Installation

Clone the repository:

```bash
git clone https://github.com/vishnu-vemula/COVERT.git
cd COVERT
```

Install dependencies:

```bash
pnpm install
```

If the repository uses npm instead:

```bash
npm install
```

### Environment Variables

Copy the example environment configuration:

```bash
cp .env.example .env
```

Configure the required services.

Example:

```bash
# Firebase Client
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=

# OpenAI
OPENAI_API_KEY=

# API
API_PORT=3000
```

> [!WARNING]
> Never commit real credentials.

The values above are examples only. Refer to `.env.example` for the variables required by the current implementation.

## Development

### Mobile

```bash
cd apps/mobile
pnpm start
```

Run on Android:

```bash
pnpm android
```

Run on iOS:

```bash
pnpm ios
```

### API

```bash
cd services/api
pnpm dev
```

### Website

```bash
cd apps/web
pnpm dev
```

Then open:

```
http://localhost:3000
```

## Testing

Run the project's test suite:

```bash
pnpm test
```

Run type checking:

```bash
pnpm typecheck
```

Run linting:

```bash
pnpm lint
```

Before submitting changes, make sure:

```
✓ TypeScript passes
✓ Tests pass
✓ Lint passes
✓ Web builds successfully
✓ API builds successfully
✓ Mobile application starts successfully
```

## Security

COVERT is designed around authenticated, user-owned document data.

Important security decisions include:

- Firebase ID token verification on authenticated API routes
- server-side privileged credentials
- UID-based document ownership
- runtime input validation
- restricted file types and upload sizes
- structured LLM output validation
- no API credentials stored in the mobile client
- no authentication tokens written to application logs
- document content excluded from routine server logging

Never configure Firestore with unrestricted production rules such as:

```
allow read, write: if true;
```

Production rules should always enforce authentication and ownership.

## Privacy

COVERT processes documents in order to extract and structure their contents.

The application is designed to minimize unnecessary storage of original documents. Structured results may be stored in the authenticated user's history.

Do not upload sensitive or confidential documents to development deployments that are not configured for production security.

For a public deployment, maintain a separate privacy policy describing the exact infrastructure, retention behavior, subprocessors, and data handling practices being used.

## Accessibility

Accessibility is treated as part of the core product experience.

COVERT includes support for:

- device text-to-speech
- descriptive accessibility labels
- semantic controls
- large interaction targets
- dynamic text sizing
- logical navigation order
- reduced-motion-friendly interfaces
- interfaces that do not depend exclusively on color

Audio controls allow users to listen to summaries or navigate through table records individually.

## Contributing

Contributions are welcome.

For substantial changes:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Add or update relevant tests.
5. Run linting and type checks.
6. Open a pull request describing the change.

Please keep contributions focused and avoid unnecessary dependencies or architectural complexity.

## Project Status

COVERT is under active development.

APIs, schemas, UI behavior, and project structure may change while the project is being developed.

## License

This project is licensed under the terms defined in the repository's `LICENSE` file.

---

<p align="center">
  <strong>COVERT</strong><br>
  Capture · OCR · Validate · Extract · Read · Tabulate<br>
  <em>Documents in. Structured data out.</em>
</p>
