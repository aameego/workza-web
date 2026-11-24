import { useQuery } from "@tanstack/react-query";
import { Modal } from "../../design-system";
import { ApiError } from "../../lib/apiClient";
import { getProbationHistory } from "../../services/employeeService";

const ACTION_LABEL: Record<string, string> = {
  created: "Probation started",
  extended: "Probation extended",
  confirmed: "Confirmed",
  "auto-confirmed": "Auto-confirmed",
  reopened: "Probation reopened",
};

const fmt = (value?: string | null) => {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "-"
    : d.toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata" });
};

/** Probation start, end and every extension (EMP-FN-18). */
export default function ProbationHistoryModal({
  employeeId,
  onClose,
}: {
  employeeId: string | null;
  onClose: () => void;
}) {
  const query = useQuery({
    queryKey: ["probation-history", employeeId],
    queryFn: () => getProbationHistory(employeeId as string),
    enabled: Boolean(employeeId),
  });
  if (!employeeId) return null;
  const data = query.data;

  return (
    <Modal open title="Probation History" onClose={onClose}>
      {query.isLoading ? (
        <p className="m-0 text-sm text-wz-text-secondary">Loading…</p>
      ) : query.isError ? (
        <p className="m-0 text-sm text-wz-error" role="alert">
          {query.error instanceof ApiError ? query.error.message : "Unable to load probation history"}
        </p>
      ) : (
        <div className="flex flex-col gap-wz-4 text-sm">
          <dl className="m-0 grid grid-cols-2 gap-x-wz-6 gap-y-wz-2">
            <dt className="text-wz-text-muted">Start</dt>
            <dd className="m-0 text-wz-heading">{fmt(data?.probationStartDate)}</dd>
            <dt className="text-wz-text-muted">End</dt>
            <dd className="m-0 text-wz-heading">{fmt(data?.probationEndDate)}</dd>
            <dt className="text-wz-text-muted">Extended</dt>
            <dd className="m-0 text-wz-heading">{data?.probationExtendedMonths || 0} month(s)</dd>
          </dl>
          {data?.history.length ? (
            <ul className="m-0 flex list-none flex-col gap-wz-3 p-0">
              {data.history.map((h, i) => (
                <li key={i} className="rounded-wz-md border border-wz-border px-wz-4 py-wz-3">
                  <div className="flex justify-between gap-wz-4 font-semibold text-wz-heading">
                    <span>
                      {ACTION_LABEL[h.action] || h.action}
                      {h.months ? ` (+${h.months} month${h.months > 1 ? "s" : ""})` : ""}
                    </span>
                    <span className="font-normal text-wz-text-muted">{fmt(h.date)}</span>
                  </div>
                  {h.remark || h.by?.name ? (
                    <p className="m-0 mt-1 text-xs text-wz-text-secondary">
                      {[h.remark, h.by?.name ? `by ${h.by.name}` : ""].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-wz-text-secondary">No probation changes recorded yet.</p>
          )}
        </div>
      )}
    </Modal>
  );
}
