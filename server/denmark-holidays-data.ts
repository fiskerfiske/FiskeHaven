// Denmark school holidays data for Copenhagen (national reference)
// Source: https://publicholidays.dk/school-holidays/copenhagen/
// Denmark school holidays are municipality-based; this uses Copenhagen as the national reference

export interface DenmarkHoliday {
  name: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export const DENMARK_SCHOOL_HOLIDAYS: Record<number, DenmarkHoliday[]> = {
  2025: [
    {
      name: "Winterferien",
      start: "2025-02-10",
      end: "2025-02-14",
    },
    {
      name: "Osterferien",
      start: "2025-04-14",
      end: "2025-04-21",
    },
    {
      name: "Christi Himmelfahrt",
      start: "2025-05-29",
      end: "2025-05-30",
    },
    {
      name: "Sommerferien",
      start: "2025-06-30",
      end: "2025-08-08",
    },
    {
      name: "Herbstferien",
      start: "2025-10-13",
      end: "2025-10-17",
    },
    {
      name: "Weihnachtsferien",
      start: "2025-12-24",
      end: "2026-01-02",
    },
  ],
  2026: [
    {
      name: "Winterferien",
      start: "2026-02-09",
      end: "2026-02-13",
    },
    {
      name: "Osterferien",
      start: "2026-03-30",
      end: "2026-04-06",
    },
    {
      name: "Christi Himmelfahrt",
      start: "2026-05-14",
      end: "2026-05-15",
    },
    {
      name: "Sommerferien",
      start: "2026-06-29",
      end: "2026-08-10",
    },
    {
      name: "Herbstferien",
      start: "2026-10-12",
      end: "2026-10-16",
    },
    {
      name: "Weihnachtsferien",
      start: "2026-12-23",
      end: "2027-01-01",
    },
  ],
  2027: [
    {
      name: "Winterferien",
      start: "2027-02-08",
      end: "2027-02-12",
    },
    {
      name: "Osterferien",
      start: "2027-03-22",
      end: "2027-03-29",
    },
    {
      name: "Christi Himmelfahrt",
      start: "2027-05-06",
      end: "2027-05-07",
    },
    {
      name: "Sommerferien",
      start: "2027-06-28",
      end: "2027-08-09",
    },
    {
      name: "Herbstferien",
      start: "2027-10-11",
      end: "2027-10-15",
    },
    {
      name: "Weihnachtsferien",
      start: "2027-12-23",
      end: "2028-01-03",
    },
  ],
  2028: [
    {
      name: "Winterferien",
      start: "2028-02-14",
      end: "2028-02-18",
    },
    {
      name: "Osterferien",
      start: "2028-04-10",
      end: "2028-04-17",
    },
    {
      name: "Christi Himmelfahrt",
      start: "2028-05-25",
      end: "2028-05-26",
    },
    {
      name: "Sommerferien",
      start: "2028-06-26",
      end: "2028-08-07",
    },
    {
      name: "Herbstferien",
      start: "2028-10-16",
      end: "2028-10-20",
    },
    {
      name: "Weihnachtsferien",
      start: "2028-12-22",
      end: "2029-01-02",
    },
  ],
  2029: [
    {
      name: "Winterferien",
      start: "2029-02-12",
      end: "2029-02-16",
    },
    {
      name: "Osterferien",
      start: "2029-03-26",
      end: "2029-04-02",
    },
    {
      name: "Christi Himmelfahrt",
      start: "2029-05-10",
      end: "2029-05-11",
    },
    {
      name: "Sommerferien",
      start: "2029-06-25",
      end: "2029-08-06",
    },
    {
      name: "Herbstferien",
      start: "2029-10-15",
      end: "2029-10-19",
    },
    {
      name: "Weihnachtsferien",
      start: "2029-12-24",
      end: "2030-01-02",
    },
  ],
  2030: [
    {
      name: "Winterferien",
      start: "2030-02-11",
      end: "2030-02-15",
    },
    {
      name: "Osterferien",
      start: "2030-04-15",
      end: "2030-04-22",
    },
    {
      name: "Christi Himmelfahrt",
      start: "2030-05-30",
      end: "2030-05-31",
    },
    {
      name: "Sommerferien",
      start: "2030-06-24",
      end: "2030-08-05",
    },
    {
      name: "Herbstferien",
      start: "2030-10-14",
      end: "2030-10-18",
    },
    {
      name: "Weihnachtsferien",
      start: "2030-12-23",
      end: "2031-01-03",
    },
  ],
  2031: [
    {
      name: "Winterferien",
      start: "2031-02-10",
      end: "2031-02-14",
    },
    {
      name: "Osterferien",
      start: "2031-04-07",
      end: "2031-04-14",
    },
    {
      name: "Christi Himmelfahrt",
      start: "2031-05-22",
      end: "2031-05-23",
    },
    {
      name: "Sommerferien",
      start: "2031-06-30",
      end: "2031-08-11",
    },
    {
      name: "Herbstferien",
      start: "2031-10-13",
      end: "2031-10-17",
    },
    {
      name: "Weihnachtsferien",
      start: "2031-12-22",
      end: "2032-01-02",
    },
  ],
};
