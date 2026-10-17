import { eq, and, inArray } from "drizzle-orm";
import {getDb} from "@/db/client";
import {platformSettingOverrides} from "@/db/schema";

/** Defaults preserve the current deployed behavior if no override exists. */
export const LEARNER_PLAYBACK_DEFAULTS={saveIntervalMs:5000,watchedThresholdPercent:90} as const;
export function learnerPlaybackSettingValue(key:string,value:unknown):number|null{
 if(typeof value!=="string"||!/^\d{1,6}$/.test(value))return null;
 const n=Number(value);
 if(key==="ui.progressSaveIntervalMs")return n>=1000&&n<=60000?n:null;
 if(key==="course.watchedThresholdPercent")return n>=1&&n<=100?n:null;
 return null;
}
export async function readLearnerPlaybackSettings(collegeId:string|undefined){
 const defaults={...LEARNER_PLAYBACK_DEFAULTS};
 const keys=["ui.progressSaveIntervalMs","course.watchedThresholdPercent"];
 const rows=await getDb().select({scopeType:platformSettingOverrides.scopeType,key:platformSettingOverrides.key,
  value:platformSettingOverrides.value}).from(platformSettingOverrides)
  .where(and(inArray(platformSettingOverrides.key,keys),
    collegeId?inArray(platformSettingOverrides.scopeType,["GLOBAL","COLLEGE"]):eq(platformSettingOverrides.scopeType,"GLOBAL")));
 const chosen=new Map<string,string>();
 for(const row of rows.filter(row=>row.scopeType==="GLOBAL"))chosen.set(row.key,row.value);
 if(collegeId)for(const row of rows.filter(row=>row.scopeType==="COLLEGE"))chosen.set(row.key,row.value);
 return {
  saveIntervalMs:learnerPlaybackSettingValue(keys[0]!,chosen.get(keys[0]))??defaults.saveIntervalMs,
  watchedThresholdPercent:learnerPlaybackSettingValue(keys[1]!,chosen.get(keys[1]))??defaults.watchedThresholdPercent,
 };
}
