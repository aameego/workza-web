import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../cn";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  flush?: boolean;
};

/** Figma Layout/Card surface */
export function Card({
  children,
  flush = false,
  className,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "box-border rounded-wz-xl border border-wz-border bg-white",
        flush ? "p-0" : "p-wz-6",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
