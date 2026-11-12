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
};

/** Table footer bar: 56 tall, summary left (14px semibold navy), buttons right, 8 apart. */
export function Pagination({ page, pages, onPageChange, summary }: PaginationProps) {
  return (
    <div className="flex min-h-14 flex-wrap items-center justify-between gap-wz-3 border-t border-wz-border bg-white px-4 py-3">
      <div className="text-sm leading-[18px] font-semibold text-wz-heading">{summary}</div>
      <div className="flex flex-wrap items-center gap-wz-2">
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
