import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {ProjectAdminNav} from "@/components/projects/project-admin-nav";
import {ProjectDeletedRowRestore} from "@/components/projects/project-deleted-row-restore";
import {Alert} from "@/components/ui/alert";
import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
import {EmptyState} from "@/components/ui/empty-state";
import {ErrorState} from "@/components/ui/error-state";
import {PageHeader} from "@/components/ui/page-header";
import {Pagination} from "@/components/ui/pagination";
import {AuthorizationError} from "@/modules/permissions/policy";
import {getProjectAdminCollegeId} from "@/modules/projects/admin-college-scope";
import {listPaginatedDeletedProjectWorkspaces} from "@/modules/projects/project-soft-delete-service";

type Query={page?:string|string[];pageSize?:string|string[]};
const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
function parseQuery(q:Query):{page:number;pageSize:10|20|50|100}|null{
 const rawPage=first(q.page);
 const rawSize=first(q.pageSize);
 if(rawPage!==undefined&&!/^[1-9]\d{0,5}$/.test(rawPage))return null;
 if(rawSize!==undefined&&!["10","20","50","100"].includes(rawSize))return null;
 const page=rawPage?Number(rawPage):1;
 if(!Number.isSafeInteger(page)||page>100000)return null;
 return {page,pageSize:Number(rawSize??20) as 10|20|50|100};
}
function deletedHref(page:number,size:number):string{
 const query=new URLSearchParams();
 if(page!==1)query.set("page",String(page));
 if(size!==20)query.set("pageSize",String(size));
 return "/college/projects/deleted"+(query.size?"?"+query.toString():"");
}

export default async function DeletedCollegeProjectsPage({
 searchParams,
}:{searchParams:Promise<Query>}){
 const context=await getCurrentRequestContext();
 const collegeId=getProjectAdminCollegeId(context);
 const query=await searchParams;
 const parsed=parseQuery(query);
 const back=<Link href="/college/projects"
  className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle md:min-h-9">
  Back to workspaces
 </Link>;
 const header=<PageHeader title="Deleted workspaces"
  description="Deleted workspaces you can still restore." actions={back}/>;
 if(!collegeId)return <div className="min-w-0 space-y-4">
  <ProjectAdminNav basePath="/college/projects" active="workspaces"/>
  {header}
  <Alert tone="warning" title="Select a college to continue">
   Choose an active college from the account switcher to view deleted workspaces.
  </Alert>
 </div>;
 if(!parsed)return <div className="min-w-0 space-y-4">
  <ProjectAdminNav basePath="/college/projects" active="workspaces"/>
  {header}
  <ErrorState title="Invalid deleted workspace filters"
   description="Choose a page and 10, 20, 50 or 100 rows per page."
   action={<Link href="/college/projects/deleted" className="font-semibold text-primary-text underline">Clear filters</Link>}/>
 </div>;
 const result=await listPaginatedDeletedProjectWorkspaces(context,collegeId,parsed)
  .then(value=>({ok:true as const,value}))
  .catch((error:unknown)=>{
   if(error instanceof AuthorizationError)throw error;
   return {ok:false as const,error};
  });
 if(!result.ok)return <div className="min-w-0 space-y-4">
  <ProjectAdminNav basePath="/college/projects" active="workspaces"/>
  {header}
  <section aria-label="Deleted workspaces" className="rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
   <h2 className="mb-3 font-semibold text-[var(--lms-heading)]">Deleted workspaces</h2>
   <Alert tone="error" title="Deleted workspaces could not be loaded">
    Could not load deleted workspaces. The selected college and filters have not changed.
    <Link href={deletedHref(parsed.page,parsed.pageSize)}
     className="mt-2 inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry</Link>
   </Alert>
  </section>
 </div>;
 const data=result.value;
 if(data.page>data.totalPages)redirect(deletedHref(data.totalPages,data.pageSize));
 const columns:DataTableColumn<(typeof data.items)[number]>[]=[
  {key:"workspace",header:"Workspace",mobilePriority:"primary",cell:project=>
   <div className="min-w-0">
    <strong className="block break-words font-semibold text-[var(--lms-heading)]">{project.title}</strong>
    {project.slug?<span className="block text-xs text-muted-foreground">{project.slug}</span>:null}
   </div>},
  {key:"mentor",header:"Mentor",mobilePriority:"secondary",cell:project=>
   <div className="min-w-0">
    <span>{project.mentorName??"—"}</span>
    {project.mentorFormer&&project.mentorName?<span className="block text-xs text-muted-foreground">Former mentor</span>:null}
    {!project.mentorName?<span className="block text-xs text-[var(--lms-warning-text)]">Assign a mentor after recovery</span>:null}
   </div>},
  {key:"action",header:"Action",mobilePriority:"action",className:"min-w-[145px]",cell:project=>
   <ProjectDeletedRowRestore projectId={project.id} title={project.title}
    expectedUpdatedAt={project.updatedAt.toISOString()} mentorName={project.mentorName}
    page={data.page} pageSize={data.pageSize} total={data.total}/>},
 ];
 const from=data.total?(data.page-1)*data.pageSize+1:0;
 const through=Math.min(data.total,data.page*data.pageSize);
 return <div className="min-w-0 space-y-4 md:space-y-6">
  <ProjectAdminNav basePath="/college/projects" active="workspaces"/>
  {header}
  <section aria-label="Deleted workspaces" className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
   <h2 className="text-base font-semibold text-[var(--lms-heading)]">Deleted workspaces</h2>
   <DataTable columns={columns} rows={data.items} getRowKey={project=>project.id}
    caption="Deleted workspaces" mobileMode="scroll"
    className="min-w-0 [&_table]:min-w-[630px]"
    empty={<EmptyState title="No deleted workspaces for this college"/>}/>
   <div className="flex min-w-0 flex-col gap-3 border-t border-border pt-3 md:flex-row md:flex-wrap md:items-center md:justify-between">
    <p role="status" className="text-sm tabular-nums text-muted-foreground">
     {from}–{through} of {data.total} deleted workspaces
    </p>
    <Pagination page={data.page} pageCount={data.totalPages} label="Deleted workspaces pages"
     hrefForPage={page=>deletedHref(page,data.pageSize)}
     pageSize={data.pageSize} pageSizeOptions={[10,20,50,100]}
     hrefForPageSize={size=>deletedHref(1,size)} />
   </div>
  </section>
 </div>;
}
