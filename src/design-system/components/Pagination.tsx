import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../cn";
import { paginationItems } from "./paginationItems";

/** Figma Data/Pagination (1:19006): 32 tall, 34 min wide, 14px semibold. */
const pageBtnClass = (active = false) =>
  cn(
    "inline-flex h-8 min-w-[34px] cursor-pointer items-center justify-center gap-1 rounded-wz-md border px-[9px] text-sm leading-[18px] font-semibold disabled:cursor-not-allowed disabled:border-wz-neutral-200 disabled:text-wz-neutral-400",
    active
      ? "border-wz-primary bg-wz-primary text-white"
      : "border-wz-border bg-white text-wz-heading hover:enabled:bg-wz-neutral-50",
  );

export type PaginationProps = {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
  /** Left-hand summary, e.g. "Showing 1–10 of 84 employees". */
  summary: ReactNode;
  /**
   * bar: numbered pages. stacked: mobile (Figma 173:51558), summary above.
   * compact: mobile chevrons only (173:51639). simple: Previous / Next only (288:154039).
   */
  variant?: "bar" | "stacked" | "compact" | "simple";
};

/** Table footer bar: 56 tall, summary left (12px semibold navy), buttons right, 8 apart. */
export function Pagination({ page, pages, onPageChange, summary, variant = "bar" }: PaginationProps) {
  const stacked = variant === "stacked";
  if (variant === "simple") {
    /* Figma table footer: 56 tall, 12px summary, 32-tall Previous / Next, 7 radius, no page numbers */
    const btn =
      "inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-[7px] border border-wz-border bg-white px-2 text-xs leading-[18px] font-semibold text-wz-heading disabled:cursor-not-allowed disabled:text-wz-text-muted/50";
    return (
      <div className="flex h-14 items-center justify-between gap-3 border-t border-wz-border bg-white px-4">
        <div className="min-w-0 text-xs leading-[18px] font-semibold text-wz-heading">{summary}</div>
        <div className="flex items-center gap-2">
          <button type="button" className={btn} disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))}>
            <ChevronLeft className="size-3.5" aria-hidden />
            Previous
          </button>
          <button type="button" className={btn} disabled={page >= pages} onClick={() => onPageChange(Math.min(pages, page + 1))}>
            Next
            <ChevronRight className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>
    );
  }
  if (variant === "compact") {
    /* Mobile table footer (Figma 173:51639): 56 tall, 10px summary, chevron-only buttons */
    const btn =
      "inline-flex h-8 cursor-pointer items-center justify-center rounded-[7px] border border-wz-border bg-white px-2 text-wz-heading disabled:cursor-not-allowed disabled:text-wz-neutral-400";
    return (
      <div className="flex h-14 items-center justify-between gap-3 border-t border-wz-border bg-white px-4">
        <div className="min-w-0 flex-1 text-[10px] leading-[18px] font-semibold text-wz-heading md:text-xs">{summary}</div>
        <div className="flex items-center gap-2">
          <button type="button" className={btn} aria-label="Previous page" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))}>
            <ChevronLeft className="size-3.5" aria-hidden />
          </button>
          <button type="button" className={btn} aria-label="Next page" disabled={page >= pages} onClick={() => onPageChange(Math.min(pages, page + 1))}>
            <ChevronRight className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>
    );
  }
  return (
    <div
      className={
        stacked
          ? "flex flex-col items-start gap-3"
          : "flex min-h-14 flex-wrap items-center justify-between gap-wz-3 border-t border-wz-border bg-white px-4 py-3"
      }
    >
      <div
        className={
          stacked
            ? "text-[11px] leading-[18px] font-semibold text-wz-heading"
            : "text-xs leading-[18px] font-semibold text-wz-heading"
        }
      >
        {summary}
      </div>
      <div
        className={
          stacked
            ? "flex max-w-full items-center gap-wz-2 overflow-x-auto [&>*]:shrink-0 [&>*]:rounded-[7px] [&>*]:px-2 [&>*]:text-xs"
            : "flex flex-wrap items-center gap-wz-2"
        }
      >
        <button
          type="button"
          className={pageBtnClass()}
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeft className="size-3.5" aria-hidden />
          Previous
        </button>
        {paginationItems(page, pages).map((item, idx) =>
          item === "ellipsis" ? (
            <span key={`e-${idx}`} className={pageBtnClass()} aria-hidden>
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={pageBtnClass(item === page)}
              onClick={() => onPageChange(item)}
              aria-current={item === page ? "page" : undefined}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          className={pageBtnClass()}
          disabled={page >= pages}
          onClick={() => onPageChange(Math.min(pages, page + 1))}
        >
          Next
          <ChevronRight className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
