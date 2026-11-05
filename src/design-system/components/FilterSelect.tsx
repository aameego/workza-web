import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../cn";

export type FilterSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

/**
 * Toolbar filter dropdown — Figma employee directory filters.
 * Always shows a chevron (native appearance:none hides OS arrows).
 */
export const FilterSelect = forwardRef<HTMLSelectElement, FilterSelectProps>(
  function FilterSelect(
    { className, invalid = false, children, ...rest },
    ref,
  ) {
    return (
      <div className={cn("relative inline-flex min-w-[160px]", className)}>
        <select
          ref={ref}
          className={cn(
            "h-10 w-full cursor-pointer appearance-none rounded-wz-md border border-wz-border bg-white py-0 pr-9 pl-3 text-sm text-wz-text outline-none transition-[border-color,box-shadow]",
            "hover:enabled:border-wz-neutral-400 focus:border-wz-primary focus:shadow-[0_0_0_3px_var(--wz-state-hover)]",
            "disabled:cursor-not-allowed disabled:bg-wz-neutral-100 disabled:text-wz-neutral-500",
            invalid && "border-wz-error",
          )}
          aria-invalid={invalid || undefined}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          size={16}
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-wz-text-secondary"
        />
      </div>
    );
  },
);
