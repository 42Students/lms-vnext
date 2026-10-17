import { z } from "zod";

/** Legacy placement outcomes are college-scoped destination labels, not offer status. */
export const AFTER_COLLEGE_OUTCOMES=[
 "PLACED_ON_CAMPUS","PLACED_OFF_CAMPUS","HIGHER_STUDIES","ENTREPRENEURSHIP",
 "COMPETITIVE_EXAMS","NOT_INTERESTED","LOOKING_FOR_JOB","DEBARRED","NOT_DECIDED",
] as const;
export const afterCollegeOutcomeSchema=z.enum(AFTER_COLLEGE_OUTCOMES);
export type AfterCollegeOutcome=z.infer<typeof afterCollegeOutcomeSchema>;
export const AFTER_COLLEGE_LABELS:Record<AfterCollegeOutcome,string>={
 PLACED_ON_CAMPUS:"Placed on campus",
 PLACED_OFF_CAMPUS:"Placed off campus",
 HIGHER_STUDIES:"Higher studies",
 ENTREPRENEURSHIP:"Entrepreneurship / self-employed",
 COMPETITIVE_EXAMS:"Competitive exams",
 NOT_INTERESTED:"Not interested",
 LOOKING_FOR_JOB:"Looking for a job",
 DEBARRED:"Debarred",
 NOT_DECIDED:"Not decided yet",
};
export function afterCollegeOptions(){
 return AFTER_COLLEGE_OUTCOMES.map(value=>({value,label:AFTER_COLLEGE_LABELS[value]}));
}
