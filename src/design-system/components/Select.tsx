import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../cn";


export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

/**
 * Figma Form/Select (1:13640): 40px box, 16px #6c757d chevron 13px from the right.
 * The chevron is a real icon; the old Tailwind `bg-[url(...)]` arbitrary class
 * was never generated, so selects rendered with no arrow at all.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, invalid = false, children, ...rest }, ref) {
    return (
      <div className="relative w-full">
      <select
        ref={ref}
        className={cn(
          "w-full min-h-10 appearance-none rounded-wz-md border border-wz-border bg-white pl-3 pr-9 py-2 text-sm leading-5 text-wz-heading outline-none cursor-pointer transition-[border-color,box-shadow,background-color]",
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
      <ChevronDown
        size={16}
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-[13px] -translate-y-1/2 text-wz-text-muted"
      />
      </div>
    );
  },
);
