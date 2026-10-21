"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-fetch";
import { friendlyApiError } from "@/lib/friendly-error";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

type CompanyHistory = {
  company: {
    name: string;
    relationshipStatus: string;
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    internalNotes: string | null;
  };
  items: {
    id: string;
    title: string;
    status: string;
    publishedAt: string | null;
    applicants: number;
    hired: number;
  }[];
  totals: { drives: number; applicants: number; hired: number };
  truncated: boolean;
};

type HistoryContactDraft = {
  contactPersonName: string;
  contactEmail: string;
  contactPhone: string;
  internalNotes: string;
};

const emptyHistoryDraft: HistoryContactDraft = {
  contactPersonName: "",
  contactEmail: "",
  contactPhone: "",
  internalNotes: "",
};

function historyDate(value: string | null): string {
  if (!value) return "Not published";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeZone: "Asia/Kolkata",
      }).format(date);
}

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
  const [historyForId, setHistoryForId] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<CompanyHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const historyRequest = useRef(0);
  const [historyEditing, setHistoryEditing] = useState(false);
  const [historySaving, setHistorySaving] = useState(false);
  const [historyDiscardConfirm, setHistoryDiscardConfirm] = useState(false);
  const [historySaveError, setHistorySaveError] = useState<string | null>(null);
  const [historyDraft, setHistoryDraft] = useState<HistoryContactDraft>(emptyHistoryDraft);
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

  function closeHistory() {
    historyRequest.current += 1;
    setHistoryForId(null);
    setHistoryData(null);
    setHistoryError(null);
    setHistorySaveError(null);
    setHistoryEditing(false);
    setHistoryDiscardConfirm(false);
    setHistoryLoading(false);
  }

  function requestCloseHistory() {
    if (historySaving) return;
    const saved = historyData?.company;
    if (historyEditing && saved && (
      historyDraft.contactPersonName !== (saved.contactName ?? "") ||
      historyDraft.contactEmail !== (saved.contactEmail ?? "") ||
      historyDraft.contactPhone !== (saved.contactPhone ?? "") ||
      historyDraft.internalNotes !== (saved.internalNotes ?? "")
    )) {
      setHistoryDiscardConfirm(true);
      return;
    }
    closeHistory();
  }

  async function openHistory(relationshipId: string) {
    const requestId = ++historyRequest.current;
    setHistoryForId(relationshipId);
    setHistoryData(null);
    setHistoryError(null);
    setHistoryLoading(true);
    try {
      const result = await apiFetch<CompanyHistory>(
        "/api/placements/companies/" +
          encodeURIComponent(relationshipId) +
          "/history",
      );
      if (historyRequest.current === requestId) {
        setHistoryData(result);
        setHistoryDraft({
          contactPersonName: result.company.contactName ?? "",
          contactEmail: result.company.contactEmail ?? "",
          contactPhone: result.company.contactPhone ?? "",
          internalNotes: result.company.internalNotes ?? "",
        });
      }
    } catch (error) {
      if (historyRequest.current === requestId) {
        setHistoryError(
          error instanceof Error ? error.message : friendlyApiError({}),
        );
      }
    } finally {
      if (historyRequest.current === requestId) setHistoryLoading(false);
    }
  }

  async function saveHistoryContact() {
    if (!historyForId || historySaving) return;
    const contactPhone = historyDraft.contactPhone.trim();
    if (contactPhone && !/^[+()\d][\d\s().-]{6,29}$/.test(contactPhone)) {
      setHistorySaveError("Enter a valid phone number");
      return;
    }
    setHistorySaving(true);
    setHistorySaveError(null);
    try {
      await apiFetch(
        "/api/placements/companies/" + encodeURIComponent(historyForId) + "/history",
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            contactPersonName: historyDraft.contactPersonName.trim() || null,
            contactEmail: historyDraft.contactEmail.trim() || null,
            contactPhone: contactPhone || null,
            internalNotes: historyDraft.internalNotes.trim() || null,
          }),
        },
      );
      showToast({
        tone: "success",
        title: "Company updated",
        description: "These college contact details are not visible to students.",
      });
      setHistoryEditing(false);
      await openHistory(historyForId);
      router.refresh();
    } catch (error) {
      setHistorySaveError(
        error instanceof Error ? error.message : friendlyApiError({}),
      );
    } finally {
      setHistorySaving(false);
    }
  }

  const activeHistoryName = relationships.find(
    (item) => item.relationshipId === historyForId,
  )?.name ?? "Company";

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
                    : "Never posted"}
                </div>
                <div role="cell" className="min-w-0 space-y-3">
                <Button
                  size="sm"
                  variant="secondary"
                  className="min-h-11 w-full sm:w-auto md:min-h-9"
                  onClick={() => void openHistory(item.relationshipId)}
                >
                  History
                </Button>
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
      <Dialog
        open={Boolean(historyForId)}
        onOpenChange={(next) => { if (!next) requestCloseHistory(); }}
        dismissible={!historySaving}
        title={activeHistoryName + " · Drive history"}
        description="Drives and outcomes recorded for this college only."
        className="max-w-[720px]"
      >
        {historyLoading ? (
          <div role="status" aria-live="polite" className="space-y-3">
            <p className="text-sm text-body">Loading company history…</p>
            {[0, 1, 2].map((row) => (
              <div key={row} aria-hidden="true" className="h-10 animate-pulse rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-50)]" />
            ))}
          </div>
        ) : historyError ? (
          <div role="alert" className="space-y-3 text-sm text-error">
            <p>Could not load company history. {historyError}</p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => { if (historyForId) void openHistory(historyForId); }}
            >
              Retry
            </Button>
          </div>
        ) : historyData ? (
          <div className="min-w-0 space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {([
                ["Drives run", historyData.totals.drives],
                ["Total applications", historyData.totals.applicants],
                ["Total hired", historyData.totals.hired],
              ] as const).map(([label, count]) => (
                <div key={label} className="rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] p-3">
                  <p className="text-xs text-body">{label}</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{count}</p>
                </div>
              ))}
            </div>
            {historyData.truncated ? (
              <p role="status" className="text-sm text-body">
                Showing the first 100 drives; totals above cover only those drives.
              </p>
            ) : null}
            <p className="text-xs text-body">
              Hired means an accepted offer with a recorded joined outcome.
              Unrecorded or pending outcomes are not guessed.
            </p>
            <div className="overflow-x-auto rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)]">
              <table className="w-full min-w-[580px] text-left text-sm">
                <thead className="border-b border-[var(--lms-canvas-border)] text-xs text-body">
                  <tr>
                    <th scope="col" className="p-3 font-semibold">Drive</th>
                    <th scope="col" className="p-3 font-semibold">Status</th>
                    <th scope="col" className="p-3 font-semibold">Published</th>
                    <th scope="col" className="p-3 text-right font-semibold">Applications</th>
                    <th scope="col" className="p-3 text-right font-semibold">Hired</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--lms-canvas-border)]">
                  {historyData.items.map((job) => (
                    <tr key={job.id}>
                      <td className="p-3">
                        <Link
                          href={`/college/placements/jobs/${encodeURIComponent(job.id)}/overview`}
                          className="font-semibold text-link underline underline-offset-2 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
                        >
                          {job.title}
                        </Link>
                      </td>
                      <td className="p-3 text-body">{job.status}</td>
                      <td className="p-3 text-body">{historyDate(job.publishedAt)}</td>
                      <td className="p-3 text-right tabular-nums">{job.applicants}</td>
                      <td className="p-3 text-right tabular-nums">{job.hired}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {historyData.items.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No drives recorded for this company.
                </p>
              ) : null}
            </div>
            <div className="space-y-3 border-t border-[var(--lms-canvas-border)] pt-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold text-foreground">College contact and internal notes</h3>
                {!historyEditing && historyData.company.relationshipStatus === "ACTIVE" ? (
                  <Button variant="secondary" size="sm" className="min-h-11 md:min-h-9"
                    onClick={() => { setHistorySaveError(null); setHistoryEditing(true); }}>
                    Edit college details
                  </Button>
                ) : null}
              </div>
              {historyEditing ? (
                <form className="grid min-w-0 gap-3 sm:grid-cols-2"
                  onSubmit={(event) => { event.preventDefault(); void saveHistoryContact(); }}>
                  <label className="grid min-w-0 gap-1 font-semibold text-body">
                    Contact person
                    <Input value={historyDraft.contactPersonName} maxLength={150}
                      disabled={historySaving} placeholder="Recruiter contact name"
                      onChange={(event) => setHistoryDraft((current) => ({
                        ...current, contactPersonName: event.target.value,
                      }))} />
                  </label>
                  <label className="grid min-w-0 gap-1 font-semibold text-body">
                    Contact email
                    <Input type="email" value={historyDraft.contactEmail} maxLength={150}
                      disabled={historySaving} placeholder="recruiter@company.com"
                      onChange={(event) => setHistoryDraft((current) => ({
                        ...current, contactEmail: event.target.value,
                      }))} />
                  </label>
                  <label className="grid min-w-0 gap-1 font-semibold text-body">
                    Contact phone
                    <Input type="tel" value={historyDraft.contactPhone} maxLength={30}
                      disabled={historySaving} placeholder="Contact phone"
                      onChange={(event) => setHistoryDraft((current) => ({
                        ...current, contactPhone: event.target.value,
                      }))} />
                  </label>
                  <label className="grid min-w-0 gap-1 font-semibold text-body sm:col-span-2">
                    Internal notes
                    <span className="font-normal text-xs text-muted-foreground">
                      Visible only to your placement team, not to students.
                    </span>
                    <Textarea rows={2} value={historyDraft.internalNotes}
                      maxLength={2000} disabled={historySaving}
                      onChange={(event) => setHistoryDraft((current) => ({
                        ...current, internalNotes: event.target.value,
                      }))} />
                    <span className="text-right font-normal text-xs text-muted-foreground">
                      {historyDraft.internalNotes.length}/2000
                    </span>
                  </label>
                  {historySaveError ? (
                    <p role="alert" className="text-sm text-error sm:col-span-2">
                      Company was not saved. {historySaveError}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2 sm:col-span-2">
                    <Button type="submit" variant="primary" disabled={historySaving}
                      className="min-h-11 md:min-h-9">
                      {historySaving ? "Saving…" : "Save"}
                    </Button>
                    <Button type="button" variant="secondary" disabled={historySaving}
                      className="min-h-11 md:min-h-9"
                      onClick={() => {
                        setHistoryEditing(false);
                        setHistorySaveError(null);
                        setHistoryDraft({
                          contactPersonName: historyData.company.contactName ?? "",
                          contactEmail: historyData.company.contactEmail ?? "",
                          contactPhone: historyData.company.contactPhone ?? "",
                          internalNotes: historyData.company.internalNotes ?? "",
                        });
                      }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="text-body">
                    {historyData.company.contactName || "No contact recorded"}
                    {historyData.company.contactEmail ? " · " + historyData.company.contactEmail : ""}
                    {historyData.company.contactPhone ? " · " + historyData.company.contactPhone : ""}
                  </p>
                  <p className="whitespace-pre-wrap break-words text-body">
                    {historyData.company.internalNotes || "No internal notes recorded."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    These details are private to this college, not shown to students.
                  </p>
                </>
              )}
            </div>
          </div>
        ) : null}
      </Dialog>
      <ConfirmDialog
        open={historyDiscardConfirm}
        onOpenChange={(next) => { if (!next) setHistoryDiscardConfirm(false); }}
        title="Discard unsaved changes?"
        description="You have unsaved changes in this form. Closing now will discard them."
        cancelLabel="Keep editing"
        confirmLabel="Discard"
        confirmVariant="danger"
        onConfirm={() => { setHistoryDiscardConfirm(false); closeHistory(); }}
      />
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
