import {
  forwardRef,
  type ReactNode,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type SelectHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../cn";

export type FilterSelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "size"
> & {
  invalid?: boolean;
  /** md: Figma toolbar filter (40px, 13px). sm: compact panel filter (29px, 12px). */
  size?: "md" | "sm";
  /** Replaces the chevron (e.g. a calendar icon for month pickers). */
  icon?: ReactNode;
};

/**
 * Figma Data/Filter Toolbar dropdown: white box, #dee2e6 border, 8 radius,
 * 12px side padding, label then a 12px chevron 6px after it, hugging the label.
 *
 * The native <select> sits invisibly on top (keyboard, screen readers, mobile
 * pickers all keep working); the visible face shows the selected option's text,
 * so the box sizes to that label instead of the longest option.
 * ponytail: option list is still the browser's native menu — Figma's custom
 * option panel needs a listbox component; add one when that panel is built.
 */
export const FilterSelect = forwardRef<HTMLSelectElement, FilterSelectProps>(
  function FilterSelect(
    { className, invalid = false, size = "md", icon, children, value, defaultValue, onChange, ...rest },
    ref,
  ) {
    const selectRef = useRef<HTMLSelectElement>(null);
    useImperativeHandle(ref, () => selectRef.current as HTMLSelectElement);
    const [label, setLabel] = useState("");

    // Re-read the selected option's text whenever the value or options change.
    useLayoutEffect(() => {
      const el = selectRef.current;
      setLabel(el?.selectedOptions[0]?.text ?? "");
    }, [value, children]);

    return (
      <div
        className={cn(
          "relative box-border inline-flex w-auto shrink-0 items-center gap-1.5 rounded-wz-md border bg-white px-3 text-wz-text-muted transition-[border-color,box-shadow]",
          size === "sm" ? "h-[29px] text-xs" : "h-10 text-[13px]",
          invalid ? "border-wz-error" : "border-wz-border",
          "hover:border-wz-neutral-400 has-[select:focus-visible]:border-wz-primary has-[select:focus-visible]:shadow-[0_0_0_3px_var(--wz-state-hover)]",
          "has-[select:disabled]:cursor-not-allowed has-[select:disabled]:bg-wz-neutral-100 has-[select:disabled]:text-wz-neutral-500",
          className,
        )}
      >
        <span className="whitespace-nowrap leading-[normal]" aria-hidden>
          {label}
        </span>
        {icon ?? <ChevronDown size={12} aria-hidden className="shrink-0" />}
        <select
          ref={selectRef}
          className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
          aria-invalid={invalid || undefined}
          value={value}
          defaultValue={defaultValue}
          onChange={(e) => {
            setLabel(e.target.selectedOptions[0]?.text ?? "");
            onChange?.(e);
          }}
          {...rest}
        >
          {children}
        </select>
      </div>
    );
  },
);
