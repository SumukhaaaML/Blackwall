export const providerOptions = [
  { value: "groq", label: "Groq - Llama 3.3 70B" },
  { value: "gemini", label: "Gemini 2.5 Flash" },
  { value: "openrouter", label: "OpenRouter - DeepSeek R1" },
  { value: "cerebras", label: "Cerebras - Llama 3.3 70B" },
  { value: "together", label: "Together - Llama 4 Scout" },
  { value: "mistral", label: "Mistral Small" },
];

export const defaultProviderConfig = {
  attacker: import.meta.env.VITE_DEFAULT_ATTACKER || "groq",
  defender: import.meta.env.VITE_DEFAULT_DEFENDER || "gemini",
  evaluator: import.meta.env.VITE_DEFAULT_EVALUATOR || "gemini",
};
