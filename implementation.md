# ADVERSARIAL RED TEAM — Free Model Implementation Guide

> **100% free. Zero cost.** All three agents run on free-tier providers.
> No Claude API required anywhere in the pipeline.

---

## Agent Assignments

| Agent | Role | Provider | Model | Cost |
|---|---|---|---|---|
| **ARTEMIS** | Attacker | Groq | `llama-3.3-70b-versatile` | $0.00 |
| **AEGIS** | Defender | Google AI Studio | `gemini-2.5-flash` | $0.00 |
| **JUDGE** | Evaluator | Google AI Studio | `gemini-2.5-flash` | $0.00 |

> **Bias note:** AEGIS and JUDGE share the same model family (Gemini). This can produce
> a mild scoring bias favoring AEGIS. If you observe AEGIS winning >65% of rounds
> consistently, rotate JUDGE to `deepseek/deepseek-r1:free` on OpenRouter for a fully
> uncorrelated evaluator. See the **JUDGE Rotation** section below.

---

## Provider Overview

| Provider | Best Model | Free Tier | Assigned To |
|---|---|---|---|
| **Groq** | `llama-3.3-70b-versatile` | 14,400 req/day, 30 rpm | ARTEMIS (primary) |
| **Google AI Studio** | `gemini-2.5-flash` | 1,500 req/day, 1M tok/min | AEGIS + JUDGE (primary) |
| **OpenRouter** | `deepseek/deepseek-r1:free` | 50 req/day free | JUDGE alternate / fallback |
| **Cerebras** | `llama-3.3-70b` | 1M tokens/day | ARTEMIS fallback |
| **Together AI** | `meta-llama/Llama-4-Scout` | $25 free credits | General fallback |
| **Mistral AI** | `mistral-small-latest` | 1B tokens/month | General fallback |
| **Hugging Face** | `Qwen/Qwen2.5-72B-Instruct` | 1,000 req/day | Fine-tuned model hosting |

---

## Step 1 — Get API Keys

```bash
# Groq — https://console.groq.com
# Sign up → API Keys → Create API Key
export GROQ_API_KEY="gsk_..."

# Google AI Studio — https://aistudio.google.com
# Sign in → Get API key → Create API key in new project
# No credit card. Completely free.
export GOOGLE_API_KEY="AIza..."

# OpenRouter — https://openrouter.ai (for JUDGE fallback)
# Sign up → Keys → Create Key
export OPENROUTER_API_KEY="sk-or-..."

# Optional extras
export TOGETHER_API_KEY="..."     # https://api.together.xyz
export MISTRAL_API_KEY="..."      # https://console.mistral.ai
export CEREBRAS_API_KEY="..."     # https://cloud.cerebras.ai
```

---

## Step 2 — Core Implementation

Replace the single `callClaude()` function in the artifact with this full router.
**Paste this entire block at the top of the artifact, before any component definitions.**

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// FREE MODEL ROUTER — replaces callClaude() entirely
// ═══════════════════════════════════════════════════════════════════════════

// ── Provider configs ────────────────────────────────────────────────────────
const PROVIDERS = {
  groq: {
    url:   "https://api.groq.com/openai/v1/chat/completions",
    key:   "YOUR_GROQ_API_KEY",
    model: "llama-3.3-70b-versatile",
    rpm:   30,
  },
  gemini: {
    url:   "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    key:   "YOUR_GOOGLE_API_KEY",
    model: "gemini-2.5-flash",
    rpm:   15,
  },
  openrouter: {
    url:   "https://openrouter.ai/api/v1/chat/completions",
    key:   "YOUR_OPENROUTER_API_KEY",
    model: "deepseek/deepseek-r1:free",
    rpm:   3,
    extraHeaders: {
      "HTTP-Referer": "https://redteam.local",
      "X-Title":      "RedTeam Research",
    },
  },
  cerebras: {
    url:   "https://api.cerebras.ai/v1/chat/completions",
    key:   "YOUR_CEREBRAS_API_KEY",
    model: "llama-3.3-70b",
    rpm:   30,
  },
  together: {
    url:   "https://api.together.xyz/v1/chat/completions",
    key:   "YOUR_TOGETHER_API_KEY",
    model: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
    rpm:   10,
  },
  mistral: {
    url:   "https://api.mistral.ai/v1/chat/completions",
    key:   "YOUR_MISTRAL_API_KEY",
    model: "mistral-small-latest",
    rpm:   5,
  },
};

// ── Agent → provider assignments ────────────────────────────────────────────
const AGENT_CONFIG = {
  attacker:  "groq",      // ARTEMIS — Groq Llama 3.3 70B
  defender:  "gemini",    // AEGIS   — Gemini 2.5 Flash
  evaluator: "gemini",    // JUDGE   — Gemini 2.5 Flash
};

