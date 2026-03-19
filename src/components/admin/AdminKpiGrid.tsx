import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Kpi = {
  label: string;
  value: number | string;
  icon: ReactNode;
  sublabel?: string;
  trend?: { value: number; positive: boolean };
};

export function AdminKpiGrid({ items, className }: { items: Kpi[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-6 lg:grid-cols-4", className)}>
      {items.map((k) => (
        <div 
          key={k.label} 
          className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-all duration-200 hover:border-border hover:shadow-md"
        >
          {/* Subtle gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {k.label}
              </p>
              <p className="text-2xl font-bold tracking-tight">
                {k.value}
              </p>
              {k.sublabel && (
                <p className="text-[11px] text-muted-foreground/80">
                  {k.sublabel}
                </p>
              )}
              {k.trend && (
                <div className={cn(
                  "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                  k.trend.positive 
                    ? "bg-green-500/10 text-green-600 dark:text-green-400" 
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                )}>
                  {k.trend.positive ? '↑' : '↓'} {Math.abs(k.trend.value)}%
                </div>
              )}
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/80">
              {k.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
