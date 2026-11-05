import { describe, expect, it } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders success status", () => {
    const el = document.createElement("div");
    act(() => {
      createRoot(el).render(<Badge status="success">Active</Badge>);
    });
    const badge = el.querySelector("[data-status='success']");
    expect(badge?.textContent).toBe("Active");
    expect(badge?.className).toContain("bg-wz-badge-success-bg");
  });
});
