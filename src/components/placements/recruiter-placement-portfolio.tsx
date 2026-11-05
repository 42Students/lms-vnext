import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import type { listOwnRecruiterPlacementJobs } from "@/modules/placements/recruiter-service";
import { Heading } from "@/components/ui/heading";

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
 if(["CLOSED","REJECTED","CANCELLED"].includes(status))return "Hire again with a new request.";
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
  jobs, returnTo, counts, now, unansweredRequests={},
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

  return (
    <>
      <div className="grid gap-4" aria-label="Recruiter drives">
      {sortedJobs.map((item) => (
        <article
          key={item.job.id}
          className={"group relative min-w-0 cursor-pointer rounded-[var(--lms-canvas-radius)] border bg-surface p-4 transition-[box-shadow,border-color,transform] hover:-translate-y-0.5 hover:shadow-sm focus-within:focus-outline "+((unansweredRequests[item.job.id]??0)>0?"border-warning":"border-[var(--lms-canvas-border)]")}
        >
          <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
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
              <Heading level={2} size="base" className="mt-2 break-words text-[var(--lms-heading)] leading-[26px] md:text-[18px] md:leading-[28px] lg:text-[20px] lg:leading-[30px]">
                <Link href={"/recruiter/drives/"+encodeURIComponent(item.job.id)+
                  (returnTo?"?returnTo="+encodeURIComponent(returnTo):"")}
                  className="rounded-[var(--lms-control-radius)] after:absolute after:inset-0 hover:text-primary-text focus-ring">
                  {item.job.title}
                </Link>
              </Heading>
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
              {item.job.minimumAnnualCtcInr!=null||item.job.maximumAnnualCtcInr!=null?<p className="mt-2 text-sm font-medium text-foreground leading-[22px]">
                {item.job.minimumAnnualCtcInr!=null||item.job.maximumAnnualCtcInr!=null
                  ? "CTC: "+[item.job.minimumAnnualCtcInr,item.job.maximumAnnualCtcInr]
                    .filter(value=>value!=null).map(value=>"₹"+new Intl.NumberFormat("en-IN").format(value)).join("–")
                  : null}
              </p>:null}
              <p className="mt-1 text-xs text-muted-foreground leading-[20px]">
                {deadlineRelative(item.job.applicationDeadline,now)}
              </p>
              <p className="mt-3 line-clamp-2 text-sm text-body leading-[22px]">
                {item.job.description}
              </p>
              {counts?<nav aria-label={"Drive metrics for "+item.job.title}
                className="relative z-(--lms-z-raised) mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <Link
                  className="inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-ring"
                  href={"/recruiter/drives/"+item.job.id+"?tab=applicants"+(returnTo?"&returnTo="+encodeURIComponent(returnTo):"")}>
                  {counts?.[item.job.id]?.sharedApplicants==null?"Applicants unavailable":`${counts?.[item.job.id]?.sharedApplicants} shared applicants`}
                </Link>
                {(counts?.[item.job.id]?.offers??0)>0?<Link
                  className="font-semibold text-primary-text underline focus-ring max-md:inline-flex max-md:min-h-11 max-md:items-center"
                  href={"/recruiter/drives/"+item.job.id+"?tab=offers"+(returnTo?"&returnTo="+encodeURIComponent(returnTo):"")}>
                  {counts?.[item.job.id]?.offers??0} offers
                </Link>:null}
              </nav>:null}
              {(unansweredRequests[item.job.id]??0)>0?<Link
                href={"/recruiter/drives/"+item.job.id+"?tab=requests"+(returnTo?"&returnTo="+encodeURIComponent(returnTo):"")}
                className="relative z-(--lms-z-raised) mt-2 inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-warning bg-[var(--lms-warning-subtle)] px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle focus-ring">
                The placement cell asked about {unansweredRequests[item.job.id]===1?"1 thing":`${unansweredRequests[item.job.id]} things`}
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
              className="relative z-(--lms-z-raised) inline-flex min-h-11 w-full shrink-0 items-center justify-center md:min-h-9 md:w-auto rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary-subtle hover:text-primary-text focus-ring"
            >
              Open
            </Link>
          </div>
          <nav aria-label={"Actions for "+item.job.title}
            className="relative z-(--lms-z-raised) mt-2 flex min-w-0 flex-wrap items-center gap-x-5 gap-y-1">
            {["CLOSED","REJECTED","CANCELLED"].includes(item.job.status)?<Link href={"/hr/drives/new?collegeId="+encodeURIComponent(item.collegeId)+"&from="+encodeURIComponent(item.job.id)}
              className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text underline underline-offset-4 hover:text-[var(--lms-primary-hover)] focus-ring">
              {item.job.status==="CLOSED"?"Hire again":"Hire again with changes"}
            </Link>:null}
            {(unansweredRequests[item.job.id]??0)>0?<Link href={"/recruiter/drives/"+encodeURIComponent(item.job.id)+"?tab=requests"+
              (returnTo?"&returnTo="+encodeURIComponent(returnTo):"")}
              className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-ring">
              Answer
            </Link>:null}
          </nav>
        </article>
      ))}
      </div>
    </>
  );
}
