import type { ReactNode } from "react";
import { cn } from "../../design-system";

export type EmployeeInfoFieldProps = {
  label: string;
  value: ReactNode;
  className?: string;
  fullWidth?: boolean;
};

/** Figma InfoField — uppercase muted label + navy value */
export function EmployeeInfoField({
  label,
  value,
  className,
  fullWidth = false,
}: EmployeeInfoFieldProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1",
        fullWidth ? "w-full" : "flex-1",
        className,
      )}
    >
      <p className="m-0 text-xs font-semibold tracking-[0.5px] text-[#6c757d] uppercase">
        {label}
      </p>
      <p className="m-0 text-sm font-semibold break-words text-[#0a1f4a]">
        {value}
      </p>
    </div>
  );
}

export function EmployeeInfoRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-wz-4 sm:flex-row sm:gap-6">
      {children}
    </div>
  );
}

export function EmployeeSectionHeader({ title }: { title: string }) {
  return (
    <div className="w-full border-b border-wz-border pb-2">
      <h2 className="m-0 text-base font-semibold text-[#0a1f4a]">{title}</h2>
    </div>
  );
}
