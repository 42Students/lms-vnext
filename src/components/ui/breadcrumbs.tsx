import Link from "next/link";
import { cx } from "@/lib/class-names";
import { isSafeInternalHref } from "@/lib/safe-internal-href";

export type BreadcrumbItem = { label: string; href?: string };
export type BreadcrumbsProps = { items: readonly BreadcrumbItem[]; className?: string };

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" data-slot="breadcrumbs" className={cx("min-w-0", className)}>
      <ol className="flex min-w-0 flex-wrap items-center gap-x-[var(--lms-space-2)] gap-y-1 text-[var(--lms-font-sm)] leading-5 text-[var(--lms-body-text)]">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-[var(--lms-space-2)]">
            {index > 0 ? <span aria-hidden="true" className="text-[var(--lms-neutral-400)]">/</span> : null}
            {index === items.length - 1 || !item.href || !isSafeInternalHref(item.href) ?
              <span aria-current={index === items.length - 1 ? "page" : undefined} className="max-w-[16rem] break-words font-semibold text-[var(--lms-heading)]">{item.label}</span> :
              <Link href={item.href} className="inline-flex min-h-11 sm:min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-radius-control)] text-[var(--lms-link-text)] underline-offset-4 hover:text-[var(--lms-primary-text)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">{item.label}</Link>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
