import {Badge} from "@/components/ui/badge";
import {projectTemplateSectionCounts} from "@/modules/projects/project-template-catalogue-model";

type Entry=Record<string,unknown>;
const object=(value:unknown):Entry=>
 value&&typeof value==="object"&&!Array.isArray(value)?value as Entry:{};
const nonblank=(value:unknown):string=>
 typeof value==="string"?value.trim():"";
function displayLabel(value:unknown):string{
 if(typeof value==="string")return value.trim()||"—";
 if(typeof value==="number"&&Number.isFinite(value))return String(value);
 const record=object(value);
 return nonblank(record.title)||nonblank(record.name)||nonblank(record.label)||
  nonblank(record.key)||"—";
}
function rowsFor(value:unknown):readonly unknown[]{
 return Array.isArray(value)?value:[];
}
function tag(value:string,index:number){
 return <Badge key={index} tone="neutral" className="max-w-full border border-border bg-muted px-2 py-0.5 text-xs text-body">{value}</Badge>;
}
function templateCard(title:string,body:unknown,isOverview=false){
 const rows=rowsFor(body);
 const overview=object(body);
 const allowed=isOverview?([
  ["goal",overview.goal],
  ["deliverables",overview.deliverables],
 ] as const).filter(([key,value])=>key==="goal"?Boolean(nonblank(value)):
  Array.isArray(value)&&value.length>0):[];
 return <section aria-label={title} className="min-w-0 rounded-[8px] border border-[var(--lms-canvas-border)] bg-surface px-4 py-3">
  <h2 className="mb-3 text-base font-semibold text-[var(--lms-heading)]">{title}</h2>
  {isOverview?allowed.length?
   <dl className="min-w-0 overflow-hidden rounded border border-border text-sm">
    {allowed.map(([key,value])=><div key={key} className="grid min-w-0 border-b border-border last:border-b-0 sm:grid-cols-[165px_minmax(0,1fr)]">
     <dt className="bg-muted px-3 py-2 font-semibold text-body">{key==="goal"?"Goal":"Deliverables"}</dt>
     <dd className="min-w-0 px-3 py-2 break-words">
      {Array.isArray(value)?<div className="flex min-w-0 flex-wrap gap-2">
       {value.map((item,index)=>tag(displayLabel(item),index))}
      </div>:nonblank(value)||"—"}
     </dd>
    </div>)}
   </dl>:<p className="text-sm text-muted-foreground">No overview provided.</p>
  :rows.length?
   <div className="flex min-w-0 flex-wrap gap-2">
    {rows.map((item,index)=>tag(displayLabel(item),index))}
   </div>:<p className="text-sm text-muted-foreground">No {title.toLowerCase()} configured</p>}
 </section>;
}

/** Read-only legacy summary of the immutable published blueprint.
 * Render only Goal and Deliverables as Overview fields, consistent with
 * the central count, but retain vNext extras below the four legacy cards.
 * Legacy name/label/title array rows are descriptive, never executable.
 */
export function ProjectTemplateView({blueprint}:{blueprint:unknown}){
 const data=object(blueprint);
 const counts=projectTemplateSectionCounts(blueprint);
 const overview=object(data.overview);
 const additional=object(data.legacy);
 const definitionOfDone=rowsFor(overview.definitionOfDone);
 const releases=rowsFor(data.releases);
 const submission=object(data.submission);
 const supplemental=Boolean(releases.length||definitionOfDone.length||
  Object.keys(additional).length||Object.keys(submission).length||
  rowsFor(data.meetings).length||rowsFor(data.activity).length||Object.keys(object(data.delivery)).length);
 return <div className="min-w-0 max-w-full space-y-3">
  <section aria-label="Section counts" className="min-w-0 rounded-[8px] border border-[var(--lms-canvas-border)] bg-surface p-4">
   <h2 className="mb-3 font-semibold text-[var(--lms-heading)]">Section counts</h2>
   <div className="flex min-w-0 flex-wrap gap-2">
    {([["Overview",counts.overview],["Sprints",counts.sprints],
      ["Tasks",counts.tasks],["Resources",counts.resources]] as const)
     .map(([label,count])=><Badge key={label} tone="neutral" className="border border-border bg-muted px-2 py-0.5 text-xs text-body">{label} {count}</Badge>)}
   </div>
  </section>
  {templateCard("Overview",data.overview,true)}
  {templateCard("Sprints",data.sprints)}
  {templateCard("Tasks",data.tasks)}
  {templateCard("Resources",data.resources)}
  {supplemental?<details className="min-w-0 rounded-[8px] border border-[var(--lms-canvas-border)] bg-surface px-4 py-3">
   <summary className="cursor-pointer text-sm font-semibold text-[var(--lms-heading)] focus-visible:outline-2 focus-visible:outline-[var(--lms-primary)]">
    Additional template details
   </summary>
   <div className="mt-3 space-y-3">
    {releases.length?<div className="space-y-2">
     <h3 className="text-sm font-semibold">Releases</h3>
     <div className="flex flex-wrap gap-2">{releases.map((item,i)=>tag(displayLabel(item),i))}</div>
    </div>:null}
    {definitionOfDone.length?<div className="space-y-2">
     <h3 className="text-sm font-semibold">Definition of done</h3>
     <div className="flex flex-wrap gap-2">{definitionOfDone.map((item,i)=>tag(displayLabel(item),i))}</div>
    </div>:null}
    {nonblank(submission.instructions)?<div>
     <h3 className="text-sm font-semibold">Submission instructions</h3>
     <p className="mt-1 whitespace-pre-wrap break-words text-sm">{nonblank(submission.instructions)}</p>
    </div>:null}
    {Object.keys(additional).length?<dl className="grid min-w-0 gap-2 text-sm sm:grid-cols-2">
     {Object.entries(additional).filter(([,value])=>typeof value==="string").map(([label,value])=>
      <div key={label}><dt className="font-semibold">{label}</dt><dd className="break-words">{String(value)}</dd></div>)}
    </dl>:null}
    {["delivery","meetings","activity"].map(key=>{
     const value=data[key];
     const entries=rowsFor(value);
     const fields=object(value);
     if(!entries.length&&!Object.keys(fields).length)return null;
     return <section key={key} aria-label={"Imported "+key} className="min-w-0 space-y-2">
      <h3 className="text-sm font-semibold">{key[0].toUpperCase()+key.slice(1)}</h3>
      {entries.length?<div className="flex flex-wrap gap-2">
       {entries.map((item,i)=>tag(displayLabel(item),i))}
      </div>:<dl className="min-w-0 overflow-hidden rounded border border-border text-sm">
       {Object.entries(fields).slice(0,40).map(([label,value])=><div key={label}
        className="grid border-b border-border last:border-b-0 sm:grid-cols-[160px_minmax(0,1fr)]">
        <dt className="bg-muted px-3 py-2 font-semibold">{label}</dt>
        <dd className="break-words px-3 py-2">{typeof value==="string"?value:
         value===null?"—":JSON.stringify(value)?.slice(0,400)??"—"}</dd>
       </div>)}
      </dl>}
     </section>;
    })}
   </div>
  </details>:null}
 </div>;
}
