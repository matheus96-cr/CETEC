import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxOe9MujeLIGxM3L5QJVd28NhAgljTnoKGS_jMAjM5K8k7wnlKjtlJkBrmWyPW-0ht2/exec';

  // API Proxy endpoints
  app.get("/api/diary", async (req, res) => {
    try {
      console.log(`[Proxy GET] Fetching diary data from Apps Script: ${APPS_SCRIPT_URL}`);
      const response = await fetch(APPS_SCRIPT_URL);
      if (!response.ok) {
        throw new Error(`Apps Script responded with status ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("[Proxy GET Error]", error);
      res.status(500).json({ status: "error", message: error.message || String(error) });
    }
  });

  app.post("/api/diary", async (req, res) => {
    try {
      console.log(`[Proxy POST] Submitting to Apps Script:`, req.body);
      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });
      if (!response.ok) {
        throw new Error(`Apps Script responded with status ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("[Proxy POST Error]", error);
      res.status(500).json({ status: "error", message: error.message || String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
