import {facultyProfileRecordHasManagedDocument} from "./faculty-receipt-row-policy";
/** Copy a persisted snapshot before a user explicitly discards local edits. */
export function restoreFacultyProfileRows<T extends {id:string}>(initial:readonly T[]):T[]{
 return initial.map(row=>({...row}));
}
