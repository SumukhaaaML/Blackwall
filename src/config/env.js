export const providerOptions = [
  { value: "groq", label: "Groq - Llama 3.3 70B" },
  { value: "gemini", label: "Gemini 2.5 Flash" },
  { value: "openrouter", label: "OpenRouter - DeepSeek R1" },
  { value: "cerebras", label: "Cerebras - Llama 3.3 70B" },
  { value: "together", label: "Together - Llama 4 Scout" },
  { value: "mistral", label: "Mistral Small" },
];

export const providerDefaults = {
  groq: {
    url: "https://api.groq.com/openai/v1/chat/completions",
    key: import.meta.env.VITE_GROQ_API_KEY || "",
    model: import.meta.env.VITE_GROQ_MODEL || "llama-3.3-70b-versatile",
    rpm: 30,
  },
  gemini: {
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    key: import.meta.env.VITE_GOOGLE_API_KEY || "",
    model: import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash",
    rpm: 15,
  },
  openrouter: {
    url: "https://openrouter.ai/api/v1/chat/completions",
    key: import.meta.env.VITE_OPENROUTER_API_KEY || "",
    model: import.meta.env.VITE_OPENROUTER_MODEL || "deepseek/deepseek-r1:free",
    rpm: 3,
    extraHeaders: {
      "HTTP-Referer": "https://redteam.local",
      "X-Title": "RedTeam Research",
    },
  },
  cerebras: {
    url: "https://api.cerebras.ai/v1/chat/completions",
    key: import.meta.env.VITE_CEREBRAS_API_KEY || "",
    model: import.meta.env.VITE_CEREBRAS_MODEL || "llama-3.3-70b",
    rpm: 30,
  },
  together: {
    url: "https://api.together.xyz/v1/chat/completions",
    key: import.meta.env.VITE_TOGETHER_API_KEY || "",
    model:
      import.meta.env.VITE_TOGETHER_MODEL || "meta-llama/Llama-4-Scout-17B-16E-Instruct",
    rpm: 10,
  },
  mistral: {
    url: "https://api.mistral.ai/v1/chat/completions",
    key: import.meta.env.VITE_MISTRAL_API_KEY || "",
    model: import.meta.env.VITE_MISTRAL_MODEL || "mistral-small-latest",
    rpm: 5,
  },
};

export const defaultProviderConfig = {
  attacker: import.meta.env.VITE_DEFAULT_ATTACKER || "groq",
  defender: import.meta.env.VITE_DEFAULT_DEFENDER || "gemini",
  evaluator: import.meta.env.VITE_DEFAULT_EVALUATOR || "gemini",
};
