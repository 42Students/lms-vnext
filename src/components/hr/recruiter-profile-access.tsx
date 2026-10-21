"use client";
import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/inline-notice";
import { EmptyState } from "@/components/ui/empty-state";

import { useRef, useState } from "react";
import {ConfirmActionDialog} from "@/components/ui/confirm-action-dialog";
import {isConfirmedRecruiterLeaveResponse} from "@/modules/placements/recruiter-profile-access-model";
import Link from "next/link";
import {hrRecruiterGrantLinks} from "@/modules/placements/hr-recruiter-grant-navigation-model";

type Grant = {
  id: string;
  collegeId: string;
  collegeName: string;
};

export function RecruiterProfileAccess({ grants, hideHeading = false }: { grants: readonly Grant[]; hideHeading?: boolean }) {
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
    <section aria-label="College Access" className="min-w-0 border-t border-border pt-4">
      {hideHeading ? null : <h2 className="font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">College Access</h2>}
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground leading-[22px]">
        College access is granted and managed by the placement cell at each college.
        You cannot add or approve college access from this profile.
        Open a page for the exact college you select; these links do not change your account-wide active college.
        Leaving access takes effect immediately and requires a new placement-cell grant to return.
      </p>
      {error ? (
        <InlineNotice tone="error" message={error}/>
      ) : null}
      <ConfirmActionDialog open={confirmGrant!==null}
        title={"Leave access to "+(confirmGrant?.collegeName??"this college")+"?"}
        consequence="You will immediately lose recruiter access to this college."
        confirmLabel="Leave Access" pending={leaving!==null}
        onCancel={()=>setConfirmGrant(null)}
        onConfirm={()=>{if(confirmGrant)void leave(confirmGrant);}}/>
      {items.length === 0 ? (
        <EmptyState title="No college access."
          description="College access is managed by each placement cell. Ask the placement cell to grant access to your recruiter account."/>
      ) : (
        <div className="mt-4 divide-y divide-border">
          {items.map((grant) => (
            <div key={grant.id} className="flex min-w-0 flex-col gap-3 py-4 first:pt-0 last:pb-0 min-[768px]:flex-row min-[768px]:items-start min-[768px]:justify-between">
              <div className="min-w-0 flex-1">
                <div className="break-words font-medium text-foreground">{grant.collegeName}</div>
                <div className="mt-1 text-xs text-muted-foreground">Active recruiter access</div>
                <nav aria-label={"Open "+grant.collegeName+" recruiter pages"}
                  className="mt-2 flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-sm">
                  {hrRecruiterGrantLinks(grant.collegeId).map(link=>(
                    <Link key={link.label} href={link.href}
                      className="inline-flex min-h-11 min-[768px]:min-h-9 items-center text-sm font-medium text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
              <details className="min-w-0 min-[768px]:shrink-0">
              <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-[768px]:min-h-9">Manage access</summary>
              <Button
                variant="secondary"
                type="button"
                disabled={leaving === grant.id}
                loading={leaving === grant.id}
                onClick={() => setConfirmGrant(grant)}
                className="mt-2 min-h-11 w-full justify-center border-error/30 text-error hover:bg-error/5 min-[768px]:min-h-9 min-[768px]:w-auto"
              >
                {leaving === grant.id ? "Leaving…" : "Leave Access"}
              </Button>
              </details>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
