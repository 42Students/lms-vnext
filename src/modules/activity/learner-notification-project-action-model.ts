import {z} from "zod";
import {learnerNotificationTarget} from "./learner-notification-inbox-model";
const id=z.string().uuid();
const tab=z.enum(["overview","team","sprints","board","tasks","resources","meetings","activity","delivery"]);
/** A project instance ID is navigation, never authorization; the page validates membership. */
export function learnerNotificationProjectAction(raw:string|null|undefined){
  const safe=learnerNotificationTarget(raw);
  if(!safe)return null;
  const url=new URL(safe,"https://lms-vnext.invalid");
  if(url.pathname==="/learn/projects")return {href:"/learn/projects",label:"View projects"};
  const match=url.pathname.match(/^\/learn\/projects\/([^/]+)$/);
  if(!match||!id.safeParse(match[1]).success)return null;
  const tabs=url.searchParams.getAll("tab");
  if(tabs.length>1||tabs.length===1&&!tab.safeParse(tabs[0]).success)return null;
  const valid=tabs[0]??null;
  const href="/learn/projects/"+encodeURIComponent(match[1]!)+
    (valid?"?tab="+encodeURIComponent(valid):"");
  return {href,label:valid==="board"||valid==="tasks"?"View project board":
    valid==="delivery"?"View project delivery":"View project"};
}
