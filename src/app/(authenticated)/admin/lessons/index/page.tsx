import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
import {ErrorState} from "@/components/ui/error-state";
import {
 listGlobalSuperAdminLessonIndex,GLOBAL_LESSON_INDEX_PAGE_SIZE,
} from "@/modules/courses/super-admin-global-lesson-index-service";

export const dynamic="force-dynamic";

export default async function GlobalLessonIndexPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 const raw=await searchParams;
 const q=raw["q"];
 const page=raw["page"];
 const invalid=Object.keys(raw).some(k=>k!=="q"&&k!=="page")||
  (q!==undefined&&(typeof q!=="string"||q.length>80))||
  (page!==undefined&&(typeof page!=="string"||!/^[1-9][0-9]{0,2}$/.test(page)));
 if(invalid)return <div className="min-w-0 space-y-4">
  <PageHeader title="Global lesson index" />
  <ErrorState title="Invalid index filters" description="Clear the search and page filters to continue."
   action={<Link href="/admin/lessons/index" className="font-semibold text-primary-text underline">Clear filters</Link>}/>
 </div>;
 let data:Awaited<ReturnType<typeof listGlobalSuperAdminLessonIndex>>;
 try {
  data=await listGlobalSuperAdminLessonIndex(context,{
   q:typeof q==="string"?q:"",page:typeof page==="string"?Number(page):1,
  });
 }catch{
  return <div className="min-w-0 space-y-4">
   <PageHeader title="Global lesson index"/>
   <ErrorState title="Global lesson index unavailable"
    description="The authorized global index could not be refreshed. Existing college lessons were not changed."
    action={<Link href="/admin/lessons/index" className="font-semibold text-primary-text underline">Retry</Link>}/>
  </div>;
 }
 const search=typeof q==="string"?q:"";
 const href=(nextPage:number)=>"/admin/lessons/index?"+new URLSearchParams({
  ...(search?{q:search}:{}),page:String(nextPage),
 }).toString();
 return <div className="min-w-0 space-y-4 md:space-y-6">
  <PageHeader title="Global lesson index"
   description="Read-only lesson counts across active colleges. Switch college in the header to edit lessons."
   actions={<Link href="/admin/lessons" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text md:min-h-9">Back to Lessons</Link>}/>
  <Alert tone="info">These figures cover lesson records, not individual class deliveries. Hidden and inactive lessons remain in the total. Global indexing does not grant cross-college editing.</Alert>
  <section aria-label="Global lesson directory" className="min-w-0 rounded-[var(--lms-radius-card)] border border-[var(--lms-canvas-border)] bg-surface p-4">
   <form method="get" className="mb-4 flex min-w-0 flex-wrap items-end gap-3">
    <label className="grid min-w-[200px] flex-1 gap-1 text-sm font-semibold text-body">
     College or organization
     <Input type="search" name="q" defaultValue={search} maxLength={80} placeholder="Search colleges"/>
    </label>
    <Button type="submit">Search</Button>
    <Link href={href(data.page)} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text md:min-h-9">Refresh</Link>
   </form>
   {data.items.length?<div className="overflow-x-auto">
    <table className="w-full min-w-[630px] border-collapse text-left text-sm">
     <thead className="bg-[var(--lms-canvas)]"><tr>
      <th scope="col" className="border-b border-border p-3">Organization</th>
      <th scope="col" className="border-b border-border p-3">College</th>
      <th scope="col" className="border-b border-border p-3 text-right">All lessons</th>
      <th scope="col" className="border-b border-border p-3 text-right">Visible lessons</th>
      <th scope="col" className="border-b border-border p-3 text-right">Inactive lessons</th>
     </tr></thead>
     <tbody>{data.items.map(item=><tr key={item.collegeId} className="hover:bg-[var(--lms-primary-subtle)]">
      <td className="border-b border-border p-3">{item.organizationName}</td>
      <td className="border-b border-border p-3"><span className="font-semibold">{item.collegeName}</span>
       <span className="ml-2 text-xs text-muted-foreground">{item.collegeCode}</span></td>
      <td className="border-b border-border p-3 text-right tabular-nums">{item.allLessons}</td>
      <td className="border-b border-border p-3 text-right tabular-nums">{item.visibleLessons}</td>
      <td className="border-b border-border p-3 text-right tabular-nums">{item.inactiveLessons}</td>
     </tr>)}</tbody>
    </table>
   </div>:<p role="status" className="p-4 text-sm text-muted-foreground">No colleges match this search.</p>}
   <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm">
    <p className="text-muted-foreground">Page {data.page} · up to {GLOBAL_LESSON_INDEX_PAGE_SIZE} colleges per page · Refreshed {new Date(data.refreshedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</p>
    <div className="flex items-center gap-3">
     {data.page>1?<Link href={href(data.page-1)} className="font-semibold text-primary-text underline">Previous</Link>:null}
     {data.hasNext?<Link href={href(data.page+1)} className="font-semibold text-primary-text underline">Next</Link>:null}
    </div>
   </div>
  </section>
 </div>;
}
