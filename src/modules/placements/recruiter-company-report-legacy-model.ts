/** REC-calendar-messages-profile-35: legacy outcome columns.
 * Offered includes issued, accepted and declined records, never merely
 * the currently outstanding issued subset. */
export function recruiterCompanyReportLegacyFields(job:{
 applications:number|null;outstandingOffers:number|null;
 acceptedOffers:number|null;declinedOffers:number|null;joinedOffers:number|null;
}):readonly [string,number|null][]{
 const offered=job.outstandingOffers===null||job.acceptedOffers===null||job.declinedOffers===null
  ?null:job.outstandingOffers+job.acceptedOffers+job.declinedOffers;
 return [
  ["Applied",job.applications],["Offered",offered],
  ["Accepted",job.acceptedOffers],["Declined",job.declinedOffers],
  ["Joined",job.joinedOffers],
 ];
}
export function reportLegacyValue(value:number|null):string{
 return value===null||!Number.isFinite(value)?"Unavailable":String(value);
}
