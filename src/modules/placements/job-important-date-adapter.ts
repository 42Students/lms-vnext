/** The old JobImportantDateEventDTO represented an array, not a single
 * job deadline. Preserve the original user-authored label, source index and
 * the JOB_IMPORTANT_DATE origin separately from the vNext display kind.
 * Callers must first prove the job is within their authorized college. */
export type ImportedJobImportantDate={
 id:string;jobId:string;index:number;label:string;eventType:"JOB_IMPORTANT_DATE";
 originalType:string|null;at:Date;applicationDeadline:boolean;
};
export function importedJobImportantDates(jobId:string,details:unknown):ImportedJobImportantDate[]{
 if(!details||typeof details!=="object")return [];
 const dates=(details as {importantDates?:unknown}).importantDates;
 if(!Array.isArray(dates))return [];
 return dates.flatMap((item,index):ImportedJobImportantDate[]=>{
  if(!item||typeof item!=="object")return [];
  const row=item as Record<string,unknown>;
  const label=typeof row.label==="string"?row.label.trim():"";
  const originalType=typeof row.type==="string"?row.type.trim():
    typeof row.dateType==="string"?row.dateType.trim():null;
  const raw=typeof row.at==="string"?row.at:
    typeof row.date==="string"?row.date:null;
  if(!label&&!originalType||!raw)return [];
  // For date-only historical entries, a college-local midnight is explicit.
  // Do not interpret a local timestamp without timezone as server-local UTC.
  const source=/^\d{4}-\d{2}-\d{2}$/.test(raw)?raw+"T00:00:00+05:30":raw;
  if(!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:?\d{2})$/.test(source))return [];
  const time=new Date(source);
  if(!Number.isFinite(time.getTime()))return [];
  const title=label||originalType||"Important date";
  const applicationDeadline=/^application\s*deadline$/i.test(title)||
    /^application\s*deadline$/i.test(originalType??"");
  return [{
   id:"important:"+jobId+":"+index,jobId,index,label:title,
   eventType:"JOB_IMPORTANT_DATE",originalType,at:time,applicationDeadline,
  }];
 });
}
/** A TPO extension retains the old first matching deadline label and keeps
 * unrelated important dates intact. The explicit applicationDeadline column
 * remains the authority for qualification and expiry. */
export function mirrorImportedDeadline<T extends {importantDates:Array<{label:string;at:string}>}>(
 details:T|null,newIso:string,
):T|null{
 if(!details)return null;
 const values=Array.isArray(details.importantDates)?[...details.importantDates]:[];
 const index=values.findIndex(x=>/^application\s*deadline$/i.test(x.label.trim()));
 if(index>=0)values[index]={...values[index]!,at:newIso};
 else values.push({label:"Application deadline",at:newIso});
 return {...details,importantDates:values};
}
