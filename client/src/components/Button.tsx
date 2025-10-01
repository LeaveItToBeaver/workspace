import React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "destructive" | "outline";
  size?: "default" | "sm" | "lg";
};

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none";

  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-zinc-200 text-zinc-900 hover:bg-zinc-300",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-900",
  };

  const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
    default: "h-9 px-4 py-2",
    sm: "h-8 px-3 py-1 text-xs",
    lg: "h-11 px-8 py-3",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
