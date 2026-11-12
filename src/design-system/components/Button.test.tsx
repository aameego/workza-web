import { describe, expect, it } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders primary variant by default", () => {
    const el = document.createElement("div");
    act(() => {
      createRoot(el).render(<Button>Save</Button>);
    });
    const btn = el.querySelector("button");
    expect(btn?.textContent).toBe("Save");
    expect(btn?.getAttribute("data-variant")).toBe("primary");
    expect(btn?.className).toContain("bg-wz-primary");
  });

  it("applies destructive variant", () => {
    const el = document.createElement("div");
    act(() => {
      createRoot(el).render(<Button variant="destructive">Delete</Button>);
    });
    const btn = el.querySelector("button");
    expect(btn?.getAttribute("data-variant")).toBe("destructive");
    expect(btn?.className).toContain("bg-wz-danger");
  });

  it("renders secondary as outline (white fill + primary border)", () => {
    const el = document.createElement("div");
    act(() => {
      createRoot(el).render(<Button variant="secondary">Bulk Upload</Button>);
    });
    const btn = el.querySelector("button");
    expect(btn?.getAttribute("data-variant")).toBe("secondary");
    expect(btn?.className).toContain("bg-white");
    expect(btn?.className).toContain("border-wz-primary");
    expect(btn?.className).toContain("text-wz-primary");
    // Default fill is white; hover may still reference bg-wz-hover.
    expect(btn?.className).toMatch(/(?:^|\s)bg-white(?:\s|$)/);
  });
});
