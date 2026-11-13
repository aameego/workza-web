import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Info, MoreVertical, Pencil, SquarePen } from "lucide-react";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSectionToggle,
  TabSwitcher,
} from "../../design-system";

import { useEmployee } from "../../hooks/useEmployees";
import { readSessionUser } from "../../layouts/sessionUser";
import { ApiError } from "../../lib/apiClient";
import {
  canManageEmployees,
  getLetterAccess,
} from "./letterAccess";
import {
  employeeLetterActions,
  issuedLettersPath,
} from "./employeeLetterActions";
import {
  employmentActiveBadge,
  employmentActiveLabel,
  employmentTypeBadge,
  employmentTypeLabel,
} from "./employeeListHelpers";
import { initialsFromName } from "./employeeViewFormat";
import EmployeeOverviewPanel from "./EmployeeOverviewPanel";
import EmployeeDocumentsPanel from "./EmployeeDocumentsPanel";
import EmployeeSalaryPanel from "./EmployeeSalaryPanel";
import EmployeeAttendancePanel from "./EmployeeAttendancePanel";
import IssueLetterModal from "./IssueLetterModal";


type ViewTab = "overview" | "documents" | "salary" | "attendance";

const TABS: { id: ViewTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "documents", label: "Documents" },
  { id: "salary", label: "Salary Structure" },
  { id: "attendance", label: "Attendance" },
];

