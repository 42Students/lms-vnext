import Link from "next/link";
import { cx } from "@/lib/class-names";
import { isSafeInternalHref } from "@/lib/safe-internal-href";

export type PaginationProps = {
  page: number;
  pageCount: number;
  hrefForPage: (page: number) => string;
  label?: string;
  className?: string;
  /** Show first/last shortcuts for long page ranges. */
  showBoundaryLinks?: boolean;
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
    return typeof href === "string" && isSafeInternalHref(href) ? href : null;
  } catch {
    return null;
  }
}

export function Pagination({ page, pageCount, hrefForPage, label = "Pages", className, showBoundaryLinks = true }: PaginationProps) {
  const total = normalizedPageCount(pageCount);
  const current = Number.isFinite(page) ? Math.max(1, Math.min(total, Math.trunc(page))) : 1;
  const previousHref = current > 1 ? safePageHref(hrefForPage, current - 1) : null;
  const nextHref = current < total ? safePageHref(hrefForPage, current + 1) : null;
  const pageLinks = paginationWindow(current, total).map(item=>({item,href:safePageHref(hrefForPage, item)}));
  const firstShown = pageLinks[0]?.item ?? 1;
  const lastShown = pageLinks[pageLinks.length - 1]?.item ?? total;
  const firstHref = showBoundaryLinks && firstShown > 1 ? safePageHref(hrefForPage, 1) : null;
  const lastHref = showBoundaryLinks && lastShown < total ? safePageHref(hrefForPage, total) : null;
  const buttonClass = "inline-flex min-h-9 min-w-9 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-[var(--lms-space-3)] text-[14px] font-semibold leading-5 text-[var(--lms-body-text)] transition-colors duration-[var(--lms-motion-fast)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] motion-reduce:transition-none";
  return (
    <nav data-slot="pagination" aria-label={label} className={cx("flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)]", className)}>
      {!previousHref ?
        <span aria-disabled="true" className={cx(buttonClass, "cursor-not-allowed opacity-50")}>Previous</span> :
        <Link className={buttonClass} href={previousHref} aria-label="Previous page">Previous</Link>}
      <span role="status" className="px-1 text-[12px] font-medium text-[var(--lms-neutral-500)] md:sr-only">Page {current} of {total}</span>
      {showBoundaryLinks && firstShown > 1 ? <>
        {firstHref ? <Link href={firstHref} className={cx(buttonClass, "hidden md:inline-flex")} aria-label={`Page 1 of ${total}`}>1</Link> :
          <span aria-disabled="true" aria-label="First page unavailable" className={cx(buttonClass, "hidden opacity-50 md:inline-flex")}>1</span>}
        {firstShown > 2 ? <span aria-hidden="true" className="hidden px-1 text-[var(--lms-neutral-500)] md:inline-flex">…</span> : null}
      </> : null}
      {pageLinks.map(({item,href}) => item === current ?
        <span key={item} aria-current="page" aria-label={`Current page ${item} of ${total}`}
          className={cx(buttonClass, "border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] text-[var(--lms-primary-text)]")}>{item}</span> :
        href ? <Link key={item} href={href}
          aria-label={`Page ${item} of ${total}`}
          className={cx(buttonClass, "hidden md:inline-flex hover:bg-[var(--lms-primary-subtle)]")}>
          {item}
        </Link> :
        <span key={item} aria-disabled="true" aria-label={`Page ${item} unavailable`}
          className={cx(buttonClass, "hidden opacity-50 md:inline-flex")}>{item}</span>
      )}
      {showBoundaryLinks && lastShown < total ? <>
        {lastShown < total - 1 ? <span aria-hidden="true" className="hidden px-1 text-[var(--lms-neutral-500)] md:inline-flex">…</span> : null}
        {lastHref ? <Link href={lastHref} className={cx(buttonClass, "hidden md:inline-flex")} aria-label={`Page ${total} of ${total}`}>{total}</Link> :
          <span aria-disabled="true" aria-label="Last page unavailable" className={cx(buttonClass, "hidden opacity-50 md:inline-flex")}>{total}</span>}
      </> : null}
      {!nextHref ?
        <span aria-disabled="true" className={cx(buttonClass, "cursor-not-allowed opacity-50")}>Next</span> :
        <Link className={buttonClass} href={nextHref} aria-label="Next page">Next</Link>}
    </nav>
  );
}
