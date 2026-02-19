import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border-border",
        // Doppi custom variants
        subject: "border-transparent bg-primary/10 text-primary font-medium",
        free: "border-transparent bg-xp/15 text-xp font-bold",
        premium: "border-transparent bg-gradient-coin text-foreground font-bold",
        difficulty: "border-transparent bg-muted text-muted-foreground",
        streak: "border-transparent bg-streak/15 text-streak font-bold",
        xp: "border-transparent bg-xp/15 text-xp font-bold",
        coin: "border-transparent bg-coin/15 text-coin font-bold",
        new: "border-transparent bg-accent text-accent-foreground",
        verified: "border-transparent bg-primary text-primary-foreground",
        // Content status variants
        draft: "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium",
        incomplete: "border-transparent bg-orange-500/15 text-orange-600 dark:text-orange-400 font-medium",
        published: "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
