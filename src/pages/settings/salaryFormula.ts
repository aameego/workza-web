/**
 * Custom-formula validation + sample evaluation for salary components.
 * Ported from AameegoGig-Frontend `SalaryComponentManager.jsx` /
 * `SalaryStructure.jsx` so the client rejects the same input the backend does.
 */

type ComponentLike = { code: string };

const RESERVED = ["MIN", "MAX", "GROSS", "CTC"];

/** Returns "" when valid, otherwise the user-facing message. */
export const validateFormula = (
  expr: string,
  selfCode: string | null | undefined,
  allComponents: ComponentLike[],
): string => {
  if (!expr || !expr.trim()) return "Formula cannot be empty";
  const trimmed = expr.trim();
  if (trimmed.length > 500) return "Formula must be ≤ 500 chars";

  let depth = 0;
  for (const ch of trimmed) {
    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if (depth < 0) return "Unbalanced parentheses: extra ')'";
  }
  if (depth !== 0) return "Unbalanced parentheses: missing ')'";

  if (selfCode) {
    const re = new RegExp(`\\b${selfCode}\\b`, "i");
    if (re.test(trimmed)) {
      return `Formula cannot reference itself (${selfCode})`;
    }
  }

  const stripped = trimmed.replace(/\b(MIN|MAX|GROSS|CTC)\b/gi, "");
  if (!/^[A-Z0-9_+\-*/().,\s]+$/i.test(stripped)) {
    return "Contains invalid characters. Use A-Z, 0-9, +, -, *, /, ( ), ., , and component codes";
  }

  const codePattern = /\b[A-Z][A-Z0-9_]*\b/g;
  const tokens = [
    ...new Set((trimmed.match(codePattern) || []).map((t) => t.toUpperCase())),
  ].filter((c) => !RESERVED.includes(c));
  const available = new Set(allComponents.map((c) => String(c.code).toUpperCase()));
  for (const tok of tokens) {
    if (/^\d+$/.test(tok)) continue;
    if (!available.has(tok) && available.size > 0) {
      return `Unknown component '${tok}' — choose from dropdown`;
    }
  }

  if (!/[A-Z0-9+\-*/()]/.test(trimmed)) {
    return "Formula should contain an operator or component";
  }
  return "";
};

/** Dry-run the formula against sample values so syntax errors surface early. */
export const evaluateFormula = (
  expr: string,
  sampleMap: Record<string, number> = {},
): { ok: boolean; value?: number; error?: string } => {
  if (!expr || !expr.trim()) return { ok: false, error: "Empty" };
  let e = expr.trim();

  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rep = (tok: string, val: number) => {
    e = e.replace(new RegExp(`\\b${esc(tok)}\\b`, "gi"), String(val));
  };

  rep("GROSS", sampleMap.GROSS || 50000);
  rep("CTC", sampleMap.CTC || 60000);

  const pattern = /\b[A-Z][A-Z0-9_]*\b/g;
  const toks = [
    ...new Set((e.match(pattern) || []).map((t) => t.toUpperCase())),
  ].filter((c) => !RESERVED.includes(c));
  toks.sort((a, b) => b.length - a.length);
  for (const t of toks) {
    rep(t, sampleMap[t] != null ? sampleMap[t] : 5000);
  }

  const safe = e.replace(/\bmin\b/gi, "Math.min").replace(/\bmax\b/gi, "Math.max");
  if (!/^[0-9+\-*/().,\sMathminax]+$/i.test(safe)) {
    return { ok: false, error: "Invalid characters after substitution" };
  }
  try {
    const value = Number(Function(`"use strict"; return (${safe})`)());
    if (!Number.isFinite(value)) return { ok: false, error: "Result is not finite" };
    return { ok: true, value: Math.round(value) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message || "Syntax error" : "Syntax error",
    };
  }
};
