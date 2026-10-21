import Link from "next/link";
import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectInstances,collegeMemberships,users} from "@/db/schema";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requireProjectManageAccess} from "@/modules/projects/access";
import {getProjectAdminCollegeId} from "@/modules/projects/admin-college-scope";
import {listProjectSubmissions} from "@/modules/projects/submission-service";
import {ProjectDeliveryEvidenceDownload} from "@/components/projects/project-delivery-evidence-download";
import {StatusBadge} from "@/components/ui/status-badge";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import {ErrorState} from "@/components/ui/error-state";

type Evidence={kind:"FILE"|"LINK";name:string;fileId:string|null;url:string|null};
function attachment(item:unknown,index:number):Evidence{
 const value=item&&typeof item==="object"&&!Array.isArray(item)?item as Record<string,unknown>:{};
 const name=[value.label,value.fileName,value.name].find(x=>typeof x==="string"&&x.trim()) as string|undefined;
 return {kind:value.kind==="FILE"?"FILE":"LINK",name:name??"Attachment "+(index+1),
  fileId:typeof value.fileId==="string"?value.fileId:null,
  url:typeof value.url==="string"?value.url:null};
}
function safeUrl(raw:string|null):string|null{
 if(!raw || raw!==raw.trim() || /[\\\x00-\x1f\x7f]/.test(raw))return null;
 try{const url=new URL(raw);return ["http:","https:"].includes(url.protocol)&&!url.username&&!url.password?url.href:null;}
 catch{return null;}
}
function date(value:Date|null|undefined):string{
 return value?new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(value):"—";
}
const linkStyle="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2";

