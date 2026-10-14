import {z} from "zod";
import {learnerNotificationTarget} from "./learner-notification-inbox-model";
const id=z.string().uuid();
/** Notification links remain untrusted until the destination verifies own membership. */
export function learnerNotificationAssessmentAction(raw:string|null|undefined){
 const safe=learnerNotificationTarget(raw);
 if(!safe)return null;
 const uri=new URL(safe,"https://lms-vnext.invalid");
 if(uri.pathname!=="/learn/my-placements/assessments")return {href:safe,label:"Open details"};
 const app=uri.searchParams.getAll("applicationId");
 const round=uri.searchParams.getAll("roundId");
 if(app.length===0&&round.length===0)return {
   href:"/learn/my-placements/assessments",label:"View assessments",
 };
 if(app.length!==1||round.length!==1)return null;
 if(!id.safeParse(app[0]).success||!id.safeParse(round[0]).success)return null;
 // Drop unregistered user/college selectors and untrusted filter parameters.
 return {
   href:"/learn/my-placements/assessments?applicationId="+encodeURIComponent(app[0])+
     "&roundId="+encodeURIComponent(round[0]),
   label:"View assessment details",
 };
}
