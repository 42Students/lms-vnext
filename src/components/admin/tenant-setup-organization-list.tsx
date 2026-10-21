"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {OrganizationActions} from "@/components/admin/organization-actions";
import {EmptyState} from "@/components/ui/empty-state";
type Row={id:string;name:string;canManage:boolean};
const PAGE_SIZE=25;
/** The directory is scoped on the server before these rows reach the browser. */
export function TenantSetupOrganizationList({rows}:{rows:readonly Row[]}){
 const router=useRouter();
 const [search,setSearch]=useState("");
 const [page,setPage]=useState(1);
 const matching=rows.filter(row=>row.name.toLocaleLowerCase("en-IN").includes(search.trim().toLocaleLowerCase("en-IN")));
 const pages=Math.max(1,Math.ceil(matching.length/PAGE_SIZE));
 const currentPage=Math.min(page,pages);
 const visible=matching.slice((currentPage-1)*PAGE_SIZE,currentPage*PAGE_SIZE);
 const columns:DataTableColumn<Row>[]=[
  {key:"name",header:"Organization",mobilePriority:"primary",cell:row=><span className="font-semibold">{row.name}</span>},
  {key:"actions",header:"Actions",mobilePriority:"action",cell:row=>row.canManage?
   <OrganizationActions organizationId={row.id} name={row.name}/>:<span className="text-xs text-muted-foreground">View only</span>},
 ];
 return <div className="min-w-0 space-y-3">
  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
   <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-[13px] font-semibold text-body">
    Search organizations
    <Input type="search" value={search} maxLength={100} placeholder="Search organizations"
     onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
   </label>
   <Button variant="secondary" type="button" onClick={()=>router.refresh()}>Refresh</Button>
  </div>
  <p role="status" className="text-xs text-muted-foreground">{matching.length} of {rows.length} organizations · Page {currentPage} of {pages}</p>
  <DataTable caption="Existing Organizations" rows={visible} columns={columns} getRowKey={row=>row.id}
   empty={<EmptyState title="No matching organizations" description="Clear the search or create an authorized organization."/>}/>
  {pages>1?<div className="flex flex-wrap items-center justify-between gap-3 text-sm">
   <span>Showing {(currentPage-1)*PAGE_SIZE+1}–{Math.min(currentPage*PAGE_SIZE,matching.length)} of {matching.length}</span>
   <div className="flex items-center gap-3">
    <Button variant="secondary" size="sm" disabled={currentPage===1} onClick={()=>setPage(currentPage-1)}>Previous</Button>
    <span>Page {currentPage} of {pages}</span>
    <Button variant="secondary" size="sm" disabled={currentPage===pages} onClick={()=>setPage(currentPage+1)}>Next</Button>
   </div>
  </div>:null}
 </div>;
}
