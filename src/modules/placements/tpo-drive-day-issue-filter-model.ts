import {z} from "zod";
export const tpoDriveDayIssueSchema=z.enum(["ALL","NO_SHOWS","PENDING","UNKNOWN","UNRESOLVED"]).default("ALL");
export function filterTpoDriveDayIssues<T extends {counts:{noShow:number;pending:number;unknown:number}}>(
 rows:readonly T[],issue:z.infer<typeof tpoDriveDayIssueSchema>
):T[]{if(issue==="NO_SHOWS")return rows.filter(r=>r.counts.noShow>0);
 if(issue==="PENDING")return rows.filter(r=>r.counts.pending>0);
 if(issue==="UNKNOWN")return rows.filter(r=>r.counts.unknown>0);
 if(issue==="UNRESOLVED")return rows.filter(r=>r.counts.unknown+r.counts.pending>0);
 return [...rows];}
