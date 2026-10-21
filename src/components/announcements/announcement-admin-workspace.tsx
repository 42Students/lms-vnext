"use client";
import {Select} from "@/components/ui/select";
import {EmptyState} from "@/components/ui/empty-state";
import {Disclosure} from "@/components/ui/disclosure";
import { Fragment, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {platformAnnouncementPublicationSummary} from "@/modules/announcements/super-admin-publish-consent-model";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { safeAnnouncementLink } from "@/modules/announcements/link-model";
import { announcementLocalTiming } from "@/modules/announcements/local-timing-model";

export type AnnouncementTarget = {
  type: "COLLEGE" | "PROGRAM" | "DEPARTMENT" | "LEARNER" | "FACULTY" | "CLASS";
  id: string;
  label: string;
};

export type AnnouncementAdminItem = {
  id: string;
  receiverType: AnnouncementTarget["type"];
  receiverId: string;
  title: string;
  message: string;
  buttonLabel?:string|null;
  buttonUrl?:string|null;
  senderType: string;
  scheduledAt: string | null;
  expiresAt: string | null;
  isPinned: boolean;
  deletedAt: string | null;
  version: number;
  createdAt: string;
  /** Present where the source has author and delivery-event metadata. */
  authorName?: string | null;
  updatedAt?: string | null;
  sentAt?: string | null;
  deliveryOutboxId?: string | null;
  deliveryCollegeId?: string | null;
  deliveryStatus?: "FAILED" | "SCHEDULED" | "SENT" | "PROCESSING" | null;
  visibilityState: "DELETED" | "SCHEDULED" | "EXPIRED" | "LIVE";
};

function localInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function splitTarget(value: string) {
  const separator = value.indexOf(":");
  return {
    receiverType: value.slice(0, separator) as AnnouncementTarget["type"],
    receiverId: value.slice(separator + 1),
  };
}

/** Group identity is not yet persisted on announcement rows: never mutate one
 * recipient copy of a Super Admin broadcast as if it were the whole broadcast. */
function isBroadcastCopy(item: AnnouncementAdminItem) {
  return item.senderType === "SUPER_ADMIN" && item.receiverType === "COLLEGE";
}

/** Legacy announcement timestamp: 12 Oct, 2:05 PM (add year for historical rows). */
function announcementWhen(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const nowYear = new Date().getFullYear();
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  }).formatToParts(date);
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? "";
  const calendarYear = Number(part("year"));
  return part("day") + " " + part("month") +
    (calendarYear === nowYear ? "" : " " + calendarYear) + ", " +
    part("hour") + ":" + part("minute") + " " + part("dayPeriod").toUpperCase();
}

