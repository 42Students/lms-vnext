"use client";
import { PageBackLink } from "@/components/ui/page-back-link";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
import {GracefulPageLoading} from "@/components/ui/graceful-page-loading";
import {MetricBar} from "@/components/ui/metric-bar";
import chartStyles from "./legacy-company-bar.module.css";

import Link from "next/link";
import {TpoCompanyTeamConversation} from "./tpo-company-team-conversation";
import {TpoPublicJoinLinkCard} from "./tpo-public-join-link-card";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  driveCountsWarning?:string;
  driveCountsError?:string;
};
type Phase = "loading" | "ready" | "error" | "migration-pending" | "not-found";

const buttonStyle =
  "lms-inline-link inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9";

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
function legacyAgoText(value:string,now:number){
 const elapsed=Math.max(0,Math.floor((now-new Date(value).getTime())/1000));
 if(!Number.isFinite(elapsed))return "just now";
 if(elapsed<60)return "just now";
 if(elapsed<3600)return Math.floor(elapsed/60)+" minutes ago";
 if(elapsed<86400)return Math.floor(elapsed/3600)+" hours ago";
 return Math.floor(elapsed/86400)+" days ago";
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
  const [countsWarning,setCountsWarning]=useState("");
  // Capture once on mount; expiry labels must not call Date.now during render.
  const [renderedAt] = useState(currentTimeMs);
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
        { credentials: "same-origin", cache: "no-store", ...(signal === undefined ? {} : { signal }) },
      );
      const payload = await response.json() as {
        company?: CompanyMemory;
        error?: string;
      };
      if (signal?.aborted) return null;
      if (!response.ok) {
        if (response.status === 503 && (payload.error === "DATABASE_NOT_READY" || payload.error === "DB09_MIGRATIONS_PENDING" || payload.error === "TPO_CRM_SCHEMA_NOT_REGISTERED"))
          return { company: null, phase: "migration-pending", message: "Company details are temporarily unavailable while placement data storage is being prepared. Try again." };
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
    setCountsWarning("");
    void load(controller.signal).then(result => {
      if(!controller.signal.aborted&&activeLoad.current===controller)applyLoad(result);
    });
  }
  function retryCounts() {
    activeLoad.current?.abort();
    const controller=new AbortController();
    activeLoad.current=controller;
    setCountsWarning("Refreshing company numbers…");
    void load(controller.signal).then(result=>{
      if(controller.signal.aborted||activeLoad.current!==controller)return;
      if(result?.phase==="ready"&&result.company){
        setCompany(result.company);
        setCountsWarning("");
      }else setCountsWarning("Couldn't refresh company numbers. Showing the last successfully loaded company details.");
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
      <section aria-label={"Company Memory for " + companyName} className="min-w-0 space-y-4">
        <PageHeader title={companyName} description="Recruiter contacts, drives and hiring history"
          actions={<PageBackLink href="/tpo/recruiters?view=companies" label="Companies" />} />
        {phase === "loading" ? (
          <GracefulPageLoading label="Loading company details" shape="directory" />
        ) : (
          <ErrorState
            title={phase === "not-found" ? "Company not found" :
              phase === "migration-pending" ? "Company details unavailable" : "Company Memory could not be loaded"}
            description={error}
            action={<div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row">
              <Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={retry}>Retry</Button>
              <Link className={buttonStyle} href="/tpo/recruiters?view=companies">Back to companies</Link>
            </div>}
          />
        )}
      </section>
    );
  }

  const latest = company.timeline[0] ?? null;

  return (
    <section className="min-w-0 space-y-4 md:space-y-5" aria-label={"Company Memory for " + company.name}>
      <PageHeader
        title={company.name}
        description={company.drives.length > 1 || company.hiredPerYear.filter(row=>row.hired>0).length > 1
          ? "Repeat hiring relationship"
          : "Recruiter contacts, drives and hiring history"}
        actions={
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <PageBackLink href="/tpo/recruiters?view=companies" label="Companies" />
          <Link href={"/tpo/placements/new?company="+encodeURIComponent(company.name)}
            className={buttonStyle}>Create drive</Link>
          <Link href={"/tpo/recruiters?add=1&company="+encodeURIComponent(company.name)}
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-4 text-sm font-semibold text-[var(--lms-on-primary)] hover:bg-[var(--lms-button-primary-hover)] md:min-h-9">
            Add contact
          </Link>
        </div>
        }
      />
      {company.alsoTypedAs.length ? (
        <p className="min-w-0 break-words text-xs leading-5 text-muted-foreground">
          Also typed as {company.alsoTypedAs.join(", ")}
        </p>
      ) : null}

      <section aria-label="Company numbers" className="grid min-w-0 grid-cols-2 gap-0 overflow-hidden rounded-[12px] border border-border bg-white sm:grid-cols-3 min-[992px]:grid-cols-5">
        {[
          ["Contacts", company.people.length + " · " + activeContacts + " active"],
          ["Drives that ran", String(company.drivesRan)],
          ["students placed", company.studentsHired == null ? "Verification pending" : String(company.studentsHired)],
          ["years hiring", String(company.hiredPerYear.filter(row=>row.hired>0).length)],
          ["Last activity", latest ? latest.type.toLowerCase()+" / "+legacyActivityDay(latest.createdAt) : "no activity yet"],
        ].map(([label, value], index) => (
          <div key={label}
            className={"min-w-0 px-3 py-3 md:px-4 " +
              (index < 4 ? "border-b border-border " : "") +
              (index % 2 === 0 && index < 4 ? "border-r border-border " : "") +
              (index < 3 ? "md:border-b " : "md:border-b-0 ") +
              ([0, 1, 3].includes(index) ? "md:border-r " : "md:border-r-0 ") +
              (index < 4 ? "xl:border-r " : "xl:border-r-0 ") +
              "xl:border-b-0 " +
              (index === 4 ? "col-span-2 md:col-span-2 xl:col-span-1" : "")}>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 break-words font-semibold leading-6 text-foreground">{value}</p>
          </div>
        ))}
      </section>

      {company.studentsHired == null || countsWarning || company.driveCountsWarning ? (
        <div role="status" className="border-l-2 border-warning bg-warning-subtle px-3 py-3 text-sm text-muted-foreground">
          {company.driveCountsError || countsWarning || "Students-placed counts are unavailable for this college's selected placement rule. No estimated zero is shown."}
          <Button variant="secondary" type="button" disabled={phase!=="ready"}
            onClick={retryCounts} className="ml-3 min-h-11 md:min-h-9">Retry counts</Button>
        </div>
      ) : null}

      <div className="grid min-w-0 gap-4 min-[992px]:grid-cols-2">
        <div className="min-w-0 space-y-4">
          <section className="overflow-hidden rounded-[13px] border border-border bg-white p-4 shadow-[0_4px_18px_rgba(26,45,72,0.04)]">
            <h2 className="font-semibold text-foreground">People</h2>
            {company.people.length === 0 ? (
              <p className="mt-3 text-sm text-body">No contacts yet</p>
            ) : (
              <div className="mt-3 divide-y divide-border">
                {company.people.map(person => (
                  <div key={person.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-3 md:flex-nowrap">
                    <div className="flex min-w-0 items-center gap-3">

                      <div className="min-w-0">
                      <Link className="lms-inline-link inline-flex min-h-11 items-center break-words font-medium text-link underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
                        href={"/tpo/recruiters/" + encodeURIComponent(person.id)}>
                        {person.name}
                      </Link>
                      <p className="break-words text-sm text-muted-foreground">
                        {person.designation||person.email||"—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {person.recruiterUserId?(person.recruiterLastLoginAt
                            ?"Joined · signed in "+legacyAgoText(person.recruiterLastLoginAt,renderedAt)
                            :"Joined · has not signed in yet"):
                          person.inviteBouncedAt?"Invite bounced":
                          person.inviteClickedAt?"Opened the invite, not joined yet":
                          person.inviteSentAt?"Invite sent "+legacyAgoText(person.inviteSentAt,renderedAt):"No invite sent"}
                      </p>
                      </div>
                    </div>
                    <Badge  tone="neutral">{person.stage==="DRIVE_PLANNED"?"Drive planned":person.stage==="NOT_NOW"?"Not now":person.stage==="RECRUITED"?"Recruited":person.stage==="JOINED"?"Joined":person.stage==="INVITED"?"Invited":person.stage==="CONTACTED"?"Contacted":"New"}</Badge>
                  </div>
                ))}
              </div>
            )}
          </section>

      {company.hiredPerYear.length>0?(
        <section aria-label="Students placed, by year" className="overflow-hidden rounded-[13px] border border-border bg-white p-4 shadow-[0_4px_18px_rgba(26,45,72,0.04)]">
          <h2 className="font-semibold text-foreground">Students placed, by year</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Years hiring: {company.hiredPerYear.length}. This annual chart reflects distinct confirmed JOINED learners
            by recorded joining year. The students placed total above may use a different placement-rule measure;
            annual joined counts must not be interpreted as annual placement totals.
          </p>
          <ul className="mt-3 space-y-3">
            {company.hiredPerYear.map(item=>(
              <li key={item.year} className="grid min-w-0 grid-cols-[3.5rem_minmax(0,1fr)_3rem] items-center gap-2 text-sm sm:grid-cols-[4rem_minmax(0,1fr)_3rem] sm:gap-3">
                <span>{item.year}</span>
                <MetricBar size="default" role="img" {...(chartStyles["branchBar"] === undefined ? {} : { className: chartStyles["branchBar"] })} label={item.hired+" joined learners in "+item.year}
                  value={item.hired} maximum={Math.max(1,...company.hiredPerYear.map(row=>row.hired))} />
                <strong className="text-right tabular-nums">{item.hired}</strong>
              </li>
            ))}
          </ul>
        </section>
      ):null}
      {company.canonicalCompanyId?<section aria-label="Company link and access" className="overflow-hidden rounded-[13px] border border-border bg-white p-4 shadow-[0_4px_18px_rgba(26,45,72,0.04)]">
        <TpoPublicJoinLinkCard key={company.canonicalCompanyId} scope="COMPANY"
          companyId={company.canonicalCompanyId} companyName={company.name}
          initial={{ready:false,domain:null,link:null}}/>
        <p className="mt-2 text-xs text-muted-foreground">Company trust and drive-review policy are controlled through the linked college company record.</p>
        <Link className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9"
          href={"/tpo/companies/"+encodeURIComponent(company.canonicalCompanyId)}>
          Trust and review settings
        </Link>
      </section>:(
        <section aria-label="Company link unavailable" className="overflow-hidden rounded-[13px] border border-border bg-white p-4 shadow-[0_4px_18px_rgba(26,45,72,0.04)]">
          <h2 className="font-semibold text-foreground">Company link and trust</h2>
          <p className="mt-2 text-sm text-body">No verified college company is linked to this name yet. Link it before editing the domain, trust or recruiter join link.</p>
          <Link className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9"
            href="/tpo/companies">Find a college company</Link>
        </section>
      )}
          <section className="overflow-hidden rounded-[13px] border border-border bg-white p-4 shadow-[0_4px_18px_rgba(26,45,72,0.04)]">
            <h2 className="font-semibold text-foreground">Documents</h2>
            {company.documentsStatus!=="READY"?
              <p role="status" className="mt-3 text-sm text-muted-foreground">
                Share-link history is unavailable until applicant-share storage is registered.
              </p>:company.documents.length===0?
              <p className="mt-3 text-sm text-muted-foreground">Nothing shared yet</p>:
              <ul className="mt-3 divide-y divide-border">
                {company.documents.map(doc=><li key={doc.id} className="py-3">
                  <p className="text-sm text-body">Applicant list shared {dateLabel(doc.createdAt)}</p>
                  <p className="text-xs text-muted-foreground">{doc.jobTitle} · {doc.selectedCount>0?doc.selectedCount+" selected applicants":"Current shortlist"}{doc.revokedAt?" · Link withdrawn":new Date(doc.expiresAt).getTime()<renderedAt?" · Link expired":" · Expires "+dateLabel(doc.expiresAt)}</p>
                  <Link className="lms-inline-link inline-flex min-h-11 items-center text-sm text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
                    href={"/tpo/placements/jobs/"+encodeURIComponent(doc.jobId)}>Open drive</Link>
                </li>)}
              </ul>}
          </section>
        </div>

        <div className="min-w-0 space-y-4">
          <section className="overflow-hidden rounded-[13px] border border-border bg-white p-4 shadow-[0_4px_18px_rgba(26,45,72,0.04)]">
            <h2 className="font-semibold text-foreground">Drives</h2>
            {company.drives.length===0?
              <p className="mt-3 text-sm text-body">No drives yet</p>:
              <div className="mt-3">
                <TpoCompanyMemoryDriveGrid companyName={company.name} drives={company.drives}
                  search={driveSearch} onSearchChange={setDriveSearch}/>
              </div>}
          </section>

          {company.canonicalCompanyId?<TpoCompanyTeamConversation
            companyId={company.canonicalCompanyId} companyName={company.name}
            actorMembershipId={actorMembershipId}/>:
            <section aria-label="Company Team conversation" className="border-b border-border py-4">
              <h2 className="font-semibold text-foreground">Team conversation</h2>
              <p className="mt-2 text-sm text-body">Link this company to a verified college employer before starting a private Team conversation.</p>
              <Link href="/tpo/companies" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Find company</Link>
            </section>}
          <section className="overflow-hidden rounded-[13px] border border-border bg-white p-4 shadow-[0_4px_18px_rgba(26,45,72,0.04)]">
            <h2 className="font-semibold text-foreground">Timeline</h2>
            {company.timeline.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nothing logged yet</p>
            ) : (
              <ol className="mt-3 space-y-3">
                {company.timeline.map(item => (
                  <li className="relative border-l-2 border-border pb-2 pl-4 before:absolute before:-left-[5px] before:top-2 before:size-2 before:rounded-full before:bg-primary" key={item.id}>
                    <p className="break-words text-sm leading-6"><strong>{item.person}</strong> · {item.type.toLowerCase()}{item.note?": "+item.note:""}</p>
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
