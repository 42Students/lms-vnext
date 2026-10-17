/** Legacy Super Admin navigation links are bookmarks, not authorization grants.
 * Always redirect to the protected modern page rather than rendering legacy data.
 */
export const legacySuperAdminPaths:Readonly<Record<string,string>>={
 departments:"/admin/departments",programs:"/admin/programs",
 semesters:"/admin/semesters","semester-courses":"/admin/semester-courses",
 batches:"/admin/batches",classes:"/admin/classes",
 "batch-promotion":"/admin/batch-promotion",
 "lecture-halls":"/admin/lecture-halls","lecture-hall":"/admin/lecture-halls",
 electives:"/admin/electives",attendance:"/admin/attendance",
 courses:"/admin/courses",lessons:"/admin/lessons",assignments:"/admin/assignments",
 quizzes:"/admin/quizzes","course-progress":"/admin/course-progress",
 teachers:"/admin/faculty",faculty:"/admin/faculty",
 "faculty-assignment":"/admin/faculty-assignment",
 students:"/admin/students",people:"/admin/people",recruiters:"/admin/recruiters",
 hr:"/admin/recruiters",jobs:"/admin/placements/drives",
 drives:"/admin/placements/drives",companies:"/admin/companies",
 calendar:"/admin/placements/calendar",interviews:"/admin/placements/interviews",
 "hiring-dashboard":"/admin/placements/analytics",
 "placement-operations":"/admin/placements",placements:"/admin/placements",
 projects:"/admin/projects","project-templates":"/admin/projects/templates",
};
export function legacySuperAdminDestination(pathSegments:readonly string[],type?:string){
 if(pathSegments.length!==1)return null; // Never forge nested IDs or paths.
 const slug=pathSegments[0]?.toLowerCase()??"";
 if(slug==="lesson-content"){
  const contentType=(type??"video").toLowerCase();
  if(contentType==="video"||contentType==="videos")return "/admin/videos";
  if(contentType==="resources"||contentType==="resource")return "/admin/resources";
  if(contentType==="live-classes"||contentType==="live_class")return "/admin/live-classes";
  return null;
 }
 return legacySuperAdminPaths[slug]??null;
}
