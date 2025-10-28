import { useState } from "react";
import { Fish, Calendar, Waves } from "lucide-react";
import HolidayCheckForm from "@/components/holiday-check-form";
import HolidayResults from "@/components/holiday-results";
import ThemeToggle from "@/components/theme-toggle";
import type { HolidayCheckResult } from "@shared/schema";

export default function Home() {
  const [results, setResults] = useState<HolidayCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckHolidays = async (result: HolidayCheckResult) => {
    setResults(result);
  };

  const handleLoadingChange = (loading: boolean) => {
    setIsLoading(loading);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Wave pattern background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.626 0-16.855 1.397-26.66 5.063l-1.767.662c-2.475.923-4.66 1.674-6.724 2.275h6.335zm0-20C13.258 2.892 8.077 4 0 4V2c5.744 0 9.951-.574 14.85-2h6.334zM77.38 0C85.239 2.966 90.502 4 100 4V2c-6.842 0-11.386-.542-16.396-2h-6.225zM0 14c8.44 0 13.718-1.21 22.272-4.402l1.768-.661C33.64 5.347 39.647 4 50 4c10.271 0 15.362 1.222 24.629 4.928C84.112 12.722 89.438 14 100 14v-2c-10.271 0-15.362-1.222-24.629-4.928C65.888 3.278 60.562 2 50 2 39.374 2 33.145 3.397 23.34 7.063l-1.767.662C13.223 10.84 8.163 12 0 12v2z' fill='%23007BFF' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Header */}
      <header className="relative border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Fish className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                <Waves className="w-4 h-4 text-primary/60 absolute -bottom-1 -right-1" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-heading font-bold text-foreground">
                  Ferienprüfer
                </h1>
                <p className="text-sm md:text-base text-muted-foreground mt-0.5">
                  Perfekte Urlaubszeit planen
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative">
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 text-accent-foreground mb-4">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Schulferien Deutschland & Dänemark</span>
            </div>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Überprüfen, ob Ihre geplante Reisezeit mit Schulferien überschneidet. 
            </p>
          </div>

          {/* Form Section */}
          <div className="max-w-4xl mx-auto mb-12 md:mb-16">
            <HolidayCheckForm 
              onResults={handleCheckHolidays}
              onLoadingChange={handleLoadingChange}
            />
          </div>

          {/* Results Section */}
          {(results || isLoading) && (
            <div className="max-w-4xl mx-auto">
              <HolidayResults results={results} isLoading={isLoading} />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-border bg-card/30 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 md:px-6 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Daten von ferien-api.de (Deutschland) und OpenHolidays API (Dänemark)
          </p>
        </div>
      </footer>
    </div>
  );
}
