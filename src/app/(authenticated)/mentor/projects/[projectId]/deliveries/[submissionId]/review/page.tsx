import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
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
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader eyebrow="Mentor · Final delivery" title={"Delivery version "+v.version}
      description={data.projectTitle+" · "+data.projectStatus}
      actions={<Link href={"/mentor/projects/"+encodeURIComponent(data.projectId)+"/review-overview"}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Review overview
      </Link>}/>
    <section className="border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-5)]">
      <h2 className="text-base font-semibold">Registered review decision</h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
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
      <h3 className="mt-5 font-semibold">Learner submission summary</h3>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">{v.summary||"No summary recorded"}</p>
      <h3 className="mt-5 font-semibold">Recorded reviewer feedback</h3>
      {v.feedback?<p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">
        {v.feedback}</p>:
        <p className="mt-2 text-sm text-muted-foreground">
          No written reviewer feedback is recorded for this version.
        </p>}
    </section>
    <section className="border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-5)]">
      <h2 className="font-semibold">Learner notes</h2>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">
        {v.notes||"No learner notes were attached to this version."}
      </p>
    </section>
    <section className="border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-5)]">
      <h2 className="font-semibold">Submitted source and demo links</h2>
      <div className="mt-3 flex flex-wrap gap-3">
        {([{label:"Source",href:safeProjectExternalHref(v.sourceUrl)},
          {label:"Demo",href:safeProjectExternalHref(v.demoUrl)}]).map(item=>
            item.href?<a key={item.label} href={item.href} target="_blank"
              rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              Open {item.label.toLowerCase()} link ↗</a>:null)}
        {!safeProjectExternalHref(v.sourceUrl)&&!safeProjectExternalHref(v.demoUrl)?
          <p className="text-sm text-muted-foreground">No valid source or demo URL.</p>:null}
      </div>
    </section>
    <section className="border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-5)]">
      <h2 className="font-semibold">Additional submission files and links ({attachments.length})</h2>
      {!attachments.length?<p className="mt-2 text-sm text-muted-foreground">No extra attachments recorded.</p>:null}
      <ul className="mt-3 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{attachments.map((entry,index)=>{
        const name=typeof entry.name==="string"?entry.name:"Attachment "+(index+1);
        const kind=entry.kind==="FILE"?"File":entry.kind==="LINK"?"Link":"Attachment";
        const href=typeof entry.url==="string"?safeProjectExternalHref(entry.url):null;
        return <li key={index} className="py-[var(--lms-space-3)] text-sm">
          <span className="font-semibold">{name}</span> · {kind}
          {href?<a href={href} target="_blank" rel="noopener noreferrer"
            className="ml-2 inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Open link ↗</a>:null}
          {kind==="File"&&typeof entry.fileId==="string"?
            <span className="ml-2 text-muted-foreground">Uploaded file recorded</span>:null}
        </li>;
      })}</ul>
    </section>
    <section className="border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-5)]">
      <h2 className="font-semibold">Recorded submission history</h2>
      <ol className="mt-3 space-y-2 text-sm">
        {v.createdAt?<li>Draft created · {format(v.createdAt)} · {data.createdByName??"Project learner"}</li>:null}
        {v.submittedAt?<li>Submitted · {format(v.submittedAt)} · {data.submittedByName??"Project learner"}</li>:null}
        {v.reviewedAt?<li>Reviewed ({v.decisionLabel}) · {format(v.reviewedAt)}
          {" · "+(data.reviewedByName??"Reviewer")}</li>:null}
        {data.events.map(event=><li key={event.id}>
          {event.eventType.replaceAll("_"," ").toLowerCase()} · {format(event.occurredAt)}
          {" · "+event.actorName}
          {event.reason?<p className="whitespace-pre-wrap break-words text-xs text-body">{event.reason}</p>:null}
        </li>)}
      </ol>
      {!v.createdAt&&!v.submittedAt&&!v.reviewedAt&&!data.events.length?
        <p className="mt-2 text-sm text-muted-foreground">No submission history recorded.</p>:null}
    </section>
    <p className="text-xs text-muted-foreground">
      This version&apos;s evidence and history are visible only to authorized project mentors.
      External URLs open only after safety checks. Uploaded file metadata is shown
      without exposing storage identifiers or bypassing protected download permissions.
      Existing Delivery review controls remain the only write path.
    </p>
  </div>;
}
