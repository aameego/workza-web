import { describe, expect, it } from "vitest";
import {
  buildCalendarCells,
  entriesForDay,
  flattenDayRecords,
} from "./attendanceCalendar";

const monthData = {
  year: 2026,
  month: 11,
  calendar: { 5: "Present", 6: "Leave" },
  holidays: { 14: { name: "Diwali" } },
  weekOffs: { 1: { dayName: "Sunday" }, 8: { dayName: "Sunday" } },
  dayRecords: {
    5: [
      {
        status: "Present",
        checkIn: "09:00 AM",
        checkOut: "06:00 PM",
        hours: "8h 00m",
        sessionCount: 1,
        sessions: [
          {
            sessionNumber: 1,
            checkIn: "09:00 AM",
            checkOut: "06:00 PM",
            hours: "8h 00m",
            checkInSelfieUrl: "/attendance/selfie/r1/0?type=checkin",
          },
        ],
      },
    ],
    6: [
      {
        status: "Leave",
        leaveLabel: "Casual Leave",
        leaveType: "CL",
      },
    ],
  },
};

describe("attendance day selection helpers", () => {
  it("marks cells with sessions and exposes entries for click detail", () => {
    const cells = buildCalendarCells(2026, 11, monthData);
    const day5 = cells.find((c) => !c.empty && c.day === 5);
    expect(day5).toMatchObject({
      label: "Present",
      hasSessions: true,
    });
    if (!day5 || day5.empty) throw new Error("expected day 5");
    expect(day5.entries[0]?.sessions?.[0]?.checkInSelfieUrl).toContain(
      "selfie",
    );

    const day14 = cells.find((c) => !c.empty && c.day === 14);
    expect(day14).toMatchObject({ label: "Diwali", holidayName: "Diwali" });
  });

  it("entriesForDay returns [] for empty days and rows for recorded days", () => {
    expect(entriesForDay(monthData, 5)).toHaveLength(1);
    expect(entriesForDay(monthData, 2)).toEqual([]);
    expect(flattenDayRecords(monthData).map((r) => r.day)).toEqual([5, 6]);
  });
});
