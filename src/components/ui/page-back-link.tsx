import Link from "next/link";
import { cx } from "@/lib/class-names";
import { isSafeInternalHref } from "@/lib/safe-internal-href";

export type PageBackLinkProps = {
  href: string;
  label: string;
  className?: string;
};

/**
 * Legacy page back affordance (learn-layout.scss:361-383): 44px touch target, muted text / #26bac7 hover,
 * and an icon-only presentation below 768px. The label remains accessible.
 */
export function PageBackLink({ href, label, className }: PageBackLinkProps) {
  return (
    <Link
      href={isSafeInternalHref(href) ? href : "/dashboard"}
      aria-label={label}
      data-slot="page-back-link"
      className={cx(
        "inline-flex min-h-11 min-w-11 shrink-0 self-start items-center justify-center gap-2 rounded-[var(--lms-control-radius)] px-2 text-sm font-semibold text-[var(--lms-muted-text)] transition-colors duration-150 hover:text-[var(--lms-primary)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]",
        className,
      )}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}
