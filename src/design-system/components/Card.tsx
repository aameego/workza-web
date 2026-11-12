import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../cn";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  flush?: boolean;
  /** 20px padding (Figma form cards) instead of 24. */
  compact?: boolean;
  /** #f8f9fa fill (Figma form cards) instead of white. */
  subtle?: boolean;
};

/** Figma Layout/Card surface */
export function Card({
  children,
  flush = false,
  compact = false,
  subtle = false,
  className,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "box-border rounded-wz-xl border border-wz-border",
        subtle ? "bg-wz-neutral-50" : "bg-white",
        flush ? "p-0" : compact ? "p-wz-5" : "p-wz-6",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
