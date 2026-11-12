import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg" | "toolbar";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

const sizeClass: Record<ButtonSize, string> = {
  /** Figma Action/Button small (e.g. Upload): 28px tall */
  sm: "min-h-7 border-[1.5px] px-2.5 py-1 text-xs leading-4",
  /** Figma Action/Button: 43px tall, 20px side padding, 1.5px outline */
  md: "min-h-[43px] border-[1.5px] px-5 py-2.5 text-sm leading-5",
  lg: "min-h-11 border-[1.5px] px-5 py-3 text-sm leading-5",
  /** Figma Action/Employee Action (page toolbars): 40px, 13px, 1px outline */
  toolbar: "h-10 border px-4 py-2.5 text-[13px] leading-[18px]",
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-wz-primary text-white hover:bg-wz-primary-hover active:bg-wz-primary-active disabled:bg-wz-text-muted disabled:text-white",
  /** Figma Action/Button secondary — outline, white fill, primary border/text */
  secondary:
    "bg-white border-wz-primary text-wz-primary hover:bg-wz-hover active:bg-wz-selected disabled:bg-white disabled:border-wz-border disabled:text-wz-text-muted",
  ghost:
    "bg-transparent text-wz-primary hover:bg-wz-hover active:bg-wz-selected disabled:bg-transparent disabled:text-wz-text-muted",
  destructive:
    "bg-wz-danger text-white disabled:bg-wz-text-muted disabled:text-white",
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
        "box-border inline-flex items-center justify-center gap-wz-2 rounded-wz-md border-transparent font-semibold whitespace-nowrap transition-colors cursor-pointer disabled:cursor-not-allowed",
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
