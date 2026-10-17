"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MembershipChoice } from "@/modules/identity/context-service";
import { Select } from "@/components/ui/select";
import {apiFetch} from "@/lib/api-fetch";
import {InlineNotice} from "@/components/ui/inline-notice";

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
    // PUB-auth-public-23: the placeholder is not a destructive leave-workspace action.
    if (!membershipId || membershipId === activeMembershipId) return;
    setError(null);

    startTransition(async () => {
      try{
        await apiFetch("/api/auth/memberships",{
          method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({membershipId}),
        });
        router.refresh();
      }catch{
        setError("Could not switch college. Refresh and try again.");
      }

    });
  }

  if (activeChoices.length === 0) {
    return (
      <p className="m-0 text-xs font-medium text-muted-foreground">
        No active college membership
      </p>
    );
  }

  // PUB-auth-public-22: no interactive chooser is needed for a single college.
  if (activeChoices.length === 1 && activeMembershipId === activeChoices[0].id) {
    return <p className="max-w-60 truncate text-sm font-semibold text-body">{activeChoices[0].collegeName}</p>;
  }

  return (
    <div className="w-44 min-w-0 sm:w-60">
      <label className="sr-only" htmlFor="membership-switcher">
        Switch workspace
      </label>
      <Select
        id="membership-switcher"
        value={activeMembershipId ?? ""}
        disabled={pending}
        onChange={(event) => switchMembership(event.target.value)}
        className="min-h-10 py-0"
      >
        <option value="" disabled>Switch workspace</option>
        {activeChoices.map((membership) => (
          <option key={membership.id} value={membership.id}>
            {membership.collegeName} · {membership.roles.join(", ")}
          </option>
        ))}
      </Select>
      {error?<InlineNotice tone="error" message={error} onDismiss={()=>setError(null)}/>:null}
    </div>
  );
}