// ── Rate limiter ─────────────────────────────────────────────────────────────
const _rl = {};
async function rateLimit(key) {
  if (!_rl[key]) _rl[key] = { last: 0 };
  const gap = (60 / (PROVIDERS[key]?.rpm || 10)) * 1000;
  const wait = Math.max(0, _rl[key].last + gap - Date.now());
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  _rl[key].last = Date.now();
}

// ── Single provider call ──────────────────────────────────────────────────────
async function callProvider(providerKey, system, user) {
  const p = PROVIDERS[providerKey];
  if (!p) throw new Error(`Unknown provider: ${providerKey}`);
  await rateLimit(providerKey);

  const isJudge = providerKey === AGENT_CONFIG.evaluator;

  const res = await fetch(p.url, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${p.key}`,
      ...(p.extraHeaders || {}),
    },
    body: JSON.stringify({
      model:       p.model,
      max_tokens:  1000,
      temperature: isJudge ? 0.3 : 0.88,
      messages: [
        { role: "system", content: system },
        { role: "user",   content: user   },
      ],
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${providerKey} ${res.status}: ${txt.slice(0, 160)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";

  try {
    const s = text.indexOf("{"), e = text.lastIndexOf("}");
    if (s === -1 || e === -1) throw new Error("no JSON");
    return JSON.parse(text.slice(s, e + 1));
  } catch {
    return { raw: text, _parse_error: true };
  }
}

// ── Fallback chain ────────────────────────────────────────────────────────────
const FALLBACK_ORDER = ["groq", "gemini", "cerebras", "openrouter", "together", "mistral"];

async function callWithFallback(primary, system, user) {
  const chain = [primary, ...FALLBACK_ORDER.filter(p => p !== primary)];
  for (const provider of chain) {
    try {
      return await callProvider(provider, system, user);
    } catch (err) {
      const rateLimited = /429|rate.limit|quota|exceed/i.test(err.message);
      if (rateLimited) {
        await new Promise(r => setTimeout(r, 2500));
        continue;
      }
      throw err;
    }
  }
  throw new Error("All providers exhausted");
}

// ── Public agent callers ──────────────────────────────────────────────────────
const callArtemis = (sys, usr) => callWithFallback(AGENT_CONFIG.attacker,  sys, usr);
const callAegis   = (sys, usr) => callWithFallback(AGENT_CONFIG.defender,  sys, usr);
const callJudge   = (sys, usr) => callWithFallback(AGENT_CONFIG.evaluator, sys, usr);
```

---

## Step 3 — Wire Into the Battle Loop

In `runBattle()`, swap the three `callClaude()` calls. **Three lines changed, nothing else:**

```javascript
// ── BEFORE ──────────────────────────────────────────────────────────────────
attack     = await callClaude(buildAttackerSystem(artemisRef.current), attackPrompt);
defense    = await callClaude(buildDefenderSystem(aegisRef.current),   defensePrompt);
evaluation = await callClaude(EVALUATOR_SYSTEM,                        evalPrompt);

// ── AFTER ────────────────────────────────────────────────────────────────────
attack     = await callArtemis(buildAttackerSystem(artemisRef.current), attackPrompt);
defense    = await callAegis(buildDefenderSystem(aegisRef.current),     defensePrompt);
evaluation = await callJudge(EVALUATOR_SYSTEM,                          evalPrompt);
```

Memory, storage, scoring, UI — all unchanged.

---

## JUDGE Rotation (Bias Mitigation)

If AEGIS wins >65% of rounds consistently, switch JUDGE to a different model family:

```javascript
// Option A: DeepSeek R1 via OpenRouter — best reasoning, fully free
AGENT_CONFIG.evaluator = "openrouter";
PROVIDERS.openrouter.model = "deepseek/deepseek-r1:free";

// Option B: Groq Llama — fast, different family from Gemini
// First move ARTEMIS to Cerebras so ARTEMIS/JUDGE don't share a family:
AGENT_CONFIG.attacker  = "cerebras";
AGENT_CONFIG.evaluator = "groq";

// Option C: Mistral — fully independent family
AGENT_CONFIG.evaluator = "mistral";
```

**Pairing bias risk at a glance:**

| ARTEMIS | AEGIS | JUDGE | Bias Risk |
|---|---|---|---|
| Groq (Llama) | Gemini | Gemini | Medium — AEGIS/JUDGE same family |
| Groq (Llama) | Gemini | OpenRouter (DeepSeek R1) | **Low** — all different |
| Groq (Llama) | Gemini | Mistral | **Low** — all different |
| Cerebras (Llama) | Groq (Llama) | Gemini | **Low** — JUDGE uncorrelated |

---

## Provider-Specific Notes

### Groq

```javascript
// Models ranked by capability for adversarial tasks:
// 1. "llama-3.3-70b-versatile"          → best, 14,400 req/day
// 2. "deepseek-r1-distill-llama-70b"    → chain-of-thought, slower
// 3. "llama-3.1-8b-instant"             → 100K req/day if 70B rate-limits

// Temperature 0.88–0.95 produces more creative ARTEMIS attacks.
// Groq is the fastest available (~300 tok/s). No streaming needed.
```

### Google AI Studio (Gemini)

```javascript
// Uses OpenAI-compatible endpoint — identical call pattern:
// URL: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"

// Models:
// "gemini-2.5-flash"   → best overall, 1M token context, completely free
// "gemini-2.0-flash"   → stable, slightly lower capability
// "gemma-3-27b-it"     → open weights, self-hostable

// For JUDGE: add response_mime_type for cleaner JSON output:
body: JSON.stringify({
  model: "gemini-2.5-flash",
  response_mime_type: "application/json",  // forces clean JSON, no markdown fences
  messages: [...]
})

// Free tier: no credit card required. 1,500 req/day, 1M tokens/min.
```

### OpenRouter

```javascript
// Free models (50 req/day each — rotate to multiply quota):
const OR_FREE = [
  "deepseek/deepseek-r1:free",                        // best reasoning
  "deepseek/deepseek-r1-distill-qwen-32b:free",
  "google/gemma-3-27b-it:free",
  "nvidia/llama-3.1-nemotron-70b-instruct:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
];

let _orIdx = 0;
function nextFreeModel() {
  const m = OR_FREE[_orIdx % OR_FREE.length];
  _orIdx++;
  return m;
}
// Before each JUDGE call via OpenRouter:
// PROVIDERS.openrouter.model = nextFreeModel();
```

### Cerebras

```javascript
// Same Llama weights as Groq, excellent ARTEMIS fallback.
// 1M tokens/day free — token-based not request-based, very generous.
const CEREBRAS_URL = "https://api.cerebras.ai/v1/chat/completions";
// API key from: https://cloud.cerebras.ai → API Keys
```

### Hugging Face (post fine-tune deployment)

```javascript
// After training ARTEMIS/AEGIS LoRA weights, host on HF Hub and call free:
async function callHuggingFace(repoId, sys, usr) {
  const res = await fetch(
    `https://api-inference.huggingface.co/models/${repoId}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_KEY}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        inputs: `${sys}\n\n### Input:\n${usr}\n\n### Response:`,
        parameters: { max_new_tokens: 800, temperature: 0.88, return_full_text: false },
      }),
    }
  );
  const data = await res.json();
  const text = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text || "";
  try {
    const s = text.indexOf("{"), e = text.lastIndexOf("}");
    return JSON.parse(text.slice(s, e + 1));
  } catch {
    return { raw: text, _parse_error: true };
  }
}
// Usage: callHuggingFace("yourusername/artemis-lora", system, user)
```

---

## Multi-Model Rotation for Long Sessions

For 8–12 round sessions run repeatedly throughout the day:

```javascript
// ARTEMIS pool — Llama family, all free
const ARTEMIS_POOL = [
  { p: "groq",     m: "llama-3.3-70b-versatile"              },
  { p: "groq",     m: "deepseek-r1-distill-llama-70b"        },
  { p: "cerebras", m: "llama-3.3-70b"                        },
  { p: "together", m: "meta-llama/Llama-4-Scout-17B-16E-Instruct" },
];

