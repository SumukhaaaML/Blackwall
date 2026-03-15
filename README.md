# Blackwall

Blackwall is a React + Vite adversarial red-team console for running structured battles between three agents:

- `ARTEMIS` attacks
- `AEGIS` defends
- `JUDGE` evaluates

The frontend is a Vite app, but provider API calls now run server-side through local `/api` handlers and Vercel serverless routes. That keeps provider secrets out of the browser bundle and makes deployment sane.

## Features

- Multi-round attacker / defender / evaluator battle flow
- Provider routing with fallback across Groq, Gemini, OpenRouter, Cerebras, Together, and Mistral
- Persistent round history and agent memory via `localStorage`
- Clearer invalid-model and provider failure messages
- Hacker-console UI branded as Blackwall
- Local dev support and Vercel deployment support using the same API logic

## Tech Stack

- React
- Vite
- Vercel serverless API routes
- Browser `localStorage`

## Architecture

### Frontend

- UI lives in `src/`
- The browser calls:
  - `POST /api/chat`
  - `POST /api/ping`

### Backend

- Server routes live in `api/`
- Provider secrets are read from server environment variables
- Fallback and rate-limiting logic lives in:
  - [api/_lib/providers.js](./api/_lib/providers.js)
  - [api/_lib/handlers.js](./api/_lib/handlers.js)

## Project Structure

```text
.
├── api
│   ├── chat.js
│   ├── ping.js
│   └── _lib
│       ├── handlers.js
│       └── providers.js
├── src
│   ├── App.jsx
│   ├── main.jsx
│   ├── styles.css
│   ├── components
│   ├── config
│   └── lib
├── index.html
├── package.json
├── vite.config.js
└── .env.example
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env`

```bash
cp .env.example .env
```

### 3. Add environment variables

Use server-side secrets for provider keys:

```env
GROQ_API_KEY=your_groq_key
GOOGLE_API_KEY=your_google_key
OPENROUTER_API_KEY=
CEREBRAS_API_KEY=
TOGETHER_API_KEY=
MISTRAL_API_KEY=
```

Optional server-side metadata:

```env
APP_PUBLIC_URL=http://localhost:5173
APP_TITLE=Blackwall
```

Model and UI defaults can remain Vite-exposed:

```env
VITE_GROQ_MODEL=llama-3.3-70b-versatile
VITE_GEMINI_MODEL=gemini-2.5-flash
VITE_OPENROUTER_MODEL=deepseek/deepseek-r1:free
VITE_CEREBRAS_MODEL=llama-3.3-70b
VITE_TOGETHER_MODEL=meta-llama/Llama-4-Scout-17B-16E-Instruct
VITE_MISTRAL_MODEL=mistral-small-latest

VITE_DEFAULT_ATTACKER=groq
VITE_DEFAULT_DEFENDER=gemini
VITE_DEFAULT_EVALUATOR=gemini
```

## Local Development

Run:

```bash
npm run dev
```

Open the Vite URL, usually:

```text
http://localhost:5173
```

The Vite dev server is configured to serve the same `/api/chat` and `/api/ping` handlers locally, so you do not need a separate backend process.

## Production Deployment on Vercel

Add these environment variables in Vercel Project Settings:

### Required server secrets

- `GROQ_API_KEY`
- `GOOGLE_API_KEY`
- `OPENROUTER_API_KEY`
- `CEREBRAS_API_KEY`
- `TOGETHER_API_KEY`
- `MISTRAL_API_KEY`

### Optional model config

- `GROQ_MODEL`
- `GEMINI_MODEL`
- `OPENROUTER_MODEL`
- `CEREBRAS_MODEL`
- `TOGETHER_MODEL`
- `MISTRAL_MODEL`

### Optional frontend defaults

- `VITE_DEFAULT_ATTACKER`
- `VITE_DEFAULT_DEFENDER`
- `VITE_DEFAULT_EVALUATOR`

### Optional app metadata

- `APP_PUBLIC_URL`
- `APP_TITLE`

After changing environment variables:

1. Redeploy
2. Open the app
3. Click `Reset State` if old provider selections are still stored in `localStorage`

## Usage

1. Open the app
2. Set the objective
3. Choose rounds and difficulty
4. Confirm the attacker / defender / evaluator providers
5. Click `Ping Providers`
6. Click `Run Battle`

During a battle, Blackwall will:

- request an attack from `ARTEMIS`
- request a defense from `AEGIS`
- request a ruling from `JUDGE`
- update scores
- store round packets and memory locally

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

## Security Notes

- Do not commit your real `.env`
- `.env` is ignored by git
- Rotate any keys that were ever exposed in screenshots, commits, logs, or frontend bundles
- Server-side keys should use `GROQ_API_KEY`, `GOOGLE_API_KEY`, etc., not `VITE_*_API_KEY`

## Limitations

- Provider availability and free-tier limits change over time
- Model slugs can go stale
- Some providers may still fail due to quota, auth, or upstream availability
- Battle state persists in browser `localStorage`, which can preserve stale provider choices until reset

## Recommended Defaults

- `ARTEMIS`: `groq`
- `AEGIS`: `gemini`
- `JUDGE`: `gemini`

If `AEGIS` appears overly dominant, move `JUDGE` to another provider family to reduce evaluation bias.
