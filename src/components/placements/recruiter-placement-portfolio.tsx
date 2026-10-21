import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
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

/** Legacy driveNextAction precedence: open college question, completed
 * hiring flow, shared candidates awaiting review, or wait for access.
 * "To review" is not the entire shared-list count; the backend must supply
 * pending-review state before any exact count is exposed here. */
function recruiterDriveNextStep(status:string,requests:number,shared:number,deadline:Date|null,now:Date){
 if(requests>0)return "The placement cell asked for a change. Answer the open request.";
 if(status==="CLOSED")return "Hire again with a new request.";
 if(shared===0)return "Wait for the placement cell to share the applicant list.";
 if(deadline&&deadline<now)return "Review shared applicants and hiring rounds after the deadline.";
 return "Review shared applicants and prepare the next hiring step.";
}
function recruiterDriveStatus(status:string,openRequests:number){
 if(openRequests>0)return "Waiting for your reply";
 if(status==="PUBLISHED")return "Live";
 if(status==="CLOSED")return "Completed";
 if(status==="CANCELLED")return "Cancelled";
 if(status==="REJECTED")return "Rejected";
 return status;
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
        action={<Link href="/hr/drives/new" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 md:min-h-9">Request a drive</Link>}
      />
    );
  }

  // Local sort retains original server order within equal request priority.
  // Request-priority across pages must happen at the authorized DB query;
  // client-side reordering cannot recover unseen rows.
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
      status:recruiterDriveStatus(job.status,requests),
      nextStep:recruiterDriveNextStep(job.status,requests,sharedApplicants,job.applicationDeadline,now),
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
        <article
          key={item.job.id}
          className={cx("min-w-0 border-b border-[var(--lms-canvas-border)] py-4 first:pt-0", (unansweredRequests[item.job.id]??0)>0 ? "border-warning" : "border-border")}
        >
          <div className="flex min-w-0 flex-col gap-3 min-[768px]:flex-row min-[768px]:items-start min-[768px]:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  tone={
                    item.job.status ===
                    "PUBLISHED"
                      ? "success"
                      : "neutral"
                  }
                >
                  {recruiterDriveStatus(item.job.status,unansweredRequests[item.job.id]??0)}
                </StatusBadge>
                <span className="text-xs font-semibold text-muted-foreground">
                  {item.collegeName}
                </span>
              </div>
              <h2 className="mt-2 break-words font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">
                <Link href={"/recruiter/drives/"+encodeURIComponent(item.job.id)+
                  (returnTo?"?returnTo="+encodeURIComponent(returnTo):"")}
                  className="rounded-[var(--lms-control-radius)] hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
                  {item.job.title}
                </Link>
              </h2>
              <p className="mt-1 break-words text-sm text-body leading-[22px]">
                {item.companyName} ·{" "}
                {item.job.employmentType
                  .toLowerCase()
                  .split("_")
                  .join(" ")}{" "}
                ·{" "}
                {item.job.workMode
                  .toLowerCase()}
              </p>
              <p className="mt-2 text-sm font-medium text-foreground leading-[22px]">
                {item.job.minimumAnnualCtcInr!=null||item.job.maximumAnnualCtcInr!=null
                  ? "CTC: "+[item.job.minimumAnnualCtcInr,item.job.maximumAnnualCtcInr]
                    .filter(value=>value!=null).map(value=>"₹"+new Intl.NumberFormat("en-IN").format(value!)).join("–")
                  : "CTC not specified"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground leading-[20px]">
                {deadlineRelative(item.job.applicationDeadline,now)}
              </p>
              <p className="mt-3 line-clamp-2 text-sm text-body leading-[22px]">
                {item.job.description}
              </p>
              {counts?<nav aria-label={"Drive metrics for "+item.job.title}
                className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <Link
                  className="inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
                  href={"/recruiter/drives/"+item.job.id+"?tab=applicants"+(returnTo?"&returnTo="+encodeURIComponent(returnTo):"")}>
                  {counts?.[item.job.id]?.sharedApplicants??0} shared applicants
                </Link>
                <Link
                  className="font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] max-[767px]:inline-flex max-[767px]:min-h-11 max-[767px]:items-center"
                  href={"/recruiter/drives/"+item.job.id+"?tab=offers"+(returnTo?"&returnTo="+encodeURIComponent(returnTo):"")}>
                  {counts?.[item.job.id]?.offers??0} offers
                </Link>
              </nav>:null}
              {(unansweredRequests[item.job.id]??0)>0?<Link
                href={"/recruiter/drives/"+item.job.id+"?tab=requests"+(returnTo?"&returnTo="+encodeURIComponent(returnTo):"")}
                className="mt-2 inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-warning bg-[var(--lms-warning-subtle)] px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
                Answer {unansweredRequests[item.job.id]} open {unansweredRequests[item.job.id]===1?"request":"requests"} →
              </Link>:null}
              {(unansweredRequests[item.job.id]??0)>0||counts?<p className="mt-2 text-sm text-body leading-[22px]">
                Next: {recruiterDriveNextStep(item.job.status,
                  unansweredRequests[item.job.id]??0,counts?.[item.job.id]?.sharedApplicants??0,
                  item.job.applicationDeadline,now)}
              </p>:null}
            </div>
            <Link
              href={"/recruiter/drives/" + item.job.id +
                (returnTo ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
              className="inline-flex min-h-11 w-full shrink-0 items-center justify-center min-[768px]:min-h-9 min-[768px]:w-auto rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary-subtle hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
            >
              Open
            </Link>
          </div>
          <nav aria-label={"Actions for "+item.job.title}
            className="mt-2 flex min-w-0 flex-wrap items-center gap-x-5 gap-y-1">
            {item.job.status==="CLOSED"?<Link href={"/hr/drives/new?collegeId="+encodeURIComponent(item.collegeId)+"&from="+encodeURIComponent(item.job.id)}
              className="inline-flex min-h-11 min-[768px]:min-h-9 items-center text-sm font-semibold text-primary-text underline underline-offset-4 hover:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
              Hire again
            </Link>:null}
            {(unansweredRequests[item.job.id]??0)>0?<Link href={"/recruiter/drives/"+encodeURIComponent(item.job.id)+"?tab=requests"+
              (returnTo?"&returnTo="+encodeURIComponent(returnTo):"")}
              className="inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
              Answer
            </Link>:null}
          </nav>
        </article>
      ))}
      </div>
    </>
  );
}
