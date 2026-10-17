import {z} from "zod";
import type {RequestContext} from "@/modules/identity/context";
import {isSuperAdmin} from "@/modules/identity/context";
import {cloudPollSettings} from "@/modules/log-alerts/scheduler";
import {cloudLoggingAccessToken,readCloudLogErrorPage} from "@/modules/log-alerts/cloud-log-reader";
import {TrackerAdminError} from "./admin-errors";

export const trackerCloudLogQuerySchema=z.strictObject({
  windowMinutes:z.coerce.number().int().min(2).max(1440).default(60),
  pageToken:z.string().min(1).max(1024).optional(),
  query:z.string().trim().max(150).optional(),
});
export async function readTrackerLiveLogs(context:RequestContext,raw:unknown,now=new Date()){
  if(!isSuperAdmin(context)||context.user.platformStatus!=="ACTIVE"||
     context.adminScope?.collegeId||context.adminScope?.organizationId)
    throw new TrackerAdminError("FORBIDDEN");
  const input=trackerCloudLogQuerySchema.parse(raw);
  const cfg=cloudPollSettings();
  if(!cfg)return {configured:false,items:[],nextPageToken:null};
  const end=new Date(now.getTime());
  const start=new Date(now.getTime()-input.windowMinutes*60_000);
  // Uses the existing bounded 5s Google Cloud Logging reader. Its output
  // contains only redacted whitelisted fields, never raw provider JSON.
  const token=await cloudLoggingAccessToken();
  const page=await readCloudLogErrorPage({
    project:cfg.project,namespace:cfg.namespace,start,end,token,
    ...(input.pageToken?{pageToken:input.pageToken}:{}),
  });
  const term=input.query?.toLocaleLowerCase("en-IN")??"";
  const items=page.errors.filter(row=>!term||
    [row.message,row.path,row.event,row.requestId??""].some(value=>
      value.toLocaleLowerCase("en-IN").includes(term)))
    .map(row=>({
      id:row.id.slice(0,1024),time:row.timestamp.toISOString(),event:row.event,
      message:row.message,path:row.path,requestId:row.requestId??null,component:row.component??null,
    }));
  return {configured:true,items,nextPageToken:page.nextPageToken??null};
}
