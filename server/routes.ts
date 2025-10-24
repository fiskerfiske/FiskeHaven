import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { holidayQuerySchema, type HolidayCheckResult, type Holiday, type StateHolidays } from "@shared/schema";
import { DENMARK_SCHOOL_HOLIDAYS } from "./denmark-holidays-data";

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

function getCached(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Parse DD.MM.YYYY to Date
function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
}

// Check if date ranges overlap
function datesOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
  return start1 <= end2 && start2 <= end1;
}

// German state codes and names
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

function fetchDenmarkHolidays(year: number): any[] {
  // Use static data from denmark-holidays-data.ts
  // Denmark school holidays are municipality-based; we use Copenhagen as national reference
  const holidays = DENMARK_SCHOOL_HOLIDAYS[year] || [];
  return holidays;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/check-holidays", async (req, res) => {
    try {
      // Validate request body
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
                  const day = String(d.getDate()).padStart(2, '0');
                  const month = String(d.getMonth() + 1).padStart(2, '0');
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
      const statesWithHolidays = germanStates.filter(s => s.holidays.length > 0);

      // Fetch Denmark holidays
      const denmarkHolidaysData = fetchDenmarkHolidays(year);
      const denmarkHolidays: Holiday[] = denmarkHolidaysData
        .map((h: any) => {
          const holidayStart = new Date(h.start);
          const holidayEnd = new Date(h.end);
          
          if (datesOverlap(userStart, userEnd, holidayStart, holidayEnd)) {
            const formatDate = (d: Date) => {
              const day = String(d.getDate()).padStart(2, '0');
              const month = String(d.getMonth() + 1).padStart(2, '0');
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
        error: "Fehler beim Abrufen der Feriendaten. Bitte versuchen Sie es später erneut." 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Translate German holiday names to more readable format
function translateHolidayName(name: string): string {
  const translations: Record<string, string> = {
    'winterferien': 'Winterferien',
    'osterferien': 'Osterferien',
    'pfingstferien': 'Pfingstferien',
    'sommerferien': 'Sommerferien',
    'herbstferien': 'Herbstferien',
    'weihnachtsferien': 'Weihnachtsferien',
  };
  
  return translations[name.toLowerCase()] || name.charAt(0).toUpperCase() + name.slice(1);
}
