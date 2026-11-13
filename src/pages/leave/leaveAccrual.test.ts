import { expect, it } from "vitest";
import { accrualMonthOptions, accrualResultMessage } from "./leaveAccrual";

it("summarises skip reasons after the backend message", () => {
  const msg = accrualResultMessage({
    message: "Leave accrual completed for 2026-11. Credited: 1 · Already credited: 0 · Skipped: 3",
    details: [
      { status: "credited" },
      { status: "skipped", reason: "zero-credit" },
      { status: "skipped", reason: "zero-credit" },
      { status: "skipped", reason: "exited" },
    ],
  });
  expect(msg).toBe(
    "Leave accrual completed for 2026-11. Credited: 1 · Already credited: 0 · Skipped: 3 (2 nothing due — yearly cap or attendance rule, 1 exited)",
  );
});

it("lists the current month first", () => {
  const opts = accrualMonthOptions(new Date(2026, 10, 12));
  expect(opts[0]!.value).toBe("2026-11");
  expect(opts[1]!.value).toBe("2026-10");
  expect(opts).toHaveLength(13);
});
