import { useState, type ReactNode } from "react";
import {
  Badge,
  Button,
  ConfirmDialog,
  Field,
  Input,
  Modal,
  Select,
  TextArea,
  showSuccessToast,
  type BadgeStatus,
} from "../../design-system";
import { ApiError } from "../../lib/apiClient";
import { useDecideRegularization, useRegularizationRequests } from "../../hooks/useRegularization";
import type { RegularizationRequest, RegularizationStatus } from "../../services/regularizationService";
import {
  filterRegRequests,
  isApprovedThisMonth,
  recordedLines,
  regDate,
  regEmployeeLabel,
  regKindLabel,
  requestedLines,
  reviewerText,
} from "./regularizationViewModel";

const PAGE_SIZE = 10;

const STATUS_BADGE: Record<RegularizationStatus, BadgeStatus> = {
  Pending: "warning",
  Approved: "success",
  Rejected: "error",
  Cancelled: "neutral",
};

const COPY: Record<"all" | "pending" | "approved", { title: string; sub: (month: string) => string }> = {
  all: { title: "All requests", sub: () => "Review organization attendance and leave correction requests." },
  pending: {
    title: "Pending approvals",
    sub: () => "Review the recorded value and requested correction before deciding.",
  },
  approved: {
    title: "Approved this month",
    sub: (month) => `Approved attendance and leave corrections for ${month}.`,
  },
};

