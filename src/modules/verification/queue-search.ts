export type VerificationSearchRow={learnerName:string;batchName:string|null;branchName:string|null;section:"EDUCATION"|"IDENTITY"};
export function matchesVerificationSearch(row:VerificationSearchRow,query:string):boolean {
 const term=query.trim().toLocaleLowerCase("en-IN");
 if(!term)return true;
 return [row.learnerName,row.batchName??"",row.branchName??"",row.section]
 .some(value=>value.toLocaleLowerCase("en-IN").includes(term));
}
