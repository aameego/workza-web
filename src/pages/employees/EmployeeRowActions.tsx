import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Eye,
  FilePlus2,
  FileText,
  FolderOpen,
  Lock,
  LockOpen,
  Mail,
  MoreVertical,
  Pencil,
  Trash2,
  UserCheck,
} from "lucide-react";
import {
  Button,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSectionToggle,
  Modal,
  type ConfirmTone,
} from "../../design-system";
import { EMPLOYEES_QUERY_KEY } from "../../hooks/useEmployees";
import { ApiError } from "../../lib/apiClient";
import {
  confirmProbation,
  convertToEmployee,
  deleteEmployee,
  resendCredentials,
  toggleAppLogin,
} from "../../services/employeeService";
import type { EmployeeListItem } from "../../services/employeeTypes";
import type { SessionUser } from "../../layouts/sessionUser";
import {
  CONSULTANCY_RECIPIENT_RULE,
  employeeLetterActions,
  issuedLettersPath,
} from "./employeeLetterActions";
import {
  canManageEmployees,
  canManageProbation,
  getLetterAccess,
} from "./letterAccess";
import type { DirectoryTab } from "./employeeListHelpers";
import {
  MENU_SECTION_LABEL,
  visibleMenuSections,
  type MenuSectionKey,
} from "./employeeRowMenuSections";
import IssueLetterModal from "./IssueLetterModal";
import { ExtendProbationModal, MakeConsultantModal } from "./EmployeeActionModals";

export type EmployeeRowActionsProps = {
  employee: EmployeeListItem;
  directory: DirectoryTab;
  vendorSlug: string;
  user: SessionUser | null;
  basePath: string;
};

type ConfirmState =
  | { kind: "delete" }
  | { kind: "toggleLogin"; enable: boolean }
  | { kind: "resend" }
  | { kind: "convertEmployee" }
  | { kind: "convertConsultant" }
  | { kind: "confirmProbation" }
  | { kind: "extendProbation" }
  | null;

