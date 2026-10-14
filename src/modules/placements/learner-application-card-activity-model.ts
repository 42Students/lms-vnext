import {z} from "zod";
import {learnerApplicationLatestActivity,type LearnerApplicationBrowseItem} from "./learner-applications-browse-model";
const uuid=z.string().uuid();
/** Saved own activity only, not a claimed employer update/response. */
export function learnerApplicationCardActivity(item:LearnerApplicationBrowseItem){
 const latest=learnerApplicationLatestActivity(item);
 return {
  at:new Date(latest),
  historyHref:uuid.safeParse(item.applicationId).success
   ?"/learn/my-placements/applications/"+encodeURIComponent(item.applicationId)+"/history":null,
 };
}
