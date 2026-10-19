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
    <Tag data-slot="card" className={cx("min-w-0 rounded-[var(--lms-radius-card)] border border-[var(--lms-canvas-border)] bg-white p-[var(--lms-space-4)] shadow-none sm:p-[var(--lms-canvas-padding)]", className)} {...props}>
      {title ? <h2 className="m-0 text-[var(--lms-font-lg)] font-semibold leading-7 text-[var(--lms-heading)]">{title}</h2> : null}
      {description ? <p className="mt-1 text-[13px] leading-5 text-[var(--lms-body-text)]">{description}</p> : null}
      <div className={cx("min-w-0", title || description ? "mt-[var(--lms-space-4)]" : "")}>{children}</div>
      {footer ? <div className="mt-[var(--lms-space-5)] flex flex-wrap items-center justify-end gap-[var(--lms-space-2)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)]">{footer}</div> : null}
    </Tag>
  );
}
