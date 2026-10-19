import Link from "next/link";
import { cx } from "@/lib/class-names";
import { isSafeInternalHref } from "@/lib/safe-internal-href";

export type StatTileProps = {
  label: string;
  value: string | number;
  detail?: string;
  href?: string;
  className?: string;
};

const numberFormat = new Intl.NumberFormat("en-IN");

export function StatTile({ label, value, detail, href, className }: StatTileProps) {
  const safeHref = href && isSafeInternalHref(href) ? href : null;
  const displayValue = typeof value === "number"
    ? Number.isFinite(value) ? numberFormat.format(value) : "—"
    : value;
  const content = (
    <>
      <p className="m-0 text-[13px] font-medium leading-5 text-[var(--lms-body-text)]">{label}</p>
      <p className="mt-2 break-words text-2xl font-semibold leading-8 tabular-nums text-[var(--lms-heading)] lg:text-3xl lg:leading-9">{displayValue}</p>
      {detail ? <p className="mt-2 text-[13px] leading-5 text-[var(--lms-body-text)]">{detail}</p> : null}
    </>
  );
  const classes = cx("block min-w-0 rounded-[var(--lms-radius-card)] border border-[var(--lms-canvas-border)] bg-surface p-[var(--lms-space-4)] shadow-none sm:p-[var(--lms-canvas-padding)]", safeHref ? "min-h-11 transition-colors duration-[var(--lms-motion-fast)] hover:border-[var(--lms-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] motion-reduce:transition-none" : "", className);
  return safeHref ? <Link href={safeHref} className={classes} data-slot="stat-tile">{content}</Link> :
    <section className={classes} data-slot="stat-tile">{content}</section>;
}
