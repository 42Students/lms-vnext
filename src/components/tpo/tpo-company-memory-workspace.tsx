"use client";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {DataTable} from "@/components/ui/data-table";

import Link from "next/link";
import {TpoCompanyTeamConversation} from "./tpo-company-team-conversation";
import {companyDriveCsv} from "@/modules/placements/tpo-company-drive-export-model";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";


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
  "inline-flex min-h-9 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-primary-subtle";

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
  const statusLabel=(status:string)=>({PUBLISHED:"Live",CLOSED:"Completed",DRAFT:"Draft",REQUEST:"Sent for review",CANCELLED:"Cancelled"} as Record<string,string>)[status]??status;
  const visibleDrives=company.drives.filter(drive=>
    [drive.jobTitle,drive.status,String(new Date(drive.createdAt).getFullYear())]
      .join(" ").toLowerCase().includes(driveSearch.trim().toLowerCase()));

  return (
    <section className="space-y-5" aria-label={"Company Memory for " + company.name}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link className="text-sm text-link hover:underline" href="/tpo/recruiters?view=companies">
            ← Companies
          </Link>
          <h1 className="mt-1 text-[30px] font-semibold leading-9 tracking-[-0.02em] text-[var(--lms-heading)]">{company.name}</h1>
          <p className="text-sm text-muted-foreground">
            {company.drivesRan>1||company.hiredPerYear.length>1?"Repeat hiring relationship":"Recruiter contacts, drives and hiring history"}
          </p>
          {company.alsoTypedAs.length ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Also typed as {company.alsoTypedAs.join(", ")}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <details className="relative">
           <summary className={buttonStyle+" cursor-pointer"}>+ New</summary>
           <nav aria-label={"New work for "+company.name}
            className="absolute right-0 z-20 mt-1 w-60 space-y-1 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-2 shadow-[var(--lms-dropdown-shadow)]">
            <Link href={"/tpo/recruiters?add=1&company="+encodeURIComponent(company.name)}
             className="block rounded-[var(--lms-control-radius)] px-2 py-3 text-sm text-link hover:bg-primary-subtle">New recruiter lead for {company.name}</Link>
            <Link href={"/tpo/placements/new?company="+encodeURIComponent(company.name)}
             className="block rounded-[var(--lms-control-radius)] px-2 py-3 text-sm text-link hover:bg-primary-subtle">New drive for {company.name}</Link>
            <div role="separator" className="border-t border-border"/>
            <Link href={"/tpo/calendar?company="+encodeURIComponent(company.name)}
             className="block rounded-[var(--lms-control-radius)] px-2 py-3 text-sm text-link hover:bg-primary-subtle">Follow-up</Link>
           </nav>
          </details>
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
      </div>

      <div aria-label="Company numbers" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Contacts", company.people.length + " · " + activeContacts + " active"],
          ["Drives that ran", String(company.drivesRan)],
          ["Accepted-offer drives", String(company.acceptedOfferDrives)],
          ["students placed", company.studentsHired == null ? "Verification pending" : String(company.studentsHired)],
          ["Last activity", latest ? latest.type.toLowerCase()+" / "+legacyActivityDay(latest.createdAt) : "no activity yet"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {company.studentsHired == null ? (
        <div role="status" className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface-secondary p-3 text-sm text-muted-foreground">
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
                <div className="h-3 overflow-hidden rounded-full bg-surface-secondary" role="img" aria-label={item.hired+" joined learners in "+item.year}>
                  <div className="h-full rounded-full bg-primary" style={{width:(100*item.hired/Math.max(1,...company.hiredPerYear.map(row=>row.hired)))+"%"}}/>
                </div>
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
                  <div key={person.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <Link className="font-medium text-link hover:underline"
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
                    <span className="rounded-full border border-border px-2 py-1 text-xs">{person.stage==="DRIVE_PLANNED"?"Drive planned":person.stage==="NOT_NOW"?"Not now":person.stage==="RECRUITED"?"Recruited":person.stage==="JOINED"?"Joined":person.stage==="INVITED"?"Invited":person.stage==="CONTACTED"?"Contacted":"New"}</span>
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
                  <Link className="text-sm text-link underline"
                    href={"/tpo/placements/jobs/"+encodeURIComponent(doc.jobId)}>Open drive</Link>
                </li>)}
              </ul>}
          </section>
        </div>

        <div className="space-y-5">
          <section className="border-b border-border py-4">
            <h2 className="font-semibold text-foreground">Drives</h2>
            <Button variant="secondary" type="button" className="mt-3"
              disabled={visibleDrives.length===0}
              onClick={()=>{
                const blob=new Blob([companyDriveCsv(visibleDrives)],{type:"text/csv;charset=utf-8"});
                const url=URL.createObjectURL(blob);
                const link=document.createElement("a");
                link.href=url;
                link.download=company.name.toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,70)+"-drives.csv";
                document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
              }}>
              Export drives CSV
            </Button>
            <label className="mt-3 block text-sm text-body">Search drives
              <Input className="mt-1"
                type="search" value={driveSearch} onChange={e=>setDriveSearch(e.target.value)}
                placeholder="Search role, status or year"/>
            </label>
            {company.drives.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No drives yet.</p>
            ) : (
              <div className="mt-3">
                <DataTable rows={visibleDrives} getRowKey={drive=>drive.id}
                  caption="Company drives" empty={<p>No matching drives.</p>}
                  columns={[
                    {key:"role",header:"Role",mobilePriority:"primary",cell:drive=>
                      <Link className="inline-flex min-h-9 items-center font-semibold text-link hover:underline"
                        href={"/tpo/placements/jobs/" + encodeURIComponent(drive.id)}>{drive.jobTitle}</Link>},
                    {key:"status",header:"Status",mobilePriority:"secondary",cell:drive=>statusLabel(drive.status)},
                    {key:"year",header:"Year",mobilePriority:"secondary",cell:drive=>new Intl.DateTimeFormat("en-IN",{year:"numeric",timeZone:"Asia/Kolkata"}).format(new Date(drive.createdAt))},
                    {key:"applied",header:"Applied",mobilePriority:"secondary",cell:drive=>drive.applied+" · "+drive.offers+" offers"},
                    {key:"created",header:"Created",mobilePriority:"secondary",cell:drive=>dateLabel(drive.createdAt)},
                  ]}/>
              </div>
            )}
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
