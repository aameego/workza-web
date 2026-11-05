import { describe, expect, it } from "vitest";
import {
  buildCalendarCells,
  flattenDayRecords,
  kpiFromStats,
} from "./attendanceCalendar";

describe("attendanceCalendar", () => {
  it("builds KPI cards from month stats", () => {
    expect(
      kpiFromStats({
        Present: 18,
        Absent: 2,
        Leave: 2,
        "Half Day": 4,
        WFH: 2,
        Late: 1,
      }),
    ).toEqual([
      { label: "Present (Days)", value: 18 },
      { label: "Absent (Days)", value: 2 },
      { label: "Leave (Days)", value: 2 },
      { label: "Half Day (Days)", value: 4 },
      { label: "WFH (Days)", value: 2 },
      { label: "Late (Days)", value: 1 },
    ]);
  });

  it("pads calendar with leading empties and flattens day records", () => {
    const cells = buildCalendarCells(2026, 9, {
      year: 2026,
      month: 9,
      calendar: { 1: "Present" },
      dayRecords: {
        1: [{ status: "Present", checkIn: "09:00" }],
      },
      holidays: {},
      weekOffs: {},
    });
    expect(cells.some((c) => c.empty)).toBe(true);
    expect(cells.find((c) => !c.empty && c.day === 1)).toMatchObject({
      label: "Present",
      entries: [{ status: "Present", checkIn: "09:00" }],
      hasSessions: false,
    });
    expect(flattenDayRecords({ year: 2026, month: 9, dayRecords: { 2: [{ status: "Late" }] } })).toEqual([
      { day: 2, status: "Late" },
    ]);
  });
});
