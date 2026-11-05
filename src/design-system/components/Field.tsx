import type { ReactNode } from "react";
import { cn } from "../cn";

export type FieldProps = {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
};

/** Label + control + hint/error — Figma Form wrapper */
export function Field({
  label,
  htmlFor,
  required = false,
  hint,
  error,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label
        className="text-sm font-semibold leading-5 text-wz-text-primary"
        htmlFor={htmlFor}
      >
        {label}
        {required ? (
          <span className="ml-0.5 text-wz-error" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="m-0 text-xs leading-4 text-wz-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="m-0 text-xs leading-4 text-wz-text-secondary">{hint}</p>
      ) : null}
    </div>
  );
}
