import { describe, expect, it } from "vitest";
import { buildHistoryEvents, formatHistoryTime, formatHours } from "./attendanceHistory";

describe("attendance history", () => {
  it("formats HH:MM as 12h", () => {
    expect(formatHistoryTime("17:30")).toBe("05:30 PM");
    expect(formatHistoryTime("")).toBe("-");
    expect(formatHistoryTime("—")).toBe("-");
    expect(formatHistoryTime("4:00 pm")).toBe("04:00 PM");
  });

  it("builds newest-first events for one employee-day and ends with the original mark", () => {
    const events = buildHistoryEvents(
      [
        { _id: "a", employeeId: { _id: "e1" }, decidedAt: "2026-09-28T12:30:00Z", reason: "missing",
          requested: { date: new Date(2026, 8, 28).toISOString(), status: "Present", checkIn: "09:00", checkOut: "17:30" },
          previous: { status: "Present", checkIn: "09:00", checkOut: null } },
        { _id: "b", employeeId: { _id: "e1" }, decidedAt: "2026-09-30T12:10:00Z",
          requested: { date: "2026-09-28", status: "Sick Leave" },
          previous: { status: "Present", checkIn: "09:00", checkOut: "17:30" } },
        { _id: "c", employeeId: "e2", requested: { date: "2026-09-28", status: "Absent" } },
      ],
      "e1",
      "2026-09-28",
      { name: "Priya" },
    );
    expect(events.map((e) => e.title)).toEqual([
      "Attendance Updated!",
      "Check-out time updated!",
      "Attendance Marked!",
    ]);
    expect(events[0]).toMatchObject({ previous: "Present", updated: "Sick Leave" });
    expect(events[1]).toMatchObject({ previous: "-", updated: "05:30 PM" });
    expect(events[2]).toMatchObject({ checkIn: "09:00 AM", checkOut: "-" });
  });
});

it("formats hours like Figma", () => {
  expect(formatHours("6h 00m")).toBe("06 hr 00 m");
  expect(formatHours("9h 53m")).toBe("09 hr 53 m");
  expect(formatHours(1.5)).toBe("01 hr 30 m");
  expect(formatHours("—")).toBe("-");
});
