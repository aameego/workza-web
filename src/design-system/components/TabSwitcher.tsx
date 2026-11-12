import { cn } from "../cn";

export type TabSwitcherItem<T extends string> = {
  value: T;
  label: string;
  /** Count badge; omit to hide it. */
  count?: number;
};

export type TabSwitcherProps<T extends string> = {
  items: TabSwitcherItem<T>[];
  value: T;
  onChange: (value: T) => void;
  "aria-label": string;
  className?: string;
};

/**
 * Figma Navigation/Module Switcher (1:18899) — folder tabs on a bottom rule.
 * Active: white, #1f5da3 semibold, soft count. Inactive: muted, solid grey count.
 */
export function TabSwitcher<T extends string>({
  items,
  value,
  onChange,
  className,
  ...rest
}: TabSwitcherProps<T>) {
  return (
    <div
      className={cn("flex flex-wrap items-end gap-wz-2 border-b border-wz-neutral-200", className)}
      role="tablist"
      aria-label={rest["aria-label"]}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn(
              "inline-flex cursor-pointer items-center gap-wz-2 rounded-t-wz-sm border border-b-0 border-wz-neutral-200 px-wz-4 py-[7px] text-sm leading-[normal]",
              active
                ? "relative z-[1] -mb-px border-b border-b-white bg-white font-semibold text-wz-primary"
                : "bg-transparent font-normal text-wz-text-muted hover:text-wz-heading",
            )}
            onClick={() => onChange(item.value)}
          >
            {item.label}
            {item.count !== undefined ? (
              <span
                className={cn(
                  "inline-flex rounded-[10px] px-1.5 py-0.5 text-[11px] leading-[normal] font-semibold",
                  active ? "bg-wz-hover text-wz-primary" : "bg-wz-text-muted text-white",
                )}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
