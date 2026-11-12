import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../cn";

export type SearchableSelectOption = { value: string; label: string };

export type SearchableSelectProps = {
  id?: string;
  value: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  invalid?: boolean;
  disabled?: boolean;
};

/**
 * Figma Form/Select with type-to-filter (department, supervisor pickers).
 * Same face as Select: 42px white box, muted placeholder, chevron.
 */
export function SearchableSelect({
  id,
  value,
  options,
  onChange,
  placeholder,
  searchPlaceholder = "Search…",
  invalid,
  disabled,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);
  const q = term.trim().toLowerCase();
  const shown = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const pick = (v: string) => {
    onChange(v);
    setTerm("");
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex min-h-[42px] w-full cursor-pointer items-center justify-between gap-2 rounded-wz-md border bg-white px-3 text-left text-sm leading-5 disabled:cursor-not-allowed disabled:bg-wz-neutral-100",
          invalid ? "border-wz-error" : "border-wz-border hover:border-wz-neutral-400",
        )}
      >
        <span className={cn("truncate", selected ? "text-wz-heading" : "text-wz-text-muted")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} className="shrink-0 text-wz-text-muted" aria-hidden />
      </button>
      {open ? (
        <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-wz-md border border-wz-border bg-white shadow-lg">
          <input
            type="search"
            autoFocus
            value={term}
            placeholder={searchPlaceholder}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "Enter" && shown[0]) {
                e.preventDefault();
                pick(shown[0].value);
              }
            }}
            className="w-full border-0 border-b border-wz-border px-3 py-2 text-sm outline-none"
          />
          <ul role="listbox" className="m-0 max-h-56 list-none overflow-auto p-0">
            {value ? (
              <li>
                <button
                  type="button"
                  className="w-full cursor-pointer border-0 bg-transparent px-3 py-2 text-left text-sm text-wz-text-muted hover:bg-wz-hover"
                  onClick={() => pick("")}
                >
                  Clear selection
                </button>
              </li>
            ) : null}
            {shown.length === 0 ? (
              <li className="px-3 py-2 text-sm text-wz-text-muted">No matches</li>
            ) : (
              shown.map((o) => (
                <li key={o.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={o.value === value}
                    onClick={() => pick(o.value)}
                    className={cn(
                      "w-full cursor-pointer border-0 bg-transparent px-3 py-2 text-left text-sm hover:bg-wz-hover",
                      o.value === value && "bg-wz-hover font-semibold",
                    )}
                  >
                    {o.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
