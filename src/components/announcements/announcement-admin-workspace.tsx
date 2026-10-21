"use client";
import {Select} from "@/components/ui/select";
import {EmptyState} from "@/components/ui/empty-state";
import {Disclosure} from "@/components/ui/disclosure";
import {Dropdown} from "@/components/ui/dropdown";
import { Menu, MenuItem } from "@/components/ui/menu";


import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
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
      <Disclosure title="Create announcement" className="min-w-0" contentClassName="pb-[var(--lms-space-4)]">
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
              <Textarea className="w-full" value={message} maxLength={10000} onChange={(e) => setMessage(e.target.value)} />
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
      </Disclosure>

      <section className="min-w-0 space-y-[var(--lms-space-3)]">
        <h2 className="m-0 text-lg font-semibold text-foreground">Announcements</h2>
        {items.length === 0 ? (
          <EmptyState title="No announcements" description={emptyMessage}/>
        ) : (
          items.map((item) => {
            const targetLabel = targetLabels.get(`${item.receiverType}:${item.receiverId}`) ?? item.receiverId;
            const safeLink = safeAnnouncementLink(item.message);
            return (
              <article key={item.id} className="min-w-0 border-t border-border py-[var(--lms-space-4)]">
                <div className="flex flex-col gap-3 min-[768px]:flex-row min-[768px]:items-start min-[768px]:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                      <span>{item.receiverType} · {targetLabel}</span>
                      {item.isPinned ? <span>· Pinned</span> : null}
                      <span>· {item.visibilityState.charAt(0) + item.visibilityState.slice(1).toLowerCase()}</span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-body">{item.message}</p>
                    {item.buttonLabel&&item.buttonUrl&&/^https:\/\/[^\s]+$/i.test(item.buttonUrl)?<a href={item.buttonUrl}
                      className="mt-2 inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-[650] text-[var(--lms-link-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
                      {item.buttonLabel} ↗
                    </a>:null}
                    {safeLink ? <a href={safeLink} className="mt-2 inline-flex min-h-11 items-center break-all text-sm font-semibold text-[var(--lms-link-text)] underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Open linked resource ↗</a> : null}
                    {item.expiresAt ? <p className="mt-2 text-xs text-muted-foreground">Show until {new Date(item.expiresAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"})} IST</p> : null}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Sender: {item.senderType} · Version {item.version}
                    </p>
                  </div>
                  <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-start gap-[var(--lms-space-2)] min-[768px]:justify-end">
                    {isBroadcastCopy(item) ? (
                      <span role="status" className="max-w-56 text-xs text-muted-foreground">Group-wide broadcast editing and withdrawal are not available yet.</span>
                    ) : !item.deletedAt ? (
                      <>
                        <Button size="sm" variant="secondary" disabled={pending} onClick={() => {setEditConsent(false);setEditing(item);}}>Edit</Button>
                        <Dropdown trigger="More" label="Announcement actions" align="end" mobileSheet triggerClassName="md:!min-h-9">
                          <Menu className="w-full min-w-0">
                            <MenuItem disabled={pending} onClick={() => mutate(item, "PIN")}>{item.isPinned ? "Unpin" : "Pin"}</MenuItem>
                            <MenuItem disabled={pending} onClick={() => setConfirmDelete(item)}>Delete</MenuItem>
                          </Menu>
                        </Dropdown>
                      </>
                    ) : (
                      <Button size="sm" disabled={pending} onClick={() => mutate(item, "RESTORE")}>Restore</Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>




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
        description="Recipients will stop seeing this announcement."
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
            <Button disabled={pending || !editing || (requiresPublicationConsent&&!editConsent)} onClick={saveEdit}>{pending ? "Saving…" : "Confirm reviewed changes"}</Button>
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
              <Textarea name="message" defaultValue={editing.message} maxLength={editing.senderType === "SUPER_ADMIN" ? 8000 : 10000} className="w-full" />
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
