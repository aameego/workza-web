import { describe, expect, it } from "vitest";
import type { LeaveRequest } from "../../services/leaveService";
import {
  employeeFromRequest,
  filterRequests,
  formatLeaveDate,
  formatLeaveDays,
  getLeaveTypeLabel,
  orgLeaveMetrics,
  selfLeaveMetrics,
  statusTabCounts,
  validateLeaveRequestForm,
} from "./leaveViewModel";

const req = (overrides: Partial<LeaveRequest> = {}): LeaveRequest => ({
  _id: "r1",
  leaveType: "CL",
  status: "Pending",
  reason: "Personal",
  startDate: "2026-09-01T18:30:00.000Z",
  endDate: "2026-09-02T18:30:00.000Z",
  days: 2,
  employeeId: {
    _id: "e1",
    name: "Priya Sharma",
    employeeCode: "EMP-0016",
    email: "priya@example.com",
    phone: "9999999999",
  },
  ...overrides,
});

describe("leaveViewModel", () => {
  it("maps leave type labels", () => {
    expect(getLeaveTypeLabel("CL")).toContain("Casual");
    expect(getLeaveTypeLabel("unknown")).toBe("unknown");
  });

  it("formats leave days with half-day parts", () => {
    expect(formatLeaveDays({ days: 1, dayPart: "full" })).toBe("1d");
    expect(formatLeaveDays({ days: 0.5, dayPart: "first-half" })).toContain(
      "First Half",
    );
  });

  it("formats IST dates without crashing", () => {
    expect(formatLeaveDate("2026-09-01T18:30:00.000Z")).not.toBe("—");
    expect(formatLeaveDate(null)).toBe("—");
  });

  it("extracts employee fields from request", () => {
    const emp = employeeFromRequest(req());
    expect(emp.name).toBe("Priya Sharma");
    expect(emp.employeeCode).toBe("EMP-0016");
    expect(emp.initials).toBe("PS");
  });

  it("builds org and self metrics", () => {
    const org = orgLeaveMetrics({
      wfhDaysThisMonth: 7,
      leaveDaysThisMonth: 4,
      pendingRequests: 2,
      rejectedRequests: 10,
      employeeCount: 3,
    });
    expect(org).toHaveLength(4);
    expect(org[0]?.value).toBe(7);

    const self = selfLeaveMetrics({
      wfhDaysThisMonth: 1,
      leaveDaysThisMonth: 2,
      pendingRequests: 1,
      rejectedRequests: 0,
    });
    expect(self.find((m) => m.key === "submitted")?.value).toBe(1);
  });

  it("filters requests by search, status, and type", () => {
    const rows = [
      req(),
      req({
        _id: "r2",
        leaveType: "WFH",
        requestType: "WFH",
        status: "Approved",
        employeeId: {
          name: "Ankit Kumar",
          employeeCode: "EMP-0001",
        },
      }),
    ];
    expect(filterRequests(rows, { status: "Pending" })).toHaveLength(1);
    expect(filterRequests(rows, { requestType: "WFH" })).toHaveLength(1);
    expect(filterRequests(rows, { search: "ankit" })).toHaveLength(1);
  });

  it("counts status tabs", () => {
    const counts = statusTabCounts([
      req({ status: "Pending" }),
      req({ _id: "a", status: "Approved" }),
      req({ _id: "c", status: "Cancelled" }),
      req({ _id: "r", status: "Rejected" }),
    ]);
    expect(counts[""]).toBe(4);
    expect(counts.Pending).toBe(1);
    expect(counts.Rejected).toBe(1);
  });

  it("validates leave request form", () => {
    expect(
      validateLeaveRequestForm({
        leaveType: "",
        startDate: "2026-09-01",
        endDate: "2026-09-02",
        dayPart: "full",
        reason: "ok",
      }),
    ).toMatch(/leave type/i);

    expect(
      validateLeaveRequestForm({
        leaveType: "CL",
        startDate: "2026-09-02",
        endDate: "2026-09-01",
        dayPart: "full",
        reason: "Trip home",
      }),
    ).toMatch(/end date/i);

    expect(
      validateLeaveRequestForm({
        leaveType: "CL",
        startDate: "2026-09-01",
        endDate: "2026-09-02",
        dayPart: "first-half",
        reason: "Trip home",
      }),
    ).toMatch(/single day/i);

    expect(
      validateLeaveRequestForm({
        leaveType: "CL",
        startDate: "2026-09-01",
        endDate: "2026-09-01",
        dayPart: "full",
        reason: "Trip home",
        requireEmployee: true,
        employeeId: "",
      }),
    ).toMatch(/select an employee/i);

    expect(
      validateLeaveRequestForm({
        leaveType: "CL",
        startDate: "2026-09-01",
        endDate: "2026-09-01",
        dayPart: "full",
        reason: "Trip home",
      }),
    ).toBe("");
  });
});
