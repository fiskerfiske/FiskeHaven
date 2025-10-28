import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { HolidayCheckResult } from "@shared/schema";

const formSchema = z.object({
  fromDate: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, "Format muss DD.MM.YYYY sein"),
  toDate: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, "Format muss DD.MM.YYYY sein"),
  year: z.string(),
}).refine((data) => {
  const from = parseDate(data.fromDate);
  const to = parseDate(data.toDate);
  return from && to && from < to;
}, {
  message: "Von-Datum muss vor Bis-Datum liegen",
  path: ["toDate"],
}).refine((data) => {
  const from = parseDate(data.fromDate);
  const to = parseDate(data.toDate);
  const year = parseInt(data.year);
  if (!from || !to) return false;
  return from.getFullYear() === year && to.getFullYear() === year;
}, {
  message: "Beide Daten müssen im ausgewählten Jahr liegen",
  path: ["toDate"],
});

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

interface HolidayCheckFormProps {
  onResults: (results: HolidayCheckResult) => void;
  onLoadingChange: (loading: boolean) => void;
}

export default function HolidayCheckForm({ onResults, onLoadingChange }: HolidayCheckFormProps) {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => currentYear + i);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromDate: "",
      toDate: "",
      year: currentYear.toString(),
    },
  });

  const checkHolidaysMutation = useMutation({
    mutationFn: async (data: { fromDate: string; toDate: string; year: number }) => {
      const response = await apiRequest("POST", "/api/check-holidays", data);
      const json = await response.json();
      return json as HolidayCheckResult;
    },
    onSuccess: (data) => {
      onResults(data);
      onLoadingChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler beim Abrufen der Daten",
        description: error.message || "Bitte versuchen Sie es später erneut.",
        variant: "destructive",
      });
      onLoadingChange(false);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onLoadingChange(true);
    checkHolidaysMutation.mutate({
      fromDate: values.fromDate,
      toDate: values.toDate,
      year: parseInt(values.year),
    });
  };

  return (
    <Card className="p-6 md:p-8 shadow-lg border-card-border">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <FormField
              control={form.control}
              name="fromDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Von-Datum
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="01.07.2025"
                      {...field}
                      data-testid="input-from-date"
                      className="h-12 text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="toDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Bis-Datum
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="31.07.2025"
                      {...field}
                      data-testid="input-to-date"
                      className="h-12 text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Jahr</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger
                      data-testid="select-year"
                      className="h-12 text-base"
                    >
                      <SelectValue placeholder="Jahr auswählen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium"
            disabled={checkHolidaysMutation.isPending}
            data-testid="button-check-holidays"
          >
            {checkHolidaysMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                Ferien werden geprüft...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Ferien überprüfen
              </>
            )}
          </Button>
        </form>
      </Form>
    </Card>
  );
}