export default function ViewEmployeePage() {
  const navigate = useNavigate();
  const { vendorSlug, employeeId } = useParams();
  const base = `/${vendorSlug || "app"}`;
  const user = readSessionUser();
  const canManage = canManageEmployees(user?.role);

  const { data: employee, isLoading, isError, error, refetch } = useEmployee(
    employeeId,
  );

  const location = useLocation();
  const locationTab = (location.state as { tab?: ViewTab } | null)?.tab;
  const [tab, setTab] = useState<ViewTab>(() =>
    locationTab && TABS.some((t) => t.id === locationTab)
      ? locationTab
      : "overview",
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState<"general" | "letters" | null>(null);

  // Consultants share this route; tag the URL so the top bar shows "Consultancy" (EMP-UI-33).
  useEffect(() => {
    if (employee?.isConsultancy && !location.search.includes("type=consultancy")) {
      navigate(`${location.pathname}?type=consultancy`, { replace: true, state: location.state });
    }
  }, [employee?.isConsultancy, location.pathname, location.search, location.state, navigate]);
  const [letterOpen, setLetterOpen] = useState(false);
  const moreRef = useRef<HTMLButtonElement>(null);

  const letterAccess = getLetterAccess(user);
  const letters = useMemo(
    () =>
      employee
        ? employeeLetterActions(letterAccess, employee, { canTerminate: false })
        : null,
    [employee, letterAccess],
  );

  if (isLoading) {
    return (
      <div className="p-wz-6 text-sm text-wz-text-secondary">
        Loading employee…
      </div>
    );
  }

  if (isError || !employee) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Employee not found or could not be loaded.";
    return (
      <div className="flex flex-col gap-wz-4 p-wz-6">
        <p className="m-0 text-sm text-wz-error" role="alert">
          {message}
        </p>
        <div className="flex gap-wz-3">
          <Button type="button" variant="secondary" onClick={() => void refetch()}>
            Retry
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(`${base}/employees`)}
          >
            Back to employees
          </Button>
        </div>
      </div>
    );
  }

  const typeLabel = employmentTypeLabel(employee);
  const photo =
    employee.photoDisplayUrl || employee.photoUrl || employee.photo || "";


  return (
    <div className="flex flex-col gap-wz-6">
      {/* Figma Profile-Summary-Card */}
      <div className="flex flex-wrap items-center justify-between gap-wz-4 rounded-wz-xl border border-wz-border bg-white px-wz-6 py-[15px]">
        <div className="flex min-w-0 items-center gap-wz-4">
          <span className="inline-flex size-[55px] shrink-0 items-center justify-center overflow-hidden rounded-[32px] bg-[#1f5da3] text-xl font-semibold text-white">
            {photo ? (
              <img
                src={photo}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              initialsFromName(employee.name)
            )}
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="m-0 truncate text-xl leading-[25px] font-bold text-wz-heading">
              {employee.name || "Employee"}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-base font-semibold text-[#6c757d]">
                {employee.employeeCode || "-"}
              </span>
              <Badge status={employmentActiveBadge(employee)} size="md">
                {employmentActiveLabel(employee)}
              </Badge>
              {typeLabel ? (
                <Badge status={employmentTypeBadge(employee)} size="md">
                  {typeLabel}
                  {typeLabel === "Probation" ? (
                    <Info size={10} aria-hidden className="opacity-80" />
                  ) : null}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {canManage ? (
            <button
              type="button"
              className="inline-flex size-6 cursor-pointer items-center justify-center rounded-wz-md border-0 bg-transparent text-wz-heading hover:bg-wz-neutral-100"
              aria-label="Edit employee"
              title="Edit"
              onClick={() =>
                navigate(`${base}/employees/${employee._id}/edit`)
              }
            >
              <SquarePen size={12} strokeWidth={2} />
            </button>
          ) : null}
          <button
            ref={moreRef}
            type="button"
            className="inline-flex size-6 cursor-pointer items-center justify-center rounded-wz-md border-0 bg-transparent text-wz-heading hover:bg-wz-neutral-100"
            aria-label="More actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title="More"
            onClick={() => {
              setExpanded(null);
              setMenuOpen((open) => !open);
            }}
          >
            <MoreVertical size={12} strokeWidth={2} />
          </button>
        </div>
      </div>

      <DropdownMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorEl={moreRef.current}
        align="right"
      >
        <DropdownMenuSectionToggle
          label="General"
          open={expanded === "general"}
          onClick={() =>
            setExpanded((prev) => (prev === "general" ? null : "general"))
          }
        />
        {expanded === "general" ? (
          <>
            <DropdownMenuItem
              onClick={() => {
                setMenuOpen(false);
                navigate(`${base}/employees`);
              }}
            >
              Back to directory
            </DropdownMenuItem>
            {canManage ? (
              <DropdownMenuItem
                onClick={() => {
                  setMenuOpen(false);
                  navigate(`${base}/employees/${employee._id}/edit`);
                }}
              >
                <Pencil size={16} /> Edit details
              </DropdownMenuItem>
            ) : null}
          </>
        ) : null}

        {letters?.any ? (
          <>
            <DropdownMenuSectionToggle
              label="Letters"
              open={expanded === "letters"}
              onClick={() =>
                setExpanded((prev) => (prev === "letters" ? null : "letters"))
              }
            />
            {expanded === "letters" ? (
              <>
                {letters.issue ? (
                  <DropdownMenuItem
                    onClick={() => {
                      setMenuOpen(false);
                      setLetterOpen(true);
                    }}
                  >
                    Issue a letter…
                  </DropdownMenuItem>
                ) : null}
                {letters.viewIssued ? (
                  <DropdownMenuItem
                    onClick={() => {
                      setMenuOpen(false);
                      navigate(
                        issuedLettersPath(vendorSlug || "app", {
                          recipientId: employee._id,
                        }),
                      );
                    }}
                  >
                    View issued letters
                  </DropdownMenuItem>
                ) : null}
              </>
            ) : null}
          </>
        ) : null}
      </DropdownMenu>

      {/* Figma Module Switcher tabs */}
      <TabSwitcher
        aria-label="Employee sections"
        value={tab}
        onChange={setTab}
        items={TABS.map((item) => ({ value: item.id, label: item.label }))}
      />

      {tab === "overview" ? (
        <EmployeeOverviewPanel employee={employee} />
      ) : null}
      {tab === "documents" ? (
        <EmployeeDocumentsPanel
          employeeId={employee._id}
          canUpload={canManage}
        />
      ) : null}
      {tab === "salary" ? (
        <EmployeeSalaryPanel employeeId={employee._id} />
      ) : null}
      {tab === "attendance" ? (
        <EmployeeAttendancePanel employeeId={employee._id} />
      ) : null}

      <IssueLetterModal
        open={letterOpen}
        onClose={() => setLetterOpen(false)}
        employee={employee}
      />
    </div>
  );
}