/** Figma content card (288:158024 parent): white, #dde3eb border, 8 radius. */
export function RegPanel({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-[8px] border border-[#dde3eb] bg-white p-5 max-md:p-4">
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-lg leading-[27px] font-semibold text-wz-heading">{title}</h2>
        <p className="m-0 text-[13px] leading-5 text-wz-text-secondary">{sub}</p>
      </div>
      {children}
    </section>
  );
}

const Lines = ({ lines }: { lines: string[] }) => (
  <>
    {lines.map((l) => (
      <span key={l} className="block">
        {l}
      </span>
    ))}
  </>
);

type Decision = { row: RegularizationRequest; decision: "approve" | "reject" };

export function RegularizationRequests({ tab, canApprove }: { tab: "all" | "pending" | "approved"; canApprove: boolean }) {
  const [kind, setKind] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | RegularizationStatus>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deciding, setDeciding] = useState<Decision | null>(null);
  const [viewing, setViewing] = useState<RegularizationRequest | null>(null);

  const fixedStatus: RegularizationStatus | undefined =
    tab === "pending" ? "Pending" : tab === "approved" ? "Approved" : undefined;
  const status = fixedStatus || statusFilter || undefined;
  const query = useRegularizationRequests(status);

  const rows = filterRegRequests(query.data || [], { kind, search }).filter(
    (r) => tab !== "approved" || isApprovedThisMonth(r),
  );
  const pages = Math.max(Math.ceil(rows.length / PAGE_SIZE), 1);
  const pageSafe = Math.min(page, pages);
  const pageRows = rows.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const from = rows.length ? (pageSafe - 1) * PAGE_SIZE + 1 : 0;
  const summary = `Showing ${from}–${Math.min(pageSafe * PAGE_SIZE, rows.length)} of ${rows.length} requests`;
  const month = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const resetPage = () => setPage(1);

  const actions = (row: RegularizationRequest, mobile = false) =>
    row.status === "Pending" && canApprove ? (
      <div className={mobile ? "grid grid-cols-2 gap-3" : "flex flex-col gap-2"}>
        {/* Figma: Approve primary, Reject #fff0f0 with red label (Reject first on mobile) */}
        <Button size="lg" className={mobile ? "order-2" : "w-[120px]"} onClick={() => setDeciding({ row, decision: "approve" })}>
          Approve
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className={mobile ? "order-1 bg-[#fff0f0] text-[#c22126]" : "w-[120px] bg-[#fff0f0] text-[#c22126]"}
          onClick={() => setDeciding({ row, decision: "reject" })}
        >
          Reject
        </Button>
      </div>
    ) : (
      <Button size="lg" variant="secondary" className={mobile ? "w-full" : "w-[120px] px-2"} onClick={() => setViewing(row)}>
        View details
      </Button>
    );

  return (
    <RegPanel title={COPY[tab].title} sub={COPY[tab].sub(month)}>
      {/* Figma Request filters: type, status (fixed on the pending/approved tabs), search */}
      <div className="grid grid-cols-[1fr_1fr_2fr] gap-4 max-md:grid-cols-1">
        <Field label="Request type" htmlFor="reg-filter-type">
          <Select id="reg-filter-type"
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              resetPage();
            }}
          >
            <option value="">All types</option>
            <option value="attendance">Attendance</option>
            <option value="leave">Leave</option>
          </Select>
        </Field>
        <Field label="Request status" htmlFor="reg-filter-status">
          <Select id="reg-filter-status"
            value={fixedStatus || statusFilter}
            disabled={Boolean(fixedStatus)}
            onChange={(e) => {
              setStatusFilter(e.target.value as RegularizationStatus | "");
              resetPage();
            }}
          >
            <option value="">All statuses</option>
            {(Object.keys(STATUS_BADGE) as RegularizationStatus[]).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Search" htmlFor="reg-filter-search">
          <Input id="reg-filter-search"
            type="search"
            placeholder="Employee name or code"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
          />
        </Field>
      </div>

      <div className="overflow-hidden rounded-[6px] border border-[#dde3eb]">
        {query.isLoading ? (
          <p className="m-0 px-4 py-10 text-center text-sm text-wz-text-secondary">Loading requests…</p>
        ) : query.isError ? (
          <p className="m-0 px-4 py-10 text-center text-sm text-wz-error">Could not load requests.</p>
        ) : pageRows.length === 0 ? (
          <p className="m-0 px-4 py-10 text-center text-sm text-wz-text-secondary">No requests found.</p>
        ) : (
          <>
            {/* Web table (Figma 288:158024): 11px text, 10px cell padding, #f8f9fa header */}
            <div className="overflow-x-auto max-md:hidden">
              <table className="w-full min-w-[1000px] table-fixed border-collapse text-[11px] leading-[17px] text-wz-heading">
                <thead className="bg-wz-neutral-50">
                  <tr>
                    {[
                      ["Employee", "w-[155px]"],
                      ["Type / Date", "w-[125px]"],
                      ["Recorded", "w-[135px]"],
                      ["Requested correction", "w-[165px]"],
                      ["Reason / Reviewer note", ""],
                      ["Status", "w-[90px]"],
                      ["Reviewer", "w-[130px]"],
                      ["Actions", "w-[140px]"],
                    ].map(([label, width]) => (
                      <th key={label} className={`p-2.5 text-left align-top font-semibold ${width}`}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => (
                    <tr key={row._id} className="border-t border-[#dde3eb] align-top">
                      <td className="p-2.5 font-semibold break-words">{regEmployeeLabel(row)}</td>
                      <td className="p-2.5">
                        <Lines lines={[regKindLabel(row), regDate(row)]} />
                      </td>
                      <td className="p-2.5 break-words">
                        <Lines lines={recordedLines(row)} />
                      </td>
                      <td className="p-2.5 break-words">
                        <Lines lines={requestedLines(row)} />
                      </td>
                      <td className="p-2.5 break-words">
                        <Lines lines={[row.reason || "—", ...(row.approverComment ? [`Note: ${row.approverComment}`] : [])]} />
                      </td>
                      <td className="p-2.5">
                        <Badge status={STATUS_BADGE[row.status]}>{row.status}</Badge>
                      </td>
                      <td className="p-2.5 break-words">{reviewerText(row)}</td>
                      <td className="p-2.5">{actions(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile table (Figma 288:158861): three columns, then recorded/reason and actions */}
            <div className="md:hidden">
              <div className="grid grid-cols-[96fr_107fr_87fr] gap-3 bg-[#ebf0f6] px-3 py-2.5 text-[11px] leading-[17px] font-semibold text-wz-heading">
                <span>Employee / Date</span>
                <span>Correction</span>
                <span>Status</span>
              </div>
              {pageRows.map((row) => (
                <div key={row._id} className="flex flex-col gap-3 border-t border-[#dde3eb] p-3 text-[11px] leading-[17px] text-wz-heading">
                  <div className="grid grid-cols-[96fr_107fr_87fr] gap-3">
                    <div className="min-w-0 break-words">
                      <span className="block font-semibold">{regEmployeeLabel(row)}</span>
                      <span className="mt-1 block text-wz-text-secondary">{regDate(row)}</span>
                    </div>
                    <div className="min-w-0 break-words">
                      <span className="block font-semibold">{regKindLabel(row)}</span>
                      <Lines lines={requestedLines(row)} />
                    </div>
                    <div className="flex min-w-0 flex-col items-start gap-1">
                      <Badge status={STATUS_BADGE[row.status]}>{row.status}</Badge>
                      <span className="text-[10px] leading-[15px] text-wz-text-secondary">{reviewerText(row)}</span>
                    </div>
                  </div>
                  <div className="break-words">
                    <span className="block">Recorded: {recordedLines(row).join(" · ")}</span>
                    <span className="block">Reason: {row.reason || "—"}</span>
                  </div>
                  {actions(row, true)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Figma pagination: summary, then outlined Previous / Next */}
      <div className="flex flex-col gap-3">
        <p className="m-0 text-[11px] leading-[17px] text-wz-text-secondary">{summary}</p>
        <div className="flex gap-3 max-md:grid max-md:grid-cols-2">
          <Button variant="secondary" className="min-w-[110px]" disabled={pageSafe <= 1} onClick={() => setPage(pageSafe - 1)}>
            Previous
          </Button>
          <Button variant="secondary" className="min-w-[110px]" disabled={pageSafe >= pages} onClick={() => setPage(pageSafe + 1)}>
            Next
          </Button>
        </div>
      </div>

      {deciding ? <DecisionDialog key={deciding.row._id + deciding.decision} {...deciding} onClose={() => setDeciding(null)} /> : null}
      <RequestDetailsModal row={viewing} onClose={() => setViewing(null)} />
    </RegPanel>
  );
}

/** Approve (optional note) or reject (note required, 3+ chars — backend rule). */
function DecisionDialog({ row, decision, onClose }: Decision & { onClose: () => void }) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const mutation = useDecideRegularization();
  const reject = decision === "reject";

  const submit = async () => {
    if (reject && comment.trim().length < 3) {
      setError("Please provide a rejection comment (at least 3 characters).");
      return;
    }
    try {
      await mutation.mutateAsync({ id: row._id, decision, comment: comment.trim() });
      showSuccessToast(reject ? "Request rejected" : "Request approved");
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update the request.");
    }
  };

  return (
    <ConfirmDialog
      open
      tone={reject ? "destructive" : "success"}
      title={reject ? "Reject request?" : "Approve request?"}
      message={`${regKindLabel(row)} correction for ${regEmployeeLabel(row)} on ${regDate(row)}.`}
      confirmLabel={reject ? "Reject" : "Approve"}
      loading={mutation.isPending}
      onConfirm={() => void submit()}
      onClose={onClose}
    >
      <Field label={reject ? "Rejection comment" : "Comment (optional)"} required={reject} error={error || undefined} htmlFor="reg-decision-comment">
        <TextArea id="reg-decision-comment"
          rows={3}
          maxLength={500}
          value={comment}
          placeholder={reject ? "Tell the employee why" : "Add a note for the employee"}
          onChange={(e) => {
            setComment(e.target.value);
            setError("");
          }}
        />
      </Field>
    </ConfirmDialog>
  );
}

function RequestDetailsModal({ row, onClose }: { row: RegularizationRequest | null; onClose: () => void }) {
  if (!row) return null;
  const items: [string, ReactNode][] = [
    ["Employee", regEmployeeLabel(row)],
    ["Type / Date", `${regKindLabel(row)} · ${regDate(row)}`],
    ["Recorded", recordedLines(row).join(" · ")],
    ["Requested correction", requestedLines(row).join(" · ")],
    ["Reason", row.reason || "—"],
    ["Status", <Badge key="s" status={STATUS_BADGE[row.status]}>{row.status}</Badge>],
    ["Reviewer", reviewerText(row)],
    ["Reviewer note", row.approverComment || "—"],
  ];
  return (
    <Modal open title="Request details" onClose={onClose}>
      <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-4 max-md:grid-cols-1">
        {items.map(([label, value]) => (
          <div key={label} className="flex min-w-0 flex-col gap-1">
            <dt className="text-[11px] leading-4 font-semibold tracking-[0.4px] text-wz-text-muted uppercase">{label}</dt>
            <dd className="m-0 text-sm leading-5 break-words text-wz-heading">{value}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
