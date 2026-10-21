"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-fetch";
import { friendlyApiError } from "@/lib/friendly-error";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";

function employerWebsiteHost(url:string|null){
 if(!url)return null;
 try{return new URL(url).hostname||null;}catch{return null;}
}

export type PlacementEmployerRelationshipItem = {
  relationshipId: string;
  companyId: string;
  name: string;
  websiteUrl: string | null;
  primaryDomain: string | null;
  verifiedAt?:Date|null;
  companyStatus?:string;
  relationshipStatus?:string;
  industry?:string|null;
  contactName?:string|null;
  contactEmail?:string|null;
  drives?:number;
  lastActive?:Date|null;
  isTrusted: boolean;
  ownerMembershipId: string | null;
};

export type PlacementEmployerOwnerChoice = {
  membershipId: string;
  displayName: string | null;
  email: string | null;
  roles: string[];
};

type Draft = {
  isTrusted: boolean;
  ownerMembershipId: string;
};

export function PlacementEmployerRelationships({
  relationships,
  owners,
}: {
  relationships: readonly PlacementEmployerRelationshipItem[];
  owners: readonly PlacementEmployerOwnerChoice[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pendingId, setPendingId] =
    useState<string | null>(null);
  const [restoreConfirmId,setRestoreConfirmId]=useState<string|null>(null);
  const [archiveConfirmId, setArchiveConfirmId] =
    useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, Draft>
  >(
    Object.fromEntries(
      relationships.map((item) => [
        item.relationshipId,
        {
          isTrusted: item.isTrusted,
          ownerMembershipId:
            item.ownerMembershipId ?? "",
        },
      ]),
    ),
  );

  async function mutate(
    relationshipId: string,
    method: "PATCH" | "DELETE",
    body?: unknown,
  ) {
    await apiFetch(
      `/api/placements/companies/${relationshipId}`,
      {
        method,
        headers: body===undefined ? undefined : {"content-type":"application/json"},
        body: body===undefined ? undefined : JSON.stringify(body),
      },
    );
  }

  async function save(
    relationshipId: string,
  ) {
    const draft = drafts[relationshipId];
    if (!draft) return;
    if(pendingId)return;
    setPendingId(relationshipId);
    try {
      await mutate(
        relationshipId,
        "PATCH",
        {
          isTrusted: draft.isTrusted,
          ownerMembershipId:
            draft.ownerMembershipId || null,
        },
      );
      showToast({
        tone: "success",
        title: "Employer relationship updated",
        description:
          "Trust and ownership stay private to this college.",
      });
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not update employer",
        description:
          error instanceof Error ? error.message : friendlyApiError({}),
      });
    } finally {
      setPendingId(null);
    }
  }

  async function archive(
    relationshipId: string,
  ) {
    if(pendingId)return;
    setPendingId(relationshipId);
    try {
      await mutate(
        relationshipId,
        "DELETE",
      );
      showToast({
        tone: "success",
        title: "Company deleted from this college",
        description:
          "Canonical employer identity remains available to other colleges.",
      });
      setArchiveConfirmId(null);
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not archive employer",
        description:
          error instanceof Error ? error.message : friendlyApiError({}),
      });
    } finally {
      setPendingId(null);
    }
  }

  /** COL-placements-15: recovery is a confirmed, same-college write. */
  async function restore(relationshipId:string){
    if(pendingId)return;
    setPendingId(relationshipId);
    try{
      await apiFetch("/api/placements/companies/"+encodeURIComponent(relationshipId)+"/restore",{method:"POST"});
      setRestoreConfirmId(null);
      showToast({tone:"success",title:"Company restored"});
      router.refresh();
    }catch{
      showToast({tone:"error",title:"Could not restore company",
        description:"This company cannot be restored right now. Refresh and try again."});
    }finally{setPendingId(null);}
  }

  return (
    <section className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
      <div className="border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-3)]">
        <h2 className="sr-only text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px] font-semibold text-[var(--lms-heading)]">
          Companies
        </h2>
        <p className="mt-1 text-sm text-body leading-[22px]">
          Maintain each recruiting company once and reuse it across drives.
          {" "}A company is kept once across colleges by its website or company email domain: add at least one of them.
        </p>
      </div>

      {relationships.length === 0 ? (
        <p className="m-0 py-6 text-sm text-muted-foreground leading-[22px]">
          No companies yet.
        </p>
      ) : (
        <div className="min-w-0 overflow-x-auto">
          <div role="table" aria-label="College company relationships" className="min-w-[1120px] divide-y divide-border">
            <div role="row" className="grid grid-cols-[1.5fr_1.1fr_1.1fr_0.7fr_1fr_2fr] gap-3 border-b border-border py-3 text-xs font-semibold text-body">
              <span role="columnheader">Company</span>
              <span role="columnheader">Contact</span>
              <span role="columnheader">Website</span>
              <span role="columnheader">Drives</span>
              <span role="columnheader">Last active</span>
              <span role="columnheader">Actions</span>
            </div>
          {relationships.map((item) => {
            const draft =
              drafts[item.relationshipId] ?? {
                isTrusted: item.isTrusted,
                ownerMembershipId:
                  item.ownerMembershipId ??
                  "",
              };
            // COL-placements-15: serialize relationship edits and recovery;
            // concurrent row writes otherwise race a shared refresh/pending state.
            const busy = pendingId !== null;

            return (
              <div
                key={item.relationshipId}
                role="row"
                className="grid grid-cols-[1.5fr_1.1fr_1.1fr_0.7fr_1fr_2fr] min-w-0 items-start gap-3 py-4"
              >
                <div role="cell" className="min-w-0">
                  <p className="m-0 break-words font-semibold text-foreground">{item.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.verifiedAt ? <StatusBadge tone="success">Verified by 42</StatusBadge> : null}
                    {item.companyStatus==="ARCHIVED"||item.relationshipStatus==="ARCHIVED" ?
                      <StatusBadge tone="warning">Deleted</StatusBadge> : null}
                    <StatusBadge tone={draft.isTrusted?"success":"neutral"}>
                      {draft.isTrusted?"Trusted":"Unverified"}
                    </StatusBadge>
                  </div>
                  <p className="mt-1 break-words text-xs text-body">
                    {item.primaryDomain??(item.websiteUrl?employerWebsiteHost(item.websiteUrl):"No domain registered")}
                    {item.industry?" · "+item.industry:""}
                  </p>
                </div>
                <div role="cell" className="min-w-0 break-words text-sm text-body">
                  {item.contactName || item.contactEmail || "No contact recorded"}
                  {item.contactName&&item.contactEmail?<p className="mt-1 break-all text-xs">{item.contactEmail}</p>:null}
                </div>
                <div role="cell" className="min-w-0 break-all text-sm">
                  {item.websiteUrl ?
                    <a href={item.websiteUrl} rel="noopener noreferrer"
                      className="text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
                      {employerWebsiteHost(item.websiteUrl)??"Employer website"}
                    </a> : <span className="text-muted-foreground">—</span>}
                </div>
                <div role="cell" className="text-sm text-body">{item.drives??"—"}</div>
                <div role="cell" className="text-sm text-body">
                  {item.lastActive
                    ? new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(item.lastActive)
                    : "Not recorded"}
                </div>
                <div role="cell" className="min-w-0 space-y-3">
                <div className="grid min-w-0 gap-3">
                  <label>
                    <span className="mb-[var(--lms-space-2)] block text-xs font-semibold text-body">
                      Relationship owner
                    </span>
                    <Select
                      className="min-h-11 w-full md:min-h-9"
                      disabled={busy||item.companyStatus==="ARCHIVED"||item.relationshipStatus==="ARCHIVED"}
                      value={
                        draft.ownerMembershipId
                      }
                      onChange={(event) =>
                        setDrafts(
                          (current) => ({
                            ...current,
                            [item.relationshipId]:
                              {
                                ...draft,
                                ownerMembershipId:
                                  event.target
                                    .value,
                              },
                          }),
                        )
                      }
                    >
                      <option value="">
                        Unassigned
                      </option>
                      {owners.map((owner) => (
                        <option
                          key={
                            owner.membershipId
                          }
                          value={
                            owner.membershipId
                          }
                        >
                          {owner.displayName ??
                            owner.email ??
                            "Placement owner"}
                          {" · "}
                          {owner.roles.join(
                            " / ",
                          )}
                        </option>
                      ))}
                    </Select>
                  </label>

                  <label className="flex items-center gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)]">
                    <Checkbox
                      disabled={busy||item.companyStatus==="ARCHIVED"||item.relationshipStatus==="ARCHIVED"}
                      checked={draft.isTrusted}
                      onChange={(event) =>
                        setDrafts(
                          (current) => ({
                            ...current,
                            [item.relationshipId]:
                              {
                                ...draft,
                                isTrusted:
                                  event.target
                                    .checked,
                              },
                          }),
                        )
                      }
                    />
                    Trusted employer relationship
                  </label>
                </div>

                <div className="flex min-w-0 flex-wrap gap-2 border-t border-[var(--lms-canvas-border)] pt-3">
                  {item.companyStatus!=null && item.companyStatus!=="ACTIVE" ? (
                    <span role="status" className="text-sm text-muted-foreground">
                      This company is archived on the platform and cannot be restored here.
                    </span>
                  ) : item.relationshipStatus==="ARCHIVED" ? (
                    <Button size="sm" className="min-h-11 w-full sm:w-auto md:min-h-9" variant="secondary" disabled={busy}
                      onClick={()=>setRestoreConfirmId(item.relationshipId)}>Restore</Button>
                  ) : (<>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="min-h-11 w-full sm:w-auto md:min-h-9"
                    disabled={busy}
                    onClick={() =>
                      save(
                        item.relationshipId,
                      )
                    }
                  >
                    {busy
                      ? "Saving…"
                      : "Save"}
                  </Button>

                  <Button size="sm" variant="ghost"
                    className="min-h-11 w-full sm:w-auto md:min-h-9"
                    disabled={busy||item.drives==null||item.drives>0}
                    title={item.drives==null
                      ?"Drive usage is unavailable. Refresh before archiving."
                      :item.drives>0?"Used by drives: switch it off instead":undefined}
                    onClick={()=>setArchiveConfirmId(item.relationshipId)}>Archive</Button>
                  </>)}
                </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}
      <ConfirmDialog open={Boolean(archiveConfirmId)}
        onOpenChange={next=>{if(!next&&!pendingId)setArchiveConfirmId(null);}}
        title="Archive this company?"
        description="This company relationship will be archived for this college. Canonical employer identity remains available to other colleges."
        confirmLabel="Confirm archive" confirmVariant="danger" pending={Boolean(pendingId)}
        onConfirm={()=>{if(archiveConfirmId)void archive(archiveConfirmId);}}/>
      <ConfirmDialog open={Boolean(restoreConfirmId)} onOpenChange={next=>{if(!next&&!pendingId)setRestoreConfirmId(null);}}
        title="Restore this company?"
        description="The archived company relationship will become available to this college again. Its history is preserved."
        confirmLabel="Restore company" pending={Boolean(pendingId)}
        onConfirm={()=>{if(restoreConfirmId)void restore(restoreConfirmId);}}/>
    </section>
  );
}
