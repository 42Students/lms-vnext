import { z } from "zod";

const searchSchema = z.string().trim().max(100).catch("");
/** Search only the project and its own authorized team summary. No user lookup. */
export function learnerProjectMatchesSearch(
  project: {title:string;slug:string;summary:string|null;courseLabel?:string|null},
  mentorName: string|null,
  input: unknown,
): boolean {
  const needle=searchSchema.parse(input).toLocaleLowerCase("en-IN");
  if(!needle)return true;
  return [project.title, project.slug, project.summary??"", project.courseLabel??"", mentorName??""]
    .some(value=>value.toLocaleLowerCase("en-IN").includes(needle));
}
