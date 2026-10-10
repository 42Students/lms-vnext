"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Person = {
  id: string;
  name: string;
  designation: string | null;
  email: string | null;
  phone: string | null;
  stage: string;
  source: string | null;
  updatedAt: string;
};
type Drive = {
  id: string;
  jobTitle: string;
  companyName: string;
  status: string;
  createdAt: string;
};
type TimelineItem = {
  id: string;
  type: string;
  outcome: string | null;
  note: string | null;
  isSystem: boolean;
  createdAt: string;
  person: string;
};
type CompanyMemory = {
  key: string;
  name: string;
  alsoTypedAs: string[];
  people: Person[];
  drives: Drive[];
  drivesRan: number;
  acceptedOfferDrives: number;
  confirmedJoinedDrives: number;
  studentsHired: number | null;
  hiredPerYear: Array<{ year: string; hired: number }>;
  placedMetricStatus: string;
  timeline: TimelineItem[];
  documents: never[];
  documentsStatus: string;
};
type Phase = "loading" | "ready" | "error" | "migration-pending" | "not-found";

const buttonStyle =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-secondary";

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }).format(date)
    : "Unknown time";
}

export function TpoCompanyMemoryWorkspace({
  collegeId,
  companyName,
}: {
  collegeId: string;
  companyName: string;
}) {
  const [company, setCompany] = useState<CompanyMemory | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    setCompany(null);
    setPhase("loading");
    setError("");
    try {
      const response = await fetch(
        "/api/placements/tpo/companies/detail?collegeId=" +
          encodeURIComponent(collegeId) +
          "&name=" +
          encodeURIComponent(companyName),
        { credentials: "same-origin", cache: "no-store", signal },
      );
      const payload = await response.json() as {
        company?: CompanyMemory;
        error?: string;
      };
      if (!response.ok) {
        if (signal?.aborted) return;
        if (response.status === 503 && payload.error === "DB09_MIGRATIONS_PENDING") {
          setPhase("migration-pending");
          setError("Company Memory is awaiting DB09 database verification.");
        } else if (response.status === 404) {
          setPhase("not-found");
          setError("Company not found in this college.");
        } else {
          setPhase("error");
          setError("Company Memory could not be loaded.");
        }
        return;
      }
      if (signal?.aborted) return;
      setCompany(payload.company ?? null);
      setPhase(payload.company ? "ready" : "error");
    } catch {
      if (signal?.aborted) return;
      setPhase("error");
      setError("Company Memory could not be loaded. Try again.");
    }
  }, [collegeId, companyName]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const activeContacts = useMemo(
    () => company?.people.filter(person => !["NOT_NOW", "RECRUITED"].includes(person.stage)).length ?? 0,
    [company],
  );

  if (phase !== "ready" || !company) {
    return (
      <section className="rounded-lg border border-border bg-surface p-6">
        <p role={phase === "loading" ? "status" : "alert"}>
          {phase === "loading" ? "Loading Company Memory…" : error}
        </p>
        {phase === "error" || phase === "not-found" ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <button className={buttonStyle} onClick={() => void load()}>Retry</button>
            <Link className={buttonStyle} href="/tpo/recruiters?view=companies">Back to companies</Link>
          </div>
        ) : null}
      </section>
    );
  }

  const latest = company.timeline[0] ?? null;

  return (
    <section className="space-y-5" aria-label={"Company Memory for " + company.name}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link className="text-sm text-primary-text hover:underline" href="/tpo/recruiters?view=companies">
            ← Companies
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">{company.name}</h1>
          <p className="text-sm text-muted-foreground">
            Recruiter contacts, drives and hiring history
          </p>
          {company.alsoTypedAs.length ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Also typed as {company.alsoTypedAs.join(", ")}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className={buttonStyle} href={"/tpo/recruiters?add=1&company=" + encodeURIComponent(company.name)}>
            Add contact
          </Link>
          <Link className={buttonStyle} href={"/tpo/placements/new?company=" + encodeURIComponent(company.name)}>
            Create drive
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Contacts", company.people.length + " · " + activeContacts + " active"],
          ["Drives that ran", String(company.drivesRan)],
          ["Accepted-offer drives", String(company.acceptedOfferDrives)],
          ["Students placed", company.studentsHired == null ? "Verification pending" : String(company.studentsHired)],
          ["Last activity", latest ? dateLabel(latest.createdAt) : "None"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border bg-surface p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {company.studentsHired == null ? (
        <div className="rounded-lg border border-border bg-surface-secondary p-3 text-sm text-muted-foreground">
          Students-placed totals remain hidden until W04 verifies the college counts-as-placed policy against current offer outcomes. No guessed zero is shown.
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-5">
          <section className="rounded-lg border border-border bg-surface p-4">
            <h2 className="font-semibold text-foreground">People</h2>
            {company.people.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No contacts yet.</p>
            ) : (
              <div className="mt-3 divide-y divide-border">
                {company.people.map(person => (
                  <div key={person.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <Link className="font-medium text-primary-text hover:underline"
                        href={"/tpo/recruiters/" + encodeURIComponent(person.id)}>
                        {person.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {[person.designation, person.email].filter(Boolean).join(" · ") || "No contact details"}
                      </p>
                    </div>
                    <span className="rounded-full border border-border px-2 py-1 text-xs">{person.stage.replaceAll("_", " ")}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-border bg-surface p-4">
            <h2 className="font-semibold text-foreground">Documents</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Shared applicant-list history is waiting for the DB09 share-link persistence batch. It is intentionally not reconstructed from unrelated activity.
            </p>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-lg border border-border bg-surface p-4">
            <h2 className="font-semibold text-foreground">Drives</h2>
            {company.drives.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No drives yet.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-muted-foreground">
                    <tr><th className="py-2">Role</th><th>Status</th><th>Created</th></tr>
                  </thead>
                  <tbody>
                    {company.drives.map(drive => (
                      <tr className="border-b border-border last:border-0" key={drive.id}>
                        <td className="py-3">
                          <Link className="text-primary-text hover:underline"
                            href={"/tpo/placements/" + encodeURIComponent(drive.id)}>
                            {drive.jobTitle}
                          </Link>
                        </td>
                        <td>{drive.status}</td>
                        <td>{dateLabel(drive.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-border bg-surface p-4">
            <h2 className="font-semibold text-foreground">Timeline</h2>
            {company.timeline.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nothing logged yet.</p>
            ) : (
              <ol className="mt-3 space-y-3">
                {company.timeline.map(item => (
                  <li className="border-l-2 border-border pl-3" key={item.id}>
                    <p className="text-sm"><strong>{item.person}</strong> · {item.type.toLowerCase()}</p>
                    {item.note ? <p className="text-sm text-muted-foreground">{item.note}</p> : null}
                    <p className="text-xs text-muted-foreground">{dateLabel(item.createdAt)}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
