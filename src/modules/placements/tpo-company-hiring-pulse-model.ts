export type TpoCompanyPulseDrive={status:string;archivedAt:Date|null};
export type TpoCompanyPulseOffer={status:string;membershipId:string;joiningStatus:string|null};
export type TpoCompanyPulseEvent={at:Date};
/** All measures come from this college's persisted company relationship, never CRM name matching. */
export function projectTpoCompanyHiringPulse(input:{
 drives:readonly TpoCompanyPulseDrive[];
 offers:readonly TpoCompanyPulseOffer[];
 timeline:readonly TpoCompanyPulseEvent[];
 seasonIds:readonly (string|null)[];
}){
 const activeDrives=input.drives.filter(d=>d.status==="PUBLISHED"&&!d.archivedAt).length;
 const accepted=input.offers.filter(o=>o.status==="ACCEPTED");
 const confirmedJoined=accepted.filter(o=>o.joiningStatus==="JOINED");
 const latest=input.timeline.reduce<Date|null>((best,event)=>!best||event.at.getTime()>best.getTime()?event.at:best,null);
 return {
  activeDrives,
  seasonsWithDrives:new Set(input.seasonIds.filter((v):v is string=>Boolean(v))).size,
  distinctAcceptedLearners:new Set(accepted.map(o=>o.membershipId)).size,
  distinctConfirmedJoinedLearners:new Set(confirmedJoined.map(o=>o.membershipId)).size,
  latestRecordedEventIso:latest?.toISOString()??null,
 };
}
