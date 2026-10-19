import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cx } from "@/lib/class-names";
import { isSafeInternalHref } from "@/lib/safe-internal-href";

export type PageBackLinkProps = {
  href: string;
  label: string;
  className?: string;
};

/**
 * Legacy page back affordance: 44px touch target, muted text / teal hover,
 * and an icon-only presentation below 768px. The label remains accessible.
 */
export function PageBackLink({ href, label, className }: PageBackLinkProps) {
  return (
    <Link
      href={isSafeInternalHref(href) ? href : "/dashboard"}
      aria-label={label}
      data-slot="page-back-link"
      className={cx(
        "inline-flex min-h-11 min-w-11 shrink-0 self-start items-center justify-center gap-2 rounded-[var(--lms-control-radius)] px-2 text-sm font-semibold text-[var(--lms-muted-text)] transition-colors duration-150 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]",
        className,
      )}
    >
      <ArrowLeft aria-hidden="true" className="size-4 shrink-0" />
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}
