"use client";
import type {TpoRecruiterLeadStage} from "@/modules/placements/tpo-recruiter-lead-policy";
import {tpoRecruiterFollowupSignal} from "@/modules/placements/tpo-recruiter-attention-model";

export type TpoRecruiterPrototypeColumn="recruiter"|"company"|"stage"|"next"|"last"|"owner";
export const TPO_RECRUITER_PROTOTYPE_COLUMNS:readonly {key:TpoRecruiterPrototypeColumn;label:string}[]=[
 {key:"recruiter",label:"Recruiter"},{key:"company",label:"Company"},
 {key:"stage",label:"Where you are"},{key:"next",label:"Next step"},
 {key:"last",label:"Last activity"},{key:"owner",label:"Handled by"},
];
export type TpoRecruiterPrototypeRow={
 id:string;name:string;designation:string|null;companyName:string|null;
 stage:TpoRecruiterLeadStage;nextFollowupAt:string|null;
 lastActivityAt:string|null;ownerName:string|null;
};

function shortDate(raw:string|null){
 if(!raw)return "Not recorded";
 const date=new Date(raw);
 if(!Number.isFinite(date.getTime()))return "Unavailable";
 return new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short"}).format(date);
}

const prototypeStage:Record<TpoRecruiterLeadStage,string>={
 NEW:"Not contacted",CONTACTED:"In touch",INVITED:"Invited",JOINED:"Joined",
 DRIVE_PLANNED:"Drive planned",RECRUITED:"Hired from you",NOT_NOW:"Paused",
};
const stageClass:Record<TpoRecruiterLeadStage,string>={
 NEW:"bg-slate-100 text-slate-700",
 CONTACTED:"bg-cyan-50 text-cyan-800",
 INVITED:"bg-indigo-50 text-indigo-700",
 JOINED:"bg-emerald-50 text-emerald-700",
 DRIVE_PLANNED:"bg-orange-50 text-orange-800",
 RECRUITED:"bg-emerald-50 text-emerald-700",
 NOT_NOW:"bg-gray-100 text-gray-600",
};

/** Default six-column roster matches the actual 2026 prototype's structure.
 * The full CRM spreadsheet remains below in Advanced; this view uses the
 * same authorized, filtered, real rows rather than a separate synthetic list. */
export function TpoRecruiterPrototypeRoster({
 rows,selectedId,onSelect,now,columns=TPO_RECRUITER_PROTOTYPE_COLUMNS.map(column=>column.key)
}:{rows:readonly TpoRecruiterPrototypeRow[];selectedId:string|null;
 onSelect:(id:string)=>void;now:Date;columns?:readonly TpoRecruiterPrototypeColumn[]}){
 const enabled=new Set(columns);
 const columnCount=columns.length;
 return <section aria-label="Recruiter overview table" className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface"
  data-testid="tpo.recruiter.prototype-roster">
  <div className="overflow-x-auto">
   <table className="w-full min-w-[690px] border-collapse text-left text-[13px]">
    <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
     <tr>{TPO_RECRUITER_PROTOTYPE_COLUMNS.filter(column=>enabled.has(column.key)).map(column=>
       <th key={column.key} scope="col" className="border-b border-border px-3 py-3 font-bold">{column.label}</th>)}</tr>
    </thead>
    <tbody>
    {rows.map(lead=>{
     const focused=selectedId===lead.id;
     const next=tpoRecruiterFollowupSignal(lead.nextFollowupAt,now);
     return <tr key={lead.id} tabIndex={0}
      aria-selected={focused} aria-label={"Select "+lead.name+" details"}
      onClick={event=>{
       if((event.target as HTMLElement).closest("a,button"))return;
       onSelect(lead.id);
      }}
      onKeyDown={event=>{
       if((event.key==="Enter"||event.key===" ")&&event.target===event.currentTarget){
        event.preventDefault();onSelect(lead.id);
       }
      }}
      className={"cursor-pointer border-b border-border last:border-0 focus-visible:outline-2 focus-visible:outline-primary-text "+
       (focused?"bg-primary-subtle":"hover:bg-slate-50")}>
      {enabled.has("recruiter")?<td className="max-w-48 px-3 py-3">
       <div className="flex min-h-10 flex-col items-start justify-center gap-1">
        <button type="button" onClick={()=>onSelect(lead.id)}
         aria-pressed={focused} aria-label={"View "+lead.name+" in the detail panel"}
         className="break-words text-left font-semibold text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-primary-text">{lead.name}</button>
        {lead.designation?<small className="text-[11px] text-body">{lead.designation}</small>:null}
       </div>
      </td>:null}
      {enabled.has("company")?<td className="max-w-32 break-words px-3 py-3 text-foreground">{lead.companyName??"Not recorded"}</td>:null}
      {enabled.has("stage")?<td className="px-3 py-3"><span className={"inline-block rounded-full px-2 py-1 text-[11px] font-bold "+stageClass[lead.stage]}>
       {prototypeStage[lead.stage]}</span></td>:null}
      {enabled.has("next")?<td className={"max-w-40 px-3 py-3 font-semibold "+(next.lateDays>0?"text-red-700":"text-foreground")}>
       {next.label}</td>:null}
      {enabled.has("last")?<td className="px-3 py-3 text-body">{shortDate(lead.lastActivityAt)}</td>:null}
      {enabled.has("owner")?<td className="max-w-32 break-words px-3 py-3 text-body">{lead.ownerName??"Nobody yet"}</td>:null}
     </tr>;
    })}
    </tbody>
   </table>
  </div>
  {rows.length===0?<p className="p-5 text-sm text-body">No recruiter records match this view.</p>:null}
  <p className="border-t border-border px-3 py-2 text-xs text-body">{rows.length} in this view · Select a recruiter row to view details · {columnCount} columns</p>
 </section>;
}
