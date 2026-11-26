import { describe, expect, it } from "vitest";
import type { RegularizationRequest } from "../../services/regularizationService";
import {
  configFromDraft,
  filterRegRequests,
  isApprovedThisMonth,
  recordedLines,
  requestedLines,
  totalWorked,
  validateConfigDraft,
} from "./regularizationViewModel";

const row = (over: Partial<RegularizationRequest>): RegularizationRequest => ({
  _id: "1",
  kind: "attendance",
  status: "Pending",
  employeeId: { _id: "e1", name: "Testro test", employeeCode: "NA-0002" },
  ...over,
});

describe("regularization view model", () => {
  it("describes attendance before and after", () => {
    const r = row({ previous: null, requested: { date: "2026-09-08", status: "Present", checkIn: "12:11", checkOut: "18:11" } });
    expect(recordedLines(r)).toEqual(["No record · — / —"]);
    expect(requestedLines(r)).toEqual(["Present · 12:11 / 18:11", "Total 6h 00m"]);
  });

  it("describes leave corrections", () => {
    const r = row({ kind: "leave", previous: { leaveType: "CL" }, requested: { leaveType: "SL" } });
    expect(recordedLines(r)[0]).toMatch(/Casual/);
    expect(requestedLines(r)[0]).toMatch(/correction$/);
  });

  it("drops the total when times are reversed", () => {
    expect(totalWorked("18:00", "09:00")).toBe("");
  });

  it("filters by kind and name or code", () => {
    const rows = [row({}), row({ _id: "2", kind: "leave", employeeId: { name: "Riya", employeeCode: "EMP-18" } })];
    expect(filterRegRequests(rows, { kind: "leave", search: "" })).toHaveLength(1);
    expect(filterRegRequests(rows, { kind: "", search: "na-0002" })).toHaveLength(1);
  });

  it("counts approvals decided this month only", () => {
    const now = new Date(2026, 10, 20);
    expect(isApprovedThisMonth(row({ status: "Approved", decidedAt: new Date(2026, 10, 2).toISOString() }), now)).toBe(true);
    expect(isApprovedThisMonth(row({ status: "Approved", decidedAt: new Date(2026, 9, 30).toISOString() }), now)).toBe(false);
  });

  it("validates config like the backend", () => {
    const now = new Date(2026, 10, 1); // November: 30 days
    const ok = { monthlyLimit: "", monthlyLeaveLimit: "30", attendanceWindowDays: "30", leaveWindowDays: "365" };
    expect(validateConfigDraft(ok, now)).toEqual({});
    expect(configFromDraft(ok).monthlyLimit).toBeNull();
    const bad = validateConfigDraft({ ...ok, monthlyLeaveLimit: "31", leaveWindowDays: "" }, now);
    expect(Object.keys(bad).sort()).toEqual(["leaveWindowDays", "monthlyLeaveLimit"]);
  });
});
