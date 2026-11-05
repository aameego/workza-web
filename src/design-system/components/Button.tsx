import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "min-h-8 px-3 py-1.5 text-xs leading-4",
  md: "min-h-10 px-4 py-2.5 text-sm leading-5",
  lg: "min-h-11 px-5 py-3 text-sm leading-5",
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-wz-primary text-white hover:bg-wz-primary-hover active:bg-wz-primary-active disabled:bg-wz-neutral-400 disabled:text-white",
  secondary:
    "bg-wz-hover border-wz-primary text-wz-primary hover:bg-wz-selected active:bg-wz-pressed disabled:bg-wz-neutral-100 disabled:border-wz-neutral-300 disabled:text-wz-neutral-400",
  ghost:
    "bg-transparent text-wz-primary hover:bg-wz-hover active:bg-wz-selected disabled:bg-transparent disabled:text-wz-neutral-400",
  destructive:
    "bg-wz-error text-white hover:bg-[#d92d20] active:bg-[#b42318] disabled:bg-[#f9a8a1] disabled:text-white",
};

/** Figma Action/Button — Tailwind utilities + Workza theme tokens */
export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-wz-2 rounded-wz-md border border-transparent font-semibold whitespace-nowrap transition-colors cursor-pointer disabled:cursor-not-allowed",
        sizeClass[size],
        variantClass[variant],
        className,
      )}
      data-variant={variant}
      {...rest}
    >
      {children}
    </button>
  );
}
