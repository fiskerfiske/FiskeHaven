# Ferienprüfer - Fishing Holiday Checker

A beautiful fishing-themed web application to check for school holidays in Germany and Denmark during specified travel dates. Perfect for anglers planning trips outside busy holiday periods.

## Project Overview

**Purpose**: Help users verify if their planned travel dates overlap with German or Danish school holidays, making it easier to plan peaceful fishing trips.

**Theme**: Aquatic/fishing aesthetic with calming blue tones and subtle fish/wave imagery.

## Features

### Core Functionality
- **Date Range Checker**: Input travel dates (DD.MM.YYYY format) to check for holiday overlaps
- **Multi-Region Coverage**: 
  - Germany: All 16 federal states (Bundesländer)
  - Denmark: National school holidays
- **Smart Validation**: Ensures dates are valid, in correct order, and within selected year
- **Real-time API Integration**: 
  - ferien-api.de for German school holidays
  - OpenHolidays API for Denmark school holidays
- **24-Hour Caching**: Reduces API calls and improves performance

### User Interface
- **Fishing Theme**: Beautiful blue aquatic color scheme with fish icons
- **Dark Mode Support**: Full light/dark theme toggle
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop
- **Loading States**: Beautiful spinner while fetching data
- **Clear Results**: Organized by country and state with holiday details
- **Form Validation**: Real-time validation with helpful error messages

## Technology Stack

### Frontend
- React with TypeScript
- Tailwind CSS with custom fishing theme colors
- Shadcn UI components
- Wouter for routing
- TanStack Query for data fetching

### Backend
- Node.js with Express
- TypeScript
- In-memory caching (24-hour TTL)
- Zod for validation

### External APIs & Data Sources
- **OpenHolidays API**: Free API for German school holidays (all 16 federal states)
  - Uses ISO 3166-2 subdivision codes (DE-BW, DE-BY, etc.)
  - Provides data from 2020 onwards
- **Static Data**: Denmark school holidays (Copenhagen reference)
  - Pre-loaded data for years 2025-2031
  - Based on Copenhagen municipality as national reference
  - Denmark holidays vary by municipality

## Project Structure

```
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── holiday-check-form.tsx    # Date input form
│   │   │   ├── holiday-results.tsx       # Results display
│   │   │   └── theme-toggle.tsx          # Dark mode toggle
│   │   ├── pages/
│   │   │   └── home.tsx                  # Main page
│   │   └── index.css                     # Theme colors
├── server/
│   └── routes.ts                         # API endpoints
├── shared/
│   └── schema.ts                         # TypeScript types
└── design_guidelines.md                   # Design system documentation
```

## Design System

### Colors
- **Primary**: Ocean blue (#007BFF / hsl(199 89% 48%))
- **Background**: Light aqua tones for a calm, water-like feel
- **Accents**: Soft blues and greens evoking water/nature
- **Dark Mode**: Deep ocean blues with proper contrast

### Typography
- **Sans**: Inter for clean, readable body text
- **Heading**: Montserrat for distinctive headers

### Components
- All components use Shadcn UI base library
- Custom fishing theme applied via Tailwind
- Consistent spacing (4, 6, 8, 12, 16 units)
- Smooth transitions and hover states

## API Endpoints

### POST /api/check-holidays

**Request Body**:
```json
{
  "fromDate": "01.07.2025",
  "toDate": "31.07.2025",
  "year": 2025
}
```

**Response**:
```json
{
  "query": { "fromDate": "01.07.2025", "toDate": "31.07.2025", "year": 2025 },
  "germany": {
    "country": "Deutschland",
    "countryCode": "DE",
    "hasHolidays": true,
    "states": [
      {
        "state": "Bayern",
        "stateCode": "BY",
        "holidays": [
          {
            "name": "Sommerferien",
            "start": "01.08.2025",
            "end": "15.09.2025"
          }
        ]
      }
    ]
  },
  "denmark": {
    "country": "Dänemark",
    "countryCode": "DK",
    "hasHolidays": false,
    "holidays": []
  }
}
```

## Development

The application runs on port 5000 with:
- Express server handling API requests
- Vite dev server for frontend hot reload
- Automatic workflow restart on file changes

## Testing

The application has been thoroughly tested with:
- End-to-end tests covering all user journeys
- Form validation (date format, order, year matching)
- API integration with both external services
- Theme switching (light/dark modes)
- Responsive design across breakpoints
- Loading and error states

## Recent Updates

### API Migration (2025-10-27)
- ✅ Migrated German holidays from ferien-api.de to OpenHolidays API
  - Resolved 429 rate limiting errors
  - Using ISO 3166-2 subdivision codes (DE-BW, DE-BY, etc.)
  - All 16 federal states now returning data correctly
- ✅ Switched Denmark holidays to static data source
  - OpenHolidays API has no Denmark school holiday data
  - Using Copenhagen reference data (2025-2031)
  - Denmark holidays vary by municipality; Copenhagen used as national reference
- ✅ Improved error handling and logging for both data sources
- ✅ 24-hour caching remains active for performance
- ✅ All API tests passing successfully

### Project Import to Replit (2025-10-27)
- ✅ Imported GitHub repository to Replit
- ✅ Installed all npm dependencies
- ✅ Fixed TypeScript compilation errors in routes.ts
- ✅ Configured workflow to run on port 5000 with webview
- ✅ Set up .gitignore for Node.js project
- ✅ Configured deployment (autoscale) with build and run commands
- ✅ Updated browserslist database
- ✅ Verified application is running and functional
- ✅ Server running on 0.0.0.0:5000 with Vite HMR enabled

### Latest Changes (2025-10-24)
- ✅ Implemented complete MVP with all features
- ✅ Fixed JSON parsing in API mutation
- ✅ Added null safety checks in results component
- ✅ Removed emoji in favor of icon-only design
- ✅ All e2e tests passing successfully
- ✅ Architect review completed and approved

## User Preferences

- Boss is an angling/fishing enthusiast (hence the fishing theme)
- Prefers clean, professional design without clutter
- Needs the app to work reliably for planning Denmark fishing trips
