"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Disclosure } from "@/components/ui/disclosure";

import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import {useRouter} from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { apiFetch } from "@/lib/api-fetch";

type Option = { id: string; name: string };
type ClassOption = Option & { cohortName: string; periodStart: string; periodEnd: string; updatedAt: string };
type FacultyOption = { id: string; displayName: string | null };
type DeliveryOption = { id: string; sectionId: string; name: string; code: string };
type Result = { slots: Array<{ startsAt: string; endsAt: string; localDate: string; conflicts: string[] }>;
  ready: number; blocked: number; notice: string };

/** Recurring preview is always displayed in IST regardless of device timezone. */
export function recurringSlotTimeIst(slot: Pick<Result["slots"][number], "startsAt" | "endsAt">): string {
  const format = new Intl.DateTimeFormat("en-IN", {
    timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit",
  });
  return format.format(new Date(slot.startsAt))+" – "+format.format(new Date(slot.endsAt));
}

export function CollegeRecurringPreview({
  classes, halls, faculty, deliveries, defaultSectionId = "",
}: { classes: ClassOption[]; halls: Option[]; faculty: FacultyOption[]; deliveries: DeliveryOption[];
  defaultSectionId?: string }) {
  const router=useRouter();
  const chosen = classes.find(item => item.id === defaultSectionId);
  const [sectionId, setSectionId] = useState(chosen?.id ?? "");
  const [title, setTitle] = useState("Class session");
  const [deliveryId, setDeliveryId] = useState("");
  const [skipped, setSkipped] = useState<Array<{localDate:string;reasons:string[]}>>([]);
  const [created, setCreated] = useState<number | null>(null);
  const [requested,setRequested]=useState<number|null>(null);
  const [savedSessionIds,setSavedSessionIds]=useState<string[]>([]);
  const [discardOpen,setDiscardOpen]=useState(false);
  const [dirty,setDirty]=useState(false);
  useEffect(()=>{
   if(!dirty)return;
   const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
   window.addEventListener("beforeunload",warn);
   return ()=>window.removeEventListener("beforeunload",warn);
  },[dirty]);
  const [lastPreviewKey, setLastPreviewKey] = useState("");
  function previewKey() {
    return JSON.stringify({sectionId,from,to,weekdays,startTime,endTime,title,facultyId,hallId,deliveryId});
  }
  const [from, setFrom] = useState(chosen?.periodStart ?? "");
  const [to, setTo] = useState(chosen?.periodEnd ?? "");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [hallId, setHallId] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const selected = classes.find((item) => item.id === sectionId);
  const previewChanged = Boolean(result && lastPreviewKey !== previewKey());
  const invalidRange = Boolean((from && to && from > to) || (startTime && endTime && endTime <= startTime));
  function onClass(id: string) {
    setSectionId(id);
    setDirty(true);
    setDeliveryId("");
    const entry = classes.find((item) => item.id === id);
    setFrom(entry?.periodStart ?? "");
    setTo(entry?.periodEnd ?? "");
    setResult(null);
    setCreated(null);
    setError("");
    setLastPreviewKey("");
  }
  function preview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDirty(true);
    if (pending || invalidRange) return;
    setError("");
    setResult(null);
    setCreated(null);
    startTransition(async () => {
      try {
        const payload=await apiFetch<Result>("/api/academics/sections/recurring-preview", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sectionId, from, to, weekdays, startTime, endTime,
            facultyMembershipId: facultyId || null, lectureHallId: hallId || null,
            deliveryId: deliveryId || null,
          }),
        });
        setResult(payload);
        setLastPreviewKey(previewKey());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Schedule preview failed");
      }
    });
  }
  function execute() {
    if (pending || previewChanged || !selected?.updatedAt || !result || result.ready===0) return;
    if (lastPreviewKey !== previewKey()) {
      setError("Schedule fields changed since the preview. Preview this pattern again before saving.");
      return;
    }
    setConfirming(true);
  }
  function confirmExecute() {
    if (pending) return;
    setConfirming(false);
    const version = selected?.updatedAt;
    if (!version || !result || result.ready===0) return;
    if (lastPreviewKey !== previewKey()) {
      setError("Schedule fields changed since the preview. Preview this pattern again before saving.");
      return;
    }
    setError("");
    setCreated(null);
    setSkipped([]);
    startTransition(async () => {
      try {
        const value=await apiFetch<{created?:number;requested?:number;sessionIds?:string[];skipped?:Array<{localDate:string;reasons:string[]}>}>(
          "/api/academics/sections/recurring-execute",{
          method: "POST", headers: {"content-type":"application/json"},
          body: JSON.stringify({
            sectionId,from,to,weekdays,startTime,endTime,title,
            facultyMembershipId:facultyId||null,lectureHallId:hallId||null,
            deliveryId: deliveryId || null,
            expectedSectionUpdatedAt:version,confirm:true,
          }),
        });
        setCreated(value.created ?? 0);
        setRequested(value.requested ?? result.slots.length);
        setSavedSessionIds(value.sessionIds ?? []);
        setDirty(false);
        setSkipped(value.skipped ?? []);
        setResult(null);
        setLastPreviewKey("");
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Scheduling failed");
      }
    });
  }
  return (
    <section className="min-w-0 space-y-[var(--lms-space-4)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-semibold">Create recurring class schedule</h2>
         <p className="max-w-[75ch] text-sm text-body leading-[22px]">Preview does not create sessions. Confirmed execution rechecks conflicts and creates only clear dates.</p></div>
        <Button type="button" variant="secondary" disabled={pending} onClick={()=>dirty?setDiscardOpen(true):router.push("/college/classes")}>Cancel</Button>
      </div>
      {classes.length === 0 ? (
        <Alert tone="info">
          No active classes are registered for this college. Create a class before previewing a schedule.
        </Alert>
      ) : (
        <form onSubmit={preview} onChange={()=>setDirty(true)} aria-busy={pending} className="min-w-0 space-y-[var(--lms-space-4)]">
          <div className="grid min-w-0 gap-[var(--lms-space-4)] md:grid-cols-2">
          <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Session title
            <Input disabled={pending} required maxLength={160} value={title} onChange={e=>setTitle(e.target.value)}
              className="min-h-11 min-w-0 md:min-h-9"/>
          </label>
          <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class
            <Select disabled={pending} required value={sectionId} onChange={(e) => onClass(e.target.value)}
              className="min-h-11 min-w-0 md:min-h-9">
              <option value="">Select a class</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.cohortName}</option>)}
            </Select>
          </label>
          {selected ? <p className="text-xs text-muted-foreground leading-[20px]">Academic period: {selected.periodStart} to {selected.periodEnd}</p> : null}
          <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Course (optional)
            <Select value={deliveryId} onChange={e => setDeliveryId(e.target.value)}
              disabled={pending || !sectionId} className="min-h-11 min-w-0 md:min-h-9">
              <option value="">No course linked</option>
              {deliveries.filter(item => item.sectionId === sectionId).map(item =>
                <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}
            </Select>
          </label>
          </div>
          <div className="grid min-w-0 gap-[var(--lms-space-3)] md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">From
              <Input disabled={pending} type="date" required value={from} min={selected?.periodStart} max={selected?.periodEnd}
                onChange={(e) => setFrom(e.target.value)}
                className="min-h-11 min-w-0 md:min-h-9" />
            </label>
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">To (up to 93 days)
              <Input disabled={pending} type="date" required value={to} min={from || selected?.periodStart} max={selected?.periodEnd}
                onChange={(e) => setTo(e.target.value)}
                className="min-h-11 min-w-0 md:min-h-9" />
            </label>
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Start (IST)
              <Input disabled={pending} type="time" required value={startTime} step={300} onChange={(e) => setStartTime(e.target.value)}
                className="min-h-11 min-w-0 md:min-h-9" />
            </label>
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">End (IST)
              <Input disabled={pending} type="time" required value={endTime} step={300} onChange={(e) => setEndTime(e.target.value)}
                className="min-h-11 min-w-0 md:min-h-9" />
            </label>
          </div>
          <fieldset className="min-w-0 space-y-[var(--lms-space-3)]">
            <legend className="text-sm font-semibold text-body">Repeat on weekdays</legend>
            <p className="text-xs text-muted-foreground">Day names map to Sunday=0 through Saturday=6, in India Standard Time.</p>
            <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
             <Checkbox disabled={pending} checked={weekdays.length===7}
               onChange={e=>{setDirty(true);setWeekdays(e.target.checked?[0,1,2,3,4,5,6]:[]);}} />
             Every day
            </label>
            <div className="grid min-w-0 grid-cols-2 gap-[var(--lms-space-2)] sm:grid-cols-4 lg:grid-cols-7">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                <label key={day} className="flex min-h-11 min-w-0 items-center gap-[var(--lms-space-2)] rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] px-[var(--lms-space-3)] text-sm text-body">
                  <Checkbox disabled={pending} checked={weekdays.includes(index)}
                    onChange={(e) => setWeekdays((current) => e.target.checked
                      ? [...current, index].sort()
                      : current.filter((n) => n !== index))} />
                  {day}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Leave every day unchecked to repeat daily. Times use five-minute steps (IST).</p>
          </fieldset>
          <Disclosure title="Optional teaching details" defaultOpen={Boolean(facultyId || hallId)} className="min-w-0 border-b border-[var(--lms-canvas-border)]" contentClassName="min-w-0 py-3"><div className="grid min-w-0 gap-[var(--lms-space-3)] md:grid-cols-2">
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Faculty (optional)
              <Select disabled={pending} value={facultyId} onChange={(e) => setFacultyId(e.target.value)}
                className="min-h-11 min-w-0 md:min-h-9">
                <option value="">No faculty selected</option>
                {faculty.map((f) => <option key={f.id} value={f.id}>{f.displayName || "Unnamed faculty"}</option>)}
              </Select>
            </label>
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Lecture hall (optional)
              <Select disabled={pending} value={hallId} onChange={(e) => setHallId(e.target.value)}
                className="min-h-11 min-w-0 md:min-h-9">
                <option value="">No lecture hall selected</option>
                {halls.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </Select>
            </label>
          </div></Disclosure>
          {invalidRange ? <Alert tone="error">{from && to && from > to ? "To date cannot be earlier than From date." : "End time must be after start time."}</Alert> : null}
          <Button type="submit" loading={pending} className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={pending || invalidRange || !sectionId || !from || !to}>
            {pending ? "Checking conflicts…" : "Preview sessions"}
          </Button>
          {error ? <Alert tone="error">{error}</Alert> : null}
        </form>
      )}
      {created !== null ? <Alert tone="success" className="space-y-2">
        <p role="status">{created === 0 ? "No sessions were scheduled. " : ""}Scheduled {created} of {requested??created+skipped.length} sessions. Failed or skipped: {skipped.length}.</p>
        {savedSessionIds.length>0?<p className="text-xs text-body">Created session IDs: {savedSessionIds.join(", ")}</p>:null}
        {skipped.length > 0 && <>
          <p className="font-semibold">These dates were skipped:</p>
          <ul className="list-inside list-disc">{skipped.map(item =>
            <li key={item.localDate}>{item.localDate}: {item.reasons.map(reason => reason.replaceAll("_", " ")).join(", ")}</li>)}</ul>
        </>}
      </Alert> : null}
      {result ? <section aria-label="Schedule preview results" className="min-w-0 space-y-[var(--lms-space-3)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)]">
        <h2 className="m-0 font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Preview · {result.ready} clear, {result.blocked} blocked</h2>
        <p className="max-w-prose text-sm text-muted-foreground leading-[22px]">{result.notice}</p>
        {previewChanged ? <Alert tone="warning">Schedule fields changed since the preview. Preview this pattern again before saving.</Alert> : null}
        <Button type="button" loading={pending} className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={pending || previewChanged || !title.trim() || result.ready===0}
          onClick={execute}>{pending?"Creating…":"Confirm and create "+result.ready+" sessions"}</Button>
        {result.blocked>0 ? <Alert tone="warning">Conflicting dates will be skipped; clear dates may still be created.</Alert> : null}
        {result.slots.length === 0 ? <EmptyState title="No matching dates" description="No selected weekdays match this date range."/> : (
          <div className="max-h-[32rem] min-w-0 overflow-y-auto border-y border-[var(--lms-canvas-border)]">
            <DataTable<Result["slots"][number]>
              caption="Recurring sessions preview"
              rows={result.slots}
              getRowKey={slot => slot.startsAt}
              empty={<EmptyState title="No matching dates" description="No selected weekdays match this date range."/>}
              columns={[
                {key:"date",header:"Date (IST)",mobilePriority:"primary",cell:slot=>slot.localDate},
                {key:"time",header:"Time (IST)",mobilePriority:"secondary",cell:recurringSlotTimeIst},
                {key:"conflicts",header:"Conflicts",mobilePriority:"secondary",cell:slot=>
                  slot.conflicts.length ?
                    slot.conflicts.map(reason=>reason.replaceAll("_"," ")).join(", ") :
                    "None detected"},
              ]}
            />
          </div>
        )}
      </section> : null}
      <ConfirmDialog open={discardOpen} onOpenChange={setDiscardOpen}
        title="Discard recurring schedule changes?"
        description="Your unsaved session pattern and preview will be lost."
        confirmLabel="Discard changes" onConfirm={()=>{setDirty(false);setDiscardOpen(false);router.push("/college/classes");}}/>
      <ConfirmDialog open={confirming} onOpenChange={setConfirming}
        title="Create recurring sessions?"
        description={`Create ${result?.ready ?? 0} clear sessions? Conflicting dates will be skipped and listed after saving.`}
        confirmLabel="Create sessions" pending={pending} onConfirm={confirmExecute}/>
    </section>
  );
}
