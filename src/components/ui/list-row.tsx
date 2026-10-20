import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/class-names";

/** Legacy grouped-list row: hairline separators instead of a card per item.
 * Page owners supply actions, avoiding changes to permission or route behavior.
 */
export type ListRowProps = Omit<HTMLAttributes<HTMLLIElement>, "title"> & {
  title: ReactNode;
  detail?: ReactNode;
  icon?: ReactNode;
  pill?: ReactNode;
  action?: ReactNode;
};
export function ListRow({ title, detail, icon, pill, action, className, ...props }: ListRowProps) {
  return <li {...props} data-slot="list-row"
    className={cx("flex min-w-0 flex-wrap items-center justify-between gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-3)] last:border-b-0", className)}>
    <div className="flex min-w-0 flex-1 items-center gap-[var(--lms-space-3)]">
      {icon ? <span aria-hidden="true" className="mr-[5px] flex size-[34px] shrink-0 items-center justify-center rounded-[6px] bg-[var(--lms-neutral-100)]">{icon}</span> : null}
      <div className="min-w-0">
        <div className="text-[14px] font-semibold leading-5 text-[var(--lms-heading)]">{title}</div>
        {detail ? <div className="mt-1 break-words text-[12px] leading-[18px] text-[var(--lms-neutral-500)]">{detail}</div> : null}
      </div>
    </div>
    {pill ? <span className="shrink-0">{pill}</span> : null}
    {action ? <div className="shrink-0">{action}</div> : null}
  </li>;
}
