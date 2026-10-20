"use client";
import { MenuSeparator } from "@/components/ui/menu";
import { PageBackLink } from "@/components/ui/page-back-link";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import {Avatar} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {MetricBar} from "@/components/ui/metric-bar";
import chartStyles from "./legacy-company-bar.module.css";

import Link from "next/link";
import {TpoCompanyTeamConversation} from "./tpo-company-team-conversation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {Dropdown} from "@/components/ui/dropdown";
import {TpoCompanyMemoryDriveGrid} from "./tpo-company-memory-drive-grid";


/** Wall-clock read kept out of render bodies (React purity rule). */
function currentTimeMs(){return Date.now();}

type Person = {
  id: string;
  name: string;
  designation: string | null;
  email: string | null;
  phone: string | null;
  stage: string;
  inviteSentAt:string|null;inviteClickedAt:string|null;
  recruiterUserId:string|null;recruiterLastLoginAt:string|null;inviteBouncedAt:string|null;
  source: string | null;
  updatedAt: string;
};
type Drive = {
  id: string;
  jobTitle: string;
  companyName: string;
  status: string;
  applied:number;offers:number;
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
  canonicalCompanyId: string | null;
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
  documents: {id:string;jobId:string;jobTitle:string;createdAt:string;revokedAt:string|null;selectedCount:number;expiresAt:string}[];
  documentsStatus: string;
};
type Phase = "loading" | "ready" | "error" | "migration-pending" | "not-found";

const buttonStyle =
  "lms-inline-link inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9";

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

/** Legacy D MMM, h:mm A for the company activity log, in IST. */
function legacyActivityTime(value:string){
 const date=new Date(value);
 if(!Number.isFinite(date.getTime()))return "Unknown time";
 return new Intl.DateTimeFormat("en-IN",{
  day:"numeric",month:"short",hour:"numeric",minute:"2-digit",hour12:true,
  timeZone:"Asia/Kolkata",
 }).format(date).replace(/\b(am|pm)\b/g,s=>s.toUpperCase());
}
function legacyActivityDay(value:string){
 const date=new Date(value);
 if(!Number.isFinite(date.getTime()))return "Unknown day";
 return new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",timeZone:"Asia/Kolkata"}).format(date);
}

