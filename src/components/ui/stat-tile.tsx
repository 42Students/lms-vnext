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
      <p className="m-0 text-[13px] font-medium leading-5 text-body">{label}</p>
      <p className="mt-2 break-words text-2xl font-semibold leading-8 tabular-nums text-[#172033] lg:text-3xl lg:leading-9">{displayValue}</p>
      {detail ? <p className="mt-2 text-sm leading-6 text-body">{detail}</p> : null}
    </>
  );
  const classes = cx("block min-w-0 rounded-[12px] border border-[#e5e9f0] bg-surface p-4 shadow-none sm:p-6", safeHref ? "min-h-11 hover:border-[var(--lms-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]" : "", className);
  return safeHref ? <Link href={safeHref} className={classes} data-slot="stat-tile">{content}</Link> :
    <section className={classes} data-slot="stat-tile">{content}</section>;
}
