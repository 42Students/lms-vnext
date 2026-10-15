import {facultyProfileRecordHasManagedDocument} from "./faculty-receipt-row-policy";
/** Copy a persisted snapshot before a user explicitly discards local edits. */
export function restoreFacultyProfileRows<T extends {id:string}>(initial:readonly T[]):T[]{
 return initial.map(row=>({...row}));
}

/** Record deletion cannot orphan an existing private receipt; scope by its exact id. */
export function removeFacultyProfileDraftRow<T extends {id:string}>(rows:readonly T[],id:string):T[]{
 const row=rows.find(entry=>entry.id===id);
 if(!row||facultyProfileRecordHasManagedDocument(row))return [...rows];
 return rows.filter(entry=>entry.id!==id);
}

/** Duplicate authored fields, but never copy private administrator-owned receipts. */
export function cloneFacultyProfileDraftRow<T extends {id:string}>(row:T,newId:string):T{
 const duplicate={...row,id:newId} as T & {
  certificateDocumentId?:string|null;
  experienceCertificateDocumentId?:string|null;
  offerLetterDocumentId?:string|null;
 };
 if("certificateDocumentId" in duplicate)duplicate.certificateDocumentId=null;
 if("experienceCertificateDocumentId" in duplicate)duplicate.experienceCertificateDocumentId=null;
 if("offerLetterDocumentId" in duplicate)duplicate.offerLetterDocumentId=null;
 return duplicate;
}
export function duplicateFacultyProfileDraftRow<T extends {id:string}>(
 rows:readonly T[],id:string,maxItems:number,newId:string,
):T[]{
 if(rows.length>=maxItems||!newId||rows.some(row=>row.id===newId))return [...rows];
 const index=rows.findIndex(row=>row.id===id);
 if(index<0)return [...rows];
 const next=[...rows];
 next.splice(index+1,0,cloneFacultyProfileDraftRow(rows[index]!,newId));
 return next;
}

/** Reordering only changes one section's draft; it never mutates its source. */
export function moveFacultyProfileDraftRow<T extends {id:string}>(
 rows:readonly T[],id:string,toIndex:number,
):T[]{
 const from=rows.findIndex(row=>row.id===id);
 if(from<0||toIndex<0||toIndex>=rows.length||from===toIndex)return [...rows];
 const result=[...rows];const [item]=result.splice(from,1);result.splice(toIndex,0,item!);
 return result;
}

/** Filter visible authored fields while persisting the unfiltered draft. */
export function facultyProfileRecordMatches(
 row:object,fieldNames:readonly string[],query:string,
):boolean{
 const term=query.trim().toLocaleLowerCase();
 if(!term)return true;
 const values=row as Record<string,unknown>;
 return fieldNames.some(name=>typeof values[name]==="string" &&
  (values[name] as string).toLocaleLowerCase().includes(term));
}
