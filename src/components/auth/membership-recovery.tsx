"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export function MembershipRecovery({
  reason,
}: {
  reason: "MEMBERSHIP_NOT_FOUND" | "MEMBERSHIP_NOT_ACTIVE";
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function recover() {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/memberships", { method: "DELETE" });
        if (!response.ok) {
          setError("Could not clear the previous college selection. Sign out and sign in again.");
          return;
        }
        router.push("/dashboard");
        router.refresh();
      } catch {
        setError("Could not clear the previous college selection. Sign out and sign in again.");
      }
    });
  }

  return (
    <main className="min-h-dvh min-w-0 bg-[#f1f4f9] px-3 py-4 sm:px-4 md:p-6">
      <section className="mx-auto w-full min-w-0 max-w-3xl rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-white p-4 md:p-[var(--lms-canvas-padding)]">
        <PageHeader title="Choose another active college" description="College access changed" />
        <p className="mt-4 max-w-prose text-[14px] leading-6 text-[var(--lms-body-text)]">
          {reason === "MEMBERSHIP_NOT_ACTIVE"
            ? "Your previously selected college membership is no longer active."
            : "Your previously selected college membership is no longer available."}{" "}
          Your canonical account remains signed in.
        </p>
        <div className="mt-6 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" loading={pending} disabled={pending} onClick={recover}>
            {pending ? "Clearing selection…" : "Continue to college selection"}
          </Button>
        </div>
        {error ? (
          <p role="alert" className="mt-4 max-w-prose break-words rounded-[var(--lms-control-radius)] border border-[var(--lms-error)]/30 bg-[var(--lms-surface)] px-3 py-2 text-[13px] leading-5 text-[var(--lms-error)]">
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
}
