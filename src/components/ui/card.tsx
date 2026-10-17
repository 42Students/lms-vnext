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
    <Tag data-slot="card" className={cx("min-w-0 rounded-xl border border-border bg-surface p-4 shadow-none sm:p-6", className)} {...props}>
      {title ? <h2 className="m-0 text-lg font-semibold leading-7 text-foreground">{title}</h2> : null}
      {description ? <p className="mt-1 text-sm leading-6 text-body">{description}</p> : null}
      <div className={cx("min-w-0", title || description ? "mt-4" : "")}>{children}</div>
      {footer ? <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">{footer}</div> : null}
    </Tag>
  );
}
