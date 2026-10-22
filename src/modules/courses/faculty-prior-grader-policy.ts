/** A previously assigned faculty grader may revise their own earlier grade
 * after the teaching term ends, but not after losing active FACULTY membership
 * or moving to another college. This pure check is ONLY the preflight:
 * the transactional authorizer rechecks persisted membership and role. */
export function legacyPriorGraderEligible(input:{
 userId:string;gradedByUserId:string|null;collegeId:string;
 membership:{
   userId?:string;collegeId:string;status:string;roles:readonly string[];
 }|null;
}):boolean{
 const {membership}=input;
 return Boolean(membership&&membership.status==="ACTIVE"&&
  membership.collegeId===input.collegeId&&
  membership.roles.includes("FACULTY")&&
  input.gradedByUserId===input.userId&&
  (membership.userId===undefined||membership.userId===input.userId));
}
