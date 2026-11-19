import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarClock,
  Eye,
  FolderOpen,
  Lock,
  LockOpen,
  Mail,
  MoreVertical,
  Pencil,
  RotateCcw,
  Trash2,
  UserCheck,
} from "lucide-react";
import {
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuItem,
  type ConfirmTone,
} from "../../design-system";
import type { InternListItem } from "../../services/internTypes";
import type { SessionUser } from "../../layouts/sessionUser";
import { canManageEmployees } from "../employees/letterAccess";
import {
  canChangeInternStatus,
  canConvertIntern,
  canEditInternRecord,
  canExtendInternship,
} from "./internViewFormat";

export type InternRowActionsProps = {
  intern: InternListItem;
  user: SessionUser | null;
  basePath: string;
  onStatus: (intern: InternListItem) => void;
  onExtend: (intern: InternListItem) => void;
  onConvert: (intern: InternListItem) => void;
  onArchive: (intern: InternListItem) => void;
  onRestore: (intern: InternListItem) => void;
  onToggleLogin: (intern: InternListItem, enable: boolean) => void;
  onResendCredentials: (intern: InternListItem) => void;
};

type ConfirmState =
  | { kind: "archive" }
  | { kind: "toggleLogin"; enable: boolean }
  | { kind: "resend" }
  | null;

export default function InternRowActions({
  intern,
  user,
  basePath,
  onStatus,
  onExtend,
  onConvert,
  onArchive,
  onRestore,
  onToggleLogin,
  onResendCredentials,
}: InternRowActionsProps) {
  const navigate = useNavigate();
  const moreRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const canManage = canManageEmployees(user?.role);
  const internBase = `${basePath}/employees/interns`;
  const viewPath = `${internBase}/${intern._id}`;
  const editPath = `${viewPath}/edit`;

  const closeMenu = () => setMenuOpen(false);

  const confirmCopy = (): {
    title: string;
    body: string;
    label: string;
    tone: ConfirmTone;
  } => {
    switch (confirm?.kind) {
      case "archive":
        return {
          title: "Archive Intern?",
          body: `Archive ${intern.name || "this intern"}? They will be hidden from the active directory until restored.`,
          label: "Archive",
          tone: "destructive",
        };
      case "toggleLogin":
        return confirm.enable
          ? {
              title: "Enable App Login?",
              body: "Enable app login for this intern? They will be able to log in again.",
              label: "Enable",
              tone: "success",
            }
          : {
              title: "Disable App Login?",
              body: "Disable app login for this intern? They will not be able to log in until re-enabled.",
              label: "Disable",
              tone: "destructive",
            };
      case "resend":
        return {
          title: "Send Credentials?",
          body: "Send new login credentials to this intern.",
          label: "Send",
          tone: "neutral",
        };
      default:
        return { title: "", body: "", label: "Confirm", tone: "neutral" };
    }
  };

  const onConfirm = () => {
    if (!confirm) return;
    switch (confirm.kind) {
      case "archive":
        onArchive(intern);
        break;
      case "toggleLogin":
        onToggleLogin(intern, confirm.enable);
        break;
      case "resend":
        onResendCredentials(intern);
        break;
      default:
        break;
    }
    setConfirm(null);
  };

  const copy = confirmCopy();

  return (
    <>
      <button
        type="button"
        ref={moreRef}
        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-md border-0 bg-transparent text-wz-heading hover:bg-wz-neutral-100"
        aria-label={`Actions for ${intern.name || "intern"}`}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((o) => !o)}
      >
        <MoreVertical size={16} />
      </button>
      <DropdownMenu
        open={menuOpen}
        anchorEl={moreRef.current}
        onClose={closeMenu}
        align="right"
      >
        <DropdownMenuItem
          onClick={() => {
            closeMenu();
            navigate(viewPath);
          }}
        >
          <Eye size={16} /> View
        </DropdownMenuItem>
        {canManage && canEditInternRecord(intern) ? (
          <DropdownMenuItem
            onClick={() => {
              closeMenu();
              navigate(editPath);
            }}
          >
            <Pencil size={16} /> Edit
          </DropdownMenuItem>
        ) : null}
        {canManage && canChangeInternStatus(intern.internStatus) ? (
          <DropdownMenuItem
            onClick={() => {
              closeMenu();
              onStatus(intern);
            }}
          >
            <RotateCcw size={16} /> Change Status
          </DropdownMenuItem>
        ) : null}
        {canManage && canExtendInternship(intern) ? (
          <DropdownMenuItem
            onClick={() => {
              closeMenu();
              onExtend(intern);
            }}
          >
            <CalendarClock size={16} /> Extend Internship
          </DropdownMenuItem>
        ) : null}
        {canManage && canConvertIntern(intern) ? (
          <DropdownMenuItem
            onClick={() => {
              closeMenu();
              onConvert(intern);
            }}
          >
            <UserCheck size={16} /> Convert to Employee
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          onClick={() => {
            closeMenu();
            navigate(`${viewPath}#documents`);
          }}
        >
          <FolderOpen size={16} /> Documents
        </DropdownMenuItem>
        {canManage && intern.hasAppLogin ? (
          <DropdownMenuItem
            onClick={() => {
              closeMenu();
              setConfirm({
                kind: "toggleLogin",
                enable: intern.hasLoginEnabled === false,
              });
            }}
          >
            {intern.hasLoginEnabled !== false ? (
              <>
                <Lock size={16} /> Disable App Login
              </>
            ) : (
              <>
                <LockOpen size={16} /> Enable App Login
              </>
            )}
          </DropdownMenuItem>
        ) : null}
        {canManage && intern.hasAppLogin ? (
          <DropdownMenuItem
            onClick={() => {
              closeMenu();
              setConfirm({ kind: "resend" });
            }}
          >
            <Mail size={16} /> Resend Credentials
          </DropdownMenuItem>
        ) : null}
        {canManage && !intern.isDeleted && intern.internStatus !== "converted" ? (
          <DropdownMenuItem
            danger
            onClick={() => {
              closeMenu();
              setConfirm({ kind: "archive" });
            }}
          >
            <Trash2 size={16} /> Archive Intern
          </DropdownMenuItem>
        ) : null}
        {canManage && intern.isDeleted ? (
          <DropdownMenuItem
            onClick={() => {
              closeMenu();
              onRestore(intern);
            }}
          >
            <RotateCcw size={16} /> Restore Intern
          </DropdownMenuItem>
        ) : null}
      </DropdownMenu>

      <ConfirmDialog
        open={Boolean(confirm)}
        tone={copy.tone}
        title={copy.title}
        message={copy.body}
        confirmLabel={copy.label}
        onClose={() => setConfirm(null)}
        onConfirm={onConfirm}
      />
    </>
  );
}