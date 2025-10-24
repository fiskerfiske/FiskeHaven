import { CheckCircle2, XCircle, Calendar, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { HolidayCheckResult, CountryHolidays, Holiday } from "@shared/schema";

interface HolidayResultsProps {
  results: HolidayCheckResult | null;
  isLoading: boolean;
}

export default function HolidayResults({ results, isLoading }: HolidayResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground flex items-center gap-3">
          <Calendar className="w-7 h-7 text-primary" />
          Ergebnisse
        </h2>
        <Card className="p-8 md:p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-lg text-muted-foreground">
              Ferienzeiten werden geprüft...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  const hasAnyHolidays = results.germany?.hasHolidays || results.denmark?.hasHolidays;

  return (
    <div className="space-y-6" data-testid="section-results">
      <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground flex items-center gap-3">
        <Calendar className="w-7 h-7 text-primary" />
        Ergebnisse
      </h2>

      {!hasAnyHolidays ? (
        <Card className="p-8 md:p-12 text-center border-2 border-primary/20 bg-accent/30">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-heading font-semibold text-foreground mb-2">
                Keine Ferien in diesem Zeitraum
              </h3>
              <p className="text-base md:text-lg text-muted-foreground flex items-center justify-center gap-2">
                Perfekt zum Angeln!
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <CountrySection country={results.germany} />
          <CountrySection country={results.denmark} />
        </div>
      )}
    </div>
  );
}

function CountrySection({ country }: { country: CountryHolidays }) {
  const countryFlag = country.countryCode === "DE" ? "🇩🇪" : "🇩🇰";
  const countryName = country.country;

  return (
    <Card className="overflow-hidden">
      <div className="bg-primary/5 border-b border-card-border p-4 md:p-6">
        <h3 className="text-xl md:text-2xl font-heading font-bold text-foreground flex items-center gap-3">
          <span className="text-3xl">{countryFlag}</span>
          {countryName}
        </h3>
      </div>

      <div className="p-4 md:p-6">
        {!country.hasHolidays ? (
          <div className="flex items-center gap-3 p-4 bg-accent/30 rounded-lg">
            <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
            <p className="text-base text-foreground">
              Keine Ferien in diesem Zeitraum
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {country.states?.map((state) => (
              <StateSection key={state.stateCode} state={state} />
            ))}
            {country.holidays?.map((holiday, idx) => (
              <HolidayCard key={idx} holiday={holiday} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function StateSection({ state }: { state: { state: string; stateCode: string; holidays: Holiday[] } }) {
  if (state.holidays.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-primary" />
        <h4 className="text-lg font-semibold text-foreground">
          {state.state}
        </h4>
        <Badge variant="secondary" className="ml-auto">
          {state.holidays.length} {state.holidays.length === 1 ? "Ferienzeit" : "Ferienzeiten"}
        </Badge>
      </div>
      <div className="space-y-2 pl-7">
        {state.holidays.map((holiday, idx) => (
          <HolidayCard key={idx} holiday={holiday} compact />
        ))}
      </div>
    </div>
  );
}

function HolidayCard({ holiday, compact = false }: { holiday: Holiday; compact?: boolean }) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-card border border-card-border hover-elevate transition-all ${
        compact ? "" : ""
      }`}
      data-testid="card-holiday"
    >
      <div className="flex items-start gap-3">
        <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-foreground">{holiday.name}</p>
          {holiday.region && (
            <p className="text-sm text-muted-foreground mt-0.5">{holiday.region}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:ml-auto">
        <Badge variant="outline" className="whitespace-nowrap">
          <Calendar className="w-3 h-3 mr-1.5" />
          {holiday.start} - {holiday.end}
        </Badge>
      </div>
    </div>
  );
}
