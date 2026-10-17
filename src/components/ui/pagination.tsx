import Link from "next/link";
import { cx } from "@/lib/class-names";

export type PaginationProps = {
  page: number;
  pageCount: number;
  hrefForPage: (page: number) => string;
  label?: string;
  className?: string;
};

export function paginationWindow(page: number, pageCount: number): number[] {
  const total = Number.isFinite(pageCount) ? Math.max(1, Math.trunc(pageCount)) : 1;
  const selected = Number.isFinite(page) ? Math.min(total, Math.max(1, Math.trunc(page))) : 1;
  const start = Math.max(1, Math.min(selected - 1, total - 4));
  return Array.from({ length: Math.min(total, 5) }, (_, i) => start + i);
}

export function Pagination({ page, pageCount, hrefForPage, label = "Pages", className }: PaginationProps) {
  const total = Math.max(1, Math.trunc(pageCount) || 1);
  const current = Math.max(1, Math.min(total, Math.trunc(page) || 1));
  const buttonClass = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]";
  return (
    <nav data-slot="pagination" aria-label={label} className={cx("flex min-w-0 flex-wrap items-center gap-2", className)}>
      {current === 1 ? <span aria-disabled="true" className={cx(buttonClass, "opacity-50")}>Previous</span> :
        <Link className={buttonClass} href={hrefForPage(current - 1)}>Previous</Link>}
      <span className="sr-only" role="status" aria-live="polite">Page {current} of {total}</span>
      {paginationWindow(current, total).map(item => (
        <Link key={item} href={hrefForPage(item)}
          aria-label={`Page ${item} of ${total}`}
          aria-current={item === current ? "page" : undefined}
          className={cx(buttonClass, item === current ? "border-[var(--lms-teal-deep)] bg-primary-subtle" : "hover:bg-primary-subtle")}>
          {item}
        </Link>
      ))}
      {current === total ? <span aria-disabled="true" className={cx(buttonClass, "opacity-50")}>Next</span> :
        <Link className={buttonClass} href={hrefForPage(current + 1)}>Next</Link>}
    </nav>
  );
}
