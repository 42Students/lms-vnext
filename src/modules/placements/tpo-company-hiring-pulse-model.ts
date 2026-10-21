export type TpoCompanyPulseDrive={status:string;archivedAt:Date|null};
export type TpoCompanyPulseOffer={status:string;membershipId:string;joiningStatus:string|null;joiningRecordedAt:Date|null};
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
 const joinedByYear=new Map<number,Set<string>>();
 const yearless=new Set<string>();
 for(const offer of confirmedJoined){
  const when=offer.joiningRecordedAt;
  if(!(when instanceof Date)||!Number.isFinite(when.getTime())) {
    yearless.add(offer.membershipId);
    continue;
  }
  const year=Number(new Intl.DateTimeFormat("en",{timeZone:"Asia/Kolkata",year:"numeric"}).format(when));
  if(!Number.isSafeInteger(year))continue;
  if(!joinedByYear.has(year))joinedByYear.set(year,new Set());
  joinedByYear.get(year)!.add(offer.membershipId);
 }
 const hiredPerYear=[...joinedByYear.entries()].sort((a,b)=>a[0]-b[0])
  .map(([year,learners])=>({year,joinedLearners:learners.size}));
 const latest=input.timeline.reduce<Date|null>((best,event)=>!best||event.at.getTime()>best.getTime()?event.at:best,null);
 return {
  activeDrives,
  seasonsWithDrives:new Set(input.seasonIds.filter((v):v is string=>Boolean(v))).size,
  distinctAcceptedLearners:new Set(accepted.map(o=>o.membershipId)).size,
  distinctConfirmedJoinedLearners:new Set(confirmedJoined.map(o=>o.membershipId)).size,
  latestRecordedEventIso:latest?.toISOString()??null,
  hiredPerYear,
  yearsHiring:hiredPerYear.length,
  confirmedJoinsWithoutYear:yearless.size,
 };
}
/** Legacy "Hiring per year" is NOT the confirmed JOINED chart above.
 * It attributes each distinct placed learner to the creating job's calendar
 * year. The read service must compute countsAsPlaced from the selected
 * college's placement policy (offer type/status/accepted threshold), never
 * infer it from JOINED or a job title.
 */
export function projectTpoLegacyPlacedByJobYear(
 rows: readonly { membershipId: string; jobCreatedAt: Date; countsAsPlaced: boolean }[],
): { year: number; placedLearners: number }[] {
 const years = new Map<number, Set<string>>();
 for (const row of rows) {
  if (!row.countsAsPlaced || !row.membershipId.trim() ||
      !(row.jobCreatedAt instanceof Date) ||
      !Number.isFinite(row.jobCreatedAt.getTime())) continue;
  const year = Number(new Intl.DateTimeFormat("en", {
   timeZone: "Asia/Kolkata", year: "numeric",
  }).format(row.jobCreatedAt));
  if (!Number.isSafeInteger(year)) continue;
  if (!years.has(year)) years.set(year, new Set());
  years.get(year)!.add(row.membershipId);
 }
 return [...years.entries()].sort((a,b)=>a[0]-b[0])
  .map(([year, learners]) => ({year, placedLearners: learners.size}));
}
