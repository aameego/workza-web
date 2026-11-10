import { Button, Modal } from "../../design-system";

export type LeaveConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "primary" | "destructive" | "success";
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function LeaveConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  variant = "primary",
  loading,
  onConfirm,
  onClose,
}: LeaveConfirmDialogProps) {
  const buttonVariant =
    variant === "destructive" ? "destructive" : "primary";

  return (
    <Modal
      open={open}
      title={title}
      onClose={loading ? () => undefined : onClose}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={buttonVariant}
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "Working…" : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="m-0 text-sm text-wz-text-secondary">{message}</p>
    </Modal>
  );
}
