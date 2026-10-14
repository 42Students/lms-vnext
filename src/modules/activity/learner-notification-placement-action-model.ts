import {z} from "zod";
import {learnerNotificationTarget} from "./learner-notification-inbox-model";
import {learnerNotificationAssessmentAction} from "./learner-notification-assessment-action-model";
const uuid=z.string().uuid();
const offerView=z.enum(["pending","accepted","closed"]);
/** Destination pages re-check own-member permissions; URLs never select a tenant. */
export function learnerNotificationPlacementAction(raw:string|null|undefined){
  const safe=learnerNotificationTarget(raw);
  if(!safe)return null;
  const url=new URL(safe,"https://lms-vnext.invalid");
  if(url.pathname==="/learn/my-placements/applications"){
    const ids=url.searchParams.getAll("applicationId");
    if(ids.length>1||ids.length===1&&!uuid.safeParse(ids[0]).success)return null;
    return ids.length===1
      ?{href:"/learn/my-placements/applications?applicationId="+encodeURIComponent(ids[0]!),label:"View your application"}
      :{href:"/learn/my-placements/applications",label:"View applications"};
  }
  if(url.pathname==="/learn/my-placements/offers"){
    const values=url.searchParams.getAll("status");
    if(values.length>1||values.length===1&&!offerView.safeParse(values[0]).success)return null;
    return values.length===1
      ?{href:"/learn/my-placements/offers?status="+encodeURIComponent(values[0]!),label:"View your offers"}
      :{href:"/learn/my-placements/offers",label:"View your offers"};
  }
  if(url.pathname==="/learn/my-placements/interviews"){
    const app=url.searchParams.getAll("applicationId");
    const round=url.searchParams.getAll("roundId");
    if(app.length===0&&round.length===0)
      return {href:"/learn/my-placements/interviews",label:"View interviews"};
    if(app.length!==1||round.length!==1||
      !uuid.safeParse(app[0]).success||!uuid.safeParse(round[0]).success)return null;
    return {href:"/learn/my-placements/interviews?applicationId="+encodeURIComponent(app[0]!)+
      "&roundId="+encodeURIComponent(round[0]!),label:"View interview details"};
  }
  return learnerNotificationAssessmentAction(safe);
}
