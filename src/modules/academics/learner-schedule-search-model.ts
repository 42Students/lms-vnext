import {z} from "zod";
const querySchema=z.string().trim().max(100).catch("");
type Event={title:string;courseName:string|null;courseCode:string|null;
 facultyName:string|null;location:string|null;sectionName:string};
/** Filter only server-scoped authorized sessions without an additional lookup. */
export function filterLearnerScheduleBySearch<T extends Event>(
 events:readonly T[],queryInput:unknown,
):T[]{
 const query=querySchema.parse(queryInput).toLocaleLowerCase("en-IN");
 if(!query)return [...events];
 return events.filter(event=>[
  event.title,event.courseName,event.courseCode,event.facultyName,event.location,event.sectionName,
 ].some(field=>field?.toLocaleLowerCase("en-IN").includes(query)));
}
