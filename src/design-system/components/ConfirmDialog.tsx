import { useEffect, type ReactNode } from "react";
import { Check, Info, Trash2 } from "lucide-react";
import { cn } from "../cn";

export type ConfirmTone = "neutral" | "destructive" | "success";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: ReactNode;
  tone?: ConfirmTone;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  /** Extra content under the message (inputs, errors). */
  children?: ReactNode;
};

const TONE = {
  neutral: { icon: Info, circle: "bg-[#e8eef8] text-wz-primary", btn: "bg-wz-primary hover:bg-wz-navy" },
  destructive: { icon: Trash2, circle: "bg-[#fee4e4] text-wz-danger", btn: "bg-wz-danger hover:bg-[#b42318]" },
  success: { icon: Check, circle: "bg-[#e0fbf7] text-[#12b76a]", btn: "bg-[#12b76a] hover:bg-[#039855]" },
} as const;

/**
 * Figma Overlay/Confirmation Dialog: 420 wide, 21 padding, 40px tinted icon
 * circle, 18px bold title over muted copy, divider, right-aligned 36px buttons
 * (100 wide; 120 on success). Escape and backdrop click cancel.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  tone = "neutral",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onClose,
  children,
}: ConfirmDialogProps) {
  const close = () => {
    if (!loading) onClose();
  };

  useEffect(() => {
    if (!open || loading) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  if (!open) return null;
  const t = TONE[tone];
  const Icon = t.icon;
  const btn = cn(
    "inline-flex h-9 cursor-pointer items-center justify-center rounded-wz-md px-3 text-[15px] leading-[19px] font-semibold disabled:cursor-not-allowed disabled:opacity-60",
    tone === "success" ? "min-w-[120px]" : "min-w-[100px]",
  );

  return (
    <div
      className="fixed inset-0 z-90 flex items-center justify-center bg-[rgba(15,23,42,0.45)] p-wz-5"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="wz-confirm-title"
        aria-describedby="wz-confirm-body"
        className="box-border w-full max-w-[420px] rounded-wz-xl border border-wz-border bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.18)]"
      >
        <div className="flex gap-3">
          <span
            className={cn(
              "inline-flex size-10 shrink-0 items-center justify-center rounded-wz-full",
              t.circle,
            )}
          >
            <Icon size={18} aria-hidden />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2
              id="wz-confirm-title"
              className="m-0 text-lg leading-[22px] font-bold text-wz-heading"
            >
              {title}
            </h2>
            <div
              id="wz-confirm-body"
              className="text-[13px] leading-[19px] text-wz-text-muted"
            >
              {message}
            </div>
            {children}
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-4 border-t border-wz-border pt-3">
          <button
            type="button"
            className={cn(btn, "border border-wz-text-muted bg-white text-wz-text-muted hover:bg-wz-neutral-50")}
            disabled={loading}
            onClick={onClose}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            autoFocus
            className={cn(btn, "border-0 text-white", t.btn)}
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
