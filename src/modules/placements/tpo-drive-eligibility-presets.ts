export type DriveEligibilityPreset="OPEN"|"CGPA_6"|"CGPA_7"|"PCT_60"|"PCT_70";
/** TPO-drives-36: presets adjust real policy fields without bypassing validation. */
export function driveEligibilityPresetValue(preset:DriveEligibilityPreset,field:string):string{
 if(field==="minCgpa")return preset==="CGPA_6"?"6":preset==="CGPA_7"?"7":"";
 if(field==="minPctThroughout")return preset==="PCT_60"?"60":preset==="PCT_70"?"70":"";
 return "";
}
