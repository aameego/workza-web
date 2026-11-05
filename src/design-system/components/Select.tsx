import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "../cn";

const chevron =
  "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23868E96' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")] bg-no-repeat bg-size-[16px] bg-position-[right_12px_center]";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

/** Figma Form/Select */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, invalid = false, children, ...rest }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "w-full min-h-10 appearance-none rounded-wz-md border border-wz-border bg-white pl-3 pr-9 py-2 text-sm leading-5 text-wz-text-primary outline-none cursor-pointer transition-[border-color,box-shadow,background-color]",
          chevron,
          "hover:enabled:border-wz-neutral-400 focus:border-wz-primary focus:shadow-[0_0_0_1px_var(--wz-primary)] disabled:bg-wz-neutral-100 disabled:border-wz-neutral-200 disabled:text-wz-neutral-500 disabled:cursor-not-allowed",
          invalid &&
            "border-wz-error focus:border-wz-error focus:shadow-[0_0_0_1px_var(--wz-error)]",
          className,
        )}
        aria-invalid={invalid || undefined}
        {...rest}
      >
        {children}
      </select>
    );
  },
);
