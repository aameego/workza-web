import { useEffect, useMemo, useState } from "react";
import {
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  ChevronDown,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  APP_NAV_ITEMS,
  crumbsForPath,
  isNavPathActive,
  normalizeAppPath,
  titleForPath,
} from "./navConfig";
import {
  displayNameFor,
  initialsFor,
  readSessionUser,
  roleLabelFor,
} from "./sessionUser";
import { api } from "../lib/apiClient";
import { clearAuthData, updateStoredUser } from "../lib/authStorage";
import { toVendorSlug } from "../lib/vendorPath";
import workzaLogo from "../assets/landing/workza-logo.png";
import { Avatar, cn, IconButton } from "../design-system";

const sidebarToggleClass =
  "inline-flex size-[25px] shrink-0 cursor-pointer items-center justify-center rounded-wz-sm border-0 bg-transparent p-0 text-white hover:bg-white/10";

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { vendorSlug } = useParams();
  const [user, setUser] = useState(() => readSessionUser());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("app-sidebar-collapsed") === "1",
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 900,
  );
  const [profileOpen, setProfileOpen] = useState(false);
  // Login doesn't return role permissions; pages gate on them, so load them before rendering.
  const [sessionReady, setSessionReady] = useState(
    () => user?.role === "Admin" || Array.isArray(user?.permissions),
  );

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ permissions?: string[] | "all" }>("/auth/session")
      .then((session) => {
        if (!cancelled && Array.isArray(session?.permissions)) {
          updateStoredUser({ permissions: session.permissions });
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setSessionReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const vendorCode = useMemo(() => {
    if (vendorSlug) return vendorSlug;
    return toVendorSlug(user?.vendorName) || "app";
  }, [vendorSlug, user?.vendorName]);

  const currentPath = normalizeAppPath(location.pathname);
  const pageTitle = titleForPath(location.pathname);
  const pageCrumbs = crumbsForPath(location.pathname);
  const vendorBase = `/${vendorCode}`;
  const displayName = displayNameFor(user);
  const roleLabel = roleLabelFor(user);
  const initials = initialsFor(displayName);

  const collapsedDesktop = sidebarCollapsed && !isMobile;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (e.matches) setSidebarCollapsed(false);
      else setMobileNavOpen(false);
    };
    setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "app-sidebar-collapsed",
      sidebarCollapsed ? "1" : "0",
    );
  }, [sidebarCollapsed]);

  useEffect(() => {
    setMobileNavOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileNavOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const refresh = () => setUser(readSessionUser());
    window.addEventListener("storage", refresh);
    window.addEventListener("user-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("user-updated", refresh);
    };
  }, []);

  const goTo = (path: string) => {
    navigate(`/${vendorCode}${path}`);
    if (isMobile) setMobileNavOpen(false);
  };

  const logout = () => {
    clearAuthData();
    navigate("/login", { replace: true });
  };

  return (
    <div
      className={cn(
        "min-h-screen min-h-dvh bg-wz-surface font-sans text-wz-text",
      )}
    >
      {mobileNavOpen && isMobile && (
        <div
          className="fixed inset-0 z-[35] bg-[rgba(24,24,24,0.45)]"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed bottom-0 left-0 top-0 z-40 flex h-screen h-dvh flex-col overflow-hidden border-0 bg-wz-sidebar p-0 text-white transition-[width,transform] duration-200 ease-in-out",
          collapsedDesktop ? "w-wz-sidebar-collapsed" : "w-wz-sidebar",
          isMobile &&
            "max-[900px]:w-[min(var(--spacing-wz-sidebar),86vw)]",
          isMobile &&
            (mobileNavOpen
              ? "max-[900px]:translate-x-0"
              : "max-[900px]:-translate-x-[105%]"),
        )}
        aria-label="Main navigation"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div
            className={cn(
              "box-border flex h-wz-topbar min-h-wz-topbar shrink-0 items-center justify-between gap-wz-2 border-b border-white/[0.08] px-wz-4",
              collapsedDesktop && "justify-center border-b-transparent p-0",
            )}
          >
            <img
              src={workzaLogo}
              alt="Workza"
              className={cn(
                "block h-[35px] w-auto max-w-[145px] object-contain object-left brightness-0 invert",
                collapsedDesktop && "h-8 max-w-8 object-center",
              )}
            />
            <div className={cn(collapsedDesktop && "hidden")}>
              {!isMobile && !sidebarCollapsed ? (
                <button
                  type="button"
                  className={sidebarToggleClass}
                  onClick={() => setSidebarCollapsed(true)}
                  aria-label="Collapse sidebar"
                >
                  <ArrowLeft size={20} strokeWidth={2} />
                </button>
              ) : null}
              {isMobile ? (
                <button
                  type="button"
                  className={sidebarToggleClass}
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              ) : null}
            </div>
          </div>

          <nav
            className={cn(
              "flex min-h-0 flex-1 flex-col gap-wz-3 overflow-y-auto overflow-x-hidden px-wz-3 py-wz-4 [scrollbar-color:rgba(255,255,255,0.2)_transparent] [scrollbar-width:thin]",
              collapsedDesktop && "items-center px-[14px]",
            )}
          >
            {APP_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isNavPathActive(currentPath, item.path);
              return (
                <button
                  key={item.path}
                  type="button"
                  className={cn(
                    /* Figma Navigation/Nav Item: gap 10, 10/16/10/12 padding, 8 radius, 14 semibold #e8eefb, 18px icon */
                    "relative flex h-10 min-h-10 w-full cursor-pointer items-center gap-[10px] rounded-wz-md border-0 bg-transparent py-0 pl-3 pr-4 text-left text-sm font-semibold leading-5 tracking-normal transition-[background,color] duration-150 ease-in-out [&_svg]:size-[18px] [&_svg]:shrink-0",
                    active
                      ? "bg-white text-wz-primary"
                      : "text-wz-sidebar-text hover:bg-white/[0.08]",
                    collapsedDesktop &&
                      "m-0 h-10 w-11 justify-center p-0",
                  )}
                  title={item.label}
                  onClick={() => goTo(item.path)}
                >
                  {active && !collapsedDesktop ? (
                    <span
                      className="h-5 w-[3px] shrink-0 rounded-[2px] bg-wz-primary"
                      aria-hidden
                    />
                  ) : null}
                  <Icon size={18} />
                  <span className={cn(collapsedDesktop && "hidden")}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      <div
        className={cn(
          "flex min-h-screen min-h-dvh flex-col bg-wz-surface p-0 transition-[margin-left] duration-200 ease-in-out",
          collapsedDesktop ? "ml-wz-sidebar-collapsed" : "ml-wz-sidebar",
          "max-[900px]:ml-0",
        )}
      >
        <header
          className={cn(
            /* Figma Navigation/Top Bar: always 60 tall, 24 side padding */
            "sticky top-0 z-20 m-0 flex h-wz-topbar min-h-wz-topbar items-center justify-between gap-wz-4 rounded-none border-0 border-b border-wz-border bg-white px-wz-6 py-0 max-[900px]:px-wz-4",
          )}
        >
          <div className="flex min-w-0 items-center gap-wz-3">
            {isMobile ? (
              <IconButton
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={20} />
              </IconButton>
            ) : (
              sidebarCollapsed && (
                <IconButton
                  onClick={() => setSidebarCollapsed(false)}
                  aria-label="Open sidebar"
                >
                  <Menu size={20} />
                </IconButton>
              )
            )}
            <div className="min-w-0">
              <h1 className="m-0 text-lg font-bold leading-[22px] text-wz-heading">
                {pageTitle}
              </h1>
              {pageCrumbs.length > 0 ? (
                <nav
                  className="mt-0.5 flex min-w-0 flex-wrap items-center gap-[5px] text-[10px] leading-[14px] text-wz-text-muted"
                  aria-label="Breadcrumb"
                >
                  <Link
                    to={`${vendorBase}${pageCrumbs[0]?.path || "/employees"}`}
                    className="inline-flex shrink-0 items-center text-wz-text-muted no-underline hover:text-wz-primary"
                    aria-label="Back"
                  >
                    <ArrowLeft className="size-2.5" aria-hidden />
                  </Link>
                  {pageCrumbs.map((crumb, index) => {
                    const isLast = index === pageCrumbs.length - 1;
                    return (
                      <span
                        key={`${crumb.label}-${index}`}
                        className="inline-flex min-w-0 items-center gap-[5px]"
                      >
                        {index > 0 ? (
                          <ChevronRight
                            className="size-2.5 shrink-0 text-wz-text-muted"
                            aria-hidden
                          />
                        ) : null}
                        {crumb.path && !isLast ? (
                          <Link
                            to={`${vendorBase}${crumb.path}`}
                            className="truncate text-wz-text-muted no-underline hover:text-wz-primary hover:underline"
                          >
                            {crumb.label}
                          </Link>
                        ) : (
                          <span
                            className="truncate font-semibold text-wz-primary"
                            aria-current="page"
                          >
                            {crumb.label}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </nav>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-wz-3">
            <IconButton aria-label="Notifications" showDot>
              <Bell size={16} strokeWidth={1.75} />
            </IconButton>

            <div className="relative">
              <button
                type="button"
                /* Figma user-profile chip: 4/6 padding, gap 8, 8 radius, #e5eaf3 border */
                className="box-border flex cursor-pointer items-center gap-wz-2 rounded-wz-md border border-[#e5eaf3] bg-wz-neutral-50 px-1.5 py-1 hover:bg-wz-neutral-100"
                onClick={() => setProfileOpen((v) => !v)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                <Avatar initials={initials} size="xs" />
                <span className="text-left max-[900px]:hidden">
                  <strong className="block text-[10px] font-semibold leading-[14px] text-wz-heading">
                    {displayName}
                  </strong>
                  <span className="block text-[8px] font-normal leading-3 text-wz-text-muted">
                    {roleLabel}
                  </span>
                </span>
                <ChevronDown
                  size={14}
                  className="text-wz-heading"
                  strokeWidth={2}
                />
              </button>
              {profileOpen && (
                <div
                  className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-[180px] rounded-wz-xl border border-wz-border bg-white p-1.5 shadow-[0_12px_30px_rgba(24,24,24,0.12)]"
                  role="menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full cursor-pointer rounded-wz-md border-0 bg-transparent px-3 py-2.5 text-left text-sm font-medium text-wz-text hover:bg-wz-neutral-100"
                    onClick={logout}
                  >
                    <span className="inline-flex items-center gap-2">
                      <LogOut size={16} />
                      Logout
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-wz-6 max-[900px]:p-wz-4">
          {sessionReady ? <Outlet /> : null}
        </main>
      </div>
    </div>
  );
}
