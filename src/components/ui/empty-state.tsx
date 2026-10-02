import type { ReactNode } from "react";

export type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <section className="rounded-xl border border-border bg-surface px-6 py-10 text-center">
      <div
        aria-hidden="true"
        className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary-subtle text-lg font-bold text-primary-text"
      >
        42
      </div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        {description}
      </p>
      {action ? (
        <div className="mt-5 flex justify-center">{action}</div>
      ) : null}
    </section>
  );
}
