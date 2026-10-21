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
  /** Preserve scroll position for client-side filter/pager transitions. */
  scroll?: boolean;
  /** Legacy per-resource sizes; omit for fixed 50-row curation lists. */
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  hrefForPageSize?: (size: number) => string;
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

/** Remote legacy tables often index page 0; the shared component is 1-based. */
export function remotePageToPaginationPage(pageZeroBased: number): number {
  return Number.isSafeInteger(pageZeroBased) && pageZeroBased >= 0 ? pageZeroBased + 1 : 1;
}
export function paginationPageToRemotePage(pageOneBased: number): number {
  return Number.isSafeInteger(pageOneBased) && pageOneBased > 0 ? pageOneBased - 1 : 0;
}

export function Pagination({ page, pageCount, hrefForPage, label = "Pages", className, showBoundaryLinks = true, scroll = true, pageSize, pageSizeOptions, hrefForPageSize }: PaginationProps) {
  const total = normalizedPageCount(pageCount);
  const current = Number.isFinite(page) ? Math.max(1, Math.min(total, Math.trunc(page))) : 1;
  const previousHref = current > 1 ? safePageHref(hrefForPage, current - 1) : null;
  const nextHref = current < total ? safePageHref(hrefForPage, current + 1) : null;
  const pageLinks = paginationWindow(current, total).map(item=>({item,href:safePageHref(hrefForPage, item)}));
  const firstShown = pageLinks[0]?.item ?? 1;
  const lastShown = pageLinks[pageLinks.length - 1]?.item ?? total;
  const firstHref = showBoundaryLinks && firstShown > 1 ? safePageHref(hrefForPage, 1) : null;
  const lastHref = showBoundaryLinks && lastShown < total ? safePageHref(hrefForPage, total) : null;
  const choices = [...new Set((pageSizeOptions ?? []).filter(value => Number.isSafeInteger(value) && value > 0))];
  const sizeLinks = choices.map(size=>({size,href: hrefForPageSize ? safePageHref(hrefForPageSize,size) : null}));
  const buttonClass = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-[8px] md:min-h-9 md:min-w-9 md:rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-[var(--lms-space-3)] text-[14px] font-semibold leading-[42px] md:leading-5 text-[var(--lms-body-text)] transition-colors duration-[var(--lms-motion-fast)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] motion-reduce:transition-none";
  return (
    <nav data-slot="pagination" aria-label={label} className={cx("flex min-w-0 flex-wrap items-center justify-center gap-1 md:justify-start md:gap-[var(--lms-space-2)]", className)}>
      {!previousHref ?
        <span aria-disabled="true" className={cx(buttonClass, "pointer-events-none cursor-not-allowed border-[var(--lms-neutral-200)] bg-[var(--lms-neutral-50)] text-[var(--lms-neutral-400)] opacity-100")}>Previous</span> :
        <Link className={buttonClass} href={previousHref} scroll={scroll} aria-label="Previous page">Previous</Link>}
      <span role="status" className="px-1 text-[12px] font-medium text-[var(--lms-neutral-500)] sr-only">Page {current} of {total}</span>
      {showBoundaryLinks && firstShown > 1 ? <>
        {firstHref ? <Link href={firstHref} scroll={scroll} className={cx(buttonClass, "hidden md:inline-flex")} aria-label={`Page 1 of ${total}`}>1</Link> :
          <span aria-disabled="true" aria-label="First page unavailable" className={cx(buttonClass, "pointer-events-none hidden cursor-not-allowed border-[var(--lms-neutral-200)] bg-[var(--lms-neutral-50)] text-[var(--lms-neutral-400)] opacity-100 md:inline-flex")}>1</span>}
        {firstShown > 2 ? <span aria-hidden="true" className="hidden px-1 text-[var(--lms-neutral-500)] md:inline-flex">…</span> : null}
      </> : null}
      {pageLinks.map(({item,href}) => item === current ?
        <span key={item} aria-current="page" aria-label={`Current page ${item} of ${total}`}
          className={cx(buttonClass, "cursor-default border-[var(--lms-primary)] bg-white text-[var(--lms-primary)] hover:border-[var(--lms-primary)] hover:bg-white")}>{item}</span> :
        href ? <Link key={item} href={href} scroll={scroll}
          aria-label={`Page ${item} of ${total}`}
          className={cx(buttonClass, "hidden md:inline-flex hover:bg-[var(--lms-primary-subtle)]")}>
          {item}
        </Link> :
        <span key={item} aria-disabled="true" aria-label={`Page ${item} unavailable`}
          className={cx(buttonClass, "pointer-events-none hidden cursor-not-allowed border-[var(--lms-neutral-200)] bg-[var(--lms-neutral-50)] text-[var(--lms-neutral-400)] opacity-100 md:inline-flex")}>{item}</span>
      )}
      {showBoundaryLinks && lastShown < total ? <>
        {lastShown < total - 1 ? <span aria-hidden="true" className="hidden px-1 text-[var(--lms-neutral-500)] md:inline-flex">…</span> : null}
        {lastHref ? <Link href={lastHref} scroll={scroll} className={cx(buttonClass, "hidden md:inline-flex")} aria-label={`Page ${total} of ${total}`}>{total}</Link> :
          <span aria-disabled="true" aria-label="Last page unavailable" className={cx(buttonClass, "pointer-events-none hidden cursor-not-allowed border-[var(--lms-neutral-200)] bg-[var(--lms-neutral-50)] text-[var(--lms-neutral-400)] opacity-100 md:inline-flex")}>{total}</span>}
      </> : null}
      {pageSize && sizeLinks.length ? <div role="group" aria-label="Rows per page" className="flex flex-wrap items-center gap-1 text-xs text-[var(--lms-body-text)]">
        <span>Rows per page</span>
        {sizeLinks.map(({size,href}) => href && size!==pageSize ? <Link key={size} href={href} scroll={scroll} className={cx(buttonClass,"min-w-9 px-2")} aria-label={`${size} rows per page`}>{size}</Link> : <span key={size} aria-current={size===pageSize?"true":undefined} aria-disabled={!href && size!==pageSize} className={cx(buttonClass,"min-w-9 px-2",size===pageSize && "border-[var(--lms-primary)] text-[var(--lms-primary)]")}>{size}</span>)}
      </div> : null}
      {!nextHref ?
        <span aria-disabled="true" className={cx(buttonClass, "pointer-events-none cursor-not-allowed border-[var(--lms-neutral-200)] bg-[var(--lms-neutral-50)] text-[var(--lms-neutral-400)] opacity-100")}>Next</span> :
        <Link className={buttonClass} href={nextHref} scroll={scroll} aria-label="Next page">Next</Link>}
    </nav>
  );
}
