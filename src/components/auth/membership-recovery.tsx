"use client";

import { PageHeader } from "@/components/ui/page-header";
import {
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
      const response = await fetch(
        "/api/auth/memberships",
        { method: "DELETE" },
      );

      if (!response.ok) {
        setError(
          "Could not clear the previous college selection. Sign out and sign in again.",
        );
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh min-w-0 max-w-3xl items-start bg-background px-4 py-6 sm:px-6 sm:py-8">
      <section className="w-full min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 sm:p-[var(--lms-canvas-padding)]">
        <p className="m-0 text-sm font-semibold text-primary-text">
          College access changed
        </p>
        <PageHeader title="Choose another active college" />
        <p className="mt-4 text-base leading-7 text-body">
          {reason === "MEMBERSHIP_NOT_ACTIVE"
            ? "Your previously selected college membership is no longer active."
            : "Your previously selected college membership is no longer available."}{" "}
          Your canonical account remains signed in.
        </p>
        <div className="mt-6">
          <Button type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={pending} onClick={recover}>
            {pending
              ? "Clearing selection…"
              : "Continue to college selection"}
          </Button>
        </div>
        {error ? (
          <p
            role="alert"
            className="mt-4 text-sm font-semibold text-error"
          >
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
}
