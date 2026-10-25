/** A recruiter may request a colleague's access, but only the placement
 * cell may actually invite/grant that person. The request uses the existing
 * authenticated, college-scoped recruiter/TPO messaging service. */
export function recruiterColleagueWorkEmail(raw:string,domains:readonly string[]):string|null{
 const email=raw.trim().toLowerCase();
 if(email.length>254 || !/^[a-z0-9.!#$%&'*+/=?^`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/.test(email))return null;
 const domain=email.slice(email.lastIndexOf("@")+1);
 const approved=new Set(domains.map(value=>value.trim().replace(/^@/,"").toLowerCase()));
 return approved.has(domain)?email:null;
}

export function recruiterColleagueInviteRequestMessage(email:string,companyName:string,collegeName:string){
 return "Please review an invitation for "+email+" to join the recruiter team for "+
  companyName+" at "+collegeName+". Verify the person's company email and authorize "+
  "the appropriate college and applicant permissions before inviting them. "+
  "This is only an access request; do not treat this message as a grant.";
}
