import {z} from "zod";
import {learnerNotificationTarget} from "./learner-notification-inbox-model";
const id=z.string().uuid();
/** Navigation is only a hint; the destination enforces enrolled learner access. */
export function learnerNotificationCourseAction(raw:string|null|undefined){
 const safe=learnerNotificationTarget(raw);
 if(!safe)return null;
 const url=new URL(safe,"https://lms-vnext.invalid");
 if(url.pathname==="/learn/courses")return {href:"/learn/courses",label:"View courses"};
 const match=url.pathname.match(/^\/learn\/courses\/([^/]+)(\/home)?$/);
 if(!match||!id.safeParse(match[1]).success)return null;
 return {href:"/learn/courses/"+encodeURIComponent(match[1]!)+(match[2]??""),
   label:"View course"};
}
