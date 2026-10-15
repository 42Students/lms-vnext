import {z} from "zod";
/** Only the created server response may select the new college; never trust form input for the scope handoff. */
const createdCollegeResponse=z.strictObject({college:z.object({id:z.uuid()}).passthrough()});
export function tenantCreationScopeRequest(raw:unknown):{kind:"college";collegeId:string}|null {
 const result=createdCollegeResponse.safeParse(raw);
 return result.success?{kind:"college",collegeId:result.data.college.id}:null;
}