/** Linkify independently validated HTTPS URLs while React escapes all other text. */
function LinkifiedAnnouncement({ body }: { body: string }) {
  const expression = /(https:\/\/[^\s<>"')\]]+)/g;
  return <>{body.split(expression).map((part, index) => {
    if (index % 2 === 0) return <Fragment key={index}>{part}</Fragment>;
    const safe = safeAnnouncementLink(part);
    return safe ? <a key={index} href={safe} target="_blank" rel="noopener noreferrer"
      className="break-all text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{part}</a>
      : <Fragment key={index}>{part}</Fragment>;
  })}</>;
}

export function AnnouncementAdminWorkspace({
  items,
  targets,
  requiresPublicationConsent=false,
  emptyMessage="No announcements in this view.",
}: {
  items: readonly AnnouncementAdminItem[];
  targets: readonly AnnouncementTarget[];
  requiresPublicationConsent?:boolean;
  emptyMessage?:string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const flight=useRef(false);
  const editFormRef=useRef<HTMLFormElement>(null);
  const [target, setTarget] = useState(
    targets[0] ? `${targets[0].type}:${targets[0].id}` : "",
  );
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [pinned, setPinned] = useState(false);
  const [editing, setEditing] = useState<AnnouncementAdminItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deliveryAction, setDeliveryAction] = useState<AnnouncementAdminItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AnnouncementAdminItem | null>(null);
  const [editConsent,setEditConsent]=useState(false);
  const createTiming = announcementLocalTiming(scheduledAt, expiresAt);
  const [reviewPublish,setReviewPublish]=useState(false);
  const targetLabels = useMemo(
    () => new Map(targets.map((entry) => [`${entry.type}:${entry.id}`, entry.label])),
    [targets],
  );

  function resetCreate() {
    setTitle("");
    setMessage("");
    setScheduledAt("");
    setExpiresAt("");
    setPinned(false);
  }

  function create() {
    if (pending || flight.current || !target || !title.trim() || !message.trim() || !createTiming.valid) return;
    flight.current=true;
    const receiver = splitTarget(target);
    startTransition(async () => {
      try {
      const response = await fetch("/api/announcements/admin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...receiver,
          title,
          message,
          scheduledAt: createTiming.scheduledAt,
          expiresAt: createTiming.expiresAt,
          isPinned: pinned,
          publishConsent:requiresPublicationConsent?true:undefined,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        showToast({
          tone: "error",
          title: "Announcement creation failed",
          description: payload?.error ?? "Check the target and schedule.",
        });
        return;
      }
      resetCreate();
      setCreateOpen(false);
      setReviewPublish(false);
      showToast({ tone: "success", title: "Announcement created" });
      router.refresh();
      } catch {showToast({tone:"error",title:"Announcement creation failed",description:"Check the target and schedule."});}
      finally {flight.current=false;}
    });
  }

  function mutate(
    item: AnnouncementAdminItem,
    action: "DELETE" | "RESTORE" | "PIN",
  ) {
    if (pending || flight.current) return;
    if (isBroadcastCopy(item)) {
      showToast({ tone: "error", title: "Broadcast action unavailable", description: "A broadcast must be changed for every selected placement cell together." });
      return;
    }
    flight.current=true;
    startTransition(async () => {
      try {
      const url = action === "RESTORE"
        ? `/api/announcements/${item.id}/restore`
        : `/api/announcements/${item.id}`;
      const method = action === "DELETE" ? "DELETE" : action === "RESTORE" ? "POST" : "PATCH";
      const body = action === "PIN"
        ? { expectedVersion: item.version, isPinned: !item.isPinned }
        : { expectedVersion: item.version };
      const response = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        showToast({
          tone: "error",
          title: "Announcement update failed",
          description: response.status === 409
            ? "This announcement changed elsewhere. Refresh and retry."
            : payload?.error ?? "Please retry.",
        });
        return;
      }
      if (action === "DELETE") {
        setConfirmDelete(null);
        showToast({ tone: "success", title: "Deleted" });
      }
      router.refresh();
      } catch {showToast({tone:"error",title:"Announcement update failed",description:"Please retry."});}
      finally {flight.current=false;}
    });
  }

  function requeueDelivery(item: AnnouncementAdminItem) {
    if (pending || flight.current || !item.deliveryOutboxId || !item.deliveryCollegeId ||
      (item.deliveryStatus !== "FAILED" && item.deliveryStatus !== "SCHEDULED")) return;
    flight.current = true;
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/notification-delivery/" +
          encodeURIComponent(item.deliveryOutboxId!) + "/resend?collegeId=" +
          encodeURIComponent(item.deliveryCollegeId!), { method: "POST" });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          showToast({tone:"error",title:"Cannot resend notification",description:
            payload?.message ?? (payload?.error === "ALREADY_DELIVERED"
              ? "That notification was already delivered. Compose a new one instead of resending it."
              : "Unable to queue this notification.")});
          return;
        }
        showToast({tone:"success",title:"Queued for immediate delivery"});
        setDeliveryAction(null);
        router.refresh();
      } catch {
        showToast({tone:"error",title:"Cannot resend notification",description:"Please retry."});
      } finally { flight.current = false; }
    });
  }

  function saveEdit() {
    if (!editing || pending || flight.current) return;
    if (isBroadcastCopy(editing)) {
      showToast({ tone: "error", title: "Broadcast edit unavailable", description: "All placement cells must be updated in one operation." });
      return;
    }
    const form = editFormRef.current;
    if (!form) return;
    const data = new FormData(form);
    const targetValue = String(data.get("target") ?? "");
    const receiver = splitTarget(targetValue);
    const editTiming = announcementLocalTiming(String(data.get("scheduledAt") ?? ""), String(data.get("expiresAt") ?? ""));
    if (!editTiming.valid) {
      showToast({tone:"error",title:"Invalid announcement timing",description:"Expiry must be after the scheduled time."});
      return;
    }
    flight.current=true;
    startTransition(async () => {
      try {
      const response = await fetch(`/api/announcements/${editing.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expectedVersion: editing.version,
          ...receiver,
          title: String(data.get("title") ?? ""),
          message: String(data.get("message") ?? ""),
          scheduledAt: editTiming.scheduledAt,
          expiresAt: editTiming.expiresAt,
          isPinned: data.get("isPinned") === "on",
          publishConsent:requiresPublicationConsent?true:undefined,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        showToast({
          tone: "error",
          title: "Announcement edit failed",
          description: response.status === 409
            ? "This announcement changed elsewhere. Refresh and retry."
            : payload?.error ?? "Check the fields and schedule.",
        });
        return;
      }
      setEditing(null);
      setEditConsent(false);
      showToast({ tone: "success", title: editing.senderType === "SUPER_ADMIN" ? "Saved" : "Announcement updated" });
      router.refresh();
      } catch {showToast({tone:"error",title:"Announcement edit failed",description:"Check the fields and schedule."});}
      finally {flight.current=false;}
    });
  }

  return (
    <div className="min-w-0 space-y-[var(--lms-space-4)]">
      <div className="flex flex-wrap justify-end">
        <Button type="button" onClick={() => setCreateOpen(true)}>+ Create announcement</Button>
      </div>
      <Dialog open={createOpen} onOpenChange={next => { if (!pending) setCreateOpen(next); }}
       dismissible={!pending} title="Create announcement" className="max-w-[600px]">
        <section className="space-y-4 pt-[var(--lms-space-3)]">
        <div>

          <p className="mt-1 text-sm text-body">
            Target options are resolved from the current college scope. Messages render as plain text.
          </p>
        </div>
        {targets.length === 0 ? (
          <p className="text-sm text-muted-foreground">Select a college scope before creating an announcement.</p>
        ) : (
          <div className="grid min-w-0 grid-cols-1 items-start gap-[var(--lms-space-4)] md:grid-cols-2">
            <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">
              Audience
              <Select
                className="min-h-11 w-full md:min-h-9"
                value={target}
                onChange={(event) => setTarget(event.target.value)}
              >
                {targets.map((entry) => (
                  <option key={`${entry.type}:${entry.id}`} value={`${entry.type}:${entry.id}`}>
                    {entry.type} · {entry.label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">
              Title
              <Input className="w-full" value={title} maxLength={255} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] md:col-span-2 text-[13px]">
              Message
              <Textarea rows={6} className="w-full" value={message} maxLength={10000} onChange={(e) => setMessage(e.target.value)} />
            </label>
            <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">
              Schedule · local time
              <Input className="w-full" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </label>
            <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">
              Show until · local time
              <Input className="w-full" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </label>
            <label className="flex min-h-11 items-center gap-3 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              <Checkbox checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
              Pin for recipients
            </label>
            {!createTiming.valid?<p role="alert" className="md:col-span-2 text-sm text-danger-text">Invalid timing: expiry must follow the schedule.</p>:null}
            <div className="md:col-span-2 flex min-w-0 justify-stretch md:justify-end [&>button]:w-full md:[&>button]:w-auto">
              <Button disabled={pending || !title.trim() || !message.trim() || !target || !createTiming.valid} onClick={requiresPublicationConsent?()=>setReviewPublish(true):create}>
                {requiresPublicationConsent?"Review publication":pending?"Creating…":"Create announcement"}
              </Button>
            </div>
          </div>
        )}
        </section>
      </Dialog>

      <section className="min-w-0 space-y-[var(--lms-space-3)]">
        <h2 className="m-0 text-lg font-semibold text-foreground">Announcements</h2>
        {items.length === 0 ? (
          <EmptyState title={emptyMessage==="No announcements in this view."?"Nothing sent yet":emptyMessage} description={emptyMessage==="No announcements in this view."?undefined:emptyMessage}/>
        ) : (
          items.map((item) => {
            const targetLabel = targetLabels.get(`${item.receiverType}:${item.receiverId}`) ?? item.receiverId;
            return (
              <article key={item.id} id={"announcement-"+item.id}
               className={"flex min-w-0 flex-col gap-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 shadow-sm "+
                 (item.isPinned?"border-l-[3px] border-l-[var(--lms-primary)]":"")}>
                <header className="min-w-0 space-y-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    {item.isPinned?<svg role="img" aria-label="Pinned" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"
                      className="shrink-0 text-[var(--lms-primary-text)]">
                      <path d="M16 3 21 8l-3 1-3 5v3l-1 1-4-4-4 4-1-1 4-4-4-4 1-1h3l5-3z"/>
                    </svg>:null}
                    <h3 className="m-0 min-w-0 break-words text-base font-semibold text-[var(--lms-heading)]">{item.title}</h3>
                    {item.version>1 || (item.updatedAt&&item.updatedAt!==item.createdAt)
                      ?<Badge tone="neutral">Updated</Badge>:null}
                    {item.visibilityState==="SCHEDULED"?<Badge tone="warning">Scheduled for {announcementWhen(item.scheduledAt)}</Badge>:null}
                    {item.visibilityState==="EXPIRED"?<Badge tone="neutral">Ended</Badge>:null}
                  </div>
                  <p className="text-xs text-muted-foreground">{[
                    item.authorName||item.senderType,
                    announcementWhen(item.sentAt??item.createdAt),
                    item.expiresAt&&item.visibilityState!=="EXPIRED"?"shows until "+announcementWhen(item.expiresAt):null,
                   ].filter(Boolean).join(" · ")}</p>
                  <span className="inline-flex text-xs text-muted-foreground">{item.receiverType} · {targetLabel}</span>
                </header>
                <p className="min-w-0 whitespace-pre-wrap break-words text-sm leading-[1.6] text-body"><LinkifiedAnnouncement body={item.message}/></p>
                {item.buttonUrl&&/^https:\/\/[^\s]+$/i.test(item.buttonUrl)?
                  <div className="flex flex-wrap"><a href={item.buttonUrl} target="_blank" rel="noopener noreferrer"
                   className="inline-flex min-h-11 items-center gap-2 rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-link hover:border-[var(--lms-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
                    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
                     <path d="M10 13a5 5 0 0 0 7.1 0l2.1-2.1a5 5 0 0 0-7.1-7.1L11 5"/>
                     <path d="M14 11a5 5 0 0 0-7.1 0l-2.1 2.1a5 5 0 1 0 7.1 7.1L13 19"/>
                    </svg>{item.buttonLabel||"Open"}
                   </a></div>:null}
                <footer className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-[var(--lms-canvas-border)] pt-3">
                  <span className="text-xs text-muted-foreground">{item.visibilityState==="LIVE"?"Published":item.visibilityState.toLowerCase()}</span>
                  <div className="flex flex-wrap gap-2">
                    {item.deliveryOutboxId&&item.deliveryCollegeId&&(item.deliveryStatus==="FAILED"||item.deliveryStatus==="SCHEDULED")?
                      <Button size="sm" variant="secondary" disabled={pending} onClick={()=>setDeliveryAction(item)}>
                        {item.deliveryStatus==="FAILED"?"Retry":"Send now"}
                      </Button>:null}
                    {isBroadcastCopy(item)?<span role="status" className="text-xs text-muted-foreground">Edit placement-cell broadcasts together</span>
                    :!item.deletedAt?<>
                      <Button size="sm" variant="secondary" disabled={pending} onClick={()=>{setEditConsent(false);setEditing(item);}}>Edit</Button>
                      <Button size="sm" variant="danger" disabled={pending} onClick={()=>setConfirmDelete(item)}>Delete</Button>
                      <Button size="sm" variant="ghost" disabled={pending} onClick={()=>mutate(item,"PIN")}>{item.isPinned?"Unpin":"Pin"}</Button>
                     </>:<Button size="sm" disabled={pending} onClick={()=>mutate(item,"RESTORE")}>Restore</Button>}
                  </div>
                </footer>
              </article>
            );
          })
        )}
      </section>




      <Dialog open={Boolean(deliveryAction)} onOpenChange={next=>{if(!next&&!pending)setDeliveryAction(null);}}
       dismissible={!pending} title="Send existing notification now"
       description="This retries delivery of the saved notification. It does not create a new announcement or alter the message."
       footer={<div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" disabled={pending} onClick={()=>setDeliveryAction(null)}>Cancel</Button>
        <Button disabled={pending} onClick={()=>{if(deliveryAction)requeueDelivery(deliveryAction);}}>{pending?"Queueing…":"Send now"}</Button>
       </div>}>
        <p className="text-sm text-body">The existing content and audience are retained for this delivery attempt.</p>
      </Dialog>
      {requiresPublicationConsent?<Dialog open={reviewPublish} dismissible={!pending} onOpenChange={next=>{if(!pending)setReviewPublish(next);}} title="Confirm announcement publication"
       description="The selected recipients will see this notice when it becomes visible. This does not send external SMS or email."
       footer={<div className="flex w-full flex-col-reverse gap-[var(--lms-space-2)] md:flex-row md:justify-end [&>button]:w-full md:[&>button]:w-auto"><Button variant="secondary" disabled={pending} onClick={()=>setReviewPublish(false)}>Cancel</Button>
         <Button disabled={pending} onClick={create}>{pending?"Publishing…":"Confirm and publish"}</Button></div>}>
       <ul className="list-disc space-y-1 pl-5 text-sm text-body">
        {platformAnnouncementPublicationSummary({
          receiverType:splitTarget(target).receiverType,
          receiverLabel:targetLabels.get(target)??"Selected audience",
          title,scheduledAt:createTiming.scheduledAt,expiresAt:createTiming.expiresAt,isPinned:pinned,
        }).map(line=><li key={line}>{line}</li>)}
       </ul>
       <p className="mt-3 text-xs text-muted-foreground">You are confirming publication to the selected audience. No external outbound delivery is initiated.</p>
      </Dialog>:null}
      <Dialog
        open={Boolean(confirmDelete)}
        onOpenChange={(open) => { if (!open && !pending) setConfirmDelete(null); }}
        dismissible={!pending}
        title="Delete this announcement?"
        description="Placement cells stop seeing it."
        footer={<div className="flex w-full flex-col-reverse gap-[var(--lms-space-2)] md:flex-row md:justify-end [&>button]:w-full md:[&>button]:w-auto">
          <Button variant="secondary" disabled={pending} onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="danger" disabled={pending} onClick={() => { if (confirmDelete) mutate(confirmDelete, "DELETE"); }}>{pending ? "Deleting…" : "Delete"}</Button>
        </div>}
      >
        <p className="text-sm text-body">Placement cells stop seeing this announcement after deletion.</p>
      </Dialog>
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => { if (!open&&!pending) setEditing(null); }}
        dismissible={!pending}
        title="Edit announcement"
        description="Retargeting is re-authorized server-side against both the old and new tenant scope."
        footer={
          <div className="flex w-full flex-col-reverse gap-[var(--lms-space-2)] md:flex-row md:justify-end [&>button]:w-full md:[&>button]:w-auto">
            <Button variant="secondary" disabled={pending} onClick={() => setEditing(null)}>Cancel</Button>
            <Button disabled={pending || !editing || (requiresPublicationConsent&&!editConsent)} onClick={saveEdit}>{pending ? "Saving…" : requiresPublicationConsent ? "Confirm reviewed changes" : "Save"}</Button>
          </div>
        }
      >
        {editing ? (
          <form id="announcement-edit-form" ref={editFormRef} className="grid gap-[var(--lms-space-4)]">
            {requiresPublicationConsent?<label className="flex items-start gap-2 text-sm text-body">
              <Checkbox checked={editConsent} onChange={e=>setEditConsent(e.target.checked)} />
              I reviewed the audience and notice contents and consent to applying changes to recipients.
            </label>:null}
            <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">
              Audience
              <Select
                name="target"
                defaultValue={`${editing.receiverType}:${editing.receiverId}`}
                disabled={isBroadcastCopy(editing)}
                className="min-h-11 w-full md:min-h-9"
              >
                {!targets.some(
                  (entry) =>
                    entry.type === editing.receiverType &&
                    entry.id === editing.receiverId,
                ) ? (
                  <option value={`${editing.receiverType}:${editing.receiverId}`}>
                    {editing.receiverType} · Current target unavailable
                  </option>
                ) : null}
                {targets.map((entry) => (
                  <option key={`${entry.type}:${entry.id}`} value={`${entry.type}:${entry.id}`}>
                    {entry.type} · {entry.label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">
              Title
              <Input name="title" defaultValue={editing.title} maxLength={editing.senderType === "SUPER_ADMIN" ? 200 : 255} className="w-full" />
            </label>
            <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">
              Message
              <Textarea rows={6} name="message" defaultValue={editing.message} maxLength={editing.senderType === "SUPER_ADMIN" ? 8000 : 10000} className="w-full" />
            </label>
            <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">
              Schedule · local time
              <Input name="scheduledAt" type="datetime-local" defaultValue={localInputValue(editing.scheduledAt)} className="w-full" />
            </label>
            <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">
              Show until · local time
              <Input name="expiresAt" type="datetime-local" defaultValue={localInputValue(editing.expiresAt)} className="w-full" />
            </label>
            <label className="flex items-center gap-3 text-sm font-semibold text-body">
              <Checkbox name="isPinned" defaultChecked={editing.isPinned} />
              Pin for recipients
            </label>
          </form>
        ) : null}
      </Dialog>
    </div>
  );
}
