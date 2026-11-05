import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  UserRoundCheck,
  Clock3,
  CalendarHeart,
  ClipboardPen,
  CircleDollarSign,
  Wallet,
  CreditCard,
  Briefcase,
  FileText,
  DoorOpen,
  BarChart3,
  Settings,
} from "lucide-react";

export type NavItem = {
  label: string;
  path: string;
  icon: LucideIcon;
};

/**
 * Figma sidebar order + icon mapping (frame sidebar / Employees active).
 * Screens stay empty; routes only power the shell.
 */
export const APP_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Departments", path: "/departments", icon: Building2 },
  { label: "Employees", path: "/employees", icon: UserRoundCheck },
  { label: "Attendance", path: "/attendance", icon: Clock3 },
  { label: "Leave", path: "/leave", icon: CalendarHeart },
  { label: "Regularisation", path: "/regularization", icon: ClipboardPen },
  { label: "Payroll", path: "/payroll", icon: CircleDollarSign },
  { label: "Expenses", path: "/expenses", icon: Wallet },
  { label: "Advance Loan", path: "/advance-loan", icon: CreditCard },
  { label: "Recruitment", path: "/recruitment", icon: Briefcase },
  { label: "Documents", path: "/documents", icon: FileText },
  { label: "Resignations", path: "/resignation", icon: DoorOpen },
  { label: "Reports", path: "/reports", icon: BarChart3 },
  { label: "Settings", path: "/settings", icon: Settings },
];

export const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/departments": "Departments",
  "/employees": "Employees",
  "/employees/new": "Add New Employee",
  "/attendance": "Attendance",
  "/leave": "Leave",
  "/regularization": "Regularisation",
  "/payroll": "Payroll",
  "/expenses": "Expenses",
  "/advance-loan": "Advance Loan",
  "/recruitment": "Recruitment",
  "/documents": "Documents",
  "/resignation": "Resignations",
  "/reports": "Reports",
  "/settings": "Settings",
};

/** Strip vendor slug: `/acme/employees` → `/employees` */
export const normalizeAppPath = (pathname: string): string => {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 1) {
    return `/${segments.slice(1).join("/")}`;
  }
  if (segments.length === 1 && PAGE_TITLES[`/${segments[0]}`]) {
    return `/${segments[0]}`;
  }
  return pathname || "/dashboard";
};

export const titleForPath = (pathname: string): string => {
  const path = normalizeAppPath(pathname);
  if (PAGE_TITLES[path]) return PAGE_TITLES[path];
  if (/^\/employees\/[^/]+\/edit$/.test(path)) return "Edit Employee";
  if (/^\/employees\/[^/]+$/.test(path) && path !== "/employees/new") {
    return "Employee Details";
  }
  if (path.startsWith("/employees/")) return PAGE_TITLES["/employees"] || "Employees";
  return "Dashboard";
};

/** Whether a sidebar item should appear active for the current app path */
export const isNavPathActive = (currentPath: string, itemPath: string): boolean =>
  currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
