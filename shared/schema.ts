import { z } from "zod";

// Holiday query schema
export const holidayQuerySchema = z.object({
  fromDate: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, "Date must be in DD.MM.YYYY format"),
  toDate: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, "Date must be in DD.MM.YYYY format"),
  year: z.number().int().min(2024).max(2030),
});

export type HolidayQuery = z.infer<typeof holidayQuerySchema>;

// Holiday result types
export interface Holiday {
  name: string;
  start: string;
  end: string;
  region?: string;
}

export interface StateHolidays {
  state: string;
  stateCode: string;
  holidays: Holiday[];
}

export interface CountryHolidays {
  country: string;
  countryCode: string;
  hasHolidays: boolean;
  states?: StateHolidays[];
  holidays?: Holiday[];
}

export interface HolidayCheckResult {
  query: HolidayQuery;
  germany: CountryHolidays;
  denmark: CountryHolidays;
}
