import { describe, expect, it } from "vitest";
import {
  buildCalendarCells,
  flattenDayRecords,
  kpiFromStats,
  unmarkedPastWorkingDays,
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
    // Figma Sept 2026: leading 30, 31 (Aug) and trailing 1, 2, 3 (Oct), full weeks only.
    const outside = cells.flatMap((c) => (c.empty ? [c.outsideDay] : []));
    expect(outside).toEqual([30, 31, 1, 2, 3]);
    expect(cells.length % 7).toBe(0);
    expect(flattenDayRecords({ year: 2026, month: 9, dayRecords: { 2: [{ status: "Late" }] } })).toEqual([
      { day: 2, status: "Late" },
    ]);
  });
});

it("counts past working days with no record as absent", () => {
  const data = {
    year: 2026,
    month: 11,
    calendar: { "2": "Present", "1": "week-off" },
    weekOffs: { "1": { dayName: "Sunday" } },
    holidays: { "4": { name: "Diwali" } },
    dayRecords: { "2": [{ status: "Present" }] },
  };
  // 1 week-off, 2 present, 3 unmarked, 4 holiday, 5 unmarked; today = 6th
  expect(unmarkedPastWorkingDays(2026, 11, data, { today: new Date(2026, 10, 6) })).toBe(2);
  expect(
    unmarkedPastWorkingDays(2026, 11, data, { today: new Date(2026, 10, 6), joinedOn: "2026-11-05" }),
  ).toBe(1);
});
