import {learnerSafeExternalContentHref} from "./learner-external-content-link-model";

/**
 * LEARNER-course-detail-R03 — a live meeting is joinable/copyable from the
 * moment the faculty publishes its HTTPS link, including before startsAt.
 * Only an ended live meeting loses the Join/Copy action. Other scheduled
 * content must retain the existing release-time restriction.
 *
 * The learner-course service remains responsible for course/delivery access;
 * this helper sanitizes even legacy-stored URLs at the server read boundary.
 */
export function learnerVisibleContentExternalUrl(input:{
  contentType:string;
  availability:"SCHEDULED"|"AVAILABLE"|"ENDED";
  externalUrl:string|null;
}):string|null{
  const available=input.contentType==="LIVE_CLASS"
    ?input.availability!=="ENDED"
    :input.availability==="AVAILABLE";
  return available?learnerSafeExternalContentHref(input.externalUrl):null;
}
