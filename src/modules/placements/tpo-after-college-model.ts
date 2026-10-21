import { z } from "zod";

/** Registered migration 0128 defines nine NAAC/NIRF after-college destinations. */
export const TPO_FIXED_CHOICES_CATALOG_VERSION="2026-10" as const;
export const AFTER_COLLEGE_OUTCOMES=[
 "PLACED_ON_CAMPUS","PLACED_OFF_CAMPUS","HIGHER_STUDIES","ENTREPRENEURSHIP",
 "COMPETITIVE_EXAMS","NOT_INTERESTED","LOOKING_FOR_JOB","DEBARRED","NOT_DECIDED",
] as const;
export const afterCollegeOutcomeSchema=z.enum(AFTER_COLLEGE_OUTCOMES);
export type AfterCollegeOutcome=z.infer<typeof afterCollegeOutcomeSchema>;
export const AFTER_COLLEGE_LABELS:Record<AfterCollegeOutcome,string>={
 PLACED_ON_CAMPUS:"Placed on campus",PLACED_OFF_CAMPUS:"Placed off campus",
 HIGHER_STUDIES:"Higher studies",ENTREPRENEURSHIP:"Entrepreneurship / self-employed",
 COMPETITIVE_EXAMS:"Competitive exams",NOT_INTERESTED:"Not interested",
 LOOKING_FOR_JOB:"Looking for a job",DEBARRED:"Debarred",NOT_DECIDED:"Not decided yet",
};
/** Placement and debarment outcomes require verified evidence in their own modules. */
export const MANUAL_AFTER_COLLEGE_OUTCOMES=AFTER_COLLEGE_OUTCOMES.filter(value=>
 !["PLACED_ON_CAMPUS","PLACED_OFF_CAMPUS","DEBARRED"].includes(value));
export const afterCollegeManualSchema=afterCollegeOutcomeSchema.refine(value=>
 MANUAL_AFTER_COLLEGE_OUTCOMES.includes(value),"Use recorded offer or debarment evidence to mark placed or debarred.");
export function afterCollegeOptions(){
 return MANUAL_AFTER_COLLEGE_OUTCOMES.map(value=>({value,label:AFTER_COLLEGE_LABELS[value],settable:true as const}));
}
export function afterCollegeDisplay(outcome:AfterCollegeOutcome|null|undefined){
 return outcome?AFTER_COLLEGE_LABELS[outcome]:AFTER_COLLEGE_LABELS.NOT_DECIDED;
}

/** Include evidence-derived placed and debarred outcomes in read-only settings. */
export function afterCollegeAllOptions(){
 return AFTER_COLLEGE_OUTCOMES.map(value=>({value,label:AFTER_COLLEGE_LABELS[value],
  settable:MANUAL_AFTER_COLLEGE_OUTCOMES.includes(value)}));
}

/** Registration is a learner's intent to participate in placements, not a
 * NAAC/NIRF after-college result. In particular, selecting PLACEMENTS never
 * creates a PLACED_ON_CAMPUS or PLACED_OFF_CAMPUS outcome. */
export const REGISTRATION_CHOICES = ["PLACEMENTS","HIGHER_STUDIES","NOT_INTERESTED"] as const;
export const registrationChoiceSchema=z.enum(REGISTRATION_CHOICES);
export type RegistrationChoice=z.infer<typeof registrationChoiceSchema>;
export const REGISTRATION_CHOICE_LABELS:Record<RegistrationChoice,string>={
 PLACEMENTS:"Placements",HIGHER_STUDIES:"Higher studies",NOT_INTERESTED:"Not interested",
};
export function registrationChoiceOptions(){
 return REGISTRATION_CHOICES.map(value=>({value,label:REGISTRATION_CHOICE_LABELS[value]}));
}

/** Per-college custom outcome labels/job types must use a tenant + revision
 * scoped lookup. Stable built-in options can be reused until either changes;
 * callers supply a trustworthy server catalog revision, not a browser guess. */
export function afterCollegeCatalogScopeKey(collegeId:string,catalogVersion:string|number){
 return JSON.stringify([z.string().uuid().parse(collegeId),String(catalogVersion)]);
}

/** SQL CAST(passing_year AS CHAR) ORDER BY 1 in the legacy choices API used
 * string order. Keep unknown/invalid years out of the options object.
 */
export function legacyPassingYearOptions(years:readonly (number|string|null)[]){
 const values=[...new Set(years.map(year=>String(year??"").trim()).filter(year=>/^\\d{4}$/.test(year)))];
 return values.sort().map(value=>({value,label:value}));
}

/** One cache per caller workspace/session, NEVER a global authenticated cache.
 * The reader performs tenant/role authorization. Versions must be obtained
 * from the persisted catalog and the caller must call invalidate() after an
 * in-session job-type/outcome-label change or active membership switch.
 * Concurrent callers for the same tenant, scope, revision share one Promise.
 */
export function createTenantChoicePromiseCache<T>(){
 const cache=new Map<string,{collegeId:string;promise:Promise<T>}>();
 function keyFor(collegeId:string,scope:string,revision:string|number){
  const tenant=z.string().uuid().parse(collegeId);
  const role=z.string().trim().min(1).max(128).parse(scope);
  return {tenant,key:JSON.stringify([tenant,role,String(revision),TPO_FIXED_CHOICES_CATALOG_VERSION])};
 }
 return {
  load(collegeId:string,scope:string,revision:string|number,reader:()=>Promise<T>):Promise<T>{
   const {tenant,key}=keyFor(collegeId,scope,revision);
   const found=cache.get(key);
   if(found)return found.promise;
   const promise=Promise.resolve().then(reader).catch(error=>{
    if(cache.get(key)?.promise===promise)cache.delete(key);
    throw error;
   });
   cache.set(key,{collegeId:tenant,promise});
   return promise;
  },
  invalidate(collegeId?:string){
   const tenant=collegeId?z.string().uuid().parse(collegeId):null;
   for(const [key,value] of cache)
    if(!tenant||value.collegeId===tenant)cache.delete(key);
  },
 };
}
