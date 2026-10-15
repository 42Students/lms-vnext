import { z } from "zod";

/** Student-reported destination, not placement-offer status. */
export const AFTER_COLLEGE_OUTCOMES=[
 "HIGHER_STUDIES","ENTREPRENEURSHIP","COMPETITIVE_EXAMS","LOOKING_FOR_JOB","NOT_DECIDED",
] as const;
export const afterCollegeOutcomeSchema=z.enum(AFTER_COLLEGE_OUTCOMES);
export const AFTER_COLLEGE_LABELS:Record<(typeof AFTER_COLLEGE_OUTCOMES)[number],string>={
 HIGHER_STUDIES:"Higher studies",ENTREPRENEURSHIP:"Entrepreneurship",
 COMPETITIVE_EXAMS:"Competitive exams",LOOKING_FOR_JOB:"Looking for a job",
 NOT_DECIDED:"Not decided",
};
export function afterCollegeOptions(){
 return AFTER_COLLEGE_OUTCOMES.map(value=>({value,label:AFTER_COLLEGE_LABELS[value]}));
}

export type AfterCollegeOutcome=(typeof AFTER_COLLEGE_OUTCOMES)[number];
