import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {Disclosure} from "@/components/ui/disclosure";
import {getMentorDeliveryVersion} from "@/modules/projects/mentor-delivery-version-service";
import {safeProjectExternalHref} from "@/modules/projects/mentor-workspace-evidence-model";
export default async function MentorDeliveryVersionPage({params}:{
  params:Promise<{projectId:string;submissionId:string}>;
}){
  const raw=await params;
  const data=await getMentorDeliveryVersion(await getCurrentRequestContext(),raw);
  const v=data.version;
  const attachments=v.attachments.filter((item):item is Record<string,unknown>=>
    Boolean(item)&&typeof item==="object"&&!Array.isArray(item));
  const format=(date:Date)=>new Intl.DateTimeFormat("en-IN",{
    dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
  }).format(date)+" IST";
  return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
    <PageHeader title={"Delivery version "+v.version}
      description={data.projectTitle+" · "+data.projectStatus}
      actions={<Link data-unskin="" href={"/mentor/projects/"+encodeURIComponent(data.projectId)+"/review-overview"}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-teal-deep)] w-full md:w-auto justify-center">
        Review overview
      </Link>}/>
    <section className="min-w-0 border-b border-border pb-[var(--lms-space-4)]">
      <h2 className="m-0 text-base font-semibold leading-6 text-[var(--lms-heading)]">Registered review decision</h2>
      <dl className="mt-4 grid min-w-0 gap-3 md:grid-cols-2">
        <div><dt className="text-xs text-muted-foreground">Submission state</dt>
          <dd className="mt-1 text-sm font-semibold">{v.status}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Submission type</dt>
          <dd className="mt-1 text-sm">{v.submissionType}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Review</dt>
          <dd className="mt-1 text-sm font-semibold">{v.decisionLabel}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Submitted by</dt>
          <dd className="mt-1 text-sm">{data.submittedByName??"Not submitted"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Submitted</dt>
          <dd className="mt-1 text-sm">{v.submittedAt?format(v.submittedAt):"Not submitted"}</dd></div>
      </dl>
      <Disclosure title="Additional review details" className="min-w-0 border-t border-border py-2" contentClassName="pt-3">
        <dl className="grid min-w-0 gap-3 sm:grid-cols-2">
        <div><dt className="text-xs text-muted-foreground">Draft created</dt>
          <dd className="mt-1 text-sm">{v.createdAt?format(v.createdAt):"Not recorded"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Locked</dt>
          <dd className="mt-1 text-sm">{v.lockedAt?format(v.lockedAt):"Not locked"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Reopened for revision</dt>
          <dd className="mt-1 text-sm">{v.reopenedAt?format(v.reopenedAt):"Not reopened"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Reviewed by</dt>
          <dd className="mt-1 text-sm">{data.reviewedByName??"Not reviewed"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Reviewed</dt>
          <dd className="mt-1 text-sm">{v.reviewedAt?format(v.reviewedAt):"No review date recorded"}</dd></div>
        </dl>
      </Disclosure>
      <h3 className="mt-6 font-semibold text-[var(--lms-heading)] text-[var(--lms-font-md)] leading-[24px] min-[768px]:text-[var(--lms-font-lg)] min-[768px]:leading-[26px]">Learner submission summary</h3>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-body leading-[22px]">{v.summary||"No summary recorded"}</p>
      <h3 className="mt-6 font-semibold text-[var(--lms-heading)] text-[var(--lms-font-md)] leading-[24px] min-[768px]:text-[var(--lms-font-lg)] min-[768px]:leading-[26px]">Recorded reviewer feedback</h3>
      {v.feedback?<p className="mt-2 whitespace-pre-wrap break-words text-sm text-body leading-[22px]">
        {v.feedback}</p>:
        <p className="mt-2 text-sm text-muted-foreground leading-[22px]">
          No written reviewer feedback is recorded for this version.
        </p>}
    </section>
    <section className="min-w-0 border-b border-border pb-[var(--lms-space-4)]">
      <h2 className="m-0 text-base font-semibold leading-6 text-[var(--lms-heading)]">Learner notes</h2>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-body leading-[22px]">
        {v.notes||"No learner notes were attached to this version."}
      </p>
    </section>
    <section className="min-w-0 border-b border-border pb-[var(--lms-space-4)]">
      <h2 className="m-0 text-base font-semibold leading-6 text-[var(--lms-heading)]">Submitted source and demo links</h2>
      <div className="mt-3 flex flex-wrap gap-3">
        {([{label:"Source",href:safeProjectExternalHref(v.sourceUrl)},
          {label:"Demo",href:safeProjectExternalHref(v.demoUrl)}]).map(item=>
            item.href?<a key={item.label} href={item.href} target="_blank"
              rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline min-[768px]:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-teal-deep)]">
              Open {item.label.toLowerCase()} link ↗</a>:null)}
        {!safeProjectExternalHref(v.sourceUrl)&&!safeProjectExternalHref(v.demoUrl)?
          <p className="text-sm text-muted-foreground leading-[22px]">No valid source or demo URL.</p>:null}
      </div>
    </section>
    <Disclosure title={<>Additional submission files and links ({attachments.length})</>} className="min-w-0 border-b border-border" contentClassName="min-w-0 pb-4">
      <div className="min-w-0 space-y-2">
      {!attachments.length?<p className="mt-2 text-sm text-muted-foreground leading-[22px]">No extra attachments recorded.</p>:null}
      <ul className="mt-3 divide-y divide-[var(--lms-canvas-border)] border-y border-border">{attachments.map((entry,index)=>{
        const name=typeof entry.name==="string"?entry.name:"Attachment "+(index+1);
        const kind=entry.kind==="FILE"?"File":entry.kind==="LINK"?"Link":"Attachment";
        const href=typeof entry.url==="string" ? safeProjectExternalHref(entry.url) : null;
        return <li key={index} className="py-[var(--lms-space-3)] text-sm">
          <span className="break-words font-semibold">{name}</span> · {kind}
          {href?<a href={href} target="_blank" rel="noopener noreferrer"
            className="ml-2 inline-flex min-h-11 max-w-full items-center break-all text-link underline min-[768px]:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-teal-deep)]">Open link ↗</a>:null}
          {kind==="File"&&typeof entry["fileId"]==="string"?
            <span className="ml-2 text-muted-foreground">Uploaded file recorded</span>:null}
        </li>;
      })}</ul>
      </div>
    </Disclosure>
    <Disclosure title={"Recorded submission history"} className="min-w-0 border-b border-border" contentClassName="min-w-0 pb-4">
      <div className="min-w-0 space-y-2">
      <ol className="mt-3 divide-y divide-[var(--lms-canvas-border)] border-y border-border text-sm">
        {v.createdAt?<li className="py-[var(--lms-space-3)]">Draft created · {format(v.createdAt)} · {data.createdByName??"Project learner"}</li>:null}
        {v.submittedAt?<li className="py-[var(--lms-space-3)]">Submitted · {format(v.submittedAt)} · {data.submittedByName??"Project learner"}</li>:null}
        {v.reviewedAt?<li className="py-[var(--lms-space-3)]">Reviewed ({v.decisionLabel}) · {format(v.reviewedAt)}
          {" · "+(data.reviewedByName??"Reviewer")}</li>:null}
        {data.events.map(event=><li key={event.id} className="py-[var(--lms-space-3)]">
          {event.eventType.replaceAll("_"," ").toLowerCase()} · {format(event.occurredAt)}
          {" · "+event.actorName}
          {event.reason?<p className="whitespace-pre-wrap break-words text-xs text-body leading-5">{event.reason}</p>:null}
        </li>)}
      </ol>
      {!v.createdAt&&!v.submittedAt&&!v.reviewedAt&&!data.events.length?
        <p className="mt-2 text-sm text-muted-foreground leading-[22px]">No submission history recorded.</p>:null}
      </div>
    </Disclosure>
    <p className="text-xs text-muted-foreground leading-5">
      This version&apos;s evidence and history are visible only to authorized project mentors.
      External URLs open only after safety checks. Uploaded file metadata is shown
      without exposing storage identifiers or bypassing protected download permissions.
      Existing Delivery review controls remain the only write path.
    </p>
  </div>;
}
