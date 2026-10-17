import { z } from "zod";

/** Registered migration 0128 defines nine NAAC/NIRF after-college destinations. */
export const AFTER_COLLEGE_OUTCOMES=[
 "PLACED_ON_CAMPUS","PLACED_OFF_CAMPUS","HIGHER_STUDIES","ENTREPRENEURSHIP",
 "COMPETITIVE_EXAMS","NOT_INTERESTED","LOOKING_FOR_JOB","DEBARRED","NOT_DECIDED",
] as const;
export const afterCollegeOutcomeSchema=z.enum(AFTER_COLLEGE_OUTCOMES);
export type AfterCollegeOutcome=z.infer<typeof afterCollegeOutcomeSchema>;
export const AFTER_COLLEGE_LABELS:Record<AfterCollegeOutcome,string>={
 PLACED_ON_CAMPUS:"Placed on campus",PLACED_OFF_CAMPUS:"Placed off campus",
 HIGHER_STUDIES:"Higher studies",ENTREPRENEURSHIP:"Entrepreneurship",
 COMPETITIVE_EXAMS:"Competitive exams",NOT_INTERESTED:"Not interested",
 LOOKING_FOR_JOB:"Looking for a job",DEBARRED:"Debarred",NOT_DECIDED:"Not decided",
};
/** Placement and debarment outcomes require verified evidence in their own modules. */
export const MANUAL_AFTER_COLLEGE_OUTCOMES=AFTER_COLLEGE_OUTCOMES.filter(value=>
 !["PLACED_ON_CAMPUS","PLACED_OFF_CAMPUS","DEBARRED"].includes(value));
export const afterCollegeManualSchema=afterCollegeOutcomeSchema.refine(value=>
 MANUAL_AFTER_COLLEGE_OUTCOMES.includes(value),"Use recorded offer or debarment evidence to mark placed or debarred.");
export function afterCollegeOptions(){
 return MANUAL_AFTER_COLLEGE_OUTCOMES.map(value=>({value,label:AFTER_COLLEGE_LABELS[value]}));
}
export function afterCollegeDisplay(outcome:AfterCollegeOutcome|null|undefined){
 return outcome?AFTER_COLLEGE_LABELS[outcome]:AFTER_COLLEGE_LABELS.NOT_DECIDED;
}
