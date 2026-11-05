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
        "inline-flex items-center justify-center gap-1 rounded-wz-sm font-semibold whitespace-nowrap box-border",
        size === "sm"
          ? "h-[18px] px-1.5 py-0.5 text-[11px] leading-[14px]"
          : "h-[25px] px-2 py-1 text-xs leading-4",
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
