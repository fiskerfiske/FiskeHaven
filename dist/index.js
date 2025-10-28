// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
import { z } from "zod";
var holidayQuerySchema = z.object({
  fromDate: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, "Date must be in DD.MM.YYYY format"),
  toDate: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, "Date must be in DD.MM.YYYY format"),
  year: z.number().int().min(2024).max(2030)
});

// server/routes.ts
var __CACHE = /* @__PURE__ */ new Map();
function setCache(key, value, ttlSeconds = 60 * 60 * 24) {
  const expires = Date.now() + ttlSeconds * 1e3;
  __CACHE.set(key, { expires, value });
}
function getCached(key) {
  const entry = __CACHE.get(key);
  if (!entry) return void 0;
  if (Date.now() > entry.expires) {
    __CACHE.delete(key);
    return void 0;
  }
  return entry.value;
}
function parseDate(dateStr) {
  const parts = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!parts) return null;
  const day = parseInt(parts[1], 10);
  const month = parseInt(parts[2], 10) - 1;
  const year = parseInt(parts[3], 10);
  const date = new Date(year, month, day);
  if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
    return null;
  }
  return date;
}
function datesOverlap(aStart, aEnd, bStart, bEnd) {
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  return aStart.getTime() <= bEnd.getTime() && bStart.getTime() <= aEnd.getTime();
}
var GERMAN_STATES = [
  { code: "BW", name: "Baden-W\xFCrttemberg" },
  { code: "BY", name: "Bayern" },
  { code: "BE", name: "Berlin" },
  { code: "BB", name: "Brandenburg" },
  { code: "HB", name: "Bremen" },
  { code: "HH", name: "Hamburg" },
  { code: "HE", name: "Hessen" },
  { code: "MV", name: "Mecklenburg-Vorpommern" },
  { code: "NI", name: "Niedersachsen" },
  { code: "NW", name: "Nordrhein-Westfalen" },
  { code: "RP", name: "Rheinland-Pfalz" },
  { code: "SL", name: "Saarland" },
  { code: "SN", name: "Sachsen" },
  { code: "ST", name: "Sachsen-Anhalt" },
  { code: "SH", name: "Schleswig-Holstein" },
  { code: "TH", name: "Th\xFCringen" }
];
async function fetchGermanHolidays(year, stateCode) {
  const cacheKey = `DE_${stateCode}_${year}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;
  const url = `https://ferien-api.de/api/v1/holidays/${stateCode}/${year}`;
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`ferien-api.de returned ${response.status} for ${stateCode} (attempt ${attempt})`);
        if (attempt === maxAttempts) return [];
        await new Promise((r) => setTimeout(r, 150 * attempt));
        continue;
      }
      const data = await response.json();
      setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Network error fetching ${stateCode} (attempt ${attempt}):`, error instanceof Error ? error.message : error);
      if (attempt === maxAttempts) return [];
      await new Promise((r) => setTimeout(r, 150 * attempt));
    }
  }
  return [];
}
async function fetchDenmarkHolidaysFromOpenHolidays(year) {
  const cacheKey = `DK_OPENH_${year}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;
  const validFrom = `${year}-01-01`;
  const validTo = `${year}-12-31`;
  const urls = [
    `https://openholidaysapi.org/SchoolHolidays?countryIsoCode=DK&validFrom=${validFrom}&validTo=${validTo}`,
    `https://openholidaysapi.org/SchoolHolidays?countryIsoCode=DK&languageIsoCode=EN&validFrom=${validFrom}&validTo=${validTo}`,
    `https://openholidaysapi.org/SchoolHolidays?countryIsoCode=DK&languageIsoCode=DA&validFrom=${validFrom}&validTo=${validTo}`
  ];
  const extractDate = (obj, keys) => {
    if (!obj) return null;
    for (const k of keys) {
      const v = obj[k];
      if (typeof v === "string" || typeof v === "number") return v;
      if (v && typeof v === "object") {
        if (typeof v.from === "string" || typeof v.from === "number") return v.from;
        if (typeof v.start === "string" || typeof v.start === "number") return v.start;
        if (typeof v.dateFrom === "string" || typeof v.dateFrom === "number") return v.dateFrom;
        if (typeof v.startDate === "string" || typeof v.startDate === "number") return v.startDate;
        if (typeof v.endDate === "string" || typeof v.endDate === "number") return v.endDate;
      }
    }
    if (obj.date && typeof obj.date === "object") {
      if (obj.date.from) return obj.date.from;
      if (obj.date.start) return obj.date.start;
    }
    if (obj.startDate) return obj.startDate;
    if (obj.start) return obj.start;
    return null;
  };
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) {
        console.warn(`OpenHolidays attempt returned ${res.status} for ${url}`);
        continue;
      }
      const raw = await res.json();
      const items = Array.isArray(raw) ? raw : raw.items || raw.data || raw.holidays || [];
      const mapped = items.map((h) => {
        let name;
        if (Array.isArray(h.name) && h.name.length > 0 && h.name[0].text) {
          name = h.name[0].text;
        } else if (typeof h.name === "string") {
          name = h.name;
        } else if (h.title) {
          name = typeof h.title === "string" ? h.title : Array.isArray(h.title) && h.title[0]?.text || void 0;
        } else if (h.holidayName) {
          name = h.holidayName;
        } else if (h.description) {
          name = typeof h.description === "string" ? h.description : void 0;
        }
        const startIso = extractDate(h, ["start", "startDate", "from", "dateFrom", "begin"]);
        const endIso = extractDate(h, ["end", "endDate", "to", "dateTo", "finish"]);
        if (!startIso || !endIso) return null;
        const s = new Date(startIso);
        const e = new Date(endIso);
        if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
        const formatDate = (d) => {
          const day = String(d.getDate()).padStart(2, "0");
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const year2 = d.getFullYear();
          return `${day}.${month}.${year2}`;
        };
        return {
          name: name || "Ferien",
          start: formatDate(s),
          end: formatDate(e)
        };
      }).filter((x) => x !== null);
      setCache(cacheKey, mapped);
      console.info(`OpenHolidays: succeeded for ${url} (found ${mapped.length} entries)`);
      return mapped;
    } catch (err) {
      console.warn(`OpenHolidays fetch error for ${url}:`, err);
      continue;
    }
  }
  throw new Error(`OpenHolidays API unavailable for year ${year}`);
}
async function registerRoutes(app2) {
  app2.post("/api/check-holidays", async (req, res) => {
    try {
      const validation = holidayQuerySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid request data",
          details: validation.error.errors
        });
      }
      const { fromDate, toDate, year } = validation.data;
      const userStart = parseDate(fromDate);
      const userEnd = parseDate(toDate);
      if (!userStart || !userEnd) {
        return res.status(400).json({
          error: "Invalid date format"
        });
      }
      const germanStates = [];
      for (const state of GERMAN_STATES) {
        const holidays = await fetchGermanHolidays(year, state.code);
        const overlappingHolidays = holidays.map((h) => {
          const holidayStart = new Date(h.start || h.startDate || h.from);
          const holidayEnd = new Date(h.end || h.endDate || h.to);
          if (isNaN(holidayStart.getTime()) || isNaN(holidayEnd.getTime())) return null;
          if (datesOverlap(userStart, userEnd, holidayStart, holidayEnd)) {
            const formatDate = (d) => {
              const day = String(d.getDate()).padStart(2, "0");
              const month = String(d.getMonth() + 1).padStart(2, "0");
              const year2 = d.getFullYear();
              return `${day}.${month}.${year2}`;
            };
            return {
              name: translateHolidayName(h.name || h.title || h.holidayName || h.description),
              start: formatDate(holidayStart),
              end: formatDate(holidayEnd)
            };
          }
          return null;
        }).filter((h) => h !== null);
        germanStates.push({ state: state.name, stateCode: state.code, holidays: overlappingHolidays });
      }
      const statesWithHolidays = germanStates.filter((s) => s.holidays.length > 0);
      const denmarkHolidaysData = await fetchDenmarkHolidaysFromOpenHolidays(year);
      const denmarkHolidays = denmarkHolidaysData.map((h) => {
        const holidayStart = new Date(h.start);
        const holidayEnd = new Date(h.end);
        if (datesOverlap(userStart, userEnd, holidayStart, holidayEnd)) {
          const formatDate = (d) => {
            const day = String(d.getDate()).padStart(2, "0");
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const year2 = d.getFullYear();
            return `${day}.${month}.${year2}`;
          };
          return {
            name: h.name,
            start: formatDate(holidayStart),
            end: formatDate(holidayEnd)
          };
        }
        return null;
      }).filter((h) => h !== null);
      const result = {
        query: { fromDate, toDate, year },
        germany: {
          country: "Deutschland",
          countryCode: "DE",
          hasHolidays: statesWithHolidays.length > 0,
          states: statesWithHolidays
        },
        denmark: {
          country: "D\xE4nemark",
          countryCode: "DK",
          hasHolidays: denmarkHolidays.length > 0,
          holidays: denmarkHolidays
        }
      };
      res.json(result);
    } catch (error) {
      console.error("Error checking holidays:", error);
      res.status(500).json({
        error: "Fehler beim Abrufen der Feriendaten. Bitte versuchen Sie es sp\xE4ter erneut."
      });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}
function translateHolidayName(name) {
  if (!name) return "Ferien";
  const translations = {
    winterferien: "Winterferien",
    osterferien: "Osterferien",
    pfingstferien: "Pfingstferien",
    sommerferien: "Sommerferien",
    herbstferien: "Herbstferien",
    weihnachtsferien: "Weihnachtsferien"
  };
  return translations[name.toLowerCase()] || name.charAt(0).toUpperCase() + name.slice(1);
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
