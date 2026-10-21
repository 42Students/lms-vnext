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
 projects:"/admin/projects/templates","project-templates":"/admin/projects/templates",
};
/**
 * Static historical bookmarks can map without database access. A template or
 * workspace ID must be translated and authorized by the server route's scoped
 * lookup; NEVER concatenate untrusted dynamic segments into canonical paths.
 */
export function legacySuperAdminDestination(
 pathSegments:readonly string[],
 type?:string,
):string|null {
 if(pathSegments.length===0)return null;
 const normalized=pathSegments.map(segment=>segment.toLowerCase());
 const slug=normalized[0]??"";
 if(slug==="projects"&&normalized.length===2){
  switch(normalized[1]){
   case "at-risk":return "/admin/projects/at-risk";
   case "audit":return "/admin/projects/audit";
   case "readiness":return "/admin/projects/readiness";
   case "templates":return "/admin/projects/templates";
   case "workspaces":return "/admin/projects";
   default:return null;
  }
 }
 if(pathSegments.length!==1)return null;
 if(slug==="lesson-content"){
  const contentType=(type??"video").toLowerCase();
  if(contentType==="video"||contentType==="videos")return "/admin/videos";
  if(contentType==="resources"||contentType==="resource")return "/admin/resources";
  if(contentType==="live-classes"||contentType==="live_class")return "/admin/live-classes";
  return null;
 }
 return legacySuperAdminPaths[slug]??null;
}
