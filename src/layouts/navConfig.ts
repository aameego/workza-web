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
  { label: "Regularization", path: "/regularization", icon: ClipboardPen },
  { label: "Payroll", path: "/payroll", icon: CircleDollarSign },
  { label: "Expenses", path: "/expenses", icon: Wallet },
  { label: "Advance Loan", path: "/advance-loan", icon: CreditCard },
  { label: "Recruitment", path: "/recruitment", icon: Briefcase },
  { label: "Documents", path: "/documents", icon: FileText },
  { label: "Resignation", path: "/resignation", icon: DoorOpen },
  { label: "Reports", path: "/reports", icon: BarChart3 },
  { label: "Settings", path: "/settings", icon: Settings },
];

/**
 * Admin-side menus and the permissions that unlock them for other roles (ATT-FN-08).
 * Everything not listed is self-service and shown to everyone.
 */
const NAV_PERMISSIONS: Record<string, string[]> = {
  "/departments": ["departments:view", "departments:manage"],
  "/employees": ["employees:view", "employees:manage", "consultancy:view", "consultancy:manage"],
  "/recruitment": ["recruitment:view", "recruitment:manage"],
  "/reports": ["reports:view", "payroll:reports"],
};

/** Sidebar items this user may see: Admin/HR get everything, others by role permissions. */
export const navItemsFor = (
  user: { role?: string; permissions?: string[] } | null,
): NavItem[] => {
  if (user?.role === "Admin" || user?.role === "HR") return APP_NAV_ITEMS;
  const perms = Array.isArray(user?.permissions) ? user.permissions : [];
  return APP_NAV_ITEMS.filter((item) => {
    const needed = NAV_PERMISSIONS[item.path];
    return !needed || needed.some((p) => perms.includes(p));
  });
};

export const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/departments": "Departments",
  "/employees": "Employees",
  "/employees/new": "Add New Employee",
  "/attendance": "Attendance",
  "/leave": "Leave",
  "/regularization": "Regularization",
  "/payroll": "Payroll",
  "/expenses": "Expenses",
  "/advance-loan": "Advance Loan",
  "/recruitment": "Recruitment",
  "/documents": "Documents",
  "/resignation": "Resignation",
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

/** `?type=consultancy` marks consultant screens (add, view, edit) on the shared employee routes. */
const isConsultancySearch = (search = "") =>
  new URLSearchParams(search).get("type") === "consultancy";

export const titleForPath = (pathname: string, search = ""): string => {
  const path = normalizeAppPath(pathname);
  if (
    isConsultancySearch(search) &&
    (path === "/employees" || (/^\/employees\/[^/]+$/.test(path) && path !== "/employees/new"))
  ) {
    return "Consultancy";
  }
  if (PAGE_TITLES[path]) return PAGE_TITLES[path];
  if (/^\/employees\/[^/]+\/edit$/.test(path)) return "Edit Employee Details";
  if (/^\/employees\/[^/]+$/.test(path) && path !== "/employees/new") {
    return "Employees";
  }
  // Nested pages (e.g. /leave/policy) take their module's title.
  const top = `/${path.split("/").filter(Boolean)[0] || ""}`;
  if (PAGE_TITLES[top]) return PAGE_TITLES[top];
  return "Dashboard";
};

export type PageCrumb = {
  label: string;
  /** App path without vendor slug, e.g. `/employees`. Omit for the current page. */
  path?: string;
};

/**
 * Figma topbar breadcrumb trail for nested screens.
 * Empty for top-level pages (title only).
 */
export const crumbsForPath = (pathname: string, search = ""): PageCrumb[] => {
  const path = normalizeAppPath(pathname);
  const consult = isConsultancySearch(search);
  if (path === "/employees/new") {
    return [
      { label: "Employees", path: "/employees" },
      { label: "Add New Employee" },
    ];
  }
  if (/^\/employees\/[^/]+\/edit$/.test(path)) {
    return [
      { label: "Employees", path: "/employees" },
      { label: "Edit Employee Details" },
    ];
  }
  if (/^\/employees\/[^/]+$/.test(path) && path !== "/employees/new") {
    return [
      { label: "Employees", path: "/employees" },
      { label: consult ? "Consultancy Details" : "Employee Details" },
    ];
  }
  return [];
};

/** Whether a sidebar item should appear active for the current app path */
export const isNavPathActive = (currentPath: string, itemPath: string): boolean =>
  currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
