import {z} from "zod";
export const AFTER_COLLEGE_OUTCOMES=["PLACED","HIGHER_STUDIES","ENTREPRENEURSHIP","GOVERNMENT_EXAMS","OTHER"] as const;
export const afterCollegeOutcomeSchema=z.enum(AFTER_COLLEGE_OUTCOMES);
export const AFTER_COLLEGE_LABELS:Record<(typeof AFTER_COLLEGE_OUTCOMES)[number],string>={PLACED:"Placement",HIGHER_STUDIES:"Higher studies",ENTREPRENEURSHIP:"Entrepreneurship",GOVERNMENT_EXAMS:"Government exams",OTHER:"Other"};
export function afterCollegeOptions(){return AFTER_COLLEGE_OUTCOMES.map(value=>({value,label:AFTER_COLLEGE_LABELS[value]}));}
