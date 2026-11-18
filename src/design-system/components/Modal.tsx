import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../cn";

export type ModalProps = {
  open: boolean;
  title: ReactNode;
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
      className="fixed inset-0 z-80 flex items-center justify-center bg-[rgba(15,23,42,0.45)] p-wz-5 max-md:items-end max-md:p-0"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          /* Figma overlay: 650 wide (md), 820 wide (lg), 16 radius */
          "flex max-h-[min(90vh,950px)] w-full flex-col overflow-hidden rounded-wz-modal bg-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]",
          /* Figma mobile sheets (173:50139): full width, 28 top radius, grab handle */
          "max-md:max-h-[90vh] max-md:max-w-none max-md:rounded-b-none max-md:rounded-t-[28px]",
          size === "lg" ? "max-w-[820px]" : "max-w-[650px]",
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wz-modal-title"
      >
        <div className="hidden shrink-0 justify-center pt-2.5 max-md:flex" aria-hidden>
          <span className="h-[5px] w-11 rounded-[5px] bg-[#d5dcea]" />
        </div>
        {/* Figma overlay-header: 57 tall, 16/24 padding (mobile: 59 tall, 12/20) */}
        <div className="flex items-center justify-between gap-wz-3 border-b border-wz-border px-wz-6 py-wz-4 max-md:border-[#e4e9f2] max-md:px-5 max-md:py-3">
          <h2
            id="wz-modal-title"
            className="m-0 text-xl font-bold leading-[25px] text-wz-heading max-md:text-base max-md:leading-[normal] max-md:font-semibold max-md:tracking-[-0.32px] max-md:text-[#0d1f4d]"
          >
            {title}
          </h2>
          <button
            type="button"
            className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-wz-sm border border-wz-border bg-wz-neutral-50 p-0 text-wz-heading hover:bg-wz-neutral-100 max-md:size-[34px] max-md:rounded-[10px] max-md:border-[#e4e9f2] max-md:bg-white max-md:[&_svg]:size-4"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-wz-6 max-md:px-5 max-md:py-4 max-md:[&>.-mt-2]:mt-0">{children}</div>
        {/* Figma overlay-footer: white, 16/24 padding, buttons share the width */}
        {footer ? (
          <div className="flex gap-wz-4 border-t border-wz-border bg-white px-wz-6 py-wz-4 max-md:px-5 max-md:py-3 [&>*]:flex-1">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
