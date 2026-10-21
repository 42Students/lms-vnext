"use client";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
  faculty:Array<{role:string;displayName:string}>;
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
    if (opened) { setOpened(false); return; }
    setOpened(true); setEditing(null); setMessage("");
    await load();
  }

  function startEdit(offering: Offering) {
    setEditing(offering);
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
      setEditing(null); setGroupId("");
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
    {opened && <section aria-label="Elective course offerings"
      className="mt-[var(--lms-space-3)] min-w-0 w-full max-w-[920px] space-y-[var(--lms-space-3)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)]">
      {loading && <p role="status">Loading eligible courses and groups…</p>}
      {data && <>
        <h3 className="text-sm font-semibold text-[var(--lms-heading)]">Courses in this elective slot</h3>
        {data.offerings.length === 0 && <p className="text-sm text-muted-foreground leading-[22px]">
          No courses added yet.</p>}
        {data.offerings.map(offering => <div key={offering.offeringId}
          className="flex min-w-0 flex-col items-start gap-2 border-b border-border py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p>{offering.courseName} ({offering.courseCode}) · Seats: {offering.capacity ?? "No cap"} · Enrolled: {offering.activeMembers} · Waitlist: {offering.waitlistedCount} · {offering.status}</p>
            <p className="text-xs text-muted-foreground">Faculty: {offering.faculty.length?
              offering.faculty.map(member=>member.displayName+" ("+
                (member.role==="PRIMARY"?"Primary":"Co-teacher")+")").join(", "):
              "Not assigned"}</p>
          </div>
          <div className="flex min-w-0 w-full flex-col items-stretch gap-[var(--lms-space-2)] sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <Link href={"/college/electives/" + encodeURIComponent(slotId) + "/offerings/" +
              encodeURIComponent(offering.offeringId) + "/roster"}
              className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-[650] text-link hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)] md:min-h-9">
              Roster & faculty
            </Link>
            <Link href={"/college/electives/"+encodeURIComponent(slotId)+
              "/offerings/"+encodeURIComponent(offering.offeringId)+"/roster#faculty"}
              className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
              Set faculty
            </Link>
            <Link href={"/college/electives/"+encodeURIComponent(slotId)+
              "/offerings/"+encodeURIComponent(offering.offeringId)+"/roster#allocate"}
              className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
              Allocate students
            </Link>
            {offering.status === "ACTIVE" && <>
              <Button variant="secondary" type="button" onClick={() => startEdit(offering)}
                >Edit</Button>
              <Button variant="danger" type="button" disabled={busy} onClick={() => void archive(offering)}>Archive</Button>
            </>}
          </div>
        </div>)}
        <div className="border-t border-border pt-3">
          <h4 className="text-sm font-semibold">{editing ? "Edit offering" : "Add offering"}</h4>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            An active course delivery is required for learner access. Faculty assignments and learner allocations
            are managed on the offering&apos;s Roster & faculty page.
          </p>
          <label className="mt-2 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Course
            <Select className="mt-[var(--lms-space-2)] min-h-11 w-full md:min-h-9"
              value={deliveryId} onChange={event => setDeliveryId(event.target.value)}>
              <option value="">Select course and class</option>
              {selectable.map(row => <option key={row.id} value={row.id}>
                {row.course} ({row.code}) · {row.section}</option>)}
            </Select>
          </label>
          {!editing && <label className="mt-2 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Group (optional)
            <Select className="mt-[var(--lms-space-2)] min-h-11 w-full md:min-h-9"
              value={groupId} onChange={event => setGroupId(event.target.value)}>
              <option value="">Create elective group automatically</option>
              {data.groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
            </Select>
          </label>}
          <label className="mt-2 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Capacity
            <Input type="number" min="1" max="100000" required
              value={capacity} onChange={event => setCapacity(event.target.value)}
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
              setEditing(null); setDeliveryId(data.deliveries.find(row => !offered.has(row.courseId))?.id ?? "");
            }} >Cancel edit</Button>}
          </div>
        </div>
      </>}
      {error && <div role="alert" className="flex min-w-0 flex-wrap items-start justify-between gap-2 border border-error rounded-[var(--lms-control-radius)] p-3 text-sm text-error leading-[22px]">
        <p>{error}</p>
        <Button type="button" variant="secondary" size="sm" onClick={() => setError("")}>Dismiss</Button>
      </div>}
      {message && <p role="status" className="text-sm leading-[22px]">{message}</p>}
    </section>}
  </div>;
}
