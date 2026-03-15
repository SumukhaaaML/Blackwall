import { handlePing } from "./_lib/handlers.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const result = await handlePing();
  res.status(result.status).json(result.body);
}