export default function EmployeeRowActions({
  employee,
  directory,
  vendorSlug,
  user,
  basePath,
}: EmployeeRowActionsProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const moreRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState<MenuSectionKey | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [letterOpen, setLetterOpen] = useState(false);
  const [letterRule, setLetterRule] = useState<string | null>(null);
  const [docsNotice, setDocsNotice] = useState(false);

  const canManage = canManageEmployees(user?.role);
  const letterAccess = getLetterAccess(user);
  const letters = employeeLetterActions(letterAccess, employee, {
    canTerminate: false,
  });
  const sections = visibleMenuSections({
    directory,
    canManage,
    canManageProbation: canManageProbation(user?.role),
    letterAccess,
    employee,
  });

  const closeMenu = () => setMenuOpen(false);

  const openMenu = () => {
    setExpanded(null);
    setMenuOpen((open) => !open);
  };

  const toggleSection = (key: MenuSectionKey) => {
    setExpanded((prev) => (prev === key ? null : key));
  };

  const invalidateList = () => {
    void queryClient.invalidateQueries({ queryKey: [EMPLOYEES_QUERY_KEY] });
  };

  const runAction = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setActionError(null);
    try {
      await fn();
      setConfirm(null);
      invalidateList();
    } catch (err: unknown) {
      setActionError(
        err instanceof ApiError ? err.message : "Action failed. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const confirmCopy = (): {
    title: string;
    body: string;
    label: string;
    tone: ConfirmTone;
  } => {
    switch (confirm?.kind) {
      case "delete": {
        const who = directory === "consultancy" ? "consultant" : "employee";
        return {
          title: directory === "consultancy" ? "Delete Consultant?" : "Delete Employee?",
          body: `Are you sure you want to delete ${who}? This will disable ${who} login & cannot be undone.`,
          label: "Delete",
          tone: "destructive",
        };
      }
      case "toggleLogin":
        return confirm.enable
          ? {
              title: "Enable App Login?",
              body: "Enable app login for this user? They will be able to log in again.",
              label: "Enable",
              tone: "success",
            }
          : {
              title: "Disable App Login?",
              body: "Disable app login for this user? They will not be able to log in until re-enabled.",
              label: "Disable",
              tone: "destructive",
            };
      case "resend":
        return {
          title: "Send Credentials?",
          body: "Credentials sent to the selected user with a new password.",
          label: "Send",
          tone: "neutral",
        };
      case "convertEmployee":
        return {
          title: "Convert to Employee?",
          body: "Are you sure you want to convert this consultant to employee? This will update relevant information for this user.",
          label: "Convert",
          tone: "neutral",
        };
      case "confirmProbation":
        return {
          title: "Mark as Full-Time?",
          body: "The selected employee will be confirmed and marked as full-time.",
          label: "Confirm",
          tone: "success",
        };
      default:
        return { title: "", body: "", label: "Confirm", tone: "neutral" };
    }
  };

  const onConfirm = () => {
    if (!confirm) return;
    switch (confirm.kind) {
      case "delete":
        void runAction(() => deleteEmployee(employee._id));
        break;
      case "toggleLogin":
        void runAction(() => toggleAppLogin(employee._id, confirm.enable));
        break;
      case "resend":
        void runAction(() => resendCredentials(employee._id));
        break;
      case "convertEmployee":
        void runAction(() => convertToEmployee(employee._id));
        break;
      case "confirmProbation":
        void runAction(() => confirmProbation(employee._id));
        break;
      default:
        break;
    }
  };

  const copy = confirmCopy();
  const dialogKind =
    confirm?.kind === "convertConsultant" || confirm?.kind === "extendProbation"
      ? null
      : confirm?.kind;

  const renderSectionBody = (key: MenuSectionKey) => {
    if (expanded !== key) return null;

    switch (key) {
      case "general":
        return (
          <>
            <DropdownMenuItem
              onClick={() => {
                closeMenu();
                navigate(`${basePath}/employees/${employee._id}`);
              }}
            >
              <Eye size={16} /> View profile
            </DropdownMenuItem>
            {canManage ? (
              <DropdownMenuItem
                onClick={() => {
                  closeMenu();
                  navigate(`${basePath}/employees/${employee._id}/edit`);
                }}
              >
                <Pencil size={16} /> Edit details
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              onClick={() => {
                closeMenu();
                setDocsNotice(true);
              }}
            >
              <FolderOpen size={16} /> Documents
            </DropdownMenuItem>
          </>
        );
      case "probation":
        return (
          <>
            <DropdownMenuItem
              onClick={() => {
                closeMenu();
                setConfirm({ kind: "confirmProbation" });
              }}
            >
              <UserCheck size={16} /> Mark full-time
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                closeMenu();
                setConfirm({ kind: "extendProbation" });
              }}
            >
              <Clock size={16} /> Extend probation
            </DropdownMenuItem>
          </>
        );
      case "letters":
        return (
          <>
            {letters.issue ? (
              <DropdownMenuItem
                onClick={() => {
                  closeMenu();
                  setLetterRule(null);
                  setLetterOpen(true);
                }}
              >
                <FilePlus2 size={16} /> Issue a letter…
              </DropdownMenuItem>
            ) : null}
            {letters.viewIssued ? (
              <DropdownMenuItem
                onClick={() => {
                  closeMenu();
                  navigate(
                    issuedLettersPath(vendorSlug, {
                      recipientId: employee._id,
                    }),
                  );
                }}
              >
                <FileText size={16} /> View issued letters
              </DropdownMenuItem>
            ) : null}
            {letters.consultancyAgreement ? (
              <DropdownMenuItem
                disabled={!employee.isActive}
                onClick={() => {
                  if (!employee.isActive) return;
                  closeMenu();
                  setLetterRule(CONSULTANCY_RECIPIENT_RULE);
                  setLetterOpen(true);
                }}
              >
                <FileText size={16} /> Consultancy agreement
              </DropdownMenuItem>
            ) : null}
          </>
        );
      case "convert":
        return directory === "consultancy" ? (
          <DropdownMenuItem
            onClick={() => {
              closeMenu();
              setConfirm({ kind: "convertEmployee" });
            }}
          >
            <UserCheck size={16} /> Make it employee
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => {
              closeMenu();
              setConfirm({ kind: "convertConsultant" });
            }}
          >
            <UserCheck size={16} /> Make it consultant
          </DropdownMenuItem>
        );
      case "access":
        return (
          <>
            <DropdownMenuItem
              onClick={() => {
                closeMenu();
                setConfirm({
                  kind: "toggleLogin",
                  enable: !employee.hasLoginEnabled,
                });
              }}
            >
              {employee.hasLoginEnabled ? (
                <>
                  <Lock size={16} /> Disable app login
                </>
              ) : (
                <>
                  <LockOpen size={16} /> Enable app login
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                closeMenu();
                setConfirm({ kind: "resend" });
              }}
            >
              <Mail size={16} /> Send credentials
            </DropdownMenuItem>
          </>
        );
      case "danger":
        return (
          <DropdownMenuItem
            danger
            onClick={() => {
              closeMenu();
              setConfirm({ kind: "delete" });
            }}
          >
            <Trash2 size={16} />{" "}
            {directory === "consultancy"
              ? "Delete consultant"
              : "Delete employee"}
          </DropdownMenuItem>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Figma Actions column: compact kebab only (24×32) */}
      <button
        ref={moreRef}
        type="button"
        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-md border-0 bg-transparent p-0 text-wz-text-secondary hover:bg-wz-neutral-100 hover:text-wz-text"
        aria-label={`Actions for ${employee.name || employee.employeeCode || "employee"}`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        title="Actions"
        onClick={openMenu}
      >
        <MoreVertical size={16} strokeWidth={2} />
      </button>

      <DropdownMenu
        open={menuOpen}
        onClose={closeMenu}
        anchorEl={moreRef.current}
        align="right"
      >
        {sections.map((key) => (
          <div key={key}>
            <DropdownMenuSectionToggle
              label={MENU_SECTION_LABEL[key]}
              open={expanded === key}
              danger={key === "danger"}
              onClick={() => toggleSection(key)}
            />
            {renderSectionBody(key)}
          </div>
        ))}
      </DropdownMenu>

      <IssueLetterModal
        open={letterOpen}
        onClose={() => setLetterOpen(false)}
        employee={employee}
        recipientRule={letterRule}
      />

      <Modal
        open={docsNotice}
        title="Documents"
        onClose={() => setDocsNotice(false)}
        footer={
          <Button type="button" onClick={() => setDocsNotice(false)}>
            OK
          </Button>
        }
      >
        <p className="m-0 text-sm text-wz-text-secondary">
          Employee documents will open here in a later pass.
        </p>
      </Modal>

      <ConfirmDialog
        open={Boolean(dialogKind)}
        title={copy.title}
        message={copy.body}
        tone={copy.tone}
        confirmLabel={copy.label}
        loading={busy}
        onClose={() => {
          setConfirm(null);
          setActionError(null);
        }}
        onConfirm={onConfirm}
      >
        {actionError ? (
          <p className="m-0 mt-1 text-sm text-wz-error" role="alert">
            {actionError}
          </p>
        ) : null}
      </ConfirmDialog>

      <ExtendProbationModal
        open={confirm?.kind === "extendProbation"}
        employee={employee}
        onClose={() => setConfirm(null)}
        onDone={invalidateList}
      />
      <MakeConsultantModal
        open={confirm?.kind === "convertConsultant"}
        employee={employee}
        onClose={() => setConfirm(null)}
        onDone={invalidateList}
      />
    </>
  );
}
