import Link from "next/link";
import { cx } from "@/lib/class-names";
import { isSafeInternalHref } from "@/lib/safe-internal-href";

export type BreadcrumbItem = { label: string; href?: string };
export type BreadcrumbsProps = { items: readonly BreadcrumbItem[]; className?: string };

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" data-slot="breadcrumbs" className={cx("min-w-0", className)}>
      <ol className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-5 text-body">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-2">
            {index > 0 ? <span aria-hidden="true" className="text-[#a9a7ae]">/</span> : null}
            {index === items.length - 1 || !item.href || !isSafeInternalHref(item.href) ?
              <span aria-current={index === items.length - 1 ? "page" : undefined} className="max-w-[16rem] break-words font-semibold text-[#172033]">{item.label}</span> :
              <Link href={item.href} className="inline-flex min-h-11 items-center rounded-[6px] text-[#0e7c87] underline-offset-4 hover:text-[#1a95a1] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#26bac7]">{item.label}</Link>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
