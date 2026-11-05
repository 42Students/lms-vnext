"use client";
import type {TpoRecruiterLeadStage} from "@/modules/placements/tpo-recruiter-lead-policy";
import {tpoRecruiterFollowupSignal} from "@/modules/placements/tpo-recruiter-attention-model";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { createDateFormatter } from "@/lib/format-date";

export type TpoRecruiterPrototypeColumn="recruiter"|"company"|"stage"|"next"|"last"|"owner";
export const TPO_RECRUITER_PROTOTYPE_COLUMNS:readonly {key:TpoRecruiterPrototypeColumn;label:string}[]=[
 {key:"recruiter",label:"Recruiter"},{key:"company",label:"Company"},
 {key:"stage",label:"Where you are"},{key:"next",label:"Next step"},
 {key:"last",label:"Last contact"},{key:"owner",label:"Handled by"},
];
export type TpoRecruiterPrototypeRow={
 id:string;name:string;designation:string|null;companyName:string|null;
 stage:TpoRecruiterLeadStage;nextFollowupAt:string|null;
 lastContactAt?:string|null;lastActivityAt:string|null;ownerName:string|null;
};

function shortDate(raw:string|null){
 if(!raw)return "Not recorded";
 const date=new Date(raw);
 if(!Number.isFinite(date.getTime()))return "Unavailable";
 return createDateFormatter("en-IN", {timeZone:"Asia/Kolkata",day:"numeric",month:"short"}).format(date);
}

const prototypeStage:Record<TpoRecruiterLeadStage,string>={
 NEW:"Not contacted",CONTACTED:"In touch",INVITED:"Invited",JOINED:"Joined",
 DRIVE_PLANNED:"Drive planned",RECRUITED:"Hired from you",NOT_NOW:"Paused",
};
const stageClass:Record<TpoRecruiterLeadStage,string>={
 NEW:"bg-[color:var(--lms-neutral-100)] text-[color:var(--lms-text-body)]",
 CONTACTED:"bg-[color:var(--lms-primary-subtle)] text-[color:var(--lms-button-primary-hover)]",
 INVITED:"bg-[color:var(--lms-purple-surface)] text-[color:var(--lms-purple)]",
 JOINED:"bg-[color:var(--lms-success-surface)] text-[color:var(--lms-success)]",
 DRIVE_PLANNED:"bg-[color:var(--lms-gold-subtle)] text-[color:var(--lms-warning-strong)]",
 RECRUITED:"bg-[color:var(--lms-success-surface)] text-[color:var(--lms-success)]",
 NOT_NOW:"bg-[color:var(--lms-neutral-100)] text-[color:var(--lms-text-body)]",
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
 return <section aria-label="Recruiter overview table" className="min-w-0 overflow-hidden bg-surface"
  data-testid="tpo.recruiter.prototype-roster">
  <div className="overflow-x-auto">
   <Table className="min-w-[692px]">
    <thead className="bg-[color:var(--lms-neutral-50)] text-xs font-bold uppercase tracking-wide text-muted-foreground">
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
      className={"cursor-pointer border-b border-border last:border-0 focus-ring "+
       (focused?"bg-primary-subtle":"hover:bg-[color:var(--lms-neutral-50)]")}>
      {enabled.has("recruiter")?<td className="max-w-48 px-3 py-3">
       <div className="flex min-h-11 flex-col items-start justify-center gap-1 md:min-h-9">
        <Button variant="bare" type="button" onClick={()=>onSelect(lead.id)}
         aria-pressed={focused} aria-label={"View "+lead.name+" in the detail panel"}
         className="min-h-11 break-words text-left font-semibold text-foreground hover:underline md:min-h-9 focus-ring">{lead.name}</Button>
        {lead.designation?<small className="text-xs text-body">{lead.designation}</small>:null}
       </div>
      </td>:null}
      {enabled.has("company")?<td className="max-w-32 break-words px-3 py-3 text-foreground">{lead.companyName??"Not recorded"}</td>:null}
      {enabled.has("stage")?<td className="px-3 py-3"><span className={"inline-block rounded-full px-2 py-1 text-xs font-bold "+stageClass[lead.stage]}>
       {prototypeStage[lead.stage]}</span></td>:null}
      {enabled.has("next")?<td className={"max-w-40 px-3 py-3 font-semibold "+(next.lateDays>0?"text-[color:var(--lms-error-text)]":"text-foreground")}>
       {next.label}</td>:null}
      {enabled.has("last")?<td className="px-3 py-3 text-body">{shortDate(lead.lastContactAt??null)}</td>:null}
      {enabled.has("owner")?<td className="max-w-32 break-words px-3 py-3 text-body">{lead.ownerName??"Nobody yet"}</td>:null}
     </tr>;
    })}
    </tbody>
   </Table>
  </div>
  {rows.length===0?<p className="p-5 text-sm text-body">No recruiter records match this view.</p>:null}
  <p className="sr-only" aria-live="polite">{rows.length} in this view · Select a recruiter row to view details · {columnCount} columns</p>
 </section>;
}
