import {z} from "zod";
import {learnerDriveUrlSchema} from "./learner-drive-url-model";
const jobId=z.string().uuid();
const queryLimit=512;
function safeFilterQuery(raw:unknown):string {
  if(typeof raw!=="string"||raw.length>queryLimit)return "";
  const params=new URLSearchParams(raw);
  const parsed=learnerDriveUrlSchema.safeParse(Object.fromEntries(params));
  return parsed.success ? params.toString() : "";
}
export function learnerJobDetailFromDrivesHref(rawJobId:unknown,rawFilters:unknown){
  const id=jobId.safeParse(rawJobId);
  if(!id.success)return null;
  const saved=safeFilterQuery(rawFilters);
  const target="/learn/my-placements/jobs/"+encodeURIComponent(id.data);
  return saved ? target+"?back="+encodeURIComponent(saved):target;
}
export function learnerJobReturnToDrivesHref(rawBack:unknown){
  const query=safeFilterQuery(rawBack);
  return query?"/learn/my-placements/jobs?"+query:"/learn/my-placements/jobs";
}
