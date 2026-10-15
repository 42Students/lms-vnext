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
