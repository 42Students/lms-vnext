/** The five fixed legacy choices. Only college-defined choices live in placement_tpo_job_types. */
export const TPO_BUILTIN_JOB_TYPES=[
 {label:"Full-time",countsAsPlaced:true},
 {label:"Internship",countsAsPlaced:false},
 {label:"Internship + full-time",countsAsPlaced:true},
 {label:"Contract",countsAsPlaced:true},
 {label:"Apprenticeship",countsAsPlaced:true},
] as const;
export const TPO_BUILTIN_JOB_TYPE_NAMES=new Set<string>(
 TPO_BUILTIN_JOB_TYPES.map(item=>item.label.toLocaleLowerCase("en-IN")));
export function isTpoBuiltinJobType(label:string):boolean{
 return TPO_BUILTIN_JOB_TYPE_NAMES.has(label.trim().replace(/\s+/g," ").toLocaleLowerCase("en-IN"));
}
