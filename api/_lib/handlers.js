import { callWithFallback, pingProviders } from "./providers.js";

export async function handleChat(body = {}) {
  const { primary, system, user, isJudge } = body;

  if (!primary || !system || !user) {
    return {
      status: 400,
      body: { error: "Missing required fields: primary, system, user" },
    };
  }

  try {
    const result = await callWithFallback(primary, system, user, { isJudge: Boolean(isJudge) });
    return { status: 200, body: result };
  } catch (error) {
    return {
      status: 500,
      body: { error: error.message || "Unknown server error" },
    };
  }
}

export async function handlePing() {
  try {
    const results = await pingProviders();
    return { status: 200, body: { results } };
  } catch (error) {
    return {
      status: 500,
      body: { error: error.message || "Unknown server error" },
    };
  }
}
