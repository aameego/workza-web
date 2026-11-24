import { cn } from "../../../design-system";

export interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  helpId?: string;
}

/** Accessible switch matching the org-profile toggle styling. */
export function Toggle({
  label,
  checked,
  onChange,
  disabled,
  helpId,
}: ToggleProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-3 text-sm select-none",
        disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer",
      )}
      title={disabled ? "Saving…" : undefined}
    >
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-describedby={helpId}
        className="sr-only"
      />
      <span
        className={cn(
          "relative inline-block w-10 h-6 rounded-full shrink-0 transition-colors duration-300 ease-in-out",
          checked ? "bg-wz-primary" : "bg-[#e5e9ef]",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out",
            checked && "translate-x-4",
          )}
        />
      </span>
      <span className="font-semibold text-wz-heading">{label}</span>
    </label>
  );
}
