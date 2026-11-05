import { describe, expect, it } from "vitest";
import { brand, figma, neutral, semantic, shell, typography } from "./tokens";

describe("Workza design tokens (Figma parity)", () => {
  it("matches Figma brand colors", () => {
    expect(brand.workzaBlue).toBe("#1950A3");
    expect(brand.workzaTeal).toBe("#1FA3A5");
    expect(brand.kpBlue).toBe("#245EE4");
    expect(brand.kpGreen).toBe("#08926F");
  });

  it("matches Figma neutral ramp endpoints", () => {
    expect(neutral[50]).toBe("#F8F9FA");
    expect(neutral[900]).toBe("#181818");
    expect(neutral[600]).toBe("#495057");
  });

  it("maps semantic tokens to brand / neutrals", () => {
    expect(semantic.primary).toBe(brand.workzaBlue);
    expect(semantic.accent).toBe(brand.workzaTeal);
    expect(semantic.surface).toBe(neutral[50]);
    expect(semantic.border).toBe(neutral[300]);
    expect(semantic.success).toBe("#12B76A");
    expect(semantic.error).toBe("#F04438");
  });

  it("matches shell dimensions from Navigation components", () => {
    expect(shell.sidebarWidth).toBe(232);
    expect(shell.sidebarCollapsedWidth).toBe(72);
    expect(shell.topbarHeight).toBe(60);
  });

  it("uses Sora type scale", () => {
    expect(typography.fontFamily).toContain("Sora");
    expect(typography.h1).toEqual({ size: 36, lineHeight: 44, weight: 700 });
    expect(typography.body).toEqual({ size: 14, lineHeight: 20, weight: 400 });
  });

  it("records Figma source node ids for agents", () => {
    expect(figma.fileKey).toBe("14O92bCa5gfXDTCsf2RXbp");
    expect(figma.tokensNodeId).toBe("1:13816");
  });
});
