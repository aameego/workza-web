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
          /* Figma overlay: 650 wide (md), 820 wide (lg), 16 radius */
          "flex max-h-[min(90vh,950px)] w-full flex-col overflow-hidden rounded-wz-modal bg-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]",
          size === "lg" ? "max-w-[820px]" : "max-w-[650px]",
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wz-modal-title"
      >
        {/* Figma overlay-header: 57 tall, 16/24 padding */}
        <div className="flex items-center justify-between gap-wz-3 border-b border-wz-border px-wz-6 py-wz-4">
          <h2
            id="wz-modal-title"
            className="m-0 text-xl font-bold leading-[25px] text-wz-heading"
          >
            {title}
          </h2>
          <button
            type="button"
            className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-wz-sm border border-wz-border bg-wz-neutral-50 p-0 text-wz-heading hover:bg-wz-neutral-100"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-wz-6">{children}</div>
        {/* Figma overlay-footer: white, 16/24 padding, buttons share the width */}
        {footer ? (
          <div className="flex gap-wz-4 border-t border-wz-border bg-white px-wz-6 py-wz-4 [&>*]:flex-1">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
