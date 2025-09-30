import * as React from "react";
import { cn } from "@/lib/utils";

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

export function Separator({
  orientation = "horizontal",
  className,
  ...props
}: SeparatorProps) {
  return (
    <div
      role="separator"
      className={cn(
        "bg-white/10",
        orientation === "horizontal"
          ? "h-px w-full"
          : "h-full w-px",
        className
      )}
      {...props}
    />
  );
}
