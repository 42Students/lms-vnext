/**
 * LEARNER-course-detail-R03 — a live meeting is joinable/copyable from the
 * moment the faculty publishes its HTTPS link, including before startsAt.
 * Only an ended live meeting loses the Join/Copy action. Other scheduled
 * content must retain the existing release-time restriction.
 *
 * The learner-course service remains responsible for course/delivery access;
 * this helper is deliberately not a permission bypass or URL sanitizer.
 */
export function learnerVisibleContentExternalUrl(input:{
  contentType:string;
  availability:"SCHEDULED"|"AVAILABLE"|"ENDED";
  externalUrl:string|null;
}):string|null{
  if(input.contentType==="LIVE_CLASS"){
    return input.availability==="ENDED"?null:input.externalUrl;
  }
  return input.availability==="AVAILABLE"?input.externalUrl:null;
}
