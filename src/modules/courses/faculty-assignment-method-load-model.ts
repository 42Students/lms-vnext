import {
 assignmentMethodsSchema,
 type AssignmentMethod,
} from "./assignment-submission-methods";

/** A 200 status or malformed JSON must not reset course policy to "all
 * allowed". Missing methods are a failed load, not a permissive default. */
export function verifiedFacultyAssignmentMethodsResponse(
 raw:unknown,
):AssignmentMethod[]|null{
 if(!raw||typeof raw!=="object"||!("methods" in raw))return null;
 const result=assignmentMethodsSchema.safeParse((raw as {methods:unknown}).methods);
 return result.success?result.data:null;
}

/** A late fetch for Assignment A cannot overwrite Assignment B's editor. */
export function facultyAssignmentMethodsLoadVersion(){
 let revision=0;
 return {
  next:()=>++revision,
  isCurrent:(requested:number)=>requested===revision,
 };
}
