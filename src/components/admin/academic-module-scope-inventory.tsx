"use client";
import {useState} from "react";
import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { isSafeInternalHref } from "@/lib/safe-internal-href";
import type {AcademicModuleScope} from "@/modules/module-access/admin-descendant-rule-write";
/** All stored and inheriting academic nodes on the bounded college scope page.
 * The effective learner decision still depends on runtime enrollment/locks. */
export function AcademicModuleScopeInventory({scopes,page=1,baseHref}:{
 scopes:readonly AcademicModuleScope[];page?:number;baseHref?:string;
}){
 const [expanded,setExpanded]=useState(false);
 const visible=expanded?scopes:scopes.slice(0,15);
 const safeBaseHref=baseHref && isSafeInternalHref(baseHref) ? baseHref : null;
 const columns:DataTableColumn<AcademicModuleScope>[]=[
  {key:"level",header:"Level",mobilePriority:"primary",
   cell:scope=>scope.scopeType==="COHORT"?"Batch":scope.scopeType},
  {key:"path",header:"Academic path",mobilePriority:"secondary",cell:scope=>scope.label},
  {key:"projects",header:"Projects",mobilePriority:"secondary",cell:scope=><>
    <span className={scope.projectsShadowed?"line-through text-muted-foreground":""}>{scope.projectsRule}</span>
    <p className="text-xs text-body">Effective: {scope.projectsEffective}</p>
  </>},
  {key:"placements",header:"Placements",mobilePriority:"secondary",cell:scope=><>
    <span className={scope.placementsShadowed?"line-through text-muted-foreground":""}>{scope.placementsRule}</span>
    <p className="text-xs text-body">Effective: {scope.placementsEffective}</p>
  </>},
  {key:"electives",header:"Electives",mobilePriority:"secondary",cell:scope=><>
    <span className={scope.electivesShadowed?"line-through text-muted-foreground":""}>{scope.electivesRule}</span>
    <p className="text-xs text-body">Effective: {scope.electivesEffective}</p>
  </>},
  {key:"students",header:"Students in scope",mobilePriority:"secondary",
   cell:scope=><span className="tabular-nums">{scope.studentsInScope}</span>},
 ];
 return <section aria-label="Academic scope inventory" className="mt-4 space-y-3">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <h3 className="font-semibold">Academic hierarchy</h3>
   <div className="flex gap-2 text-sm">
    <button type="button" className="inline-flex min-h-11 items-center underline disabled:opacity-50" disabled={expanded || scopes.length<=15} onClick={()=>setExpanded(true)}>Expand all</button>
    <button type="button" className="inline-flex min-h-11 items-center underline disabled:opacity-50" disabled={!expanded} onClick={()=>setExpanded(false)}>Collapse all</button>
   </div>
  </div>
  <p className="text-xs text-muted-foreground">{scopes.length} academic scopes loaded (including inheriting scopes). Effective values trace the configured scope hierarchy and locks; an individual learner still needs active enrollment and participation. Student counts include active learners with current enrollment in this college.</p>
  <div className="max-h-96 overflow-auto rounded border border-border">
   <DataTable columns={columns} rows={visible}
    getRowKey={scope=>scope.scopeType+":"+scope.scopeId}
    caption="Academic hierarchy and effective module rules"
    empty={<p>No academic scopes found.</p>}/>
  </div>
  {safeBaseHref?<nav aria-label="Academic scope pages" className="flex flex-wrap items-center gap-4 text-sm">
   <span>Academic hierarchy page {page} · {scopes.length} nodes on this page</span>
   {page>1?<Link href={safeBaseHref+"?academicPage="+(page-1)}
    className="inline-flex min-h-11 items-center text-primary-text underline">Previous hierarchy page</Link>:null}
   {scopes.length===500?<Link href={safeBaseHref+"?academicPage="+(page+1)}
    className="inline-flex min-h-10 items-center text-primary-text underline">Next hierarchy page</Link>:null}
  </nav>:null}
 </section>;
}
