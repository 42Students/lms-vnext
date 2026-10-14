import { z } from "zod";
const searchSchema=z.string().trim().max(100).catch("");
export function learnerAssessmentMatchesSearch(
  item:{title:string;description:string|null;lessonName:string;courseName:string;courseCode:string},
  query:unknown,
):boolean {
  const needle=searchSchema.parse(query).toLocaleLowerCase("en-IN");
  if(!needle)return true;
  return [item.title,item.description??"",item.lessonName,item.courseName,item.courseCode]
    .some(value=>value.toLocaleLowerCase("en-IN").includes(needle));
}
