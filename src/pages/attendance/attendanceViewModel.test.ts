import { describe, expect, it } from "vitest";
import {
  formatTimeForApi,
  type AttendanceMonthResponse,
} from "../../services/attendanceService";
import {
  buildAttendanceListParams,
  buildOrgCalendarCells,
  dateIsoForDay,
  filterRowsBySearch,
  formatAttendanceDayTitle,
  normalizeAttendanceRow,
  orgDayMetrics,
  presentCountForDay,
  selfMonthMetrics,
} from "./attendanceViewModel";

describe("orgDayMetrics", () => {
  it("maps stats into five KPI cards", () => {
    const cards = orgDayMetrics({
      Present: 12,
      Absent: 2,
      Late: 1,
      "Half Day": 3,
      Leave: 4,
    });
    expect(cards).toHaveLength(5);
    expect(cards.map((c) => c.value)).toEqual([12, 2, 1, 3, 4]);
  });

  it("defaults missing stats to zero", () => {
    expect(orgDayMetrics(null)[0]?.value).toBe(0);
  });
});

describe("selfMonthMetrics", () => {
  it("returns six self KPI rows", () => {
    expect(selfMonthMetrics({ Present: 18, Leave: 2 })).toEqual([
      { label: "Present (Days)", value: 18 },
      { label: "Absent (Days)", value: 0 },
      { label: "Leave (Days)", value: 2 },
      { label: "Half Day (Days)", value: 0 },
      { label: "WFH (Days)", value: 0 },
      { label: "Late (Days)", value: 0 },
    ]);
  });
});

describe("normalizeAttendanceRow", () => {
  it("prefers nested employee object fields", () => {
    const row = normalizeAttendanceRow({
      employeeId: { _id: "abc123", name: "Ada Lovelace", employeeCode: "EMP01" },
      status: "Present",
      date: "2026-11-05",
      recordId: "rec1",
    });
    expect(row.name).toBe("Ada Lovelace");
    expect(row.employeeCode).toBe("EMP01");
    expect(row.initials).toBe("AL");
    expect(row.rowKey).toBe("rec1");
  });

  it("falls back to top-level name and generated key", () => {
    const row = normalizeAttendanceRow({
      name: "Grace Hopper",
      status: "Late",
      date: "2026-11-05",
    });
    expect(row.employeeCode).toBe("—");
    expect(row.initials).toBe("GH");
    expect(row.rowKey).toContain("Late");
  });
});

describe("presentCountForDay / buildOrgCalendarCells", () => {
  const data: AttendanceMonthResponse = {
    year: 2026,
    month: 11,
    calendar: { "5": "Present" },
    holidays: { "14": { name: "Diwali" } },
    weekOffs: { "1": { dayName: "Sunday" } },
    dayRecords: {
      "5": [
        { status: "Present" },
        { status: "Late" },
        { status: "Absent" },
      ],
    },
  };

  it("counts present and late for a day", () => {
    expect(presentCountForDay(data, 5)).toBe(2);
    expect(presentCountForDay(data, 6)).toBe(0);
  });

  it("builds calendar cells with selection, holiday, and week-off", () => {
    const cells = buildOrgCalendarCells(2026, 11, data, 5);
    const day5 = cells.find((c) => !c.empty && c.day === 5);
    const day14 = cells.find((c) => !c.empty && c.day === 14);
    const day1 = cells.find((c) => !c.empty && c.day === 1);
    expect(day5 && !day5.empty && day5.isSelected).toBe(true);
    expect(day5 && !day5.empty && day5.presentCount).toBe(2);
    expect(day14 && !day14.empty && day14.holidayName).toBe("Diwali");
    expect(day1 && !day1.empty && day1.weekOff).toBe(true);
  });
});

describe("formatAttendanceDayTitle / dateIsoForDay", () => {
  it("formats selected day title", () => {
    expect(formatAttendanceDayTitle(2026, 11, 5)).toMatch(/Attendance —/);
    expect(formatAttendanceDayTitle(2026, 11, null)).toBe("Attendance");
  });

  it("builds ISO date", () => {
    expect(dateIsoForDay(2026, 3, 9)).toBe("2026-03-09");
  });
});

describe("buildAttendanceListParams", () => {
  it("uses custom range when a day is selected", () => {
    expect(
      buildAttendanceListParams({
        target: "org",
        year: 2026,
        month: 11,
        selectedDay: 5,
        search: "ada",
        departmentId: "dept1",
        employeeStatus: "active",
      }),
    ).toEqual({
      target: "org",
      filterType: "custom",
      startDate: "2026-11-05",
      endDate: "2026-11-05",
      search: "ada",
      page: 1,
      limit: 20,
      departmentId: "dept1",
      employeeStatus: "active",
    });
  });

  it("falls back to filterType when no day selected", () => {
    expect(
      buildAttendanceListParams({
        target: "team",
        year: 2026,
        month: 11,
        selectedDay: null,
        filterType: "today",
      }),
    ).toMatchObject({
      target: "team",
      filterType: "today",
      year: 2026,
      month: 11,
    });
  });

  it("uses explicit custom start/end when provided without selected day", () => {
    expect(
      buildAttendanceListParams({
        target: "org",
        year: 2026,
        month: 11,
        selectedDay: null,
        startDate: "2026-11-01",
        endDate: "2026-11-07",
      }),
    ).toMatchObject({
      filterType: "custom",
      startDate: "2026-11-01",
      endDate: "2026-11-07",
    });
  });

  it("passes filterType presets when no day is selected", () => {
    expect(
      buildAttendanceListParams({
        target: "org",
        year: 2026,
        month: 11,
        selectedDay: null,
        filterType: "7days",
      }),
    ).toMatchObject({ filterType: "7days", year: 2026, month: 11 });
  });
});

describe("formatTimeForApi", () => {
  it("converts 24h HTML time to 12h API string", () => {
    expect(formatTimeForApi("09:30")).toBe("09:30 AM");
    expect(formatTimeForApi("13:05")).toBe("01:05 PM");
    expect(formatTimeForApi("00:00")).toBe("12:00 AM");
    expect(formatTimeForApi("")).toBe("");
  });
});

describe("filterRowsBySearch", () => {
  const rows = [
    normalizeAttendanceRow({
      name: "Ada Lovelace",
      employeeCode: "EMP01",
      status: "Present",
    }),
    normalizeAttendanceRow({
      name: "Grace Hopper",
      employeeCode: "EMP02",
      status: "Absent",
    }),
  ];

  it("returns all rows for empty search", () => {
    expect(filterRowsBySearch(rows, "  ")).toHaveLength(2);
  });

  it("filters by name or code", () => {
    expect(filterRowsBySearch(rows, "hopper")).toHaveLength(1);
    expect(filterRowsBySearch(rows, "emp01")[0]?.name).toBe("Ada Lovelace");
    expect(filterRowsBySearch(rows, "zzz")).toHaveLength(0);
  });
});
