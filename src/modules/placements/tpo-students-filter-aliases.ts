/** Only these historical f_ selectors are permitted at the typed Students boundary. */
export const TPO_STUDENT_LEGACY_FILTER_ALIASES={
 f_journey:"journeyState",f_journeyState:"journeyState",f_stage:"legacyStage",
 f_branch:"branchId",f_branchId:"branchId",f_program:"programId",f_programId:"programId",
 f_class:"classId",f_classId:"classId",f_batch:"batchId",f_batchId:"batchId",
 f_profile:"profileStatus",f_profileStatus:"profileStatus",f_cgpaMin:"minCgpa",
 f_cgpaMax:"maxCgpa",f_minCgpa:"minCgpa",f_maxCgpa:"maxCgpa",
 f_afterCollege:"afterCollege",f_search:"search",f_company:"interviewedWith",
 f_debarred:"debarred",f_hasResume:"hasResume",f_skillName:"skillName",
 f_minSkills:"minSkills",f_minOffers:"minOffers",f_maxOffers:"maxOffers",
 f_minApplications:"minApplications",f_maxApplications:"maxApplications",
 f_needsAttention:"needsAttention",f_marksVerified:"marksVerified",
} as const;
export function normalizeTpoStudentLegacyFilters(raw:Record<string,string|string[]|undefined>){
 const normalized:Record<string,string|string[]|undefined>={...raw};
 for(const [alias,key] of Object.entries(TPO_STUDENT_LEGACY_FILTER_ALIASES)){
  if(normalized[alias]===undefined)continue;
  if(normalized[key]!==undefined)throw new Error("Ambiguous Students filters");
  normalized[key]=normalized[alias];delete normalized[alias];
 }
 return normalized;
}
