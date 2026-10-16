"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { accountActionCopy, type AccountMenuVariant } from "./college-account-copy";

export function AccountActions({
  showNotifications = true,
  variant = "other",
}: {
  showNotifications?: boolean;
  variant?: AccountMenuVariant;
}) {
  const router = useRouter();
  const copy = accountActionCopy(variant);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function signOut() {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/auth/session", {
        method: "DELETE",
      });

      if (!response.ok) {
        setError("Sign out failed");
        return;
      }

      router.push("/");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1 text-right">
      {showNotifications ? (
        <Link
          href="/notifications"
          className="inline-flex min-h-9 items-center justify-center rounded-md px-2 text-sm sm:px-3 font-semibold text-foreground transition hover:bg-muted"
        >
          Notifications
        </Link>
      ) : null}
      {copy.accountHref ? (
        <Link
          href={copy.accountHref}
          className="inline-flex min-h-9 items-center justify-center rounded-md px-2 text-sm sm:px-3 font-semibold text-foreground transition hover:bg-muted"
        >
          {copy.accountLabel}
        </Link>
      ) : null}
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={signOut}
      >
        {copy.signOutLabel}
      </Button>
      {error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