export function TpoCompanyMemoryWorkspace({
  collegeId,
  companyName,
  actorMembershipId,
}: {
  collegeId: string;
  companyName: string;
  actorMembershipId: string;
}) {
  const [company, setCompany] = useState<CompanyMemory | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState("");
  const [driveSearch,setDriveSearch]=useState("");
  // A newer retry or route change must win over a slower older response.
  const activeLoad=useRef<AbortController|null>(null);

  type LoadResult = { company: CompanyMemory | null; phase: Phase; message: string };
  const load = useCallback(async (signal?: AbortSignal): Promise<LoadResult | null> => {
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
      if (signal?.aborted) return null;
      if (!response.ok) {
        if (response.status === 503 && (payload.error === "DATABASE_NOT_READY" || payload.error === "DB09_MIGRATIONS_PENDING"))
          return { company: null, phase: "migration-pending", message: "Company details are unavailable right now. Try again." };
        if (response.status === 404)
          return { company: null, phase: "not-found", message: "Company not found" };
        return { company: null, phase: "error", message: "Company Memory could not be loaded." };
      }
      return payload.company
        ? { company: payload.company, phase: "ready", message: "" }
        : { company: null, phase: "error", message: "Company Memory could not be loaded." };
    } catch {
      if (signal?.aborted) return null;
      return { company: null, phase: "error", message: "Company Memory could not be loaded. Try again." };
    }
  }, [collegeId, companyName]);

  function applyLoad(result: LoadResult | null) {
    if (!result) return;
    setCompany(result.company);
    setPhase(result.phase);
    setError(result.message);
  }

  function retry() {
    activeLoad.current?.abort();
    const controller=new AbortController();
    activeLoad.current=controller;
    setCompany(null);
    setPhase("loading");
    setError("");
    void load(controller.signal).then(result => {
      if(!controller.signal.aborted&&activeLoad.current===controller)applyLoad(result);
    });
  }

  useEffect(() => {
    const controller=new AbortController();
    activeLoad.current?.abort();
    activeLoad.current=controller;
    void load(controller.signal).then(result => {
      if(!controller.signal.aborted&&activeLoad.current===controller)applyLoad(result);
    });
    return () => {
      activeLoad.current?.abort();
      activeLoad.current=null;
    };
  }, [load]);

  const activeContacts = useMemo(
    () => company?.people.filter(person => !["NOT_NOW", "RECRUITED"].includes(person.stage)).length ?? 0,
    [company],
  );

  if (phase !== "ready" || !company) {
    return (
      <section className="border-b border-border py-6">
        <p role={phase === "loading" ? "status" : "alert"}>
          {phase === "loading" ? "Loading Company Memory…" : error}
        </p>
        {phase === "error" || phase === "not-found" || phase === "migration-pending" ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={retry}>Retry</Button>
            <Link className={buttonStyle} href="/tpo/recruiters?view=companies">Back to companies</Link>
          </div>
        ) : null}
      </section>
    );
  }

  const latest = company.timeline[0] ?? null;

  return (
    <section className="space-y-5" aria-label={"Company Memory for " + company.name}>
      <PageBackLink href="/tpo/recruiters?view=companies" label="Companies" />
      <PageHeader
        title={company.name}
        description={company.drivesRan > 1 || company.hiredPerYear.length > 1
          ? "Repeat hiring relationship"
          : "Recruiter contacts, drives and hiring history"}
        actions={
        <div className="flex flex-wrap gap-2">
          <Dropdown align="end" label={"New work for "+company.name} trigger="+ New">
           <nav aria-label={"New work for "+company.name}
            className="w-[min(15rem,calc(100vw_-_5rem))] max-w-full space-y-1">
            <Link href={"/tpo/recruiters?add=1&company="+encodeURIComponent(company.name)}
             className="lms-inline-link block min-h-11 rounded-[var(--lms-control-radius)] px-2 py-3 text-sm text-link underline hover:bg-[rgba(0,0,0,0.035)] active:bg-[rgba(0,0,0,0.06)] transition-[background-color] duration-[200ms] ease-[ease] motion-reduce:transition-none break-words [overflow-wrap:anywhere] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">New recruiter lead for {company.name}</Link>
            <Link href={"/tpo/placements/new?company="+encodeURIComponent(company.name)}
             className="lms-inline-link block min-h-11 rounded-[var(--lms-control-radius)] px-2 py-3 text-sm text-link underline hover:bg-[rgba(0,0,0,0.035)] active:bg-[rgba(0,0,0,0.06)] transition-[background-color] duration-[200ms] ease-[ease] motion-reduce:transition-none break-words [overflow-wrap:anywhere] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">New drive for {company.name}</Link>
            <MenuSeparator />
            <Link href={"/tpo/calendar?company="+encodeURIComponent(company.name)}
             className="lms-inline-link block min-h-11 rounded-[var(--lms-control-radius)] px-2 py-3 text-sm text-link underline hover:bg-[rgba(0,0,0,0.035)] active:bg-[rgba(0,0,0,0.06)] transition-[background-color] duration-[200ms] ease-[ease] motion-reduce:transition-none break-words [overflow-wrap:anywhere] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Follow-up</Link>
           </nav>
          </Dropdown>
          {company.canonicalCompanyId?<Link className={buttonStyle}
            href={"/tpo/companies/"+encodeURIComponent(company.canonicalCompanyId)}>
            Company link and trusted settings
          </Link>:null}
          {company.canonicalCompanyId?<Link className={buttonStyle}
            href={"/tpo/companies/"+encodeURIComponent(company.canonicalCompanyId)+"/team"}>
            Open in Team
          </Link>:null}
          <Link className={buttonStyle} href={"/tpo/recruiters?add=1&company=" + encodeURIComponent(company.name)}>
            Add contact
          </Link>
          <Link className={buttonStyle} href={"/tpo/placements/new?company=" + encodeURIComponent(company.name)}>
            Create drive
          </Link>
        </div>
        }
      />
      {company.alsoTypedAs.length ? (
        <p className="text-xs text-muted-foreground">
          Also typed as {company.alsoTypedAs.join(", ")}
        </p>
      ) : null}

      <div aria-label="Company numbers" className="grid min-w-0 grid-cols-2 gap-0 overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border bg-surface md:grid-cols-3 xl:grid-cols-5">
        {[
          ["Contacts", company.people.length + " · " + activeContacts + " active"],
          ["Drives that ran", String(company.drivesRan)],
          ["Accepted-offer drives", String(company.acceptedOfferDrives)],
          ["students placed", company.studentsHired == null ? "Verification pending" : String(company.studentsHired)],
          ["Last activity", latest ? latest.type.toLowerCase()+" / "+legacyActivityDay(latest.createdAt) : "no activity yet"],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0 border-b border-r border-border px-3 py-3 last:border-r-0 md:px-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 break-words font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {company.studentsHired == null ? (
        <div role="status" className="border-l-2 border-warning bg-warning-subtle px-3 py-3 text-sm text-muted-foreground">
          Students-placed counts are unavailable for this college&apos;s selected placement rule. No estimated zero is shown.
        </div>
      ) : null}

      {company.hiredPerYear.length>0?(
        <section aria-label="Students placed, by year" className="border-b border-border py-4">
          <h2 className="font-semibold text-foreground">Students placed, by year</h2>
          <p className="mt-1 text-xs text-muted-foreground">Years hiring: {company.hiredPerYear.length}. Counts are distinct confirmed JOINED learners with a recorded joining year, not estimated offers.</p>
          <ul className="mt-3 space-y-3">
            {company.hiredPerYear.map(item=>(
              <li key={item.year} className="grid grid-cols-[4rem_1fr_3rem] items-center gap-3 text-sm">
                <span>{item.year}</span>
                <MetricBar size="default" role="img" className={chartStyles.branchBar} label={item.hired+" joined learners in "+item.year}
                  value={item.hired} maximum={Math.max(1,...company.hiredPerYear.map(row=>row.hired))} />
                <strong className="text-right tabular-nums">{item.hired}</strong>
              </li>
            ))}
          </ul>
        </section>
      ):null}
      {company.canonicalCompanyId?<TpoCompanyTeamConversation
        companyId={company.canonicalCompanyId} companyName={company.name}
        actorMembershipId={actorMembershipId}/>:<p role="status" className="text-sm text-body">
        Link this company to an authorized college employer before starting a private Team conversation.
      </p>}
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-5">
          <section className="border-b border-border py-4">
            <h2 className="font-semibold text-foreground">People</h2>
            {company.people.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No contacts yet.</p>
            ) : (
              <div className="mt-3 divide-y divide-border">
                {company.people.map(person => (
                  <div key={person.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-3 md:flex-nowrap">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={person.name} size="md"/>
                      <div className="min-w-0">
                      <Link className="lms-inline-link inline-flex min-h-11 items-center break-words font-medium text-link underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        href={"/tpo/recruiters/" + encodeURIComponent(person.id)}>
                        {person.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {[person.designation, person.email].filter(Boolean).join(" · ") || "No contact details"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {person.recruiterUserId?(person.recruiterLastLoginAt
                            ?"Joined · signed in "+new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"}).format(new Date(person.recruiterLastLoginAt))
                            :"Joined · has not signed in yet"):
                          person.inviteBouncedAt?"Invite bounced":
                          person.inviteClickedAt?"Invite opened, not joined yet":
                          person.inviteSentAt?"Invite sent, not opened":"No invite sent"}
                      </p>
                      </div>
                    </div>
                    <Badge  tone="neutral">{person.stage==="DRIVE_PLANNED"?"Drive planned":person.stage==="NOT_NOW"?"Not now":person.stage==="RECRUITED"?"Recruited":person.stage==="JOINED"?"Joined":person.stage==="INVITED"?"Invited":person.stage==="CONTACTED"?"Contacted":"New"}</Badge>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="border-b border-border py-4">
            <h2 className="font-semibold text-foreground">Documents</h2>
            {company.documentsStatus!=="READY"?
              <p role="status" className="mt-3 text-sm text-muted-foreground">
                Share-link history is unavailable until applicant-share storage is registered.
              </p>:company.documents.length===0?
              <p className="mt-3 text-sm text-muted-foreground">Nothing shared yet.</p>:
              <ul className="mt-3 divide-y divide-border">
                {company.documents.map(doc=><li key={doc.id} className="py-3">
                  <p className="text-sm text-body">Applicant list shared {dateLabel(doc.createdAt)}</p>
                  <p className="text-xs text-muted-foreground">{doc.jobTitle} · {doc.selectedCount>0?doc.selectedCount+" selected applicants":"Current shortlist"}{doc.revokedAt?" · Link withdrawn":new Date(doc.expiresAt).getTime()<currentTimeMs()?" · Link expired":" · Expires "+dateLabel(doc.expiresAt)}</p>
                  <Link className="lms-inline-link inline-flex min-h-11 items-center text-sm text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    href={"/tpo/placements/jobs/"+encodeURIComponent(doc.jobId)}>Open drive</Link>
                </li>)}
              </ul>}
          </section>
        </div>

        <div className="space-y-5">
          <section className="border-b border-border py-4">
            <h2 className="font-semibold text-foreground">Drives</h2>
            {company.drives.length===0?
              <p className="mt-3 text-sm text-muted-foreground">No drives yet.</p>:
              <div className="mt-3">
                <TpoCompanyMemoryDriveGrid companyName={company.name} drives={company.drives}
                  search={driveSearch} onSearchChange={setDriveSearch}/>
              </div>}
          </section>

          <section className="border-b border-border py-4">
            <h2 className="font-semibold text-foreground">Timeline</h2>
            {company.timeline.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nothing logged yet.</p>
            ) : (
              <ol className="mt-3 space-y-3">
                {company.timeline.map(item => (
                  <li className="border-l-2 border-border pl-3" key={item.id}>
                    <p className="text-sm"><strong>{item.person}</strong> · {item.type.toLowerCase()}{item.note?": "+item.note:""}</p>
                    <p className="text-xs text-muted-foreground">{legacyActivityTime(item.createdAt)}</p>
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
