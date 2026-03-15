async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export async function callWithFallback(primary, system, user, options = {}) {
  return postJson("/api/chat", {
    primary,
    system,
    user,
    isJudge: Boolean(options.isJudge),
  });
}

export async function pingProviders() {
  const data = await postJson("/api/ping", {});
  return data.results || [];
}
