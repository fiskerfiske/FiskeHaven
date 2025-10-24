import { Express } from "express";
import { createServer, Server } from "http";
// Note: this file assumes helper functions/types (getCached, setCache, parseDate, datesOverlap, holidayQuerySchema, StateHolidays, Holiday, HolidayCheckResult, DENMARK_SCHOOL_HOLIDAYS) exist elsewhere in the project (as in the original repo).
// Keep those helpers as they are; here we only add/modify the Denmark fetching logic to use OpenHolidays.

const GERMAN_STATES = [
  { code: "BW", name: "Baden-Württemberg" },
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
  { code: "TH", name: "Thüringen" },
];

// -------------------------
// German holidays (existing)
// -------------------------
async function fetchGermanHolidays(year: number, stateCode: string): Promise<any[]> {
  const cacheKey = `DE_${stateCode}_${year}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`https://ferien-api.de/api/v1/holidays/${stateCode}/${year}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch German holidays for ${stateCode}`);
    }
    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`Error fetching German holidays for ${stateCode}:`, error);
    return [];
  }
}

// ------------------------------------------------------------
// New: Denmark holidays via OpenHolidays API (with fallback)
// ------------------------------------------------------------
async function fetchDenmarkHolidaysFromOpenHolidays(year: number): Promise<any[]> {
  const cacheKey = `DK_OPENH_${year}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    // Use the documented SchoolHolidays endpoint.
    // Language and query params can be tuned (EN/DA/DE). We request EN by default.
    const url = `https://openholidaysapi.org/SchoolHolidays?countryIsoCode=DK&languageIsoCode=EN&year=${year}`;

    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      console.error(`OpenHolidays API returned status ${res.status} for ${url}`);
      // fallback to static data if available
      return DENMARK_SCHOOL_HOLIDAYS?.[year] ?? [];
    }

    const raw = await res.json();
    // DEV TIP: during first run you can uncomment the next line to inspect the actual API shape:
    // console.debug("OpenHolidays raw:", JSON.stringify(raw, null, 2));

    // raw could be either an array OR an object wrapping items/data/holidays
    const items = Array.isArray(raw) ? raw : raw.items || raw.data || raw.holidays || [];

    const extractDate = (obj: any, keys: string[]) => {
      if (!obj) return null;
      for (const k of keys) {
        const v = obj[k];
        if (typeof v === "string" || typeof v === "number") return v;
        if (v && typeof v === "object") {
          if (typeof v.from === "string" || typeof v.from === "number") return v.from;
          if (typeof v.start === "string" || typeof v.start === "number") return v.start;
          if (typeof v.dateFrom === "string" || typeof v.dateFrom === "number") return v.dateFrom;
        }
      }
      // sometimes dates are nested under obj.date: {from:...}
      if (obj.date && typeof obj.date === "object") {
        if (obj.date.from) return obj.date.from;
        if (obj.date.start) return obj.date.start;
      }
      return null;
    };

    const mapped = items
      .map((h: any) => {
        // handle different possible key names conservatively
        const startIso = extractDate(h, ["start", "startDate", "from", "dateFrom", "begin"]);
        const endIso = extractDate(h, ["end", "endDate", "to", "dateTo", "finish"]);
        const name = (h && (h.name || h.title || h.holidayName || h.description)) || "Ferien";

        if (!startIso || !endIso) return null;

        const s = new Date(startIso);
        const e = new Date(endIso);
        if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;

        const formatDate = (d: Date) => {
          const day = String(d.getDate()).padStart(2, "0");
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const year = d.getFullYear();
          return `${day}.${month}.${year}`;
        };

        return {
          name,
          start: formatDate(s),
          end: formatDate(e),
        };
      })
      .filter((x): x is { name: string; start: string; end: string } => x !== null);

    setCache(cacheKey, mapped);
    // If empty result, fallback to static local data if present
    if (mapped.length === 0 && DENMARK_SCHOOL_HOLIDAYS?.[year]) {
      return DENMARK_SCHOOL_HOLIDAYS[year];
    }
    return mapped;
  } catch (error) {
    console.error("Error fetching Denmark holidays from OpenHolidays:", error);
    // Fallback to static data if available
    return DENMARK_SCHOOL_HOLIDAYS?.[year] ?? [];
  }
}

