import Link from "next/link";
import { cx } from "@/lib/class-names";

export type StatTileProps = {
  label: string;
  value: string | number;
  detail?: string;
  href?: string;
  className?: string;
};

export function StatTile({ label, value, detail, href, className }: StatTileProps) {
  const content = (
    <>
      <p className="m-0 text-sm font-medium leading-6 text-body">{label}</p>
      <p className="mt-2 break-words text-2xl font-semibold leading-8 tabular-nums text-foreground lg:text-3xl lg:leading-9">{value}</p>
      {detail ? <p className="mt-2 text-sm leading-6 text-body">{detail}</p> : null}
    </>
  );
  const classes = cx("block min-w-0 rounded-xl border border-border bg-surface p-4 sm:p-6", href ? "min-h-11 hover:border-[var(--lms-teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]" : "", className);
  return href ? <Link href={href} className={classes} data-slot="stat-tile">{content}</Link> :
    <section className={classes} data-slot="stat-tile">{content}</section>;
}
