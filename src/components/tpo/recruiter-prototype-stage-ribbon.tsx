"use client";
import type {TpoRecruiterLeadStage} from "@/modules/placements/tpo-recruiter-lead-policy";

type FilterStage=TpoRecruiterLeadStage|"ALL";
type LeadStage={stage:TpoRecruiterLeadStage};
const stages:{value:FilterStage;label:string}[]=[
 {value:"ALL",label:"Everyone"},
 {value:"NEW",label:"Not contacted"},
 {value:"CONTACTED",label:"In touch"},
 {value:"INVITED",label:"Invited"},
 {value:"JOINED",label:"Joined"},
 {value:"DRIVE_PLANNED",label:"Drive planned"},
 {value:"RECRUITED",label:"Hired from you"},
 {value:"NOT_NOW",label:"Paused"},
];

/** The eight screenshot summary cells are derived from persisted, college-scoped
 * recruiter stages, never from fictional prototype counts. A stage selection
 * reuses the existing Engage filter; it cannot mutate a recruiter's status. */
export function TpoRecruiterPrototypeStageRibbon({
 rows,selected,onSelect
}:{rows:readonly LeadStage[];selected:FilterStage;onSelect:(value:FilterStage)=>void}){
 return <nav aria-label="Recruiter stage summary" className="min-w-0 overflow-x-auto rounded-xl border border-border bg-surface">
   <div className="grid min-w-[800px] grid-cols-8">
    {stages.map(({value,label})=>{
     const count=value==="ALL"?rows.length:rows.filter(lead=>lead.stage===value).length;
     const active=selected===value;
     return <button key={value} type="button" onClick={()=>onSelect(value)}
      aria-pressed={active} aria-label={label+": "+count}
      className={"flex min-h-[72px] flex-col items-start justify-center gap-1 border-r border-border px-3 py-2 text-left last:border-r-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-text "+
       (active?"border-b-[3px] border-b-primary bg-primary-subtle":"border-b-[3px] border-b-transparent hover:bg-primary-subtle")}>
       <strong className="text-[19px] font-bold leading-6 text-foreground">{count}</strong>
       <span className="text-xs leading-4 text-body">{label}</span>
      </button>;
    })}
   </div>
  </nav>;
}
