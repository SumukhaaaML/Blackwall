# Adversarial Red Team

A React + Vite app for running a three-agent adversarial prompt battle:

- `ARTEMIS` generates attacks
- `AEGIS` defends against them
- `JUDGE` evaluates the round

The app is designed as a browser-based red-team arena with:

- multi-provider LLM routing
- fallback handling across providers
- local persistence for rounds and agent memory
- configurable attacker / defender / evaluator assignments
- a hacker-style UI for live battle monitoring

## Stack

- React
- Vite
- Browser `fetch` for provider calls
- `localStorage` for persisted state

## Features

- Run multi-round adversarial battles between three agents
- Use Groq, Gemini, OpenRouter, Cerebras, Together, and Mistral
- Configure provider defaults via `.env`
- Ping configured providers before running a battle
- Persist round logs and memory across refreshes
- Show clearer UI errors for invalid provider model IDs
- Reset the UI back to `.env` defaults

## Project Structure

```text
.
├── index.html
├── package.json
├── vite.config.js
├── .env.example
└── src
    ├── App.jsx
    ├── main.jsx
    ├── styles.css
    ├── components
    │   ├── ControlPanel.jsx
    │   ├── MemoryPanel.jsx
    │   ├── RoundLog.jsx
    │   └── Scoreboard.jsx
    ├── config
    │   └── env.js
    └── lib
        ├── prompts.js
        ├── providers.js
        └── storage.js
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create your environment file

Copy `.env.example` to `.env` and fill in the providers you want to use.

```bash
cp .env.example .env
```

### 3. Configure `.env`

Example:

```env
VITE_GROQ_API_KEY=your_groq_key
VITE_GOOGLE_API_KEY=your_google_key
VITE_OPENROUTER_API_KEY=
VITE_CEREBRAS_API_KEY=
VITE_TOGETHER_API_KEY=
VITE_MISTRAL_API_KEY=

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

Notes:

- The current default configuration is `groq / gemini / gemini`
- `.env` changes require a Vite restart
- `Reset State` in the UI clears persisted local state and reloads env-backed defaults

### 4. Start the dev server

```bash
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://localhost:5173
```

## Usage

1. Start the app
2. Enter a battle objective
3. Choose the number of rounds and difficulty
4. Confirm the provider assignments
5. Click `Ping Providers`
6. Click `Run Battle`

The app will:

- generate an attack with `ARTEMIS`
- generate a defense with `AEGIS`
- evaluate the round with `JUDGE`
- update scores
- store round logs and agent memory in `localStorage`

## Provider Behavior

Provider setup lives in:

- [src/config/env.js](./src/config/env.js)
- [src/lib/providers.js](./src/lib/providers.js)

The router supports:

- primary provider selection per role
- fallback attempts across other configured providers
- rate limiting per provider
- judge-specific lower temperature
- improved invalid-model error messages

If a provider returns a `404` because the configured model slug is invalid, the UI now shows a clearer message indicating:

- which provider failed
- which model is configured
- that the model should be updated in `.env` or the role switched

## Persistence

Battle state is stored in browser `localStorage`, including:

- objective
- rounds
- difficulty
- scores
- round logs
- ARTEMIS / AEGIS / JUDGE memory
- selected provider configuration

If you change defaults in `.env` and the UI still shows old providers, click `Reset State`.

## Available Scripts

```bash
npm run dev
npm run build
npm run preview
```

## Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Security Notes

- Do not commit your real `.env`
- `.env` is already ignored in `.gitignore`
- If you have already exposed API keys publicly, rotate them immediately
- This app calls provider APIs directly from the browser, so treat it as a prototype or internal tool unless you move secrets server-side

## Current Limitations

- Provider APIs are called client-side
- Model availability can change over time
- Free-tier limits vary by provider
- Output quality and JSON cleanliness depend on model behavior
- Some providers may rate-limit or reject deprecated model IDs

## Recommended Defaults

For the current setup:

- `ARTEMIS`: `groq`
- `AEGIS`: `gemini`
- `JUDGE`: `gemini`

If you see evaluator bias or repeated model issues, switch `JUDGE` to a different provider in the UI or update `.env`.

## License

Add your preferred license here.
# Blackwall
