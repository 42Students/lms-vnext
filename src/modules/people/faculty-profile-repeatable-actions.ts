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
