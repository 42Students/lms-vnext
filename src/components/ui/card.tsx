import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/class-names";

export type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "article";
  title?: string;
  description?: string;
  footer?: ReactNode;
};

export function Card({ as: Tag = "section", title, description, footer, children, className, ...props }: CardProps) {
  return (
    <Tag {...props} data-slot="card" className={cx("min-w-0 rounded-[var(--lms-radius-card)] border border-[var(--lms-canvas-border)] bg-[var(--lms-surface)] p-[var(--lms-space-4)] text-[var(--lms-body-text)] shadow-none sm:p-[var(--lms-space-5)]", className)}>
      {title ? <h2 className="m-0 min-w-0 break-words [overflow-wrap:anywhere] text-[var(--lms-font-lg)] font-semibold leading-7 text-[var(--lms-heading)]">{title}</h2> : null}
      {description ? <p className="mt-[var(--lms-space-1)] min-w-0 break-words [overflow-wrap:anywhere] text-[var(--lms-font-sm)] leading-5 text-[var(--lms-body-text)]">{description}</p> : null}
      <div className={cx("min-w-0 max-w-full", title || description ? "mt-[var(--lms-space-4)]" : "")}>{children}</div>
      {footer ? <div className="mt-[var(--lms-space-5)] flex min-w-0 max-w-full flex-wrap items-center justify-end gap-[var(--lms-space-2)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)]">{footer}</div> : null}
    </Tag>
  );
}
