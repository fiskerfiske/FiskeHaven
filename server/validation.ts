import { z } from "zod";

// Einfaches, permissives Schema — es verhindert den ReferenceError.
// Du kannst die Felder später anpassen, falls nötig.
export const holidayQuerySchema = z.any();

export type HolidayQuery = z.infer<typeof holidayQuerySchema>;
