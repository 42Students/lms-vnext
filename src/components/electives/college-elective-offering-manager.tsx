"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {apiFetch} from "@/lib/api-fetch";

type Delivery = { id: string; courseId: string; course: string; code: string; section: string };
type Group = { id: string; name: string; capacity: number | null };
type Offering = {
  offeringId: string; courseId: string; courseName: string; courseCode: string;
  backedDeliveryId: string; groupId: string; capacity: number | null;
  activeMembers: number; waitlistedCount: number; status: string; version: number;
};
type Load = { deliveries: Delivery[]; groups: Group[]; offerings: Offering[] };

export function CollegeElectiveOfferingManager({ slotId }: { slotId: string }) {
  const router = useRouter();
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
    setCapacity(String(offering.capacity ?? 30));
    setError(""); setMessage("");
  }

  async function save() {
    const delivery = data?.deliveries.find(row => row.id === deliveryId);
    const number = Number(capacity);
    if (!delivery || !Number.isInteger(number) || number < 1 || number > 100000) {
      setError("Select an eligible course and enter a valid capacity.");
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
      setMessage(editing ? "Offering updated." : "Offering added.");
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
      setMessage("Offering archived.");
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
      className="mt-2 min-w-64 max-w-xl space-y-3 border-t border-border pt-3">
      {loading && <p role="status">Loading eligible courses and groups…</p>}
      {data && <>
        <h3 className="text-sm font-semibold">Courses in this elective slot</h3>
        {data.offerings.length === 0 && <p className="text-sm text-muted-foreground">
          No courses added yet.</p>}
        {data.offerings.map(offering => <div key={offering.offeringId}
          className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--lms-control-radius)] border border-border p-2 text-sm">
          <span>{offering.courseName} ({offering.courseCode}) · Seats: {offering.capacity ?? "No cap"} · Enrolled: {offering.activeMembers} · Waitlist: {offering.waitlistedCount} · {offering.status}</span>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={"/college/electives/" + encodeURIComponent(slotId) + "/offerings/" +
              encodeURIComponent(offering.offeringId) + "/roster"}
              className="rounded-[var(--lms-control-radius)] border border-border px-2 py-1 font-semibold text-link">
              Roster
            </Link>
            {offering.status === "ACTIVE" && <>
              <Button variant="secondary" type="button" onClick={() => startEdit(offering)}
                >Edit</Button>
              <Button variant="secondary" type="button" disabled={busy} onClick={() => void archive(offering)}
                className="text-error">Archive</Button>
            </>}
          </div>
        </div>)}
        <div className="border-t border-border pt-3">
          <h4 className="text-sm font-semibold">{editing ? "Edit offering" : "Add offering"}</h4>
          <label className="mt-2 block text-sm">Course
            <select className="mt-1 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-2"
              value={deliveryId} onChange={event => setDeliveryId(event.target.value)}>
              <option value="">Select course and class</option>
              {selectable.map(row => <option key={row.id} value={row.id}>
                {row.course} ({row.code}) · {row.section}</option>)}
            </select>
          </label>
          {!editing && <label className="mt-2 block text-sm">Group (optional)
            <select className="mt-1 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-2"
              value={groupId} onChange={event => setGroupId(event.target.value)}>
              <option value="">Create elective group automatically</option>
              {data.groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
            </select>
          </label>}
          <label className="mt-2 block text-sm">Capacity
            <input type="number" min="1" max="100000" required
              value={capacity} onChange={event => setCapacity(event.target.value)}
              className="mt-1 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-2" />
          </label>
          {selectable.length === 0 && <p role="status" className="mt-2 text-sm">
            Create an active elective course delivery for this program before adding an offering.</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="primary" type="button" disabled={busy || loading || !deliveryId || selectable.length === 0}
              onClick={() => void save()} >
              {busy ? "Saving…" : editing ? "Save offering" : "Add offering"}
            </Button>
            {editing && <Button variant="secondary" type="button" disabled={busy} onClick={() => {
              setEditing(null); setDeliveryId(data.deliveries.find(row => !offered.has(row.courseId))?.id ?? "");
            }} >Cancel edit</Button>}
          </div>
        </div>
      </>}
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      {message && <p role="status" className="text-sm">{message}</p>}
    </section>}
  </div>;
}
