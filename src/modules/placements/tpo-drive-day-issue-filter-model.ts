import {z} from "zod";
export const tpoDriveDayIssueSchema=z.enum(["ALL","NO_SHOWS"]).default("ALL");
export function filterTpoDriveDayIssues<T extends {counts:{noShow:number;pending:number;unknown:number}}>(
 rows:readonly T[],issue:z.infer<typeof tpoDriveDayIssueSchema>
):T[]{return issue==="NO_SHOWS"?rows.filter(r=>r.counts.noShow>0):[...rows];}
