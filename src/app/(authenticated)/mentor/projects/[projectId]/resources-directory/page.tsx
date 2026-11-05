import { FilterBar } from "@/components/ui/filter-bar";
import { Disclosure } from "@/components/ui/disclosure";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import {getMentorResourceDirectory} from "@/modules/projects/mentor-resource-directory-service";
import {mentorResourceDirectoryHref,parseMentorResourceDirectorySearch}
 from "@/modules/projects/mentor-resource-directory-model";
import {mentorResourceDirectoryFilterLayout} from "@/modules/projects/mentor-resource-directory-layout-model";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
type Search={required?:string|string[];link?:string|string[];description?:string|string[];order?:string|string[];search?:string|string[];page?:string|string[]};
export default async function MentorResourceDirectoryPage({params,searchParams}:{
 params:Promise<{projectId:string}>;searchParams:Promise<Search>;
}){
 const [{projectId},raw]=await Promise.all([params,searchParams]);
 const parsed=parseMentorResourceDirectorySearch(projectId,raw);
 if(!parsed)return <section role="alert" className="space-y-3">
  <PageHeader title="Invalid resource filters" />
  <TextLink href={"/mentor/projects/"+encodeURIComponent(projectId)+"/resources-directory"}
   className="inline-flex min-h-11 items-center">Clear invalid filters</TextLink>
 </section>;
 const data=await getMentorResourceDirectory(await getCurrentRequestContext(),parsed);
 const base="/mentor/projects/"+encodeURIComponent(projectId);
 const current=mentorResourceDirectoryHref({...data.query,page:1});
 const filters=current.includes("?")?"?"+current.split("?")[1]:"";
 const advanced=data.query.link!=="ALL"||data.query.description!=="ALL"||data.query.order!=="SEQUENCE";
 const hasFilters=Boolean(data.query.search)||data.query.required!=="ALL"||advanced;
 return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
  <PageHeader eyebrow="Mentor · Project resources" title="Registered resource links"
   description={data.projectTitle}
   actions={<TextLink data-unskin="" href={base+"?tab=resources"}
    className="inline-flex min-h-11 items-center text-sm md:min-h-9">
     Project resources
   </TextLink>}/>
  {!data.enabled?<section role="status" className="border-b border-border pb-4 text-sm text-body">
   Projects access is disabled; resource metadata was not loaded.
  </section>:<>
   <p className="text-sm text-body leading-[22px]">
    {data.registered} active resource records · {data.requiredCount} required ·
    {" "}{data.linkableCount} with HTTPS links.
   </p>
   <FilterBar title="Filters"><form method="get" action={base+"/resources-directory"} role="search" aria-label="Project resources filters"
    className={mentorResourceDirectoryFilterLayout+" !rounded-none !border-0 !bg-transparent !p-0 max-md:[&_label]:w-full [&_button]:max-md:w-full"}>
    <div className="grid min-w-0 w-full items-end gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
    <Label stack>Resource title or description
     <Input type="search" name="search" maxLength={100} defaultValue={data.query.search}
      className="min-h-11 md:min-h-9"/>
    </Label>
    <Label stack>Requirement
     <Select name="required" defaultValue={data.query.required}
      className="min-h-11 md:min-h-9">
      <option value="ALL">All</option><option value="REQUIRED">Required</option>
      <option value="OPTIONAL">Optional</option>
     </Select>
    </Label>
    <Label stack>HTTPS link availability
     <Select name="link" defaultValue={data.query.link}
      className="min-h-11 md:min-h-9">
      <option value="ALL">All</option><option value="HTTPS">Safe HTTPS link</option>
      <option value="UNAVAILABLE">No safe HTTPS link</option>
     </Select>
    </Label>
    <Button type="submit" variant="primary" className="min-h-11 w-full md:min-h-9">Filter</Button>
    </div>
    <Disclosure title="More filters" defaultOpen={advanced} className="min-w-0 w-full border-y border-border py-2" contentClassName="pt-3">
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
    <Label stack>Description recorded
     <Select name="description" defaultValue={data.query.description}
      className="min-h-11 md:min-h-9">
      <option value="ALL">Any</option><option value="RECORDED">Has a description</option>
      <option value="MISSING">No written description</option>
     </Select>
    </Label>
    <Label stack>Resource order
     <Select name="order" defaultValue={data.query.order}
      className="min-h-11 md:min-h-9">
      <option value="SEQUENCE">Recorded sequence</option><option value="TITLE">Title (A–Z)</option>
     </Select>
    </Label>
      </div>
    </Disclosure>
    {hasFilters?<TextLink href={base+"/resources-directory"} className="inline-flex min-h-11 items-center text-sm">Clear</TextLink>:null}
   </form></FilterBar>
   <div className="flex flex-wrap items-center gap-3">
    <TextLink data-unskin="" href={"/api/projects/"+encodeURIComponent(projectId)+
      "/mentor-resources-export"+filters}
      download className="inline-flex min-h-11 items-center text-sm md:min-h-9">
     Export resource metadata CSV (max 200)
    </TextLink>
    {data.exportOmitted>0?<p role="status" className="text-xs text-body leading-5">
     Export omits {data.exportOmitted} matching resource records.
    </p>:null}
   </div>
   <p className="text-sm text-body leading-[22px]">{data.total.toLocaleString("en-IN")} matching recorded resource{data.total===1?"":"s"}</p>
   {data.items.length===0?<EmptyState title="No matching resources"
    description={data.registered===0?
     "No active resources were persisted for this authorized project.":
     "Clear the filters to see other registered resource metadata."} action={<TextLink href={base+"/resources-directory"} className="inline-flex min-h-11 items-center md:min-h-9">Clear</TextLink>} />:
   <ol className="min-w-0 divide-y divide-border border-y border-border">
    {data.items.map(resource=><li key={resource.id}
     className="min-w-0 py-4">
     <div className="flex flex-wrap items-start justify-between gap-2">
      <Heading level={2} size="base" className="m-0 break-words leading-6 text-[var(--lms-heading)]">{resource.title}</Heading>
      <span className="text-xs font-semibold text-body">
       {resource.required?"Required":"Optional"}
      </span>
     </div>
     {resource.description?<p className="mt-2 whitespace-pre-wrap break-words text-sm text-body leading-[22px]">
      {resource.description}</p>:null}
     {resource.safeUrl?<TextLink href={resource.safeUrl} rel="noopener noreferrer"
      className="mt-3 inline-flex min-h-11 items-center text-sm">
      Open HTTPS resource
     </TextLink>:<p className="mt-2 text-xs text-muted-foreground leading-5">
      No safe HTTPS link recorded.
     </p>}
    </li>)}
   </ol>}
   {data.totalPages>1?<Pagination label="Resource directory pages" page={data.page} pageCount={data.totalPages} hrefForPage={page=>mentorResourceDirectoryHref({...data.query,page})}/>:null}
  </>}
  <p className="text-xs text-muted-foreground leading-5">
   Only registered resource metadata and explicitly safe HTTPS links are shown.
   No file storage, upload, download proxy, contact details or private URLs
   are added by this directory.
  </p>
 </div>;
}
