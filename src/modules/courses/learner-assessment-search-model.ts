import { z } from "zod";
const searchSchema=z.string().trim().max(100);
export function normalizeLearnerAssessmentSearch(raw:unknown):string{
 if(typeof raw!=="string")return "";
 return searchSchema.safeParse(raw.trim().slice(0,100)).data ?? "";
}
export function learnerAssessmentMatchesSearch(
  item:{title:string;description:string|null;lessonName:string;courseName:string;courseCode:string},
  query:unknown,
):boolean {
  const needle=normalizeLearnerAssessmentSearch(query).toLocaleLowerCase("en-IN");
  if(!needle)return true;
  return [item.title,item.description??"",item.lessonName,item.courseName,item.courseCode]
    .some(value=>value.toLocaleLowerCase("en-IN").includes(needle));
}
