import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../design-system";
import {
  searchEmployees,
  type EmployeeSearchResult,
} from "../../services/employeeService";

export type SearchableEmployeeSelectProps = {
  value: string;
  onChange: (employeeId: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  placeholder?: string;
  excludeIds?: string[];
  className?: string;
  allowClear?: boolean;
};

export default function SearchableEmployeeSelect({
  value,
  onChange,
  disabled = false,
  hasError = false,
  placeholder = "Select employee",
  excludeIds = [],
  className,
  allowClear = true,
}: SearchableEmployeeSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [employees, setEmployees] = useState<EmployeeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<EmployeeSearchResult | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const excludeKey = excludeIds.filter(Boolean).map(String).join(",");

  const fetchEmployees = useCallback(
    (term: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const requestId = ++requestIdRef.current;
      debounceRef.current = setTimeout(() => {
        void (async () => {
          setLoading(true);
          try {
            const list = await searchEmployees({ search: term, limit: 50 });
            const excluded = new Set(excludeKey ? excludeKey.split(",") : []);
            const filtered = list.filter((e) => !excluded.has(String(e._id)));
            if (requestId !== requestIdRef.current) return;
            setEmployees(filtered);
            if (value) {
              const match = filtered.find((e) => e._id === value) || null;
              if (match) setSelected(match);
            }
          } catch {
            if (requestId !== requestIdRef.current) return;
            setEmployees([]);
          } finally {
            if (requestId === requestIdRef.current) setLoading(false);
          }
        })();
      }, 200);
    },
    [excludeKey, value],
  );

  useEffect(() => {
    if (value) fetchEmployees("");
    else {
      setSelected(null);
      setSearchTerm("");
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, excludeKey, fetchEmployees]);

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const labelFor = (emp: EmployeeSearchResult) =>
    `${emp.employeeCode || "—"} — ${emp.name || "Employee"}`;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "flex w-full min-h-10 cursor-pointer items-center justify-between gap-2 rounded-wz-md border bg-white px-3 py-2 text-left text-sm",
          hasError ? "border-wz-error" : "border-wz-border",
          disabled && "cursor-not-allowed bg-wz-neutral-100 text-wz-neutral-500",
        )}
        onClick={() => {
          if (disabled) return;
          const next = !open;
          setOpen(next);
          if (next) fetchEmployees(searchTerm);
        }}
      >
        <span
          className={cn(
            "truncate",
            selected ? "text-wz-text-primary" : "text-wz-text-secondary",
          )}
        >
          {selected ? labelFor(selected) : placeholder}
        </span>
        {selected && allowClear && !disabled ? (
          <span
            role="button"
            tabIndex={0}
            className="shrink-0 text-xs font-semibold text-wz-text-secondary hover:text-wz-error"
            onClick={(e) => {
              e.stopPropagation();
              setSelected(null);
              setSearchTerm("");
              onChange("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                setSelected(null);
                setSearchTerm("");
                onChange("");
              }
            }}
          >
            Clear
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-wz-md border border-wz-border bg-white shadow-lg">
          <input
            type="search"
            value={searchTerm}
            autoFocus
            placeholder="Search name or code…"
            className="w-full border-0 border-b border-wz-border px-3 py-2 text-sm outline-none"
            onChange={(e) => {
              setSearchTerm(e.target.value);
              fetchEmployees(e.target.value);
            }}
          />
          <ul
            role="listbox"
            className="m-0 max-h-56 list-none overflow-auto p-0"
          >
            {loading ? (
              <li className="px-3 py-2 text-sm text-wz-text-secondary">
                Searching…
              </li>
            ) : employees.length === 0 ? (
              <li className="px-3 py-2 text-sm text-wz-text-secondary">
                No employees found
              </li>
            ) : (
              employees.map((emp) => (
                <li key={emp._id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={emp._id === value}
                    className={cn(
                      "flex w-full cursor-pointer border-0 bg-transparent px-3 py-2 text-left text-sm hover:bg-wz-hover",
                      emp._id === value && "bg-wz-hover font-semibold",
                    )}
                    onClick={() => {
                      setSelected(emp);
                      setSearchTerm("");
                      onChange(emp._id);
                      setOpen(false);
                    }}
                  >
                    {labelFor(emp)}
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
