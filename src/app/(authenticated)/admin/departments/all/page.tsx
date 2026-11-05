import {getCurrentRequestContext} from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {listAdminDepartmentsAcrossColleges} from "@/modules/admin-ui/super-admin-department-directory-service";
import { Table } from "@/components/ui/table";
import { TextLink } from "@/components/ui/text-link";

const decimal=(raw:string|string[]|undefined,fallback:number)=>{
 if(typeof raw!=="string"||!/^[1-9][0-9]*$/.test(raw))return fallback;
 const value=Number(raw);
 return Number.isSafeInteger(value)?value:fallback;
};
export default async function AdminAllDepartmentsPage({
 searchParams,
}:{searchParams:Promise<{page?:string|string[];pageSize?:string|string[]}>}){
 const context=await getCurrentRequestContext();
 if(!isSuperAdmin(context))return <ErrorState title="Department access denied"
  description="Only a Super Admin can browse departments across colleges."/>;
 const query=await searchParams;
 const page=Math.min(10000,decimal(query.page,1));
 const pageSize=Math.min(100,decimal(query.pageSize,25));
 const directory=await listAdminDepartmentsAcrossColleges(context,{page,pageSize})
  .catch(()=>null);
 const prefix="/admin/departments/all?pageSize="+pageSize+"&page=";
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Departments" description="Read-only department directory across the colleges in your permitted Super Admin scope."/>
  <TextLink href="/admin/departments" className="inline-flex min-h-11 items-center md:min-h-9">Back to department setup</TextLink>
  {!directory?<ErrorState title="Department directory could not be loaded"
   description="No departments from another college are displayed when the scoped read fails."
   action={<TextLink href="/admin/departments/all">Retry directory</TextLink>}/>:
   <section aria-label="Authorized department directory" className="min-w-0 space-y-3">
    <p className="text-sm text-body">{directory.total} departments · {directory.scope.toLowerCase()} scope · read only</p>
    {directory.items.length===0?<p className="text-sm text-body">No departments in the selected scope.</p>:
     <div role="region" aria-label="Departments table, scroll for columns" tabIndex={0} className="min-w-0 overflow-x-auto border-y border-border">
      <Table className="min-w-[560px]">
       <thead><tr className="border-b border-border text-left">
        <th scope="col" className="p-3">Department</th>
        <th scope="col" className="p-3">College</th>
        <th scope="col" className="p-3">Organization</th>
       </tr></thead>
       <tbody>{directory.items.map(row=><tr key={row.id} className="border-b border-border">
        <th scope="row" className="p-3 text-left font-semibold">{row.name}</th>
        <td className="p-3">{row.collegeName}</td>
        <td className="p-3">{row.organizationName}</td>
       </tr>)}</tbody>
      </Table>
     </div>}
    {directory.totalPages>1?<nav aria-label="Department directory pages" className="flex items-center justify-between gap-3 text-sm">
     {page>1?<TextLink href={prefix+(page-1)} className="inline-flex min-h-11 items-center">Previous</TextLink>:<span/>}
     <span>Page {page} of {directory.totalPages}</span>
     {page<directory.totalPages?<TextLink href={prefix+(page+1)} className="inline-flex min-h-11 items-center">Next</TextLink>:<span/>}
    </nav>:null}
   </section>}
 </div>;
}
