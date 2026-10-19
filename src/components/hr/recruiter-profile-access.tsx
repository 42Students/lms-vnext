"use client";
import { Button } from "@/components/ui/button";

import { useRef, useState } from "react";
import {ConfirmActionDialog} from "@/components/ui/confirm-action-dialog";
import {Button} from "@/components/ui/button";
import {isConfirmedRecruiterLeaveResponse} from "@/modules/placements/recruiter-profile-access-model";
import Link from "next/link";
import {hrRecruiterGrantLinks} from "@/modules/placements/hr-recruiter-grant-navigation-model";

type Grant = {
  id: string;
  collegeId: string;
  collegeName: string;
};

export function RecruiterProfileAccess({ grants }: { grants: readonly Grant[] }) {
  const [items, setItems] = useState(() => [...grants]);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [confirmGrant,setConfirmGrant]=useState<Grant|null>(null);
  const leavingRef=useRef(false);

  async function leave(grant: Grant) {
    if(leavingRef.current)return;
    leavingRef.current=true;
    setLeaving(grant.id);
    setError("");
    try {
      const response=await fetch(
        "/api/placements/recruiter/access/"+encodeURIComponent(grant.id),{
          method:"DELETE",credentials:"same-origin",redirect:"error",
          headers:{Accept:"application/json"},
        },
      );
      if(!response.ok)throw new Error("ACCESS_NOT_CONFIRMED");
      const payload:unknown=await response.json().catch(()=>null);
      if(!isConfirmedRecruiterLeaveResponse(payload,grant.id))
        throw new Error("ACCESS_NOT_CONFIRMED");
      setItems(current=>current.filter(item=>item.id!==grant.id));
      setConfirmGrant(null);
      window.location.assign("/hr/home");
    } catch {
      setError("Could not confirm that your college access was removed. Refresh and try again.");
    } finally {
      leavingRef.current=false;
      setLeaving(null);
    }
  }

  return (
    <section className="border-b border-border pb-5">
      <h2 className="text-base font-semibold text-foreground">College Access</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Open a page for the exact college you select. These links do not change your account-wide active college. Leaving access takes effect immediately and requires a new placement-cell grant to return.
      </p>
      {error ? (
        <div role="alert" className="mt-3 rounded-[var(--lms-control-radius)] border border-error/30 bg-error/5 p-3 text-sm text-error">
          {error}
        </div>
      ) : null}
      <ConfirmActionDialog open={confirmGrant!==null}
        title={"Leave access to "+(confirmGrant?.collegeName??"this college")+"?"}
        consequence="You will immediately lose recruiter access to this college."
        confirmLabel="Leave Access" pending={leaving!==null}
        onCancel={()=>setConfirmGrant(null)}
        onConfirm={()=>{if(confirmGrant)void leave(confirmGrant);}}/>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No active college access.</p>
      ) : (
        <div className="mt-4 divide-y divide-border">
          {items.map((grant) => (
            <div key={grant.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div>
                <div className="font-medium text-foreground">{grant.collegeName}</div>
                <div className="mt-1 text-xs text-muted-foreground">Active recruiter access</div>
                <nav aria-label={"Open "+grant.collegeName+" recruiter pages"}
                  className="mt-2 flex flex-wrap gap-3 text-sm">
                  {hrRecruiterGrantLinks(grant.collegeId).map(link=>(
                    <Link key={link.label} href={link.href}
                      className="inline-flex min-h-9 items-center text-sm font-medium text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
              <Button
                variant="secondary"
                type="button"
                disabled={leaving === grant.id}
                onClick={() => setConfirmGrant(grant)}
                className="border-error/30 text-error hover:bg-error/5"
              >
                {leaving === grant.id ? "Leaving…" : "Leave Access"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
