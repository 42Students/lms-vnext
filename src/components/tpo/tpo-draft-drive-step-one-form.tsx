"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Company = { relationshipId: string; name: string };
type Season = { id: string; name: string; startDate: string; endDate: string };

export function TpoDraftDriveStepOneForm({
  season,
  companies,
}: {
  season: Season;
  companies: readonly Company[];
}) {
  const router = useRouter();
  const [companyRelationshipId, setCompanyRelationshipId] = useState(
    companies[0]?.relationshipId ?? "",
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [employmentType, setEmploymentType] = useState<"FULL_TIME" | "INTERNSHIP" | "CONTRACT">("FULL_TIME");
  const [workMode, setWorkMode] = useState<"ONSITE" | "REMOTE" | "HYBRID">("ONSITE");
  const [deadline, setDeadline] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !companyRelationshipId || title.trim().length < 2 || !description.trim()) {
      setError("Choose a company and provide a role title and description.");
      return;
    }
    // datetime-local is intentionally interpreted as Asia/Kolkata wall-clock,
    // not the browser's machine zone or an unqualified date string.
    const deadlineWithOffset = deadline ? deadline + ":00+05:30" : null;
    if (deadlineWithOffset && (!Number.isFinite(Date.parse(deadlineWithOffset)) ||
      Date.parse(deadlineWithOffset) <= Date.now())) {
      setError("The application deadline must be a future date and time in IST.");
      return;
    }
    if (!window.confirm(
      "Save " + title.trim() + " as a DRAFT for " +
      (companies.find((company) => company.relationshipId === companyRelationshipId)?.name ?? "this company") +
      "? This creates one primary role option. It does not publish the drive.",
    )) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/placements/tpo/drives/draft", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmed: true,
          seasonId: season.id,
          companyRelationshipId,
          title: title.trim(),
          description: description.trim(),
          employmentType,
          workMode,
          applicationDeadline: deadlineWithOffset,
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | { id?: string; status?: string; error?: string }
        | null;
      if (!response.ok || !body?.id) {
        throw new Error(body?.error ?? "Could not save this draft drive.");
      }
      router.push("/tpo/placements/jobs/" + encodeURIComponent(body.id));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Draft creation failed.");
    } finally {
      setPending(false);
    }
  }
  const cls = "mt-1 block min-h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground";
  return (
    <form onSubmit={(event) => void submit(event)}
      className="space-y-5 rounded-xl border border-border bg-surface p-5">
      <p className="text-sm text-body">
        Active season: <strong>{season.name}</strong> ({season.startDate} to {season.endDate}).
        You can add other role options, compensation, targeting and rounds in the draft workspace.
      </p>
      <label className="block text-sm font-semibold text-foreground">
        Company relationship
        <select className={cls} value={companyRelationshipId}
          onChange={(event) => setCompanyRelationshipId(event.target.value)} disabled={pending}>
          {companies.map((company) => (
            <option key={company.relationshipId} value={company.relationshipId}>{company.name}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold text-foreground">
        Initial role / drive title
        <input className={cls} required minLength={2} maxLength={200}
          value={title} disabled={pending}
          onChange={(event) => setTitle(event.target.value)}/>
      </label>
      <label className="block text-sm font-semibold text-foreground">
        Role description
        <textarea className={cls} required rows={4} maxLength={20000}
          value={description} disabled={pending}
          onChange={(event) => setDescription(event.target.value)}/>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-foreground">
          Employment type
          <select className={cls} value={employmentType} disabled={pending}
            onChange={(event) => setEmploymentType(event.target.value as typeof employmentType)}>
            <option value="FULL_TIME">Full time</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="CONTRACT">Contract</option>
          </select>
        </label>
        <label className="block text-sm font-semibold text-foreground">
          Work mode
          <select className={cls} value={workMode} disabled={pending}
            onChange={(event) => setWorkMode(event.target.value as typeof workMode)}>
            <option value="ONSITE">On site</option>
            <option value="HYBRID">Hybrid</option>
            <option value="REMOTE">Remote</option>
          </select>
        </label>
      </div>
      <label className="block text-sm font-semibold text-foreground">
        Application deadline (optional, IST)
        <input className={cls} type="datetime-local" value={deadline}
          disabled={pending} onChange={(event) => setDeadline(event.target.value)}/>
      </label>
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
      <button type="submit" disabled={pending || !companyRelationshipId}
        className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
        {pending ? "Saving draft…" : "Review and save draft"}
      </button>
    </form>
  );
}
