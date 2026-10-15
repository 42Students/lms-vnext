import Link from "next/link";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasActiveMembership,hasMembershipRole} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
import {aiGradingSelectionSchema} from "@/modules/courses/faculty-ai-grading-model";
import {getFacultyAiGradingReview} from "@/modules/courses/faculty-ai-grading-service";
import {facultyAiGradingHref,facultyAiGradingReportHref} from "@/modules/courses/faculty-ai-grading-links";
import {FacultyAiGradingWorkbench} from "@/components/courses/faculty-ai-grading-workbench";
export const dynamic="force-dynamic";
type Params={assignmentId?:string|string[];deliveryId?:string|string[];submissionId?:string|string[];page?:string|string[]};
function onlyOne(value:string|string[]|undefined):string|undefined{
 return Array.isArray(value)?undefined:value;
}
export default async function FacultyAiGradingPage({searchParams}:{searchParams:Promise<Params>}){
 const context=await getCurrentRequestContext();
 if(!hasActiveMembership(context)||!hasMembershipRole(context,"FACULTY"))notFound();
 const params=await searchParams;
 const selected=aiGradingSelectionSchema.safeParse({
  assignmentId:onlyOne(params.assignmentId),deliveryId:onlyOne(params.deliveryId),
  submissionId:onlyOne(params.submissionId),page:onlyOne(params.page),
 });
 if(!params.assignmentId&&!params.deliveryId&&!params.submissionId&&!params.page)
  return <div className="space-y-6">
   <PageHeader eyebrow="Faculty · Assessment Tools" title="AI-assisted grading review"
    description="Human-confirmed grading suggestions for existing, authorized text submissions. The AI provider is disabled by default."/>
   <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
    <h2 className="font-semibold">Start from an assignment report</h2>
    <p className="text-sm text-body">Choose a published assignment in your teaching Section, open its report, and select AI grading review. Suggestions never save or publish grades.</p>
    <Link href="/teacher/allAssignments" className="text-sm font-semibold text-primary-text underline">Open All Assignments</Link>
   </section>
  </div>;
 if(!selected.success)return <section role="alert" className="space-y-3">
  <h1 className="text-xl font-semibold">Invalid grading review link</h1>
  <Link href="/ai-grading" className="text-primary-text underline">Open grading review home</Link>
 </section>;
 const data=await getFacultyAiGradingReview(context,selected.data);
 return <div className="space-y-6">
  <PageHeader eyebrow="Faculty · Assessment Tools" title="AI-assisted grading review"
   description={data.assignment.title+" · Suggestions require explicit Faculty review and never publish grades."}
   actions={<Link href={facultyAiGradingReportHref(selected.data)}
     className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-primary-text">Official assignment report</Link>}/>
  <p role="status" className="rounded-xl border border-border bg-surface p-4 text-sm text-body">
   Provider status: disabled. No model requests are made and no suggested scores are generated unless an approved provider is wired by the platform.
  </p>
  <section className="rounded-xl border border-border bg-surface p-4">
   <h2 className="mb-3 font-semibold">Recorded submissions · {data.total}</h2>
   {data.rows.length===0?<p className="text-sm text-muted-foreground">No recorded submissions on this page.</p>:
    <ul className="grid gap-2">{data.rows.map(row=><li key={row.id}>
     <Link href={facultyAiGradingHref({...selected.data,submissionId:row.id})}
      aria-current={row.id===data.selected?.id?"page":undefined}
      className="block rounded-md border border-border px-4 py-3 text-sm text-primary-text hover:underline">
      {row.learnerLabel} · {row.eligible?"Text answer eligible for suggestion review":"Suggestion unavailable"}
     </Link></li>)}</ul>}
   <nav aria-label="Submission pages" className="mt-4 flex gap-4 text-sm">
    {data.page>1?<Link href={facultyAiGradingHref({...selected.data,submissionId:undefined,page:data.page-1})}>Previous</Link>:null}
    <span>Page {data.page} of {data.totalPages}</span>
    {data.page<data.totalPages?<Link href={facultyAiGradingHref({...selected.data,submissionId:undefined,page:data.page+1})}>Next</Link>:null}
   </nav>
  </section>
  {data.selected?<FacultyAiGradingWorkbench key={data.selected.id+"-"+data.selected.version}
   selection={{assignmentId:data.assignment.id,deliveryId:data.assignment.deliveryId,submissionId:data.selected.id,page:data.page}}
   maxPoints={data.assignment.maxPoints} submission={data.selected}/>:null}
 </div>;
}
