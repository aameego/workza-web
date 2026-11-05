import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../cn";

export type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
  className?: string;
};

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  size = "md",
  className,
}: ModalProps) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center bg-[rgba(15,23,42,0.45)] p-wz-5"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "flex max-h-[min(90vh,720px)] w-full flex-col overflow-hidden rounded-wz-lg bg-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]",
          size === "lg" ? "max-w-[720px]" : "max-w-[560px]",
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wz-modal-title"
      >
        <div className="flex items-center justify-between gap-wz-3 border-b border-wz-border p-wz-5">
          <h2
            id="wz-modal-title"
            className="m-0 text-lg font-semibold leading-6 text-wz-text-primary"
          >
            {title}
          </h2>
          <button
            type="button"
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-md border-0 bg-transparent text-wz-text-secondary hover:bg-wz-neutral-100 hover:text-wz-text-primary"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-wz-5">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-wz-3 border-t border-wz-border bg-wz-neutral-50 px-wz-5 py-wz-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
