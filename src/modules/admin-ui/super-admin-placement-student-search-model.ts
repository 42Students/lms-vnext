import {z} from "zod";

/** A forged GET must not reach the placement service with an invalid search
 * (including repeated keys), even when the browser form sets maxLength. */
const searchSchema=z.string().trim().min(2).max(150);
export function parseSuperAdminPlacementStudentSearch(
  params:Record<string,string|string[]|undefined>,
):{query:string|null;invalid:boolean}{
  const value=params.q;
  if(value===undefined||value==="")return {query:null,invalid:false};
  if(typeof value!=="string")return {query:null,invalid:true};
  const parsed=searchSchema.safeParse(value);
  return parsed.success
    ? {query:parsed.data,invalid:false}
    : {query:null,invalid:true};
}
