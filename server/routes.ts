import { Express } from "express";
import { createServer, Server } from "http";

// runtime imports
import { holidayQuerySchema } from "../shared/schema";
import type { StateHolidays, Holiday, HolidayCheckResult } from "../shared/schema";
import { DENMARK_SCHOOL_HOLIDAYS } from "./denmark-holidays-data";

// --- Simple in-memory cache helpers ---
const __CACHE = new Map<string, { expires: number; value: unknown }>();

function setCache(key: string, value: unknown, ttlSeconds = 60 * 60 * 24) {
  const expires = Date.now() + ttlSeconds * 1000;
  __CACHE.set(key, { expires, value });
}

function getCached<T = unknown>(key: string): T | undefined {
  const entry = __CACHE.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    __CACHE.delete(key);
    return undefined;
  }
  return entry.value as T;
}

function parseDate(dateStr: string): Date | null {
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

function datesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  return aStart.getTime() <= bEnd.getTime() && bStart.getTime() <= aEnd.getTime();
}

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
// German holidays via OpenHolidays API
// -------------------------
async function fetchGermanHolidays(year: number, stateCode: string): Promise<any[]> {
  const cacheKey = `DE_${stateCode}_${year}`;
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  const validFrom = `${year}-01-01`;
  const validTo = `${year}-12-31`;
  // OpenHolidays API uses ISO 3166-2 subdivision codes: DE-BW, DE-BY, etc.
  const subdivisionCode = `DE-${stateCode}`;
  const url = `https://openholidaysapi.org/SchoolHolidays?countryIsoCode=DE&subdivisionCode=${subdivisionCode}&languageIsoCode=DE&validFrom=${validFrom}&validTo=${validTo}`;

  try {
    const response = await fetch(url, { 
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'Ferienpruefer/1.0'
      } 
    });

    if (!response.ok) {
      console.error(`OpenHolidays API returned ${response.status} for ${stateCode}`);
      return [];
    }

    const data = await response.json();
    // OpenHolidays API returns array directly
    const holidays = Array.isArray(data) ? data : [];
    
    // Map OpenHolidays format to our format
    const mapped = holidays.map((h: any) => {
      // Extract name from the API response
      let name = 'Ferien';
      if (Array.isArray(h.name) && h.name.length > 0) {
        name = h.name[0].text || name;
      } else if (typeof h.name === 'string') {
        name = h.name;
      }

      return {
        name,
        start: h.startDate,
        end: h.endDate,
      };
    });

    setCache(cacheKey, mapped);
    return mapped;
  } catch (error) {
    console.error(`Error fetching German holidays for ${stateCode}:`, error instanceof Error ? error.message : error);
    return [];
  }
}

// ------------------------------------------------------------
// Denmark holidays - using static data (Copenhagen reference)
// Denmark school holidays vary by municipality; we use Copenhagen as national reference
// ------------------------------------------------------------
async function fetchDenmarkHolidaysFromOpenHolidays(year: number): Promise<any[]> {
  const cacheKey = `DK_${year}`;
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  // Get data from static file (Copenhagen as national reference)
  const yearData = DENMARK_SCHOOL_HOLIDAYS[year];
  
  if (!yearData) {
    console.warn(`No Denmark holiday data available for year ${year}`);
    return [];
  }

  // Convert from static format to our API format
  const holidays = yearData.map((h) => ({
    name: h.name,
    start: h.start,
    end: h.end,
  }));

  setCache(cacheKey, holidays);
  console.info(`Denmark: loaded ${holidays.length} school holidays for ${year} (Copenhagen reference)`);
  return holidays;
}

// ------------------------------------------------------------------
// registerRoutes: main POST /api/check-holidays handler
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

      if (!userStart || !userEnd) {
        return res.status(400).json({
          error: "Invalid date format",
        });
      }

      // Fetch German holidays for all states (sequential to avoid burst)
      const germanStates: StateHolidays[] = [];
      for (const state of GERMAN_STATES) {
        const holidays = await fetchGermanHolidays(year, state.code);

        const overlappingHolidays: Holiday[] = holidays
          .map((h: any) => {
            const holidayStart = new Date(h.start || h.startDate || h.from);
            const holidayEnd = new Date(h.end || h.endDate || h.to);

            if (isNaN(holidayStart.getTime()) || isNaN(holidayEnd.getTime())) return null;

            if (datesOverlap(userStart, userEnd, holidayStart, holidayEnd)) {
              const formatDate = (d: Date) => {
                const day = String(d.getDate()).padStart(2, "0");
                const month = String(d.getMonth() + 1).padStart(2, "0");
                const year = d.getFullYear();
                return `${day}.${month}.${year}`;
              };

              return {
                name: translateHolidayName((h.name || h.title || h.holidayName || h.description) as string | undefined),
                start: formatDate(holidayStart),
                end: formatDate(holidayEnd),
              };
            }
            return null;
          })
          .filter((h): h is Holiday => h !== null);

        germanStates.push({ state: state.name, stateCode: state.code, holidays: overlappingHolidays });
      }

      const statesWithHolidays = germanStates.filter((s) => s.holidays.length > 0);

      // Fetch Denmark holidays using OpenHolidays (API only)
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
