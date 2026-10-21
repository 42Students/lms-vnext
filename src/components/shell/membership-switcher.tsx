"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MembershipChoice } from "@/modules/identity/context-service";
import { Select } from "@/components/ui/select";
import {apiFetch} from "@/lib/api-fetch";
import {InlineNotice} from "@/components/ui/inline-notice";

function roleName(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** One entry per college and role: a person with several roles or colleges switches workspace, never mixes them. */
export function workspaceChoices(memberships: readonly MembershipChoice[]) {
  return memberships
    .filter((membership) => membership.status === "ACTIVE")
    .flatMap((membership) =>
      (membership.roles.length > 0 ? membership.roles : [null]).map((role) => ({
        value: `${membership.id}|${role ?? ""}`,
        membershipId: membership.id,
        role,
        label: role ? `${membership.collegeName} · ${roleName(role)}` : membership.collegeName,
      })),
    );
}

export function MembershipSwitcher({
  memberships,
  activeMembershipId,
  activeRole = null,
}: {
  memberships: readonly MembershipChoice[];
  activeMembershipId: string | null;
  activeRole?: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const choices = workspaceChoices(memberships);
  const activeValue = `${activeMembershipId ?? ""}|${activeRole ?? ""}`;
  const active = choices.find((choice) => choice.value === activeValue)
    ?? choices.find((choice) => choice.membershipId === activeMembershipId);

  function switchWorkspace(value: string) {
    // PUB-auth-public-23: the placeholder is not a destructive leave-workspace action.
    const choice = choices.find((item) => item.value === value);
    if (!choice || choice.value === active?.value) return;
    setError(null);

    startTransition(async () => {
      try{
        await apiFetch("/api/auth/memberships",{
          method:"POST",headers:{"content-type":"application/json"},
          body:JSON.stringify(choice.role?{membershipId:choice.membershipId,role:choice.role}:{membershipId:choice.membershipId}),
        });
        // Legacy remembered the selected college on this browser. Keep it a
        // navigation preference only, after server acceptance; never reuse
        // localStorage to grant a workspace or infer a role.
        const selectedCollege=memberships.find(member=>member.id===choice.membershipId)?.collegeId;
        if(selectedCollege){
          try{window.localStorage.setItem("lms:last-selected-college",selectedCollege);}
          catch{/* Storage may be unavailable; server switch already succeeded. */}
        }
        router.push("/dashboard");
        router.refresh();
      }catch{
        setError("Could not switch workspace. Refresh and try again.");
      }

    });
  }

  if (choices.length === 0) {
    return (
      <p className="m-0 text-xs font-medium text-muted-foreground">
        No active college membership
      </p>
    );
  }

  // PUB-auth-public-22: no interactive chooser is needed for a single workspace.
  if (choices.length === 1 && active) {
    return <p className="block min-w-0 max-w-60 truncate text-sm font-semibold text-body">{choices[0].label}</p>;
  }

  return (
    <div className="grid w-full min-w-0 max-w-60 gap-[var(--lms-space-2)]">
      <label className="sr-only" htmlFor="membership-switcher">
        Switch workspace
      </label>
      <Select
        id="membership-switcher"
        value={active?.value ?? ""}
        disabled={pending}
        aria-busy={pending}
        onChange={(event) => switchWorkspace(event.target.value)}
        className="w-full min-w-0"
      >
        <option value="" disabled>Switch workspace</option>
        {choices.map((choice) => (
          <option key={choice.value} value={choice.value}>
            {choice.label}
          </option>
        ))}
      </Select>
      {error?<div className="min-w-0 break-words"><InlineNotice tone="error" message={error} onDismiss={()=>setError(null)}/></div>:null}
    </div>
  );
}
