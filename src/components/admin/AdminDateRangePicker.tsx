import { useMemo } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Props = {
  value: DateRange | undefined;
  onChange: (next: DateRange | undefined) => void;
  className?: string;
};

function formatShort(d: Date) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "2-digit" }).format(d);
}

export function AdminDateRangePicker({ value, onChange, className }: Props) {
  const label = useMemo(() => {
    if (!value?.from) return "Pick dates";
    if (!value.to) return formatShort(value.from);
    return `${formatShort(value.from)} – ${formatShort(value.to)}`;
  }, [value]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("justify-start gap-2 text-left font-normal", className)}
        >
          <CalendarIcon className="h-4 w-4" />
          <span className={cn(!value?.from && "text-muted-foreground")}>{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={value}
          onSelect={onChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
