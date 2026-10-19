import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import {getMentorResourceDirectory} from "@/modules/projects/mentor-resource-directory-service";
import {mentorResourceDirectoryHref,parseMentorResourceDirectorySearch}
 from "@/modules/projects/mentor-resource-directory-model";
import {mentorResourceDirectoryFilterLayout} from "@/modules/projects/mentor-resource-directory-layout-model";
type Search={required?:string|string[];link?:string|string[];description?:string|string[];order?:string|string[];search?:string|string[];page?:string|string[]};
export default async function MentorResourceDirectoryPage({params,searchParams}:{
 params:Promise<{projectId:string}>;searchParams:Promise<Search>;
}){
 const [{projectId},raw]=await Promise.all([params,searchParams]);
 const parsed=parseMentorResourceDirectorySearch(projectId,raw);
 if(!parsed)return <section role="alert" className="space-y-3">
  <PageHeader title="Invalid resource filters" />
  <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"/resources-directory"}
   className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear invalid filters</Link>
 </section>;
 const data=await getMentorResourceDirectory(await getCurrentRequestContext(),parsed);
 const base="/mentor/projects/"+encodeURIComponent(projectId);
 const current=mentorResourceDirectoryHref({...data.query,page:1});
 const filters=current.includes("?")?"?"+current.split("?")[1]:"";
 return <div className="min-w-0 max-w-full space-y-5">
  <PageHeader eyebrow="Mentor · Project resources" title="Registered resource links"
   description={data.projectTitle}
   actions={<Link href={base+"?tab=resources"}
    className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
     Project resources
   </Link>}/>
  {!data.enabled?<section role="status" className="border-b border-border pb-4 text-sm text-body">
   Projects access is disabled; resource metadata was not loaded.
  </section>:<>
   <p className="text-sm text-body">
    {data.registered} active resource records · {data.requiredCount} required ·
    {" "}{data.linkableCount} with HTTPS links.
   </p>
   <form method="get" action={base+"/resources-directory"}
    className={mentorResourceDirectoryFilterLayout}>
    <label className="grid gap-1 text-sm font-semibold text-body">Resource title or description
     <Input type="search" name="search" maxLength={100} defaultValue={data.query.search}
      className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3"/>
    </label>
    <label className="grid gap-1 text-sm font-semibold text-body">Requirement
     <Select name="required" defaultValue={data.query.required}
      className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
      <option value="ALL">All</option><option value="REQUIRED">Required</option>
      <option value="OPTIONAL">Optional</option>
     </Select>
    </label>
    <label className="grid gap-1 text-sm font-semibold text-body">HTTPS link availability
     <Select name="link" defaultValue={data.query.link}
      className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
      <option value="ALL">All</option><option value="HTTPS">Safe HTTPS link</option>
      <option value="UNAVAILABLE">No safe HTTPS link</option>
     </Select>
    </label>
    <label className="grid gap-1 text-sm font-semibold text-body">Description recorded
     <Select name="description" defaultValue={data.query.description}
      className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
      <option value="ALL">Any</option><option value="RECORDED">Has a description</option>
      <option value="MISSING">No written description</option>
     </Select>
    </label>
    <label className="grid gap-1 text-sm font-semibold text-body">Resource order
     <Select name="order" defaultValue={data.query.order}
      className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
      <option value="SEQUENCE">Recorded sequence</option><option value="TITLE">Title (A–Z)</option>
     </Select>
    </label>
    <Button type="submit" variant="primary">
     Filter
    </Button>
    <Link href={base+"/resources-directory" } className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
     Clear
    </Link>
   </form>
   <div className="flex flex-wrap items-center gap-3">
    <Link href={"/api/projects/"+encodeURIComponent(projectId)+
      "/mentor-resources-export"+filters}
      download className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
     Export resource metadata CSV (max 200)
    </Link>
    {data.exportOmitted>0?<p role="status" className="text-xs text-body">
     Export omits {data.exportOmitted} matching resource records.
    </p>:null}
   </div>
   <p className="text-sm text-body">{data.total} matching recorded resource{data.total===1?"":"s"}</p>
   {data.items.length===0?<EmptyState title="No matching resources"
    description={data.registered===0?
     "No active resources were persisted for this authorized project.":
     "Clear the filters to see other registered resource metadata."}/>:
   <ol className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
    {data.items.map(resource=><li key={resource.id}
     className="min-w-0 rounded-[var(--lms-radius-card)] border border-[var(--lms-canvas-border)] bg-surface p-4">
     <div className="flex flex-wrap items-start justify-between gap-2">
      <h2 className="break-words font-semibold text-foreground">{resource.title}</h2>
      <span className="text-xs font-semibold text-body">
       {resource.required?"Required":"Optional"}
      </span>
     </div>
     {resource.description?<p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">
      {resource.description}</p>:null}
     {resource.safeUrl?<Link href={resource.safeUrl} target="_blank" rel="noopener noreferrer"
      className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
      Open HTTPS resource
     </Link>:<p className="mt-2 text-xs text-muted-foreground">
      No safe HTTPS link recorded.
     </p>}
    </li>)}
   </ol>}
   <nav aria-label="Resource directory pages" className="flex min-w-0 flex-wrap items-center justify-between gap-3">
    <p className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</p>
    <div className="flex gap-3">
     {data.page>1?<Link href={mentorResourceDirectoryHref({...data.query,page:data.page-1})}
      className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Previous</Link>:null}
     {data.page<data.totalPages?<Link href={mentorResourceDirectoryHref({...data.query,page:data.page+1})}
      className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Next</Link>:null}
    </div>
   </nav>
  </>}
  <p className="text-xs text-muted-foreground">
   Only registered resource metadata and explicitly safe HTTPS links are shown.
   No file storage, upload, download proxy, contact details or private URLs
   are added by this directory.
  </p>
 </div>;
}
