import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import {getMentorResourceDirectory} from "@/modules/projects/mentor-resource-directory-service";
import {mentorResourceDirectoryHref,mentorResourceDirectoryQuerySchema}
 from "@/modules/projects/mentor-resource-directory-model";
type Search={required?:string|string[];link?:string|string[];description?:string|string[];order?:string|string[];search?:string|string[];page?:string|string[]};
const first=(x:string|string[]|undefined)=>Array.isArray(x)?x[0]:x;
export default async function MentorResourceDirectoryPage({params,searchParams}:{
 params:Promise<{projectId:string}>;searchParams:Promise<Search>;
}){
 const [{projectId},raw]=await Promise.all([params,searchParams]);
 const parsed=mentorResourceDirectoryQuerySchema.safeParse({
  projectId,required:first(raw.required)??undefined,
  link:first(raw.link)??undefined,
  description:first(raw.description)??undefined,
  order:first(raw.order)??undefined,
  search:first(raw.search)??undefined,page:first(raw.page)??undefined,
 });
 if(!parsed.success)return <section role="alert" className="space-y-3">
  <h1>Invalid resource filters</h1>
  <Link href="/mentor/projects" className="text-primary-text underline">Projects</Link>
 </section>;
 const data=await getMentorResourceDirectory(await getCurrentRequestContext(),parsed.data);
 const base="/mentor/projects/"+encodeURIComponent(projectId);
 const current=mentorResourceDirectoryHref({...data.query,page:1});
 const filters=current.includes("?")?"?"+current.split("?")[1]:"";
 return <div className="space-y-5">
  <PageHeader eyebrow="Mentor · Project resources" title="Registered resource links"
   description={data.projectTitle}
   actions={<Link href={base+"?tab=resources"}
    className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
     Project resources
   </Link>}/>
  {!data.enabled?<section role="status" className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
   Projects access is disabled; resource metadata was not loaded.
  </section>:<>
   <p className="text-sm text-body">
    {data.registered} active resource records · {data.requiredCount} required ·
    {" "}{data.linkableCount} with HTTPS links.
   </p>
   <form method="get" action={base+"/resources-directory"}
    className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
    <label className="grid gap-1 text-sm font-semibold text-body">Resource title or description
     <input type="search" name="search" maxLength={100} defaultValue={data.query.search}
      className="min-h-10 rounded-md border border-border bg-background px-3"/>
    </label>
    <label className="grid gap-1 text-sm font-semibold text-body">Requirement
     <select name="required" defaultValue={data.query.required}
      className="min-h-10 rounded-md border border-border bg-background px-3">
      <option value="ALL">All</option><option value="REQUIRED">Required</option>
      <option value="OPTIONAL">Optional</option>
     </select>
    </label>
    <label className="grid gap-1 text-sm font-semibold text-body">HTTPS link availability
     <select name="link" defaultValue={data.query.link}
      className="min-h-10 rounded-md border border-border bg-background px-3">
      <option value="ALL">All</option><option value="HTTPS">Safe HTTPS link</option>
      <option value="UNAVAILABLE">No safe HTTPS link</option>
     </select>
    </label>
    <label className="grid gap-1 text-sm font-semibold text-body">Description recorded
     <select name="description" defaultValue={data.query.description}
      className="min-h-10 rounded-md border border-border bg-background px-3">
      <option value="ALL">Any</option><option value="RECORDED">Has a description</option>
      <option value="MISSING">No written description</option>
     </select>
    </label>
    <label className="grid gap-1 text-sm font-semibold text-body">Resource order
     <select name="order" defaultValue={data.query.order}
      className="min-h-10 rounded-md border border-border bg-background px-3">
      <option value="SEQUENCE">Recorded sequence</option><option value="TITLE">Title (A–Z)</option>
     </select>
    </label>
    <button type="submit" className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
     Filter
    </button>
    <Link href={base+"/resources-directory" } className="text-sm font-semibold text-primary-text underline">
     Clear
    </Link>
   </form>
   <div className="flex flex-wrap items-center gap-3">
    <Link href={"/api/projects/"+encodeURIComponent(projectId)+
      "/mentor-resources-export"+filters}
      download className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
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
   <ol className="grid gap-3 sm:grid-cols-2">
    {data.items.map(resource=><li key={resource.id}
     className="min-w-0 rounded-xl border border-border bg-surface p-4">
     <div className="flex flex-wrap items-start justify-between gap-2">
      <h2 className="break-words font-semibold text-foreground">{resource.title}</h2>
      <span className="text-xs font-semibold text-body">
       {resource.required?"Required":"Optional"}
      </span>
     </div>
     {resource.description?<p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">
      {resource.description}</p>:null}
     {resource.safeUrl?<Link href={resource.safeUrl} target="_blank" rel="noopener noreferrer"
      className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">
      Open HTTPS resource
     </Link>:<p className="mt-2 text-xs text-muted-foreground">
      No safe HTTPS link recorded.
     </p>}
    </li>)}
   </ol>}
   <nav aria-label="Resource directory pages" className="flex items-center justify-between gap-3">
    <p className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</p>
    <div className="flex gap-3">
     {data.page>1?<Link href={mentorResourceDirectoryHref({...data.query,page:data.page-1})}
      className="text-sm font-semibold text-primary-text underline">Previous</Link>:null}
     {data.page<data.totalPages?<Link href={mentorResourceDirectoryHref({...data.query,page:data.page+1})}
      className="text-sm font-semibold text-primary-text underline">Next</Link>:null}
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
