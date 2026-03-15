import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { handleChat, handlePing } from "./api/_lib/handlers.js";

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function jsonResponse(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function localApiPlugin() {
  return {
    name: "local-api-plugin",
    configureServer(server) {
      server.middlewares.use("/api/chat", async (req, res) => {
        if (req.method !== "POST") {
          jsonResponse(res, 405, { error: "Method not allowed" });
          return;
        }

        try {
          const body = await readJsonBody(req);
          const result = await handleChat(body);
          jsonResponse(res, result.status, result.body);
        } catch (error) {
          jsonResponse(res, 500, { error: error.message || "Invalid JSON body" });
        }
      });

      server.middlewares.use("/api/ping", async (req, res) => {
        if (req.method !== "POST") {
          jsonResponse(res, 405, { error: "Method not allowed" });
          return;
        }

        const result = await handlePing();
        jsonResponse(res, result.status, result.body);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localApiPlugin()],
});
