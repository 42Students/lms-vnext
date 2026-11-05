"use client";
import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/inline-notice";
import { EmptyState } from "@/components/ui/empty-state";

import { useRef, useState } from "react";
import {ConfirmActionDialog} from "@/components/ui/confirm-action-dialog";
import {isConfirmedRecruiterLeaveResponse} from "@/modules/placements/recruiter-profile-access-model";
import {hrRecruiterGrantLinks} from "@/modules/placements/hr-recruiter-grant-navigation-model";
import { Heading } from "@/components/ui/heading";
import { Disclosure } from "@/components/ui/disclosure";
import { TextLink } from "@/components/ui/text-link";

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
    leavingRef.current = true;
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
      window.location.assign(new URL("/hr/home",window.location.origin).href);
    } catch {
      setError("Could not confirm that your college access was removed. Refresh and try again.");
    } finally {
      leavingRef.current = false;
      setLeaving(null);
    }
  }

  return (
    <section aria-label="College Access" className="min-w-0 border-t border-border pt-4">
      {hideHeading ? null : <Heading level={2} size="base" className="text-[var(--lms-heading)] leading-[26px] md:text-[18px] md:leading-[28px] lg:text-[20px] lg:leading-[30px]">College Access</Heading>}
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
            <div key={grant.id} className="flex min-w-0 flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="break-words font-medium text-foreground">{grant.collegeName}</div>
                <div className="mt-1 text-xs text-muted-foreground">Active recruiter access</div>
                <nav aria-label={"Open "+grant.collegeName+" recruiter pages"}
                  className="mt-2 flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-sm">
                  {hrRecruiterGrantLinks(grant.collegeId).map(link=>(
                    <TextLink key={link.label} href={link.href}
                      className="inline-flex min-h-11 md:min-h-9 items-center text-sm">
                      {link.label}
                    </TextLink>
                  ))}
                </nav>
              </div>
              <Disclosure title="Manage access" className="min-w-0 md:shrink-0">
              <Button
                variant="secondary"
                type="button"
                disabled={leaving === grant.id}
                loading={leaving === grant.id}
                onClick={() => setConfirmGrant(grant)}
                className="mt-2 min-h-11 w-full justify-center border-error/30 text-error hover:bg-error/5 md:min-h-9 md:w-auto"
              >
                {leaving === grant.id ? "Leaving…" : "Leave Access"}
              </Button>
              </Disclosure>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
