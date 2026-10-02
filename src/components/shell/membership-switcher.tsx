"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MembershipChoice } from "@/modules/identity/context-service";
import { Select } from "@/components/ui/select";

export function MembershipSwitcher({
  memberships,
  activeMembershipId,
}: {
  memberships: readonly MembershipChoice[];
  activeMembershipId: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const activeChoices = memberships.filter(
    (membership) => membership.status === "ACTIVE",
  );

  function switchMembership(membershipId: string) {
    setError(null);

    startTransition(async () => {
      const response = membershipId
        ? await fetch("/api/auth/memberships", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ membershipId }),
          })
        : await fetch("/api/auth/memberships", {
            method: "DELETE",
          });

      if (!response.ok) {
        setError("Could not switch college. Refresh and try again.");
        return;
      }

      router.refresh();
    });
  }

  if (activeChoices.length === 0) {
    return (
      <p className="m-0 text-xs font-medium text-muted-foreground">
        No active college membership
      </p>
    );
  }

  return (
    <div className="w-44 min-w-0 sm:w-60">
      <label className="sr-only" htmlFor="membership-switcher">
        Active college membership
      </label>
      <Select
        id="membership-switcher"
        value={activeMembershipId ?? ""}
        disabled={pending}
        onChange={(event) => switchMembership(event.target.value)}
        className="min-h-10 py-0"
      >
        <option value="">Select college</option>
        {activeChoices.map((membership) => (
          <option key={membership.id} value={membership.id}>
            {membership.collegeName} · {membership.roles.join(", ")}
          </option>
        ))}
      </Select>
      {error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
