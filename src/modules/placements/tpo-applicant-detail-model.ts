import {z} from "zod";
export const tpoApplicantDetailQuerySchema=z.object({
 jobId:z.string().uuid(),applicationId:z.string().uuid(),
}).strict();
export type ApplicantRoundEvidence={
 roundId:string;roundName:string;kind:string;version:number;outcome:string;
 appliedAt:string|null;
};
export type ApplicantOfferEvidence={
 offerId:string;version:number;status:string;roleTitle:string;
 annualCtcInr:number|null;issuedAt:string;expiresAt:string|null;joiningStatus:string|null;
};
export function projectTpoApplicantDetail(
 application:{status:string;screeningStatus:string|null},
 roundFacts:readonly ApplicantRoundEvidence[],offers:readonly ApplicantOfferEvidence[],
){
 const latestRounds=new Map<string,ApplicantRoundEvidence>();
 for(const r of roundFacts){
  const previous=latestRounds.get(r.roundId);
  if(!previous||r.version>previous.version)latestRounds.set(r.roundId,r);
 }
 const currentOffers=[...new Map(offers.map(x=>[x.offerId,x])).values()]
   .sort((a,b)=>b.version-a.version||b.issuedAt.localeCompare(a.issuedAt)||
     a.offerId.localeCompare(b.offerId));
 return {
  applicantStatus:application.status,
  screening:application.status==="WITHDRAWN"?"WITHDRAWN":application.screeningStatus??"PENDING",
  appliedRoundResults:[...latestRounds.values()].sort((a,b)=>a.roundName.localeCompare(b.roundName)||
    a.roundId.localeCompare(b.roundId)),
  offers:currentOffers.map(x=>({...x,
    joiningStatus:x.status==="ACCEPTED"?x.joiningStatus:null,
  })),
  finalEmployerSelectionAvailable:false as const,
 };
}
