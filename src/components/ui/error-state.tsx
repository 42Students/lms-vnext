import type { ReactNode } from "react";
import Link from "next/link";
import { isSafeInternalHref } from "@/lib/safe-internal-href";

export type ErrorStateProps = { title?: string; description: string; action?: ReactNode; retryHref?: string; retryLabel?: string; role?: "alert" | "status" };

export function ErrorState({ title = "Something went wrong", description, action, retryHref, retryLabel = "Try again", role }: ErrorStateProps) {
  const safeRetry = retryHref && isSafeInternalHref(retryHref) ? retryHref : null;
  const announcedRole = role ?? "alert";
  return <section data-slot="error-state" role={announcedRole}
    aria-live={announcedRole === "alert" ? "assertive" : "polite"} className="min-w-0 border-b border-border bg-transparent px-[var(--lms-space-1)] py-[var(--lms-space-5)] text-left shadow-none">
    <h2 className="m-0 text-balance break-words [overflow-wrap:anywhere] text-[length:var(--lms-font-lg)] font-semibold leading-[1.4] tracking-[-.02em] text-[var(--lms-heading)]">{title}</h2>
    <p className="mt-[var(--lms-space-2)] max-w-2xl text-pretty break-words [overflow-wrap:anywhere] text-[length:var(--lms-font-base)] font-normal leading-[1.6] text-[var(--lms-body-text)]">{description}</p>
    {action || safeRetry ? <div className="mt-[var(--lms-space-4)] flex min-w-0 max-w-full flex-wrap items-center gap-[var(--lms-space-2)] max-md:[&_a]:inline-flex max-md:[&_a]:min-h-11 max-md:[&_a]:min-w-11 max-md:[&_a]:items-center">{safeRetry ? <Link href={safeRetry} className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-primary)] px-4 text-sm font-semibold text-[var(--lms-primary-text)] hover:bg-[var(--lms-primary-subtle)] focus-ring">{retryLabel}</Link> : null}{action}</div> : null}
  </section>;
}
