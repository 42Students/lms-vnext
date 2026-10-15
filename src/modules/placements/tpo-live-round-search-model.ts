import {z} from "zod";
export const tpoLiveRoundSearchSchema=z.string().trim().max(100).default("");
export function filterTpoLiveRoundSearch<T extends {companyName:string;jobTitle:string;name:string}>(
 rows:readonly T[],term:string
):T[]{const q=term.trim().toLocaleLowerCase("en-IN");if(!q)return [...rows];
 return rows.filter(row=>[row.companyName,row.jobTitle,row.name].some(value=>value.toLocaleLowerCase("en-IN").includes(q)));
}