// AEGIS pool — Gemini primary, diverse fallbacks
const AEGIS_POOL = [
  { p: "gemini",     m: "gemini-2.5-flash"                   },
  { p: "gemini",     m: "gemini-2.0-flash"                   },
  { p: "openrouter", m: "google/gemma-3-27b-it:free"         },
  { p: "mistral",    m: "mistral-small-latest"               },
];

// JUDGE pool — Gemini primary, diverse fallbacks for bias mitigation
const JUDGE_POOL = [
  { p: "gemini",     m: "gemini-2.5-flash"                              },
  { p: "openrouter", m: "deepseek/deepseek-r1:free"                     },
  { p: "openrouter", m: "nvidia/llama-3.1-nemotron-70b-instruct:free"   },
  { p: "groq",       m: "llama-3.3-70b-versatile"                       },
];

let _ai = 0, _di = 0, _ji = 0;

const callArtemisR = (s, u) => { const c = ARTEMIS_POOL[_ai++ % ARTEMIS_POOL.length]; PROVIDERS[c.p].model = c.m; return callWithFallback(c.p, s, u); };
const callAegisR   = (s, u) => { const c = AEGIS_POOL[_di++   % AEGIS_POOL.length];   PROVIDERS[c.p].model = c.m; return callWithFallback(c.p, s, u); };
const callJudgeR   = (s, u) => { const c = JUDGE_POOL[_ji++   % JUDGE_POOL.length];   PROVIDERS[c.p].model = c.m; return callWithFallback(c.p, s, u); };
```

---

## Provider Selector UI (Optional)

Expose live model switching in the artifact without code changes:

```javascript
// Add to useState:
const [providerConfig, setProviderConfig] = useState({
  attacker: "groq", defender: "gemini", evaluator: "gemini",
});

