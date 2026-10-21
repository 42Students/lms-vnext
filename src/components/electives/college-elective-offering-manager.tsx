"use client";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {apiFetch} from "@/lib/api-fetch";
import { useToast } from "@/components/ui/toast";

type Delivery = { id: string; courseId: string; course: string; code: string; section: string };
type Group = { id: string; name: string; capacity: number | null };
type Offering = {
  offeringId: string; courseId: string; courseName: string; courseCode: string;
  backedDeliveryId: string; groupId: string; capacity: number | null;
  activeMembers: number; waitlistedCount: number; status: string; version: number;
  facultyNames?: string[]; facultyCount?: number;
};
type Load = { deliveries: Delivery[]; groups: Group[]; offerings: Offering[] };

export function CollegeElectiveOfferingManager({ slotId }: { slotId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Load | null>(null);
  const [editing, setEditing] = useState<Offering | null>(null);
  const [deliveryId, setDeliveryId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [capacity, setCapacity] = useState("30");
  const [busy, setBusy] = useState(false);
  const [dirty,setDirty]=useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const api = "/api/academics/elective-slots/" + encodeURIComponent(slotId) + "/offerings";

  async function load() {
    setLoading(true); setError("");
    try {
      const next = await apiFetch<Load>(api, { cache: "no-store" });
      setData(next);
      if (!editing) setDeliveryId(next.deliveries[0]?.id ?? "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load offerings");
    } finally { setLoading(false); }
  }

  async function open() {
    if (opened) { close(); return; }
    setOpened(true); setEditing(null);setDirty(false);setMessage("");
    await load();
  }

  function close(){
    if(busy)return;
    if(dirty&&!window.confirm("Discard these elective changes?"))return;
    setDirty(false);setEditing(null);setOpened(false);
  }

  function startEdit(offering: Offering) {
    setEditing(offering);setDirty(false);
    setDeliveryId(offering.backedDeliveryId);
    // Null is legacy unlimited; never silently replace it with 30 seats.
    setCapacity(offering.capacity === null ? "" : String(offering.capacity));
    setError(""); setMessage("");
  }

  async function save() {
    const delivery = data?.deliveries.find(row => row.id === deliveryId);
    const number = Number(capacity);
    if (!capacity.trim()) {
      setError(editing?.capacity === null
        ? "This offering has unlimited seats. Enter a seat limit to change it; keeping unlimited requires the college capacity policy to be enabled."
        : "Enter a capacity from 1 to 100000. Unlimited seats are not yet supported when saving.");
      return;
    }
    if (!delivery || !Number.isInteger(number) || number < 1 || number > 100000) {
      setError("Select an eligible course and enter a capacity from 1 to 100000.");
      return;
    }
    if (editing && number < editing.activeMembers) {
      setError("Capacity cannot be lower than enrolled students.");
      return;
    }
    if (!window.confirm(editing ? "Save changes to this elective offering?" : "Add this course to the elective slot?"))
      return;
    setBusy(true); setError(""); setMessage("");
    const url = editing ? api + "/" + encodeURIComponent(editing.offeringId) : api;
    try {
      await apiFetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          courseId: delivery.courseId, backedDeliveryId: delivery.id, capacity: number,
          ...(editing ? { expectedVersion: editing.version } : { groupId: groupId || undefined }),
        }),
      });
      const message = editing
        ? editing.capacity !== number && editing.backedDeliveryId === delivery.id
          ? "Capacity updated" : "Offering updated"
        : "Offering added";
      setMessage(message);
      showToast({ tone: "success", title: message });
      setEditing(null); setGroupId("");setDirty(false);
      await load(); router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save elective offering");
    } finally { setBusy(false); }
  }

  async function archive(offering: Offering) {
    if (!window.confirm("Archive this elective offering? Existing members are retained read-only.")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await apiFetch(api + "/" + encodeURIComponent(offering.offeringId), {
        method: "DELETE", headers: { "content-type": "application/json" },
        body: JSON.stringify({ expectedVersion: offering.version }),
      });
      setMessage("Offering archived");
      showToast({ tone: "success", title: "Offering archived" });
      await load(); router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to archive offering");
    } finally { setBusy(false); }
  }

  const offered = new Set(data?.offerings.filter(row => row.status === "ACTIVE").map(row => row.courseId) ?? []);
  const selectable = (data?.deliveries ?? []).filter(row =>
    (editing && row.courseId === editing.courseId) || !offered.has(row.courseId));
  return <div className="min-w-0">
    <Button variant="secondary" type="button" onClick={() => void open()}
      >
      Manage offerings
    </Button>
    <Dialog open={opened} onOpenChange={next=>{if(!next)close();}}
      title="Elective slot details"
      description="Offerings, seat allocation and faculty access for the selected elective slot."
      className="!max-w-[1100px] max-[767px]:!w-[calc(100vw_-_16px)]"
      bodyClassName="max-[767px]:!px-3">
    <section aria-label="Elective course offerings"
      className="min-w-0 w-full space-y-[var(--lms-space-3)]">
      {loading && <p role="status">Loading eligible courses and groups…</p>}
      {data && <>
        <h3 className="text-sm font-semibold text-[var(--lms-heading)]">Courses in this elective slot</h3>
        {data.offerings.length === 0 && <p className="text-sm text-muted-foreground leading-[22px]">
          No courses added yet.</p>}
        <div role="table" aria-label="Courses in elective slot" className="min-w-0 overflow-x-auto">
          <div role="row" className="hidden min-[850px]:grid min-[850px]:grid-cols-[minmax(170px,2fr)_minmax(90px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_auto] gap-3 border-b border-border py-2 text-xs font-semibold text-muted-foreground">
            {["Course","Seats","Waitlist","Faculty","Actions"].map(text=><span role="columnheader" key={text}>{text}</span>)}
          </div>
          {data.offerings.map(offering => <div role="row" key={offering.offeringId}
            className="grid min-w-0 grid-cols-1 items-center gap-2 border-b border-border py-3 text-sm min-[850px]:grid-cols-[minmax(170px,2fr)_minmax(90px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_auto] min-[850px]:gap-3">
            <div role="cell" className="min-w-0 break-words">
              <span className="font-semibold">{offering.courseName}</span>
              <span className="block text-xs text-muted-foreground">{offering.courseCode} · {offering.status}</span>
            </div>
            <div role="cell" className="font-semibold tabular-nums">
              {offering.activeMembers} / {offering.capacity??"Unlimited"}
            </div>
            <div role="cell">
              <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${offering.waitlistedCount>0?
                "border-amber-300 bg-amber-50 text-amber-800":"border-border bg-surface text-muted-foreground"}`}>
                Waitlist {offering.waitlistedCount}
              </span>
            </div>
            <div role="cell" className="min-w-0 break-words text-xs text-body">
              {offering.facultyNames?.length?offering.facultyNames.join(", "):
                offering.facultyCount!==undefined?`${offering.facultyCount} assigned`:"View faculty"}
            </div>
            <div role="cell" className="flex min-w-0 flex-wrap items-center gap-2">
              <Link href={"/college/electives/"+encodeURIComponent(slotId)+"/offerings/"+
                encodeURIComponent(offering.offeringId)+"/roster"}
                className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-link hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
                Roster & faculty
              </Link>
              {offering.status==="ACTIVE"?<>
                <Button type="button" variant="secondary" onClick={()=>startEdit(offering)}>Edit</Button>
                <Button type="button" variant="danger" disabled={busy} onClick={()=>void archive(offering)}>Archive</Button>
              </>:null}
            </div>
          </div>)}
        </div>
        <div className="border-t border-border pt-3">
          <h4 className="text-sm font-semibold">{editing ? "Edit offering" : "Add offering"}</h4>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            An active course delivery is required for learner access. Faculty assignments and learner allocations
            are managed on the offering&apos;s Roster & faculty page.
          </p>
          <label className="mt-2 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Course
            <Select className="mt-[var(--lms-space-2)] min-h-11 w-full md:min-h-9"
              value={deliveryId} onChange={event => {setDeliveryId(event.target.value);setDirty(true);}}>
              <option value="">Select course and class</option>
              {selectable.map(row => <option key={row.id} value={row.id}>
                {row.course} ({row.code}) · {row.section}</option>)}
            </Select>
          </label>
          {!editing && <label className="mt-2 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Group (optional)
            <Select className="mt-[var(--lms-space-2)] min-h-11 w-full md:min-h-9"
              value={groupId} onChange={event => {setGroupId(event.target.value);setDirty(true);}}>
              <option value="">Create elective group automatically</option>
              {data.groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
            </Select>
          </label>}
          <label className="mt-2 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Capacity
            <Input type="number" min="1" max="100000" required
              value={capacity} onChange={event => {setCapacity(event.target.value);setDirty(true);}}
              placeholder={editing?.capacity===null?"Unlimited (existing)": "Enter seat limit"}
              className="mt-[var(--lms-space-2)] min-h-11 w-full md:min-h-9" />
            {editing?.capacity===null && capacity==="" ? <span role="status" className="mt-1 block text-xs text-muted-foreground">
              Existing capacity is unlimited. A seat limit is required for changes in this editor; do not save to retain unlimited.
            </span> : null}
          </label>
          {selectable.length === 0 && <p role="status" className="mt-2 text-sm leading-[22px]">
            Create an active elective course delivery for this program before adding an offering.</p>}
          <div className="mt-[var(--lms-space-3)] flex min-w-0 flex-col gap-[var(--lms-space-2)] sm:flex-row sm:flex-wrap">
            <Button variant="primary" type="button" loading={busy} disabled={busy || loading || !deliveryId || selectable.length === 0}
              onClick={() => void save()} >
              {busy ? "Saving…" : editing ? "Save offering" : "Add offering"}
            </Button>
            {editing && <Button variant="secondary" type="button" disabled={busy} onClick={() => {
              if(dirty&&!window.confirm("Discard these elective changes?"))return;
              setEditing(null);setDirty(false);
              setDeliveryId(data.deliveries.find(row => !offered.has(row.courseId))?.id ?? "");
            }} >Cancel edit</Button>}
          </div>
        </div>
      </>}
      {error && <div role="alert" className="flex min-w-0 flex-wrap items-start justify-between gap-2 border border-error rounded-[var(--lms-control-radius)] p-3 text-sm text-error leading-[22px]">
        <p>{error}</p>
        <Button type="button" variant="secondary" size="sm" onClick={() => setError("")}>Dismiss</Button>
      </div>}
      {message && <p role="status" className="text-sm leading-[22px]">{message}</p>}
    </section>
    </Dialog>
  </div>;
}
