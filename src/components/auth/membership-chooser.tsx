"use client";

import {
  useEffect,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import type { MembershipChoice } from "@/modules/identity/context-service";
import { Button } from "@/components/ui/button";

function roleLabel(roles: readonly string[]) {
  return roles
    .map((role) =>
      role
        .toLowerCase()
        .split("_")
        .map(
          (part) =>
            part.charAt(0).toUpperCase() + part.slice(1),
        )
        .join(" "),
    )
    .join(" · ");
}

export function MembershipChooser({
  memberships,
}: {
  memberships: readonly MembershipChoice[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [lastUsed,setLastUsed]=useState<string|null>(null);
  useEffect(()=>{
    let live=true;
    void Promise.resolve().then(()=>{
      if(!live)return;
      try{setLastUsed(window.sessionStorage.getItem("lms_last_membership_key"));}
      catch{/* Storage may be disabled. */}
    });
    return ()=>{live=false;};
  },[]);
  const active = memberships.filter(membership=>membership.status==="ACTIVE");
  const sorted=[...memberships].sort((left,right)=>{
    const status=Number(right.status==="ACTIVE")-Number(left.status==="ACTIVE");
    if(status)return status;
    return Number(right.id===lastUsed)-Number(left.id===lastUsed);
  });

  function choose(membershipId: string) {
    setError(null);
    setPendingId(membershipId);

    startTransition(async () => {
      try {
        const response = await fetch(
          "/api/auth/memberships",
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({ membershipId }),
          },
        );

        if (!response.ok) {
          setError(
            "That college membership is no longer available. Refresh and choose another.",
          );
          return;
        }

        try{window.sessionStorage.setItem("lms_last_membership_key",membershipId);}
        catch{/* The selection still succeeds in private browsing. */}
        router.push("/dashboard");
        router.refresh();
      } finally {
        setPendingId(null);
      }
    });
  }

  if (memberships.length===0) {
    return (
      <section className="rounded-xl border border-border bg-surface p-6">
        <p className="m-0 text-base font-semibold text-foreground">
          No active college memberships
        </p>
        <p className="mt-2 text-sm leading-6 text-body">
          Your identity is valid, but there is currently no
          active college membership to enter.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-error bg-[var(--lms-error-subtle)] px-4 py-3 text-sm font-semibold text-error"
        >
          {error}
        </p>
      ) : null}
      <h2 className="text-lg font-semibold">Choose where to sign in</h2>
      {active.length===0?<p role="status" className="text-sm text-body">
        No active college memberships. Suspended memberships cannot be selected.
      </p>:null}
      <div className="grid gap-3 lg:grid-cols-2">
        {sorted.map((membership) => (
          <section
            key={membership.id}
            className="flex flex-col justify-between gap-5 rounded-xl border border-border bg-surface p-5"
          >
            <div>
              <p className="m-0 text-base font-semibold text-foreground">
                {membership.collegeName}
              </p>
              {membership.status!=="ACTIVE"?<p role="status"
                className="mt-2 text-xs font-semibold text-warning-text">
                Suspended · This account is suspended. Your college administrator can turn it back on.
              </p>:membership.id===lastUsed?<p className="mt-2 text-xs font-semibold text-primary-text">
                Last used
              </p>:null}
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-primary-text">
                {membership.collegeCode}
              </p>
              <p className="mt-3 text-sm text-body">
                {membership.organizationName}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {roleLabel(membership.roles)}
              </p>
            </div>
            <Button
              disabled={pending||membership.status!=="ACTIVE"}
              onClick={() => choose(membership.id)}
            >
              {pendingId === membership.id
                ? "Opening…"
                : "Continue with this college"}
            </Button>
          </section>
        ))}
      </div>
    </div>
  );
}
