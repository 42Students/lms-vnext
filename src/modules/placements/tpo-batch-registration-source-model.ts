import {z} from "zod";
export const tpoBatchRegistrationSourceSchema=z.enum(["ALL","SELF","TPO","BACKFILL","UNRECORDED"]).default("ALL");
export function filterTpoBatchRegistrationSource<T extends {source:string|null}>(rows:readonly T[],source:z.infer<typeof tpoBatchRegistrationSourceSchema>):T[]{
 if(source==="ALL")return [...rows];
 return rows.filter(row=>source==="UNRECORDED"?row.source===null:row.source===source);
}
