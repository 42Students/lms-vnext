"use client";
import {useState} from "react";
import type {AcademicModuleScope} from "@/modules/module-access/admin-descendant-rule-write";
/** All stored and inheriting academic nodes on the bounded college scope page.
 * The effective learner decision still depends on runtime enrollment/locks. */
export function AcademicModuleScopeInventory({scopes}:{scopes:readonly AcademicModuleScope[]}){
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
  <p className="text-xs text-muted-foreground">{scopes.length} academic scopes loaded (including inheriting scopes). Stored rules are not guaranteed to be the effective learner decision. Student-in-scope counts are not yet available.</p>
  <div className="max-h-96 overflow-auto rounded border border-border">
   <table className="w-full min-w-[44rem] text-left text-sm">
    <thead className="sticky top-0 bg-surface-subtle text-muted-foreground">
     <tr><th className="p-3">Level</th><th className="p-3">Academic path</th>
      <th className="p-3">Projects</th><th className="p-3">Placements</th><th className="p-3">Electives</th><th className="p-3">Students in scope</th></tr>
    </thead>
    <tbody>{visible.map(scope=><tr key={scope.scopeType+":"+scope.scopeId} className="border-t border-border">
     <td className="p-3">{scope.scopeType==="COHORT"?"Batch":scope.scopeType}</td>
     <td className="p-3">{scope.label}</td>
     <td className="p-3">{scope.projectsRule}</td>
     <td className="p-3">{scope.placementsRule}</td>
     <td className="p-3">{scope.electivesRule}</td>
     <td className="p-3">—</td>
    </tr>)}</tbody>
   </table>
  </div>
  {scopes.length>=500&&<p role="status" className="text-xs text-warning-text">
   Only the first 500 academic nodes are included. The full hierarchy remains incomplete.</p>}
 </section>;
}
