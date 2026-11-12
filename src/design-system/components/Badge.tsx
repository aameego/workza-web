import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../cn";

export type BadgeStatus =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "extra"
  | "blue";

export type BadgeSize = "md" | "sm";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  status?: BadgeStatus;
  size?: BadgeSize;
  children: ReactNode;
};

const statusClass: Record<BadgeStatus, string> = {
  success: "bg-wz-badge-success-bg text-wz-badge-success-fg",
  warning: "bg-wz-badge-warning-bg text-wz-badge-warning-fg",
  error: "bg-wz-badge-error-bg text-wz-badge-error-fg",
  info: "bg-wz-badge-info-bg text-wz-badge-info-fg",
  neutral: "bg-wz-badge-neutral-bg text-wz-badge-neutral-fg",
  extra: "bg-wz-badge-extra-bg text-wz-badge-extra-fg",
  blue: "bg-wz-badge-blue-bg text-wz-badge-blue-fg",
};

/** Figma Feedback/Status Badge */
export function Badge({
  status = "neutral",
  size = "md",
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1 rounded-wz-sm px-2 whitespace-nowrap box-border leading-[normal]",
        /* Figma Feedback/Status Badge: 10px semibold (md), 8px regular (sm) */
        size === "sm"
          ? "py-1 text-[8px] font-normal"
          : "py-1.5 text-[10px] font-semibold",
        statusClass[status],
        className,
      )}
      data-status={status}
      {...rest}
    >
      {children}
    </span>
  );
}