export async function CollegeProjectDeliveryOverview({projectId,basePath="/college/projects"}:{projectId:string;basePath?:string}){
 const context=await getCurrentRequestContext();
 const collegeId=getProjectAdminCollegeId(context);
 if(!collegeId)return <ErrorState title="No college selected" description="Pick a college to view its project workspaces."/>;
 await requireProjectManageAccess(context,projectId);
 const [project]=await getDb().select({id:projectInstances.id,title:projectInstances.title,slug:projectInstances.slug})
  .from(projectInstances).where(and(eq(projectInstances.id,projectId),eq(projectInstances.collegeId,collegeId))).limit(1);
 if(!project)return <EmptyState title="Workspace unavailable" description="The selected workspace is not part of this college."/>;
 const path=basePath+"/"+encodeURIComponent(project.id);
 let delivery:Awaited<ReturnType<typeof listProjectSubmissions>>;
 try{delivery=await listProjectSubmissions(context,project.id);}
 catch{return <ErrorState title="Final delivery could not be loaded"
  description="The workspace is still accessible. Retry loading its submission and review."
  action={<Link className={linkStyle} href={path+"/delivery"}>Retry delivery</Link>}/>;}
 const last=delivery.submissions.at(-1)??null;
 const review=last?delivery.reviews.filter(item=>item.submissionId===last.id).at(-1)??null:null;
 const actorIds=[last?.submittedByMembershipId,review?.reviewedByMembershipId].filter((id):id is string=>Boolean(id));
 const actors=actorIds.length?await getDb().select({id:collegeMemberships.id,name:users.displayName})
  .from(collegeMemberships).innerJoin(users,eq(users.id,collegeMemberships.userId))
  .where(and(eq(collegeMemberships.collegeId,collegeId),inArray(collegeMemberships.id,actorIds))):[];
 const actorName=(id:string|null|undefined)=>actors.find(item=>item.id===id)?.name??"—";
 const attachments=Array.isArray(last?.attachments)?last.attachments.map(attachment):[];
 const primary=attachments[0]??null;
 const additional=attachments.slice(1);
 const reviewStatus=review?.decision??last?.legacyReviewStatus??"PENDING";
 const reviewTone=reviewStatus==="APPROVED"?"success":reviewStatus==="CHANGES_REQUESTED"?"warning":"neutral";
 const facts=[
  {label:"Submission type",value:last?(primary?.kind==="FILE"?"File":primary?.kind==="LINK"?"Link":"Text"):"—"},
  {label:"Submitted by",value:actorName(last?.submittedByMembershipId)},
  {label:"Submitted at",value:date(last?.submittedAt)},
  {label:"Revisions",value:last?String(Math.max(last.legacyRevisionCount??0,last.version-1)):"—"},
 ];
 return <div className="min-w-0 space-y-6">
  <PageHeader eyebrow="Final delivery" title={project.title}
   description="Review the final submission package, evidence, revisions and mentor feedback."
   actions={<Link className={linkStyle} href={path}>Workspace overview</Link>}/>
  <nav aria-label="Project workspace sections" className="flex min-w-0 flex-wrap gap-2 border-b border-border pb-3">
   {[["Summary","summary"],["Tasks","tasks"],["Delivery","delivery"],["Activity","activity"]].map(([label,section])=>
    <Link key={section} href={path+"/"+section} aria-current={section==="delivery"?"page":undefined}
      className={linkStyle+(section==="delivery"?" border-primary bg-primary-subtle":"")}>{label}</Link>)}
  </nav>
  <section aria-labelledby="delivery-summary" className="space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 md:p-6">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <div><p className="text-xs font-semibold uppercase tracking-wider text-primary-text">Final delivery</p>
     <h2 id="delivery-summary" className="mt-1 text-xl font-semibold">Submission package and review state</h2></div>
    <StatusBadge tone={reviewTone}>{reviewStatus.replaceAll("_"," ")}</StatusBadge>
   </div>
   {!last?<div className="space-y-3">
     <EmptyState title="No final delivery has been submitted yet." description="Ask the project team to submit its final package; individual task evidence remains in Tasks."/>
     <Link className={linkStyle} href={path+"/tasks"}>See task submissions</Link>
    </div>:<>
     <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">{facts.map(fact=>
      <div key={fact.label}><dt className="text-xs text-muted-foreground">{fact.label}</dt>
       <dd className="mt-1 break-words text-sm font-semibold">{fact.value}</dd></div>)}</dl>
     <p className="whitespace-pre-wrap text-sm leading-6 text-body">{last.summary}</p>
     {last.notes?<p className="whitespace-pre-wrap text-sm text-body">{last.notes}</p>:null}
     <div className="flex flex-wrap items-start gap-3">
      {primary?.kind==="FILE"?<ProjectDeliveryEvidenceDownload projectId={project.id} fileId={primary.fileId} name={primary.name} legacyReference={last.legacyStorageKey}/>:
       primary?.url&&safeUrl(primary.url)?<a href={safeUrl(primary.url)!} target="_blank" rel="noopener noreferrer" className={linkStyle}>Open submitted link ↗</a>:null}
      {safeUrl(last.sourceUrl)?<a href={safeUrl(last.sourceUrl)!} target="_blank" rel="noopener noreferrer" className={linkStyle}>Source code ↗</a>:null}
      {safeUrl(last.demoUrl)?<a href={safeUrl(last.demoUrl)!} target="_blank" rel="noopener noreferrer" className={linkStyle}>Demo ↗</a>:null}
      {primary?.kind==="LINK"&&!safeUrl(primary.url)?<span role="status" className="text-sm text-muted-foreground">Unavailable link</span>:null}
     </div>
    </>}
  </section>
  <section aria-labelledby="delivery-evidence" className="space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 md:p-6">
   <h2 id="delivery-evidence" className="text-lg font-semibold">Additional evidence ({additional.length})</h2>
   {!additional.length?<p role="status" className="text-sm text-muted-foreground">No additional evidence has been attached.</p>:
    <ol className="space-y-3">{additional.map((item,index)=>
     <li key={index} className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-border py-2">
      <span className="break-words text-sm font-medium">{item.name}</span>
      {item.kind==="FILE"?<ProjectDeliveryEvidenceDownload projectId={project.id} fileId={item.fileId} name={item.name}/>:
       safeUrl(item.url)?<a href={safeUrl(item.url)!} target="_blank" rel="noopener noreferrer" className={linkStyle}>Open evidence ↗</a>:
       <span role="status" className="text-xs text-muted-foreground">Unavailable link</span>}
     </li>)}</ol>}
  </section>
  <section aria-labelledby="delivery-review" className="space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 md:p-6">
   <h2 id="delivery-review" className="text-lg font-semibold">Review</h2>
   {!review?<p role="status" className="text-sm text-muted-foreground">No mentor review has been recorded yet.</p>:<>
    <StatusBadge tone={reviewTone}>{reviewStatus.replaceAll("_"," ")}</StatusBadge>
    <dl className="grid gap-4 text-sm sm:grid-cols-2">
     <div><dt className="text-xs text-muted-foreground">Reviewed by</dt><dd>{actorName(review.reviewedByMembershipId)}</dd></div>
     <div><dt className="text-xs text-muted-foreground">Reviewed at</dt><dd>{date(review.reviewedAt)}</dd></div>
    </dl>
    <p className="whitespace-pre-wrap text-sm text-body">{review.feedback||"No feedback supplied."}</p>
   </>}
  </section>
 </div>;
}
