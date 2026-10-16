"use client";
import {useState} from "react";
import Link from "next/link";
import type {AcademicModuleScope} from "@/modules/module-access/admin-descendant-rule-write";
/** All stored and inheriting academic nodes on the bounded college scope page.
 * The effective learner decision still depends on runtime enrollment/locks. */
export function AcademicModuleScopeInventory({scopes,page=1,baseHref}:{
 scopes:readonly AcademicModuleScope[];page?:number;baseHref?:string;
}){
 const [expanded,setExpanded]=useState(false);
 const visible=expanded?scopes:scopes.slice(0,15);
 return <section aria-label="Academic scope inventory" className="mt-4 space-y-3">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <h3 className="font-semibold">Academic hierarchy</h3>
   <div className="flex gap-2 text-sm">
    <button type="button" className="underline" onClick={()=>setExpanded(true)}>Expand all</button>
    <button type="button" className="underline" onClick={()=>setExpanded(false)}>Collapse all</button>
   </div>
  </div>
  <p className="text-xs text-muted-foreground">{scopes.length} academic scopes loaded (including inheriting scopes). Effective values trace the configured scope hierarchy and locks; an individual learner still needs active enrollment and participation. Student counts include active learners with current enrollment in this college.</p>
  <div className="max-h-96 overflow-auto rounded border border-border">
   <table className="w-full min-w-[44rem] text-left text-sm">
    <thead className="sticky top-0 bg-surface-subtle text-muted-foreground">
     <tr><th className="p-3">Level</th><th className="p-3">Academic path</th>
      <th className="p-3">Projects</th><th className="p-3">Placements</th><th className="p-3">Electives</th><th className="p-3">Students in scope</th></tr>
    </thead>
    <tbody>{visible.map(scope=><tr key={scope.scopeType+":"+scope.scopeId} className="border-t border-border">
     <td className="p-3">{scope.scopeType==="COHORT"?"Batch":scope.scopeType}</td>
     <td className="p-3">{scope.label}</td>
     <td className="p-3"><span className={scope.projectsShadowed?"line-through text-muted-foreground":""}>{scope.projectsRule}</span>
      <p className="text-xs text-body">Effective: {scope.projectsEffective}</p></td>
     <td className="p-3"><span className={scope.placementsShadowed?"line-through text-muted-foreground":""}>{scope.placementsRule}</span>
      <p className="text-xs text-body">Effective: {scope.placementsEffective}</p></td>
     <td className="p-3"><span className={scope.electivesShadowed?"line-through text-muted-foreground":""}>{scope.electivesRule}</span>
      <p className="text-xs text-body">Effective: {scope.electivesEffective}</p></td>
     <td className="p-3 tabular-nums">{scope.studentsInScope}</td>
    </tr>)}</tbody>
   </table>
  </div>
  {baseHref?<nav aria-label="Academic scope pages" className="flex flex-wrap items-center gap-4 text-sm">
   <span>Academic hierarchy page {page} · {scopes.length} nodes on this page</span>
   {page>1?<Link href={baseHref+"?academicPage="+(page-1)}
    className="inline-flex min-h-10 items-center text-primary-text underline">Previous hierarchy page</Link>:null}
   {scopes.length===500?<Link href={baseHref+"?academicPage="+(page+1)}
    className="inline-flex min-h-10 items-center text-primary-text underline">Next hierarchy page</Link>:null}
  </nav>:null}
 </section>;
}
