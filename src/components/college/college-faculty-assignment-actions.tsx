"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Option = { id: string; label: string };
type CourseTeachingRole = "PRIMARY" | "CO_TEACHER" | "TA";

async function mutationError(response: Response) {
  const value: unknown = await response.json().catch(() => null);
  if (value && typeof value === "object" && "error" in value && typeof value.error === "string") {
    return value.error;
  }
  return "The change was not saved. Check the assignment and retry.";
}

export function CollegeFacultyAssignmentCreate({
  deliveries, faculty, deliveriesTruncated, facultyTruncated,
}: {
  deliveries: Option[];
  faculty: Option[];
  deliveriesTruncated: boolean;
  facultyTruncated: boolean;
}) {
  const router = useRouter();
  const [deliveryId, setDeliveryId] = useState("");
  const [membershipId, setMembershipId] = useState("");
  const [role, setRole] = useState<CourseTeachingRole>("PRIMARY");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const unavailable = deliveries.length === 0 || faculty.length === 0;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!deliveryId || !membershipId) {
      setError("Select a live course delivery and an active Faculty member.");
      return;
    }
    const deliveryLabel = deliveries.find(item => item.id === deliveryId)?.label ?? "selected delivery";
    const facultyLabel = faculty.find(item => item.id === membershipId)?.label ?? "selected faculty";
    if (!window.confirm(`Assign ${facultyLabel} as ${role} to ${deliveryLabel}? This is recorded in the audit log.`)) return;
    setSaving(true);
    try {
      const response = await fetch("/api/courses/teaching-assignments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ deliveryId, membershipId, role }),
      });
      if (!response.ok) throw new Error(await mutationError(response));
      setMessage("Teaching assignment created.");
      setMembershipId("");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Assignment could not be created.");
    } finally {
      setSaving(false);
    }
  }
  return <section aria-label="Assign Faculty to course delivery"
    className="rounded-xl border border-border bg-surface p-4 sm:p-5">
    <h2 className="m-0 text-lg font-semibold text-foreground">Assign Faculty</h2>
    <p className="mt-1 text-sm text-body">
      Choose a live course/class delivery and an active Faculty membership in this college.
      Duplicated roles and a second primary teacher are blocked.
    </p>
    {unavailable ? (
      <p className="mt-3 text-sm text-muted-foreground">
        {deliveries.length === 0
          ? "No active course/class deliveries are available for assignment."
          : "No active Faculty memberships are available for assignment."}
      </p>
    ) : <form onSubmit={submit} className="mt-4 grid gap-3 lg:grid-cols-[2fr_1.4fr_1fr_auto] lg:items-end">
      <label className="grid gap-1 text-sm font-semibold text-body">
        Course / class
        <select required value={deliveryId} onChange={event => setDeliveryId(event.target.value)}
          className="min-h-11 min-w-0 rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="">Select delivery</option>
          {deliveries.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">
        Faculty
        <select required value={membershipId} onChange={event => setMembershipId(event.target.value)}
          className="min-h-11 min-w-0 rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="">Select faculty</option>
          {faculty.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">
        Teaching role
        <select value={role} onChange={event => setRole(event.target.value as CourseTeachingRole)}
          className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="PRIMARY">Primary</option>
          <option value="CO_TEACHER">Co-teacher</option>
          <option value="TA">Teaching assistant</option>
        </select>
      </label>
      <button type="submit" disabled={saving}
        className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-60">
        {saving ? "Assigning…" : "Assign"}
      </button>
    </form>}
    {deliveriesTruncated || facultyTruncated ? (
      <p className="mt-3 text-sm text-warning" role="note">
        Only the first 200 {deliveriesTruncated ? "live deliveries" : "Faculty members"}
        are shown. Use the offering workspace for items not listed here.
      </p>
    ) : null}
    {error ? <p role="alert" className="mt-3 text-sm text-error">{error}</p> : null}
    {message ? <p role="status" className="mt-3 text-sm text-success">{message}</p> : null}
  </section>;
}

export function CollegeFacultyAssignmentEnd({
  assignmentId, facultyName, courseName, role,
}: {
  assignmentId: string;
  facultyName: string;
  courseName: string;
  role: CourseTeachingRole;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function end() {
    if (!window.confirm(`End ${role} assignment for ${facultyName} in ${courseName}? This cannot be undone. Teaching history is retained.`)) return;
    setError(null);
    setSaving(true);
    try {
      const response = await fetch(
        "/api/courses/teaching-assignments/" + encodeURIComponent(assignmentId),
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error(await mutationError(response));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Assignment could not be ended.");
    } finally {
      setSaving(false);
    }
  }
  return <div className="space-y-1">
    <button type="button" disabled={saving} onClick={end}
      className="min-h-9 rounded-md border border-border px-3 text-xs font-semibold text-primary-text disabled:opacity-60">
      {saving ? "Ending…" : "End assignment"}
    </button>
    {error ? <p role="alert" className="text-xs text-error">{error}</p> : null}
  </div>;
}