// ------------------------------------------------------------------
// registerRoutes: main POST /api/check-holidays handler (unchanged)
// but uses fetchDenmarkHolidaysFromOpenHolidays instead of static data
// ------------------------------------------------------------------
export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/check-holidays", async (req, res) => {
    try {
      // Validate request body
      const validation = holidayQuerySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid request data",
          details: validation.error.errors,
        });
      }

      const { fromDate, toDate, year } = validation.data;
      const userStart = parseDate(fromDate);
      const userEnd = parseDate(toDate);

      // Fetch German holidays for all states
      const germanStates: StateHolidays[] = await Promise.all(
        GERMAN_STATES.map(async (state) => {
          const holidays = await fetchGermanHolidays(year, state.code);

          const overlappingHolidays: Holiday[] = holidays
            .map((h: any) => {
              // Parse ISO dates from API (they're in UTC)
              const holidayStart = new Date(h.start);
              const holidayEnd = new Date(h.end);

              if (datesOverlap(userStart, userEnd, holidayStart, holidayEnd)) {
                // Format dates to DD.MM.YYYY
                const formatDate = (d: Date) => {
                  const day = String(d.getDate()).padStart(2, "0");
                  const month = String(d.getMonth() + 1).padStart(2, "0");
                  const year = d.getFullYear();
                  return `${day}.${month}.${year}`;
                };

                return {
                  name: translateHolidayName(h.name),
                  start: formatDate(holidayStart),
                  end: formatDate(holidayEnd),
                };
              }
              return null;
            })
            .filter((h): h is Holiday => h !== null);

          return {
            state: state.name,
            stateCode: state.code,
            holidays: overlappingHolidays,
          };
        })
      );

      // Filter out states with no holidays
      const statesWithHolidays = germanStates.filter((s) => s.holidays.length > 0);

      // Fetch Denmark holidays using OpenHolidays integration
      const denmarkHolidaysData = await fetchDenmarkHolidaysFromOpenHolidays(year);
      const denmarkHolidays: Holiday[] = denmarkHolidaysData
        .map((h: any) => {
          const holidayStart = new Date(h.start);
          const holidayEnd = new Date(h.end);

          if (datesOverlap(userStart, userEnd, holidayStart, holidayEnd)) {
            const formatDate = (d: Date) => {
              const day = String(d.getDate()).padStart(2, "0");
              const month = String(d.getMonth() + 1).padStart(2, "0");
              const year = d.getFullYear();
              return `${day}.${month}.${year}`;
            };

            return {
              name: h.name,
              start: formatDate(holidayStart),
              end: formatDate(holidayEnd),
            };
          }
          return null;
        })
        .filter((h): h is Holiday => h !== null);

      const result: HolidayCheckResult = {
        query: { fromDate, toDate, year },
        germany: {
          country: "Deutschland",
          countryCode: "DE",
          hasHolidays: statesWithHolidays.length > 0,
          states: statesWithHolidays,
        },
        denmark: {
          country: "Dänemark",
          countryCode: "DK",
          hasHolidays: denmarkHolidays.length > 0,
          holidays: denmarkHolidays,
        },
      };

      res.json(result);
    } catch (error) {
      console.error("Error checking holidays:", error);
      res.status(500).json({
        error: "Fehler beim Abrufen der Feriendaten. Bitte versuchen Sie es später erneut.",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Translate German holiday names to more readable format
function translateHolidayName(name?: string): string {
  if (!name) return "Ferien";
  const translations: Record<string, string> = {
    winterferien: "Winterferien",
    osterferien: "Osterferien",
    pfingstferien: "Pfingstferien",
    sommerferien: "Sommerferien",
    herbstferien: "Herbstferien",
    weihnachtsferien: "Weihnachtsferien",
  };

  return translations[name.toLowerCase()] || name.charAt(0).toUpperCase() + name.slice(1);
}
