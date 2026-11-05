import * as React from "react";
import { cn } from "@/lib/utils";

/* shadcn/ui-style primitives tuned to Seen's ink + sun palette. */

type Variant = "primary" | "sun" | "outline" | "ghost" | "subtle" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-950 shadow-sm disabled:bg-ink-300",
  sun: "bg-sun-500 text-white hover:bg-sun-600 active:bg-sun-700 shadow-sm disabled:bg-sun-200",
  outline:
    "border border-ink-200 bg-white text-ink-900 hover:border-ink-300 hover:bg-ink-50 disabled:text-ink-300",
  ghost: "text-ink-700 hover:bg-ink-50 active:bg-ink-100",
  subtle: "bg-ink-50 text-ink-800 hover:bg-ink-100",
  danger: "bg-[#A8442A] text-white hover:bg-[#8f3923]",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-[15px] gap-2 rounded-xl",
  icon: "h-9 w-9 rounded-lg justify-center",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

export const buttonClass = ({ variant = "primary", size = "md" }: { variant?: Variant; size?: Size } = {}) =>
  cn(
    "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-400 focus-visible:ring-offset-2 disabled:pointer-events-none",
    VARIANTS[variant],
    SIZES[size],
  );

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return <button className={cn(buttonClass({ variant, size }), className)} {...props} />;
}
