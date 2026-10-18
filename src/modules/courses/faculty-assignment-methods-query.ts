import {z} from "zod";

const methodsQuery=z.object({
 assignmentId:z.string().uuid(),
}).strict();

/** Single authoritative assignment selector. Duplicate/extra GET query fields
 * are ambiguous for audits and must never silently select the first value. */
export function parseFacultyAssignmentMethodsQuery(requestUrl:string){
 const params=new URL(requestUrl).searchParams;
 const keys=[...params.keys()];
 const selector=keys.length===1&&keys[0]==="assignmentId" &&
   params.getAll("assignmentId").length===1
   ?params.get("assignmentId"):null;
 return methodsQuery.parse({assignmentId:selector});
}
