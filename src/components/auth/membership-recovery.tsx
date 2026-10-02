"use client";

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
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <section className="w-full rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <p className="m-0 text-sm font-semibold text-primary-text">
          College access changed
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          Choose another active college
        </h1>
        <p className="mt-4 text-base leading-7 text-body">
          {reason === "MEMBERSHIP_NOT_ACTIVE"
            ? "Your previously selected college membership is no longer active."
            : "Your previously selected college membership is no longer available."}{" "}
          Your canonical account remains signed in.
        </p>
        <div className="mt-6">
          <Button disabled={pending} onClick={recover}>
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
