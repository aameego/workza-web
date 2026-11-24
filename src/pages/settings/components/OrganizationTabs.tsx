import { cn } from "../../../design-system";

const SETTINGS_TABS = [
  "Organization",
  "Roles & Access",
  "Configuration",
  "Shifts & Week Off",
  "Holidays",
  "Leave Policy",
  "Probation",
  "Salary",
  "Overtime",
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number];

export interface OrganizationTabsProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

export function OrganizationTabs({
  activeTab,
  onTabChange,
}: OrganizationTabsProps) {
  return (
    <div className="flex gap-wz-2 border-b border-wz-neutral-200">
      {SETTINGS_TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={activeTab === tab}
          onClick={() => onTabChange(tab)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-wz-md border px-wz-4 py-[7px] text-sm font-semibold transition-colors",
            activeTab === tab
              ? "border-b border-wz-primary bg-white font-semibold text-wz-primary"
              : "border-transparent text-wz-text-muted hover:text-wz-heading hover:bg-wz-neutral-50",
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
