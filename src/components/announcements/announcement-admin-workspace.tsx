"use client";
import {Select} from "@/components/ui/select";


import { useMemo, useState, useTransition } from "react";
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
  const [target, setTarget] = useState(
    targets[0] ? `${targets[0].type}:${targets[0].id}` : "",
  );
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [pinned, setPinned] = useState(false);
  const [editing, setEditing] = useState<AnnouncementAdminItem | null>(null);
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
    if (!target || !createTiming.valid) return;
    const receiver = splitTarget(target);
    startTransition(async () => {
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
    });
  }

  function mutate(
    item: AnnouncementAdminItem,
    action: "DELETE" | "RESTORE" | "PIN",
  ) {
    startTransition(async () => {
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
      router.refresh();
    });
  }

  function saveEdit() {
    if (!editing) return;
    const form = document.querySelector<HTMLFormElement>("#announcement-edit-form");
    if (!form) return;
    const data = new FormData(form);
    const targetValue = String(data.get("target") ?? "");
    const receiver = splitTarget(targetValue);
    const editTiming = announcementLocalTiming(String(data.get("scheduledAt") ?? ""), String(data.get("expiresAt") ?? ""));
    if (!editTiming.valid) {
      showToast({tone:"error",title:"Invalid announcement timing",description:"Expiry must be after the scheduled time."});
      return;
    }
    startTransition(async () => {
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
      showToast({ tone: "success", title: "Announcement updated" });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <div>
          <h2 className="m-0 text-lg font-semibold text-foreground">Create announcement</h2>
          <p className="mt-1 text-sm text-body">
            Target options are resolved from the current college scope. Messages render as plain text.
          </p>
        </div>
        {targets.length === 0 ? (
          <p className="text-sm text-muted-foreground">Select a college scope before creating an announcement.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-body">
              Audience
              <Select
                className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3"
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
            <label className="text-sm font-semibold text-body">
              Title
              <Input className="mt-1" value={title} maxLength={255} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="md:col-span-2 text-sm font-semibold text-body">
              Message
              <Textarea className="mt-1" value={message} maxLength={10000} onChange={(e) => setMessage(e.target.value)} />
            </label>
            <label className="text-sm font-semibold text-body">
              Schedule · local time
              <Input className="mt-1" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </label>
            <label className="text-sm font-semibold text-body">
              Show until · local time
              <Input className="mt-1" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </label>
            <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-body">
              <Checkbox checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
              Pin for recipients
            </label>
            {!createTiming.valid?<p role="alert" className="md:col-span-2 text-sm text-danger-text">Invalid timing: expiry must follow the schedule.</p>:null}
            <div className="md:col-span-2">
              <Button disabled={pending || !title.trim() || !message.trim() || !target || !createTiming.valid} onClick={requiresPublicationConsent?()=>setReviewPublish(true):create}>
                {requiresPublicationConsent?"Review publication":pending?"Creating…":"Create announcement"}
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="m-0 text-lg font-semibold text-foreground">Announcements</h2>
        {items.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          items.map((item) => {
            const targetLabel = targetLabels.get(`${item.receiverType}:${item.receiverId}`) ?? item.receiverId;
            const safeLink = safeAnnouncementLink(item.message);
            return (
              <article key={item.id} className="rounded-xl border border-border bg-surface p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                      <span>{item.receiverType} · {targetLabel}</span>
                      {item.isPinned ? <span>· Pinned</span> : null}
                      <span>· {item.visibilityState.charAt(0) + item.visibilityState.slice(1).toLowerCase()}</span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-body">{item.message}</p>
                    {item.buttonLabel&&item.buttonUrl&&/^https:\/\/[^\s]+$/i.test(item.buttonUrl)?<a href={item.buttonUrl}
                      className="mt-2 inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm font-semibold text-[var(--lms-teal-deep)]">
                      {item.buttonLabel} ↗
                    </a>:null}
                    {safeLink ? <a href={safeLink} className="mt-2 inline-flex min-h-11 items-center break-all text-sm font-semibold text-[var(--lms-teal-deep)] underline">Open linked resource ↗</a> : null}
                    {item.expiresAt ? <p className="mt-2 text-xs text-muted-foreground">Show until {new Date(item.expiresAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</p> : null}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Sender: {item.senderType} · Version {item.version}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {!item.deletedAt ? (
                      <>
                        <Button size="sm" variant="secondary" disabled={pending} onClick={() => {setEditConsent(false);setEditing(item);}}>Edit</Button>
                        <Button size="sm" variant="secondary" disabled={pending} onClick={() => mutate(item, "PIN")}>
                          {item.isPinned ? "Unpin" : "Pin"}
                        </Button>
                        <Button size="sm" variant="danger" disabled={pending} onClick={() => mutate(item, "DELETE")}>Delete</Button>
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

      {requiresPublicationConsent?<Dialog open={reviewPublish} onOpenChange={setReviewPublish} title="Confirm announcement publication"
       description="The selected recipients will see this notice when it becomes visible. This does not send external SMS or email."
       footer={<><Button variant="secondary" disabled={pending} onClick={()=>setReviewPublish(false)}>Cancel</Button>
         <Button disabled={pending} onClick={create}>{pending?"Publishing…":"Confirm and publish"}</Button></>}>
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
        open={Boolean(editing)}
        onOpenChange={(open) => { if (!open) setEditing(null); }}
        title="Edit announcement"
        description="Retargeting is re-authorized server-side against both the old and new tenant scope."
        footer={
          <>
            <Button variant="secondary" disabled={pending} onClick={() => setEditing(null)}>Cancel</Button>
            <Button disabled={pending || !editing || (requiresPublicationConsent&&!editConsent)} onClick={saveEdit}>{pending ? "Saving…" : "Confirm reviewed changes"}</Button>
          </>
        }
      >
        {editing ? (
          <form id="announcement-edit-form" className="grid gap-4">
            {requiresPublicationConsent?<label className="flex items-start gap-2 text-sm text-body">
              <Checkbox checked={editConsent} onChange={e=>setEditConsent(e.target.checked)} />
              I reviewed the audience and notice contents and consent to applying changes to recipients.
            </label>:null}
            <label className="text-sm font-semibold text-body">
              Audience
              <Select
                name="target"
                defaultValue={`${editing.receiverType}:${editing.receiverId}`}
                className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3"
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
            <label className="text-sm font-semibold text-body">
              Title
              <Input name="title" defaultValue={editing.title} maxLength={255} className="mt-1" />
            </label>
            <label className="text-sm font-semibold text-body">
              Message
              <Textarea name="message" defaultValue={editing.message} maxLength={10000} className="mt-1" />
            </label>
            <label className="text-sm font-semibold text-body">
              Schedule · local time
              <Input name="scheduledAt" type="datetime-local" defaultValue={localInputValue(editing.scheduledAt)} className="mt-1" />
            </label>
            <label className="text-sm font-semibold text-body">
              Show until · local time
              <Input name="expiresAt" type="datetime-local" defaultValue={localInputValue(editing.expiresAt)} className="mt-1" />
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
