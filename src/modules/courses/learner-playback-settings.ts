import { eq, and, inArray } from "drizzle-orm";
import {getDb} from "@/db/client";
import {platformSettingOverrides} from "@/db/schema";
import {writeStructuredLog} from "@/observability/logger";

/** Defaults preserve the current deployed behavior if no override exists. */
export const LEARNER_PLAYBACK_DEFAULTS={saveIntervalMs:15000,watchedThresholdPercent:90,minInProgressPercent:5,chatPollIntervalMs:15000} as const;
export function learnerPlaybackSettingValue(key:string,value:unknown):number|null{
 if(typeof value!=="string"||!/^\d{1,6}$/.test(value))return null;
 const n=Number(value);
 if(key==="ui.progressSaveIntervalMs")return n<=600000?Math.max(5000,n):null;
 if(key==="course.watchedThresholdPercent")return n>=1&&n<=100?n:null;
 if(key==="course.minInProgressPercent")return n>=0&&n<=100?n:null;
 if(key==="ui.chatPollIntervalMs")return n>=3000&&n<=600000?n:null;
 return null;
}
/** Authenticated server helper. Persisted configuration is optional:
 * a missing table or transient DB error must not break the learner player. */
export async function readLearnerPlaybackSettings(_collegeId:string|undefined){
 const defaults={...LEARNER_PLAYBACK_DEFAULTS};
 const keys=["ui.progressSaveIntervalMs","course.watchedThresholdPercent",
  "course.minInProgressPercent","ui.chatPollIntervalMs"] as const;
 let rows:{key:string;value:string}[];
 try {
  rows=await getDb().select({key:platformSettingOverrides.key,value:platformSettingOverrides.value})
   .from(platformSettingOverrides).where(and(inArray(platformSettingOverrides.key,[...keys]),
    eq(platformSettingOverrides.scopeType,"GLOBAL"),
    eq(platformSettingOverrides.scopeId,"GLOBAL")));
 } catch {
  writeStructuredLog("WARNING","learner.playback_settings_unavailable",{reason:"DB_READ_FAILED"});
  return defaults;
 }
 const chosen=new Map(rows.map(row=>[row.key,row.value] as const));
 const safeValue=(key:string,fallback:number)=>{
  const raw=chosen.get(key);
  if(raw===undefined)return fallback;
  const value=learnerPlaybackSettingValue(key,raw);
  if(value===null){
   writeStructuredLog("WARNING","learner.playback_settings_invalid",{key,reason:"OUT_OF_RANGE"});
   return fallback;
  }
  return value;
 };
 return {
  saveIntervalMs:safeValue(keys[0],defaults.saveIntervalMs),
  watchedThresholdPercent:safeValue(keys[1],defaults.watchedThresholdPercent),
  minInProgressPercent:safeValue(keys[2],defaults.minInProgressPercent),
  chatPollIntervalMs:safeValue(keys[3],defaults.chatPollIntervalMs),
 };
}
