# Design Guidelines: Fishing Holiday Checker Web Application

## Design Approach

**Approach**: Custom Thematic Design with Utility-First Principles
- **Theme**: Fishing/Angling aesthetic with aquatic elements
- **Inspiration**: Clean, calm water aesthetics combined with functional form design (similar to outdoor recreation apps like FishBrain, but with utility tool simplicity)
- **Core Principle**: Calm, trustworthy interface that prioritizes quick information retrieval while maintaining fishing theme atmosphere

## Layout System

**Container Strategy**:
- Maximum content width: `max-w-4xl` for main form and results
- Consistent horizontal padding: `px-4 md:px-6`
- Vertical spacing units: Use Tailwind units of **4, 6, 8, 12, and 16** (e.g., `p-4`, `gap-8`, `my-12`)

**Page Structure**:
- Single-column centered layout
- Header section with app branding (fishing theme elements)
- Main form section: Prominent, card-based container
- Results section: Appears below form, expanding naturally with content
- Footer: Minimal, containing attribution/info

**Responsive Breakpoints**:
- Mobile (base): Single column, full-width cards with reduced padding
- Tablet (md:): Slightly increased padding, maintain single column
- Desktop (lg:): Maximum container width with generous breathing room

## Typography

**Font Families**:
- Primary: Inter or Roboto (clean, readable sans-serif for forms and data)
- Accent: Montserrat or similar for headings (slightly nautical/adventurous feel)

**Type Scale**:
- Page Title/H1: `text-3xl md:text-4xl font-bold`
- Section Headers/H2: `text-2xl md:text-3xl font-semibold`
- Card Titles/H3: `text-xl font-semibold`
- Form Labels: `text-sm font-medium`
- Body Text: `text-base`
- Helper Text: `text-sm`
- Results Data: `text-sm md:text-base`

## Component Library

### Header Component
- Centered layout with app title
- Subtitle/tagline: "Plan je angelreis buiten schoolvakanties" or similar fishing-related messaging
- Decorative fish or fishing rod icon/illustration integrated subtly
- Height: `py-8 md:py-12`

### Main Form Card
- Prominent card container with subtle shadow (`shadow-lg`)
- Rounded corners: `rounded-xl`
- Padding: `p-6 md:p-8`
- Form layout: Grid with responsive columns
  - Mobile: Single column stack
  - Desktop: `grid-cols-2` for From/To dates, single column for Year
- **Date Input Fields**:
  - Label above input
  - Input style: `border-2` with `rounded-lg`
  - Height: `h-12`
  - Placeholder text showing DD.MM.YYYY format
  - Icon prefix (calendar icon from Heroicons)
- **Year Dropdown/Select**:
  - Similar styling to date inputs
  - Full width on mobile, appropriate width on desktop
- **Submit Button**:
  - Prominent, full-width on mobile
  - Positioned below inputs with `mt-6`
  - Height: `h-12`
  - Rounded: `rounded-lg`
  - Icon: Fishing-related icon (fish or search icon)
  - Text: "Ferien überprüfen" or similar

### Results Display Section

**No Results State**:
- Centered message card
- Friendly icon (checkmark in circle)
- Message: "Keine Ferien in diesem Zeitraum. Perfekt zum Angeln!"
- Subtle background treatment

**Results with Holidays**:
- **Country Section Cards**: Separate cards for Germany and Denmark
- Card structure for each country:
  - Country header with flag icon and name
  - If holidays found: List of affected regions/states
  - If no holidays: Simple "Keine Ferien" message

**Individual Holiday Cards** (nested within country cards):
- Compact card design with `rounded-lg`
- Grid layout: 
  - Holiday name/type (left)
  - Date range (right, aligned right on desktop)
- State/Region identifier (for Germany): Badge or tag style
- Spacing between cards: `gap-3`
- Subtle divider or distinct background for each holiday entry

**Germany Results**:
- Group by state (Bundesland)
- State name as sub-header with `text-lg font-semibold`
- List holidays under each state
- Collapsible sections for states with many holidays (consider accordion pattern)

**Denmark Results**:
- Simpler structure (country-wide)
- Direct list of holidays without state grouping

### Icons & Decorative Elements

**Icon Library**: Heroicons (via CDN)
- Calendar icon for date inputs
- Search/Check icon for submit button
- Flag icons for countries (or text flags: 🇩🇪 🇩🇰)
- Checkmark circle for "no holidays" state
- Info circle for helper text
- Fish silhouette for header decoration (Font Awesome: `fa-fish` or simple SVG)

**Fishing Theme Integration**:
- Subtle wave pattern or water texture in background (very light, non-distracting)
- Small fishing rod or fish icon next to app title
- Consider subtle fish/wave icons as decorative elements in card corners (very minimal)

### Loading State
- Center-aligned spinner during API fetch
- Text: "Ferienzeiten werden geprüft..."
- Replace form results section during loading

### Error State
- Alert box with red/warning styling
- Icon: Alert triangle or info icon
- Clear error message with actionable guidance
- Positioned above results section

## Spacing & Rhythm

**Section Spacing**:
- Between header and form: `mt-8 md:mt-12`
- Between form and results: `mt-12 md:mt-16`
- Bottom page padding: `pb-16`

**Card Internal Spacing**:
- Card padding: `p-6` on mobile, `p-8` on desktop
- Between form fields: `gap-4 md:gap-6`
- Between result items: `gap-3`

**List Spacing**:
- Between holiday entries: `space-y-3`
- Between country sections: `space-y-8`

## Accessibility

- All form inputs have associated labels with proper `for` attributes
- Color contrast meets WCAG AA standards
- Focus states clearly visible on all interactive elements (form inputs, buttons)
- Semantic HTML: `<form>`, `<label>`, `<button>`, proper heading hierarchy
- ARIA labels where helpful (loading states, dynamic content)
- Keyboard navigable throughout

## Responsive Behavior

**Mobile (< 768px)**:
- Full-width cards with minimal horizontal margins
- Stacked form inputs (single column)
- Full-width buttons
- Reduced typography sizes
- Compact padding in cards

**Desktop (≥ 768px)**:
- Centered layout with max-width container
- Two-column grid for date inputs
- Increased spacing and padding
- Hover states on interactive elements
- Side-by-side display for holiday date ranges

## Images

No hero images required for this utility application. Focus on clean, functional design with thematic icon elements instead. The fishing theme is conveyed through:
- Icon selections (fish, fishing rod decorative elements)
- Calm, water-inspired visual treatment
- Thematic language in messaging

## Animation & Interactions

**Minimal Animations**:
- Smooth transitions on form input focus: `transition-all duration-200`
- Fade-in for results section: `transition-opacity duration-300`
- Button hover scale: `hover:scale-105 transition-transform`
- Loading spinner rotation
- No elaborate scroll animations or distracting effects

**Interaction States**:
- Input focus: Enhanced border treatment
- Button hover: Subtle lift effect
- Button active: Slight scale-down
- Disabled state: Reduced opacity with cursor-not-allowed