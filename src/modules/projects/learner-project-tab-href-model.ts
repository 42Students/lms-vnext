import { z } from "zod";

const safeToken=z.string().max(100);
const retainedKeys=[
  "taskSearch","priority","taskStatus","sprintId","releaseId",
  "activityCategory","activityFrom","activityTo",
] as const;
/** Keep filter inputs on tab switches, but never carry a transient modal or paging cursor. */
export function learnerProjectTabHref(
  projectId:string,tab:string,query:Pick<URLSearchParams,"get">,
):string {
  const params=new URLSearchParams({tab});
  for(const key of retainedKeys){
    const value=query.get(key);
    if(value && safeToken.safeParse(value).success)params.set(key,value);
  }
  return "/learn/projects/"+encodeURIComponent(projectId)+"?"+params.toString();
}
