import {
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "../cn";

export type DropdownMenuProps = {
  open: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  children: ReactNode;
  className?: string;
  /** Prefer aligning the menu to the right edge of the anchor */
  align?: "left" | "right";
};

export function DropdownMenu({
  open,
  onClose,
  anchorEl,
  children,
  className,
  align = "right",
}: DropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (anchorEl?.contains(target)) return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [open, onClose, anchorEl]);

  if (!open || !anchorEl) return null;

  const rect = anchorEl.getBoundingClientRect();
  const style: CSSProperties = {
    position: "fixed",
    top: rect.bottom + 6,
    zIndex: 90,
    minWidth: 240,
    maxHeight: "min(70vh, 480px)",
    overflowY: "auto",
    ...(align === "right"
      ? { right: window.innerWidth - rect.right }
      : { left: rect.left }),
  };

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      style={style}
      className={cn(
        // Figma employee action accordion: soft card, large radius, elevation
        "bg-white py-2 shadow-[0_12px_40px_rgba(15,23,42,0.16)] rounded-[20px]",
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  );
}

export type DropdownMenuSectionToggleProps = {
  label: string;
  open: boolean;
  onClick: () => void;
  danger?: boolean;
};

/** Accordion section header — Figma GENERAL / PROBATION / … / DANGER */
export function DropdownMenuSectionToggle({
  label,
  open,
  onClick,
  danger = false,
}: DropdownMenuSectionToggleProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full cursor-pointer items-center justify-between gap-3 border-0 bg-transparent px-6 py-3.5 text-left text-[13px] font-semibold tracking-[0.04em] uppercase hover:bg-wz-neutral-50",
        danger ? "text-wz-error" : "text-wz-neutral-700",
      )}
      aria-expanded={open}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <span>{label}</span>
      <ChevronDown
        size={16}
        strokeWidth={2}
        className={cn(
          "shrink-0 text-wz-neutral-600 transition-transform duration-150",
          open && "rotate-180",
        )}
        aria-hidden
      />

    </button>
  );
}

export type DropdownMenuItemProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  className?: string;
};

export function DropdownMenuItem({
  children,
  onClick,
  disabled = false,
  danger = false,
  className,
}: DropdownMenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent px-6 py-2.5 text-left text-sm font-medium text-wz-neutral-700 hover:bg-wz-neutral-50 hover:text-wz-text disabled:cursor-not-allowed disabled:opacity-45",
        danger && "text-wz-error hover:bg-[#fef3f2]",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-6 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-wz-text-secondary uppercase">
      {children}
    </div>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-wz-border" role="separator" />;
}
