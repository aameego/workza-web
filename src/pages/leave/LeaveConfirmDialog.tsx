import type { ReactNode } from "react";
import { ConfirmDialog } from "../../design-system";

export type LeaveConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "destructive" | "success";
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
};

export default function LeaveConfirmDialog({ variant = "primary", ...rest }: LeaveConfirmDialogProps) {
  return <ConfirmDialog tone={variant === "primary" ? "neutral" : variant} {...rest} />;
}
