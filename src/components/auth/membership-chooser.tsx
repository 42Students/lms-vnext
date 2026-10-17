"use client";

import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { MembershipChoice } from "@/modules/identity/context-service";
import { Button } from "@/components/ui/button";
import { apiFetch, FriendlyFetchError } from "@/lib/api-fetch";
import { useGuardedAction } from "@/hooks/use-guarded-action";
import { FRIENDLY_MESSAGES } from "@/lib/friendly-error";

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
  const { pending, run } = useGuardedAction({ busyLabel: "Opening…", timeoutMs: 30_000 });
  const [lastUsed,setLastUsed]=useState<string|null>(null);
  const [selectedId,setSelectedId]=useState<string|null>(null);
  useEffect(()=>{
    let live=true;
    void Promise.resolve().then(()=>{
      if(!live)return;
      let stored:string|null=null;
      try{stored=window.sessionStorage.getItem("lms_last_membership_key");}
      catch{/* Storage may be disabled. */}
      setLastUsed(stored);
      setSelectedId(memberships.some(m=>m.id===stored&&m.status==="ACTIVE")
        ?stored:memberships.find(m=>m.status==="ACTIVE")?.id??null);
    });
    return ()=>{live=false;};
  },[memberships]);
  const active = memberships.filter(membership=>membership.status==="ACTIVE");
  const sorted=[...memberships].sort((left,right)=>{
    const status=Number(right.status==="ACTIVE")-Number(left.status==="ACTIVE");
    if(status)return status;
    return Number(right.id===lastUsed)-Number(left.id===lastUsed);
  });

  async function choose(membershipId: string) {
    if (pending) return;
    setError(null);
    setPendingId(membershipId);

    try {
      await run(async () => {
        await apiFetch("/api/auth/memberships", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ membershipId }),
          timeoutMs: 29_000,
        });
        try { window.sessionStorage.setItem("lms_last_membership_key", membershipId); }
        catch { /* The selection still succeeds in private browsing. */ }
        router.push("/dashboard");
        router.refresh();
      });
    } catch (reason) {
      if (reason instanceof FriendlyFetchError &&
          (reason.status === 403 || reason.status === 404)) {
        setError("That college membership is no longer available. Refresh and choose another.");
      } else {
        setError(reason instanceof FriendlyFetchError ? reason.message : FRIENDLY_MESSAGES.unexpected);
      }
    } finally {
      setPendingId(null);
    }
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
      <div role="radiogroup" aria-label="Choose where to sign in"
        className="grid gap-3 lg:grid-cols-2">
        {sorted.map((membership) => (
          <section
            key={membership.id}
            className={"flex flex-col justify-between gap-5 rounded-xl border bg-surface p-5 "+
              (membership.id===selectedId?"border-primary":"border-border")}
          >
            <div>
              <label className="mb-3 flex min-h-11 items-center gap-2 text-sm font-semibold">
                <input type="radio" name="membership" checked={selectedId===membership.id}
                  disabled={pending||membership.status!=="ACTIVE"}
                  onChange={()=>setSelectedId(membership.id)} />
                Select {membership.collegeName}
              </label>
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
            {membership.status!=="ACTIVE"?<p className="text-xs text-muted-foreground">
              Contact your college administrator to reactivate this membership.
            </p>:null}
          </section>
        ))}
      </div>
      <Button disabled={pending||!selectedId} onClick={()=>{if(selectedId)choose(selectedId);}}>
        {pendingId?"Opening…":"Continue with this college"}
      </Button>
    </div>
  );
}
