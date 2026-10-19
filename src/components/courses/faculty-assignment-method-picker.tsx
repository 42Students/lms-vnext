"use client";

import {ALL_ASSIGNMENT_METHODS,ASSIGNMENT_METHOD_LABELS,type AssignmentMethod}
 from "@/modules/courses/assignment-submission-methods";
export function FacultyAssignmentMethodPicker({methods,onChange,disabled}:{
 methods:readonly AssignmentMethod[];onChange:(next:AssignmentMethod[])=>void;disabled:boolean;
}){
 return <fieldset disabled={disabled} className="space-y-2 rounded-[var(--lms-control-radius)] border border-border p-3">
  <legend className="text-sm font-semibold">Allowed submission methods</legend>
  <p className="text-xs text-muted-foreground">
   Choose how learners may submit. File and PDF uploads require the private storage service.
  </p>
  <div className="grid gap-2 sm:grid-cols-2">
   {ALL_ASSIGNMENT_METHODS.map(method=><label key={method}
    className="flex min-h-10 items-center gap-2 text-sm text-body">
    <input type="checkbox" checked={methods.includes(method)}
     onChange={e=>{
      const next=e.target.checked?[...methods,method]:methods.filter(item=>item!==method);
      if(next.length)onChange(next);
     }}/>
    {ASSIGNMENT_METHOD_LABELS[method]}
   </label>)}
  </div>
  <p className="text-xs text-muted-foreground">
   At least one submission method must remain available.
  </p>
 </fieldset>;
}
