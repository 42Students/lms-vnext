"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import { Button } from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
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
    setPendingId(relationshipId);
    try {
      await mutate(
        relationshipId,
        "DELETE",
      );
      showToast({
        tone: "success",
        title: "Employer relationship archived",
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
    <section className="rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <h2 className="m-0 text-base font-semibold text-foreground">
          Companies
        </h2>
        <p className="mt-1 text-sm text-body">
          Maintain each recruiting company once and reuse it across drives.
          {" "}A company is kept once across colleges by its website or company email domain: add at least one of them.
        </p>
      </div>

      {relationships.length === 0 ? (
        <p className="m-0 px-5 py-6 text-sm text-muted-foreground">
          No companies yet.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {relationships.map((item) => {
            const draft =
              drafts[item.relationshipId] ?? {
                isTrusted: item.isTrusted,
                ownerMembershipId:
                  item.ownerMembershipId ??
                  "",
              };
            const busy =
              pendingId ===
              item.relationshipId;

            return (
              <div
                key={item.relationshipId}
                className="grid gap-4 px-5 py-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)_auto]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="m-0 font-semibold text-foreground">
                      {item.name}
                    </p>
                    {item.verifiedAt?<StatusBadge tone="success">Verified by 42</StatusBadge>:null}
                    {item.companyStatus==="ARCHIVED"||item.relationshipStatus==="ARCHIVED"?
                      <StatusBadge tone="warning">Deleted</StatusBadge>:null}
                    <StatusBadge
                      tone={
                        draft.isTrusted
                          ? "success"
                          : "neutral"
                      }
                    >
                      {draft.isTrusted
                        ? "Trusted"
                        : "Unverified"}
                    </StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-body">
                    Domains: {item.primaryDomain??(item.websiteUrl?employerWebsiteHost(item.websiteUrl):"No domain registered")}
                    {item.industry?" · "+item.industry:""}
                  </p>
                  {item.websiteUrl ? (
                    <a
                      className="mt-1 inline-block text-xs font-semibold text-primary-text hover:text-primary-hover"
                      href={item.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open employer website →
                    </a>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <label>
                    <span className="mb-1 block text-xs font-semibold text-body">
                      Relationship owner
                    </span>
                    <select
                      className="min-h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)]"
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
                    </select>
                  </label>

                  <label className="flex items-center gap-2 text-sm font-semibold text-body">
                    <input
                      type="checkbox"
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

                <div className="flex flex-wrap items-start gap-2 xl:justify-end">
                  {item.relationshipStatus==="ARCHIVED" ? (
                    <Button size="sm" variant="secondary" disabled={busy}
                      onClick={()=>setRestoreConfirmId(item.relationshipId)}>Restore</Button>
                  ) : (<>
                  <Button
                    size="sm"
                    variant="secondary"
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

                  {archiveConfirmId ===
                  item.relationshipId ? (
                    <>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={busy}
                        onClick={() =>
                          archive(
                            item.relationshipId,
                          )
                        }
                      >
                        Confirm archive
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() =>
                          setArchiveConfirmId(
                            null,
                          )
                        }
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() =>
                        setArchiveConfirmId(
                          item.relationshipId,
                        )
                      }
                    >
                      Archive
                    </Button>
                  )}
                  </>)}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ConfirmDialog open={Boolean(restoreConfirmId)} onOpenChange={next=>{if(!next)setRestoreConfirmId(null);}}
        title="Restore this company?"
        description="The archived company relationship will become available to this college again. Its history is preserved."
        confirmLabel="Restore company" pending={Boolean(pendingId)}
        onConfirm={()=>{if(restoreConfirmId)void restore(restoreConfirmId);}}/>
    </section>
  );
}
