import {z} from "zod";
import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {db10LogAlertSignatures} from "@/db/schema/db10-log-alerts.draft";
import {logAlertsRuntimeEnabled} from "@/modules/log-alerts/readiness";
import {alertEnvironment,errorSignatureHash} from "@/modules/log-alerts/signature";
import type {RequestContext} from "@/modules/identity/context";
import {isSuperAdmin} from "@/modules/identity/context";
import {cloudPollSettings} from "@/modules/log-alerts/scheduler";
import {cloudLoggingAccessToken,readCloudLogErrorPage} from "@/modules/log-alerts/cloud-log-reader";
import {TrackerAdminError} from "./admin-errors";

export const trackerCloudLogQuerySchema=z.strictObject({
  windowMinutes:z.coerce.number().int().min(2).max(1440).default(60),
  pageToken:z.string().min(1).max(1024).optional(),
  query:z.string().trim().max(150).optional(),
  anchorAt:z.iso.datetime({offset:true}).optional(),
  minimumSeverity:z.enum(["WARNING","ERROR"]).default("ERROR"),
});
export async function readTrackerLiveLogs(context:RequestContext,raw:unknown,now=new Date()){
  if(!isSuperAdmin(context)||context.user.platformStatus!=="ACTIVE"||
     context.adminScope?.collegeId||context.adminScope?.organizationId)
    throw new TrackerAdminError("FORBIDDEN");
  const input=trackerCloudLogQuerySchema.parse(raw);
  const cfg=cloudPollSettings();
  if(!cfg)return {configured:false,items:[],nextPageToken:null};
  const anchor=input.anchorAt?new Date(input.anchorAt):now;
  // Historical lookups are bounded to one day and never query future windows.
  if(!Number.isFinite(anchor.getTime())||anchor.getTime()>now.getTime()+300_000)
    throw new Error("INVALID_LOG_WINDOW");
  const end=input.anchorAt
    ?new Date(Math.min(now.getTime(),anchor.getTime()+input.windowMinutes*30_000))
    :new Date(now.getTime());
  const start=input.anchorAt
    ?new Date(anchor.getTime()-input.windowMinutes*30_000)
    :new Date(now.getTime()-input.windowMinutes*60_000);
  // Uses the existing bounded 5s Google Cloud Logging reader. Its output
  // contains only redacted whitelisted fields, never raw provider JSON.
  const token=await cloudLoggingAccessToken();
  const page=await readCloudLogErrorPage({
    project:cfg.project,namespace:cfg.namespace,start,end,token,
    minimumSeverity:input.minimumSeverity,
    ...(input.pageToken?{pageToken:input.pageToken}:{}),
  });
  const term=input.query?.toLocaleLowerCase("en-IN")??"";
  // SA-placements-projects-114: map a live log row to an already-persisted
  // known-error signature. Do not expose message samples, hashes or account IDs.
  // Match the reporter's same redacted error+path+environment canonical form.
  const environment=alertEnvironment();
  const hashes=page.errors.map(row=>errorSignatureHash({
    environment,message:row.message,path:row.path,
  }));
  const matches=new Map<string,{id:string;muted:boolean}>();
  if(logAlertsRuntimeEnabled()&&hashes.length){
    try{
      const known=await getDb().select({id:db10LogAlertSignatures.id,
        hash:db10LogAlertSignatures.signatureHash,muted:db10LogAlertSignatures.muted})
        .from(db10LogAlertSignatures).where(and(
          eq(db10LogAlertSignatures.environment,environment),
          inArray(db10LogAlertSignatures.signatureHash,[...new Set(hashes)]),
        ));
      for(const row of known)matches.set(row.hash,{id:row.id,muted:row.muted});
    }catch{
      // Cloud logs remain readable when Known Errors are not yet provisioned.
    }
  }
  const items=page.errors.filter(row=>!term||
    [row.message,row.path,row.event,row.requestId??""].some(value=>
      value.toLocaleLowerCase("en-IN").includes(term)))
    .map(row=>({
      id:row.id.slice(0,1024),time:row.timestamp.toISOString(),event:row.event,
      message:row.message,path:row.path,requestId:row.requestId??null,component:row.component??null,
      knownErrorId:matches.get(errorSignatureHash({environment,message:row.message,path:row.path}))?.id??null,
      muted:matches.get(errorSignatureHash({environment,message:row.message,path:row.path}))?.muted??null,
    }));
  return {configured:true,items,nextPageToken:page.nextPageToken??null};
}
