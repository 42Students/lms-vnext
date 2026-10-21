"use client";
import {useState} from "react";
import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import {Button} from "@/components/ui/button";
import { isSafeInternalHref } from "@/lib/safe-internal-href";
import type {AcademicModuleScope} from "@/modules/module-access/admin-descendant-rule-write";
/** Preserve active query filters when navigating bounded academic hierarchy pages. */
export function academicScopePageHref(baseHref: string, page: number): string | null {
 if (!isSafeInternalHref(baseHref) || !Number.isSafeInteger(page) || page<1) return null;
 const url=new URL(baseHref,"https://local.invalid");
 url.searchParams.set("academicPage",String(page));
 return url.pathname+url.search+url.hash;
}
/** All stored and inheriting academic nodes on the bounded college scope page.
 * The effective learner decision still depends on runtime enrollment/locks. */
export function AcademicModuleScopeInventory({scopes,page=1,baseHref}:{
 scopes:readonly AcademicModuleScope[];page?:number;baseHref?:string;
}){
 const [expanded,setExpanded]=useState(false);
 const visible=expanded?scopes:scopes.slice(0,15);
 const safePage=Number.isSafeInteger(page)&&page>=1?page:1;
 const showPageStatus=Boolean(baseHref&&isSafeInternalHref(baseHref));
 const prevHref=baseHref&&safePage>1?academicScopePageHref(baseHref,safePage-1):null;
 const nextHref=baseHref&&scopes.length===500?academicScopePageHref(baseHref,safePage+1):null;
 const columns:DataTableColumn<AcademicModuleScope>[]=[
  {key:"level",header:"Level",mobilePriority:"primary",
   cell:scope=>scope.scopeType==="COHORT"?"Batch":scope.scopeType==="SECTION"?"Class":scope.scopeType==="PROGRAM"?"Program":"Department"},
  {key:"path",header:"Academic path",mobilePriority:"secondary",cell:scope=>scope.label},
  {key:"projects",header:"Projects",mobilePriority:"secondary",cell:scope=><>
    <span className={scope.projectsShadowed?"line-through text-muted-foreground":""}>{scope.projectsRule}</span>
    <p className="text-xs text-body leading-5">Effective: {scope.projectsEffective}</p>
  </>},
  {key:"placements",header:"Placements",mobilePriority:"secondary",cell:scope=><>
    <span className={scope.placementsShadowed?"line-through text-muted-foreground":""}>{scope.placementsRule}</span>
    <p className="text-xs text-body leading-5">Effective: {scope.placementsEffective}</p>
  </>},
  {key:"electives",header:"Electives",mobilePriority:"secondary",cell:scope=><>
    <span className={scope.electivesShadowed?"line-through text-muted-foreground":""}>{scope.electivesRule}</span>
    <p className="text-xs text-body leading-5">Effective: {scope.electivesEffective}</p>
  </>},
  {key:"students",header:"Students in scope",mobilePriority:"secondary",
   cell:scope=><span className="tabular-nums">{scope.studentsInScope}</span>},
 ];
 return <section aria-label="Academic scope inventory" className="mt-4 space-y-3">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <h3 className="font-semibold text-[var(--lms-heading)]">Academic hierarchy</h3>
   <a href="#academic-module-rules" className="min-h-9 inline-flex items-center text-sm font-semibold text-primary-text underline">Edit inherited rules</a>
   <div className="flex flex-wrap gap-2 text-sm print:hidden">
    <Button type="button" variant="ghost" className="min-h-11 md:min-h-9 underline" disabled={expanded || scopes.length<=15} onClick={()=>setExpanded(true)}>Expand all</Button>
    <Button type="button" variant="ghost" className="min-h-11 md:min-h-9 underline" disabled={!expanded} onClick={()=>setExpanded(false)}>Collapse all</Button>
   </div>
  </div>
  <p className="text-xs text-muted-foreground leading-5">{scopes.length} academic scopes loaded (including inheriting scopes). Effective values trace the configured scope hierarchy and locks; an individual learner still needs active enrollment and participation. Student counts include active learners with current enrollment in this college.</p>
  <div className="max-h-96 overflow-auto print:max-h-none print:overflow-visible">
   <DataTable columns={columns} rows={visible}
    getRowKey={scope=>scope.scopeType+":"+scope.scopeId}
    caption="Academic hierarchy and effective module rules"
    empty={<p>No academic scopes found.</p>}/>
  </div>
  {showPageStatus?<nav aria-label="Academic scope pages" className="flex flex-wrap items-center gap-4 text-sm print:hidden">
   <span>Academic hierarchy page {safePage} · {scopes.length} nodes on this page</span>
   {prevHref?<Link href={prevHref}
    className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-[650] text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Previous hierarchy page</Link>:null}
   {nextHref?<Link href={nextHref}
    className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-[650] text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Next hierarchy page</Link>:null}
  </nav>:null}
 </section>;
}
