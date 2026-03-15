const fallbackOrder = ["groq", "gemini", "cerebras", "openrouter", "together", "mistral"];
const rateLimitState = {};

function envValue(key, fallback = "") {
  return process.env[key] || fallback;
}

function buildProviders() {
  return {
    groq: {
      url: "https://api.groq.com/openai/v1/chat/completions",
      key: envValue("GROQ_API_KEY", envValue("VITE_GROQ_API_KEY")),
      model: envValue("GROQ_MODEL", envValue("VITE_GROQ_MODEL", "llama-3.3-70b-versatile")),
      rpm: 30,
    },
    gemini: {
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      key: envValue("GOOGLE_API_KEY", envValue("VITE_GOOGLE_API_KEY")),
      model: envValue("GEMINI_MODEL", envValue("VITE_GEMINI_MODEL", "gemini-2.5-flash")),
      rpm: 15,
    },
    openrouter: {
      url: "https://openrouter.ai/api/v1/chat/completions",
      key: envValue("OPENROUTER_API_KEY", envValue("VITE_OPENROUTER_API_KEY")),
      model: envValue(
        "OPENROUTER_MODEL",
        envValue("VITE_OPENROUTER_MODEL", "deepseek/deepseek-r1:free"),
      ),
      rpm: 3,
      extraHeaders: {
        "HTTP-Referer": envValue("APP_PUBLIC_URL", "https://redteam.local"),
        "X-Title": envValue("APP_TITLE", "Blackwall"),
      },
    },
    cerebras: {
      url: "https://api.cerebras.ai/v1/chat/completions",
      key: envValue("CEREBRAS_API_KEY", envValue("VITE_CEREBRAS_API_KEY")),
      model: envValue("CEREBRAS_MODEL", envValue("VITE_CEREBRAS_MODEL", "llama-3.3-70b")),
      rpm: 30,
    },
    together: {
      url: "https://api.together.xyz/v1/chat/completions",
      key: envValue("TOGETHER_API_KEY", envValue("VITE_TOGETHER_API_KEY")),
      model: envValue(
        "TOGETHER_MODEL",
        envValue("VITE_TOGETHER_MODEL", "meta-llama/Llama-4-Scout-17B-16E-Instruct"),
      ),
      rpm: 10,
    },
    mistral: {
      url: "https://api.mistral.ai/v1/chat/completions",
      key: envValue("MISTRAL_API_KEY", envValue("VITE_MISTRAL_API_KEY")),
      model: envValue("MISTRAL_MODEL", envValue("VITE_MISTRAL_MODEL", "mistral-small-latest")),
      rpm: 5,
    },
  };
}

function buildProviderError(providerKey, provider, status, text) {
  const message = String(text || "");
  const invalidModel = status === 404 && /no endpoints found|model|not found/i.test(message);

  if (invalidModel) {
    return new Error(
      [
        `Invalid model ID for ${providerKey}.`,
        `Configured model: ${provider.model}.`,
        "Update the server environment variable for this model and redeploy.",
      ].join(" "),
    );
  }

  return new Error(`${providerKey} ${status}: ${message.slice(0, 200)}`);
}

function extractText(data) {
  const content = data.choices?.[0]?.message?.content || "";
  if (Array.isArray(content)) {
    return content.map((item) => item?.text || "").join("");
  }
  return String(content);
}

async function rateLimit(providerKey, providers) {
  if (!rateLimitState[providerKey]) {
    rateLimitState[providerKey] = { last: 0 };
  }

  const gap = (60 / (providers[providerKey]?.rpm || 10)) * 1000;
  const wait = Math.max(0, rateLimitState[providerKey].last + gap - Date.now());
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  rateLimitState[providerKey].last = Date.now();
}

async function callProvider(providers, providerKey, system, user, options = {}) {
  const provider = providers[providerKey];
  if (!provider) {
    throw new Error(`Unknown provider: ${providerKey}`);
  }
  if (!provider.key) {
    throw new Error(`Missing API key for ${providerKey}`);
  }

  await rateLimit(providerKey, providers);

  const payload = {
    model: provider.model,
    max_tokens: 1000,
    temperature: options.isJudge ? 0.3 : 0.88,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };

  if (providerKey === "gemini") {
    payload.response_mime_type = "application/json";
  }

  const response = await fetch(provider.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.key}`,
      ...(provider.extraHeaders || {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw buildProviderError(providerKey, provider, response.status, text);
  }

  const data = await response.json();
  const text = extractText(data);

  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) {
      throw new Error("No JSON block");
    }
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return { raw: text, _parse_error: true };
  }
}

export async function callWithFallback(primary, system, user, options = {}) {
  const providers = buildProviders();
  const chain = [primary, ...fallbackOrder.filter((provider) => provider !== primary)];
  const failures = [];

  for (const provider of chain) {
    try {
      return await callProvider(providers, provider, system, user, options);
    } catch (error) {
      const message = String(error.message);
      failures.push(`${provider}: ${message}`);
      const missingKey = /Missing API key/i.test(message);
      const rateLimited = /429|rate.limit|quota|exceed/i.test(message);
      const authFailed = /401|403|invalid|unauthorized|forbidden/i.test(message);
      const transient = /500|502|503|504|network|fetch|timeout/i.test(message);

      if (missingKey) {
        continue;
      }
      if (rateLimited) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
        continue;
      }
      if (authFailed || transient) {
        continue;
      }

      throw error;
    }
  }

  throw new Error(
    `All providers exhausted. Attempt summary: ${failures.join(" | ").slice(0, 1200)}`,
  );
}

export async function pingProviders() {
  const providers = buildProviders();
  const results = [];
  const probe = 'Respond with ONLY this JSON: {"ok": true, "model": "name"}';

  for (const providerKey of Object.keys(providers)) {
    if (!providers[providerKey].key) {
      results.push({ provider: providerKey, status: "skipped", detail: "no key" });
      continue;
    }

    try {
      const result = await callProvider(
        providers,
        providerKey,
        "You are a test assistant.",
        probe,
      );
      results.push({
        provider: providerKey,
        status: "ok",
        detail: result.model || "connected",
      });
    } catch (error) {
      results.push({
        provider: providerKey,
        status: "error",
        detail: String(error.message).slice(0, 140),
      });
    }
  }

  return results;
}