// Sync to AGENT_CONFIG on change:
useEffect(() => {
  AGENT_CONFIG.attacker  = providerConfig.attacker;
  AGENT_CONFIG.defender  = providerConfig.defender;
  AGENT_CONFIG.evaluator = providerConfig.evaluator;
}, [providerConfig]);

// Add dropdown to UI:
const options = [
  { value: "groq",       label: "Groq — Llama 3.3 70B"     },
  { value: "gemini",     label: "Gemini 2.5 Flash"          },
  { value: "openrouter", label: "OpenRouter — DeepSeek R1"  },
  { value: "cerebras",   label: "Cerebras — Llama 3.3 70B"  },
  { value: "mistral",    label: "Mistral Small"             },
];

{["attacker","defender","evaluator"].map(role => (
  <div key={role} style={{display:"flex",alignItems:"center",gap:6}}>
    <span style={{color:"#444",fontSize:8,width:62,flexShrink:0}}>{role.toUpperCase()}</span>
    <select
      value={providerConfig[role]}
      onChange={e => setProviderConfig(p => ({...p, [role]: e.target.value}))}
      disabled={running}
      style={{background:"#0a0a0a",border:"1px solid #222",color:"#888",
              fontFamily:"'Space Mono',monospace",fontSize:8,padding:"2px 6px",borderRadius:3}}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
))}
```

---

## Verify Setup Before First Battle

```javascript
async function pingProviders() {
  const probe = `Respond with ONLY this JSON, no other text: {"ok": true, "model": "your model name"}`;
  for (const [key] of Object.entries(PROVIDERS)) {
    if (PROVIDERS[key].key.startsWith("YOUR_")) continue; // skip unconfigured
    try {
      const r = await callProvider(key, "You are a test assistant.", probe);
      console.log(`✓ ${key}:`, r);
    } catch (e) {
      console.error(`✗ ${key}:`, e.message.slice(0, 80));
    }
    await new Promise(r => setTimeout(r, 800));
  }
}

useEffect(() => { pingProviders(); }, []);
```

---

## Rate Limit Reference

| Provider | Daily Limit | Per-Min | Notes |
|---|---|---|---|
| Groq | 14,400 req | 30 rpm | Per model. 8B model = 100K/day |
| Google AI Studio | 1,500 req | 15 rpm | 1M tokens/min. No card needed |
| OpenRouter `:free` | 50 req/model | 3 rpm | 200/day with $10 deposit |
| Cerebras | ~1M tokens | 30 rpm | Token-based, very generous |
| Together AI | $25 credits | 10 rpm | ~500K tokens one-time |
| Mistral | 1B tok/month | 1 req/sec | Monthly reset |
| Hugging Face | 1,000 req | varies | Free serverless inference |

**Effective daily capacity with default config (ARTEMIS=Groq, AEGIS+JUDGE=Gemini):**

```
ARTEMIS:  960 rounds/day  (14,400 Groq req ÷ 15 per session)
AEGIS:    100 rounds/day  (1,500 Gemini req ÷ 15 per session) ← bottleneck
JUDGE:    shared from Gemini quota above

With rotation across all providers: ~300+ rounds/day
```

---

## Cost Summary

| Agent | Provider | Cost per 100 rounds |
|---|---|---|
| ARTEMIS | Groq | **$0.00** |
| AEGIS | Google AI Studio | **$0.00** |
| JUDGE | Google AI Studio | **$0.00** |
| **Total** | | **$0.00** |

---

## Quick Start Checklist

```
□ Get Groq key       → console.groq.com         (free, no card)
□ Get Google key     → aistudio.google.com       (free, no card)
□ Get OpenRouter key → openrouter.ai             (free, for JUDGE fallback)
□ Paste keys into PROVIDERS{} in the artifact
□ Confirm AGENT_CONFIG: attacker=groq, defender=gemini, evaluator=gemini
□ Run pingProviders() — check console for ✓ on groq + gemini
□ Launch 3-round battle to validate end-to-end
□ Check Memory tab — confirm storage persisting across refresh
□ Watch AEGIS win rate — if consistently >65%, set evaluator=openrouter
□ Scale to 8–12 rounds per session
```

---

*ARTEMIS on Groq. AEGIS on Gemini. JUDGE on Gemini. Total cost: $0.*
