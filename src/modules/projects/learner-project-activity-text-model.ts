import {z} from "zod";
const termSchema=z.string().trim().max(100).catch("");
type Activity={summary:string;subjectLabel:string|null;actorDisplayName:string|null};
/** Search one authorized Project activity page without falsely claiming full-history search. */
export function filterLearnerProjectActivityText<T extends Activity>(
 rows:readonly T[],input:unknown,
):T[]{
 const term=termSchema.parse(input).toLocaleLowerCase("en-IN");
 if(!term)return [...rows];
 return rows.filter(row=>[row.summary,row.subjectLabel??"",row.actorDisplayName??""]
  .some(field=>field.toLocaleLowerCase("en-IN").includes(term)));
}
