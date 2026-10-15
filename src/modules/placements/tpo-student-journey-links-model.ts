/** Never expose another learner via an ambient query string; use the scoped membership route. */
export function tpoStudentJourneyLinks(membershipId:string){
 const root="/tpo/students/"+encodeURIComponent(membershipId);
 return {history:root+"/history",participation:root+"/participation",roster:"/tpo/students"};
}
