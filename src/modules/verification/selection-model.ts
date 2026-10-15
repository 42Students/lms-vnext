export type VerificationSelectionId={learnerMembershipId:string;section:"EDUCATION"|"IDENTITY"};
export function verificationSelectionKey(row:VerificationSelectionId):string {
 return row.learnerMembershipId+":"+row.section;
}
export function toggleVerificationSelection(keys:ReadonlySet<string>,row:VerificationSelectionId):Set<string>{
 const next=new Set(keys),key=verificationSelectionKey(row);
 if(next.has(key))next.delete(key);else next.add(key);
 return next;
}
export function retainVisibleSelection(keys:ReadonlySet<string>,rows:readonly VerificationSelectionId[]):Set<string>{
 const allowed=new Set(rows.map(verificationSelectionKey));
 return new Set([...keys].filter(key=>allowed.has(key)));
}
