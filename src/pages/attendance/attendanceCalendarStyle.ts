import { cn } from "../../design-system";

/**
 * Figma attendance calendar (employee 1:21599, organisation 1:16935).
 * Colours were sampled from the Figma renders; a label's colour doubles as its legend dot.
 */
export const ATTENDANCE_LEGEND = [
  { label: "Present", text: "text-[#12b76a]", dot: "bg-[#12b76a]" },
  { label: "Absent", text: "text-[#d92d20]", dot: "bg-[#d92d20]" },
  { label: "Late", text: "text-[#f79009]", dot: "bg-[#f79009]" },
  { label: "Half Day", text: "text-[#1f5da3]", dot: "bg-[#1f5da3]" },
  { label: "WFH", text: "text-[#9a7a34]", dot: "bg-[#9a7a34]" },
  { label: "Leave", text: "text-[#1caaea]", dot: "bg-[#1caaea]" },
  { label: "Holiday", text: "text-[#6941c6]", dot: "bg-[#6941c6]" },
  { label: "Week Off", text: "text-[#6c757d]", dot: "bg-[#6c757d]" },
  { label: "Compensatory Off", text: "text-[#062b57]", dot: "bg-[#062b57]" },
] as const;

export type DayLook = { bg: string; text: string; large: boolean };

/**
 * Cell fill + label style per day. Attendance outcomes (Present, Absent, Late,
 * Half Day, WFH) get the large 14px label; holidays, week offs, leave and comp
 * offs get the small 10px one. Absent/Late/Half Day tints are not in the Figma
 * frames; they use the same ~4% tint of their legend colour as Present.
 */
export const dayLook = (
  status: string,
  label: string | null | undefined,
  weekOff?: boolean,
  holiday?: boolean,
): DayLook => {
  const s = status.toLowerCase();
  const l = String(label || "").toLowerCase();
  if (holiday) return { bg: "bg-[#f4f3ff]", text: "text-[#6941c6]", large: false };
  if (weekOff || s === "week-off") return { bg: "bg-[#f8f9fa]", text: "text-[#6c757d]", large: false };
  if (/comp/.test(s) || /comp/.test(l)) return { bg: "bg-[#ebeef2]", text: "text-[#062b57]", large: false };
  if (s === "wfh" || l === "wfh") return { bg: "bg-[#f5f2eb]", text: "text-[#9a7a34]", large: true };
  if (s === "leave" || /leave/.test(l)) return { bg: "bg-[#eef8ff]", text: "text-[#1caaea]", large: false };
  if (s === "present" || l === "present") return { bg: "bg-[#f7fcf9]", text: "text-[#12b76a]", large: true };
  if (s === "absent" || l === "absent") return { bg: "bg-[#fdf5f4]", text: "text-[#d92d20]", large: true };
  if (s === "late" || l === "late") return { bg: "bg-[#fefaf3]", text: "text-[#f79009]", large: true };
  if (s === "half day" || s === "half-day" || l === "half day") return { bg: "bg-[#f5f7fb]", text: "text-[#1f5da3]", large: true };
  return { bg: "bg-white", text: "text-wz-text-muted", large: false };
};

/** Base classes for a day cell button: 59 tall + the 1px grid line = Figma's 60 pitch. */
export const dayCellClass =
  "relative flex h-[59px] cursor-pointer flex-col pt-[9px] pl-[11px] text-left transition-[filter] hover:brightness-[0.98]";

/** Day number: 11px semibold, muted; blue for today / the selected day. */
export const dayNumberClass = (highlight: boolean) =>
  cn("text-[11px] leading-[14px] font-semibold", highlight ? "text-wz-primary" : "text-wz-text-muted");
