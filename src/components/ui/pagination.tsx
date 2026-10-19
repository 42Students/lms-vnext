import Link from "next/link";
import { cx } from "@/lib/class-names";
import { isSafeInternalHref } from "@/lib/safe-internal-href";

export type PaginationProps = {
  page: number;
  pageCount: number;
  hrefForPage: (page: number) => string;
  label?: string;
  className?: string;
};

/** Reject nonfinite and unsafe-integer pagination counts before creating links.
 * Above MAX_SAFE_INTEGER, adjacent page numbers collapse to the same JS number
 * and create duplicate React keys or unsafe navigation URLs.
 */
export function normalizedPageCount(count: number): number {
  return Number.isFinite(count)
    ? Math.max(1, Math.min(Number.MAX_SAFE_INTEGER, Math.trunc(count)))
    : 1;
}

export function paginationWindow(page: number, pageCount: number): number[] {
  const total = normalizedPageCount(pageCount);
  const selected = Number.isFinite(page) ? Math.min(total, Math.max(1, Math.trunc(page))) : 1;
  const start = Math.max(1, Math.min(selected - 1, total - 4));
  return Array.from({ length: Math.min(total, 5) }, (_, i) => start + i);
}

/** Bad destination builders must disable only their own links, not crash the whole list. */
function safePageHref(hrefForPage: PaginationProps["hrefForPage"], target: number): string | null {
  try {
    const href = hrefForPage(target);
    return typeof href === "string" && href ? href : null;
  } catch {
    return null;
  }
}

export function Pagination({ page, pageCount, hrefForPage, label = "Pages", className }: PaginationProps) {
  const total = normalizedPageCount(pageCount);
  const current = Number.isFinite(page) ? Math.max(1, Math.min(total, Math.trunc(page))) : 1;
  const previousHref = current > 1 ? safePageHref(hrefForPage, current - 1) : null;
  const nextHref = current < total ? safePageHref(hrefForPage, current + 1) : null;
  const pageLinks = paginationWindow(current, total).map(item=>({item,href:safePageHref(hrefForPage, item)}));
  const buttonClass = "inline-flex min-h-9 min-w-9 items-center justify-center rounded-[8px] border border-[var(--lms-canvas-border)] bg-white px-3 text-[13px] font-semibold leading-5 text-[var(--lms-body-text)] transition-colors duration-[var(--lms-motion-fast)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] motion-reduce:transition-none";
  return (
    <nav data-slot="pagination" aria-label={label} className={cx("flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)]", className)}>
      {!previousHref ?
        <span aria-disabled="true" className={cx(buttonClass, "cursor-not-allowed opacity-50")}>Previous</span> :
        <Link className={buttonClass} href={previousHref} aria-label="Previous page">Previous</Link>}
      <span className="sr-only" aria-label="Current page">Page {current} of {total}</span>
      {pageLinks.map(({item,href}) => isSafeInternalHref(href) ?
        <Link key={item} href={href}
          aria-label={`Page ${item} of ${total}`}
          aria-current={item === current ? "page" : undefined}
          className={cx(buttonClass, item === current ? "border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] text-[var(--lms-primary-text)]" : "hidden md:inline-flex hover:bg-[var(--lms-primary-subtle)]")}>
          {item}
        </Link> :
        <span key={item} aria-disabled="true" aria-label={`Page ${item} unavailable`}
          className={cx(buttonClass, "hidden opacity-50 md:inline-flex")}>{item}</span>
      )}
      {!nextHref ?
        <span aria-disabled="true" className={cx(buttonClass, "cursor-not-allowed opacity-50")}>Next</span> :
        <Link className={buttonClass} href={nextHref} aria-label="Next page">Next</Link>}
    </nav>
  );
}
