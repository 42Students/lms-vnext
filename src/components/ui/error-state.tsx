import type { ReactNode } from "react";

export function ErrorState({
  title = "Something went wrong",
  description,
  action,
}: {
  title?: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section
      role="alert"
      className="rounded-xl border border-[var(--lms-error)] bg-[var(--lms-error-subtle)] p-6"
    >
      <h2 className="m-0 text-lg font-semibold text-foreground">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-body">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}
