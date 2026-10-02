"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AccountActions() {
  const router = useRouter();
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
    <div className="text-right">
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={signOut}
      >
        {pending ? "Signing out…" : "Sign out"}
      </Button>
      {error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
