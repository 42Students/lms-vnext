import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import {HrRecruiterDrivesGrid,type HrRecruiterDriveSheetRow} from "@/components/placements/hr-recruiter-drives-grid";
import { cx } from "@/lib/class-names";
import type { listOwnRecruiterPlacementJobs } from "@/modules/placements/recruiter-service";

type RecruiterJobs = Awaited<
  ReturnType<typeof listOwnRecruiterPlacementJobs>
>;

function deadlineRelative(deadline:Date|null,now:Date):string{
 if(!deadline)return "Application deadline not recorded";
 const day=(value:Date)=>{
  const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",
    year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(value);
  const get=(name:string)=>Number(parts.find(item=>item.type===name)?.value??0);
  return Date.UTC(get("year"),get("month")-1,get("day"))/86400000;
 };
 const delta=day(deadline)-day(now);
 if(delta===0)return deadline>=now?"Applications close today":"Application deadline passed today";
 if(delta===1)return "Applications close tomorrow";
 if(delta>1)return "Applications close in "+delta+" days";
 if(delta===-1)return "Application deadline passed yesterday";
 return "Application deadline passed "+Math.abs(delta)+" days ago";
}

export function RecruiterPlacementPortfolio({
  jobs, returnTo, counts, now, unansweredRequests={}, sheetScopeKey,
}: {
  jobs: RecruiterJobs;
  returnTo?: string;
  counts?:Record<string,{sharedApplicants:number;offers:number}>;
  unansweredRequests?:Record<string,number>;
  now:Date;
  /** When provided, the desktop drive list uses the shared legacy AG Grid sheet. */
  sheetScopeKey?:string;
}) {
  if (jobs.length === 0) {
    return (
      <EmptyState
        title="No employer opportunities yet"
        description="Published or closed opportunities appear here only after a college grants your employer account access to that exact relationship."
      />
    );
  }

  const sortedJobs=[...jobs].sort((a,b)=>
    Number((unansweredRequests[b.job.id]??0)>0)-Number((unansweredRequests[a.job.id]??0)>0));
  const sheetRows:HrRecruiterDriveSheetRow[]=sheetScopeKey?sortedJobs.map(item=>{
    const job=item.job;
    const id=job.id;
    const requests=unansweredRequests[id]??0;
    const sharedApplicants=counts?.[id]?.sharedApplicants??0;
    return {
      id,
      title:job.title,
      company:item.companyName,
      college:item.collegeName,
      jobType:job.employmentType.toLowerCase().replaceAll("_"," "),
      pay:job.minimumAnnualCtcInr!=null||job.maximumAnnualCtcInr!=null
        ? "CTC: "+[job.minimumAnnualCtcInr,job.maximumAnnualCtcInr]
          .filter(value=>value!=null).map(value=>"₹"+new Intl.NumberFormat("en-IN").format(value!)).join("–")
        : "CTC not specified",
      sharedApplicants,
      offers:counts?.[id]?.offers??0,
      applicantsHref:"/recruiter/drives/"+encodeURIComponent(id)+"?tab=applicants"+
        (returnTo?"&returnTo="+encodeURIComponent(returnTo):""),
      offersHref:"/recruiter/drives/"+encodeURIComponent(id)+"?tab=offers"+
        (returnTo?"&returnTo="+encodeURIComponent(returnTo):""),
      requestsHref:"/recruiter/drives/"+encodeURIComponent(id)+"?tab=requests"+
        (returnTo?"&returnTo="+encodeURIComponent(returnTo):""),
      deadlineLabel:job.applicationDeadline?
        new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",year:"numeric",timeZone:"Asia/Kolkata"}).format(job.applicationDeadline):
        "Not recorded",
      status:job.status==="PUBLISHED"?"Live":job.status==="CLOSED"?"Completed":job.status,
      nextStep:requests>0?"The placement cell asked for a change. Answer the open request.":
        job.status==="CLOSED"?"Hire again with a new request.":
        sharedApplicants===0?"Wait for the placement cell to share the applicant list.":
        job.applicationDeadline&&job.applicationDeadline<now?
          "Review shared applicants and hiring rounds after the deadline.":
          "Review shared applicants and prepare the next hiring step.",
      openHref:"/recruiter/drives/"+id+(returnTo?"?returnTo="+encodeURIComponent(returnTo):""),
      hireAgainHref:"/hr/drives/new?collegeId="+encodeURIComponent(item.collegeId)+"&from="+encodeURIComponent(id),
      hireAgainLabel:job.status==="CLOSED"?"Hire again":"Hire again with changes",
      messagesHref:"/recruiter/drives/"+encodeURIComponent(id)+"/messages",
      unansweredRequests:requests,
    };
  }):[];

  return (
    <>
      {sheetScopeKey?<div className="hidden min-w-0 min-[768px]:block">
        <HrRecruiterDrivesGrid rows={sheetRows} scopeKey={sheetScopeKey}/>
      </div>:null}
      <div className={sheetScopeKey?"grid gap-4 min-[768px]:hidden":"grid gap-4"}>
      {sortedJobs.map((item) => (
        <Card as="article"
          key={item.job.id}
          className={cx("border-b border-[var(--lms-canvas-border)] px-1 py-4", (unansweredRequests[item.job.id]??0)>0 ? "border-warning bg-[var(--lms-warning-subtle)]" : "border-border bg-surface")}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  tone={
                    item.job.status ===
                    "PUBLISHED"
                      ? "success"
                      : "neutral"
                  }
                >
                  {item.job.status==="PUBLISHED"?"Live":item.job.status==="CLOSED"?"Completed":item.job.status}
                </StatusBadge>
                <span className="text-xs font-semibold text-muted-foreground">
                  {item.collegeName}
                </span>
              </div>
              <h2 className="mt-3 text-[16px] font-semibold leading-[26px] text-foreground min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">
                {item.job.title}
              </h2>
              <p className="mt-1 text-sm text-body">
                {item.companyName} ·{" "}
                {item.job.employmentType
                  .toLowerCase()
                  .split("_")
                  .join(" ")}{" "}
                ·{" "}
                {item.job.workMode
                  .toLowerCase()}
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {item.job.minimumAnnualCtcInr!=null||item.job.maximumAnnualCtcInr!=null
                  ? "CTC: "+[item.job.minimumAnnualCtcInr,item.job.maximumAnnualCtcInr]
                    .filter(value=>value!=null).map(value=>"₹"+new Intl.NumberFormat("en-IN").format(value!)).join("–")
                  : "CTC not specified"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {deadlineRelative(item.job.applicationDeadline,now)}
              </p>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-body">
                {item.job.description}
              </p>
              <nav aria-label={"Drive metrics for "+item.job.title}
                className="mt-2 flex flex-wrap gap-3 text-sm">
                <Link
                  className="font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
                  href={"/recruiter/drives/"+item.job.id+"?tab=applicants"+(returnTo?"&returnTo="+encodeURIComponent(returnTo):"")}>
                  {counts?.[item.job.id]?.sharedApplicants??0} shared applicants
                </Link>
                <Link
                  className="font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
                  href={"/recruiter/drives/"+item.job.id+"?tab=offers"+(returnTo?"&returnTo="+encodeURIComponent(returnTo):"")}>
                  {counts?.[item.job.id]?.offers??0} offers
                </Link>
              </nav>
              {(unansweredRequests[item.job.id]??0)>0?<Link
                href={"/recruiter/drives/"+item.job.id+"?tab=requests"+(returnTo?"&returnTo="+encodeURIComponent(returnTo):"")}
                className="mt-2 inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-warning bg-[var(--lms-warning-subtle)] px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
                Answer {unansweredRequests[item.job.id]} open {unansweredRequests[item.job.id]===1?"request":"requests"} →
              </Link>:null}
              <p className="mt-2 text-sm text-body">
                Next: {(unansweredRequests[item.job.id]??0)>0?
                  "The placement cell asked for a change. Answer the open request.":item.job.status==="CLOSED"
                  ? "Hire again with a new request."
                  : (counts?.[item.job.id]?.sharedApplicants??0)===0
                    ? "Wait for the placement cell to share the applicant list."
                    : item.job.applicationDeadline&&item.job.applicationDeadline<now
                      ? "Review shared applicants and hiring rounds after the deadline."
                      : "Review shared applicants and prepare the next hiring step."}
              </p>
            </div>
            <Link
              href={"/recruiter/drives/" + item.job.id +
                (returnTo ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
              className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary-subtle hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
            >
              Open hiring flow
            </Link>
          </div>
          <nav aria-label={"Actions for "+item.job.title}
            className="mt-4 flex min-w-0 flex-wrap gap-3 border-t border-[var(--lms-canvas-border)] pt-3">
            <Link href={"/hr/drives/new?collegeId="+encodeURIComponent(item.collegeId)+"&from="+encodeURIComponent(item.job.id)}
              className="inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
              {item.job.status==="CLOSED"?"Hire again":"Hire again with changes"}
            </Link>
            <Link href={"/recruiter/drives/"+encodeURIComponent(item.job.id)+"/messages"}
              className="inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
              Answer
            </Link>
          </nav>
        </Card>
      ))}
      </div>
    </>
  );
}
