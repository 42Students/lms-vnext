import { eq, and, inArray } from "drizzle-orm";
import {getDb} from "@/db/client";
import {platformSettingOverrides} from "@/db/schema";

/** Defaults preserve the current deployed behavior if no override exists. */
export const LEARNER_PLAYBACK_DEFAULTS={saveIntervalMs:5000,watchedThresholdPercent:90,minInProgressPercent:5} as const;
export function learnerPlaybackSettingValue(key:string,value:unknown):number|null{
 if(typeof value!=="string"||!/^\d{1,6}$/.test(value))return null;
 const n=Number(value);
 if(key==="ui.progressSaveIntervalMs")return n>=5000&&n<=600000?n:null;
 if(key==="course.watchedThresholdPercent")return n>=1&&n<=100?n:null;
 if(key==="course.minInProgressPercent")return n>=0&&n<=100?n:null;
 return null;
}
export async function readLearnerPlaybackSettings(_collegeId:string|undefined){
 const defaults={...LEARNER_PLAYBACK_DEFAULTS};
 const keys=["ui.progressSaveIntervalMs","course.watchedThresholdPercent","course.minInProgressPercent"];
 const rows=await getDb().select({scopeType:platformSettingOverrides.scopeType,key:platformSettingOverrides.key,
  value:platformSettingOverrides.value}).from(platformSettingOverrides)
  .where(and(inArray(platformSettingOverrides.key,keys),
    eq(platformSettingOverrides.scopeType,"GLOBAL"),
    eq(platformSettingOverrides.scopeId,"GLOBAL")));
 const chosen=new Map(rows.map(row=>[row.key,row.value] as const));
 return {
  saveIntervalMs:learnerPlaybackSettingValue(keys[0]!,chosen.get(keys[0]))??defaults.saveIntervalMs,
  watchedThresholdPercent:learnerPlaybackSettingValue(keys[1]!,chosen.get(keys[1]))??defaults.watchedThresholdPercent,
  minInProgressPercent:learnerPlaybackSettingValue(keys[2]!,chosen.get(keys[2]))??defaults.minInProgressPercent,
 };
}
