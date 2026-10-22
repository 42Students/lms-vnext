/** The old JobImportantDateEventDTO represented an array, not a single
 * job deadline. Preserve the original user-authored label, source index and
 * the JOB_IMPORTANT_DATE origin separately from the vNext display kind.
 * Callers must first prove the job is within their authorized college. */
export type ImportedJobImportantDate={
 id:string;jobId:string;index:number;label:string;eventType:"JOB_IMPORTANT_DATE";
 originalType:string|null;at:Date;applicationDeadline:boolean;
};
/** Matches legacy PlacementDateTimeUtils.parseUtcDateTime. Bare date-time
 * values are already UTC wall-clock; bare dates preserve their civil date
 * at 00:00 UTC. Only offset-bearing strings are converted from their offset.
 * Calendar grouping later converts the resulting instant to Asia/Kolkata.
 */
export function parseImportedImportantDateUtc(raw:unknown):Date|null{
 if(typeof raw!=="string")return null;
 const value=raw.trim().replace(" ","T");
 if(/^\d{4}-\d{2}-\d{2}$/.test(value)){
  const date=new Date(value+"T00:00:00.000Z");
  return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value
    ?date:null;
 }
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:?\d{2})?$/i.test(value))
  return null;
 const hasOffset=/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
 const parsed=new Date(hasOffset?value:value+"Z");
 if(!Number.isFinite(parsed.getTime()))return null;
 if(!hasOffset&&parsed.toISOString().slice(0,10)!==value.slice(0,10))return null;
 return parsed;
}

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
  const time=parseImportedImportantDateUtc(raw);
  if(!time)return [];
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

/** Keep explicitly authored types from the old Job DTO. Never derive
 * type from title or treat a bare date as the server's local timezone. */
export function authoredImportantDateRoundTrip(row:{
 label:string;at:string;type?:string;dateType?:string;
}){
 const label=row.label.trim();
 const at=parseImportedImportantDateUtc(row.at);
 if(!label||label.length>120||!at)
  throw new Error("Important date needs a valid label and date");
 const type=row.type?.trim(),dateType=row.dateType?.trim();
 if((type&&type.length>80)||(dateType&&dateType.length>80))
  throw new Error("Important date type must be 80 characters or fewer");
 return {label,at:row.at,
  ...(type?{type}:{}),...(dateType?{dateType}:{})};
}
