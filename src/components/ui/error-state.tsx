import type { ReactNode } from "react";
import Link from "next/link";
import { isSafeInternalHref } from "@/lib/safe-internal-href";

export type ErrorStateProps = { title?: string; description: string; action?: ReactNode; retryHref?: string; retryLabel?: string };

export function ErrorState({ title = "Something went wrong", description, action, retryHref, retryLabel = "Try again" }: ErrorStateProps) {
  const safeRetry = retryHref && isSafeInternalHref(retryHref) ? retryHref : null;
  return <section data-slot="error-state" role="alert" className="min-w-0 border-b border-border bg-transparent px-[var(--lms-space-1)] py-[var(--lms-space-5)] text-left shadow-none">
    <h2 className="m-0 text-balance break-words [overflow-wrap:anywhere] text-[var(--lms-font-lg)] font-semibold leading-[1.4] tracking-[-0.012em] text-[var(--lms-heading)]">{title}</h2>
    <p className="mt-[var(--lms-space-2)] max-w-2xl text-pretty break-words [overflow-wrap:anywhere] text-[var(--lms-font-base)] font-normal leading-[1.6] text-[var(--lms-body-text)]">{description}</p>
    {action || safeRetry ? <div className="mt-[var(--lms-space-4)] flex min-w-0 max-w-full flex-wrap items-center gap-[var(--lms-space-2)] max-[767px]:[&_a]:inline-flex max-[767px]:[&_a]:min-h-11 max-[767px]:[&_a]:min-w-11 max-[767px]:[&_a]:items-center">{safeRetry ? <Link href={safeRetry} className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-primary)] px-4 text-sm font-semibold text-[var(--lms-primary-text)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)]">{retryLabel}</Link> : null}{action}</div> : null}
  </section>;
}
