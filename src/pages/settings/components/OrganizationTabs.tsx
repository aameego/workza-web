import { ChevronRight } from "lucide-react";
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
    <>
      {/* Figma mobile "Settings section selector" (288:154220): 44 tall, #dee3e8 border,
          6 radius, primary 13px label, chevron pointing right. Native select keeps the
          phone's own picker and screen-reader support. */}
      <label className="relative flex h-11 items-center rounded-[6px] border border-[#dee3e8] bg-white px-3 md:hidden">
        <span className="sr-only">Settings section</span>
        <select
          className="absolute inset-0 cursor-pointer appearance-none opacity-0"
          value={activeTab}
          onChange={(e) => onTabChange(e.target.value as SettingsTab)}
        >
          {SETTINGS_TABS.map((tab) => (
            <option key={tab} value={tab}>
              {tab}
            </option>
          ))}
        </select>
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-wz-primary" aria-hidden>
          {activeTab}
        </span>
        <ChevronRight size={16} className="shrink-0 text-wz-text-muted" aria-hidden />
      </label>
      <div className="flex gap-wz-2 border-b border-wz-neutral-200 max-md:hidden">
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
    </>
  );
}
