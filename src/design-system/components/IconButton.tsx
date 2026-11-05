import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../cn";

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  /** Red notification pip (Figma Top Bar bell) */
  showDot?: boolean;
};

export function IconButton({
  children,
  showDot = false,
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "relative inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-wz-md border border-wz-border bg-white p-0 text-wz-text-secondary transition-colors hover:enabled:bg-wz-neutral-50 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...rest}
    >
      {children}
      {showDot ? (
        <span
          className="absolute top-2 right-[9px] size-1.5 rounded-wz-full border-[1.5px] border-white bg-wz-error"
          aria-hidden
        />
      ) : null}
    </button>
  );
}
