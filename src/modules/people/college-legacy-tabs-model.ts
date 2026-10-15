/** Legacy lms-dev-2026 college-admin navGroupDefinitions/adminNavGroups copy.
 * Tab hrefs target existing College pages, never foreign-role routes.
 */
export type CollegeLegacyTab = {label:string;href:string};
export type CollegeLegacyGroup = {title:string;tabs:readonly CollegeLegacyTab[]};

export const COLLEGE_LEGACY_GROUPS: readonly CollegeLegacyGroup[] = [
  {title:"Academic Setup",tabs:[
    {label:"Departments",href:"/college/departments"},
    {label:"Programs",href:"/college/programs"},
    {label:"Semesters",href:"/college/semesters"},
    {label:"Semester–Course Mapping",href:"/college/semester-courses"},
    {label:"Batches",href:"/college/batches"},
    {label:"Classes",href:"/college/classes"},
    {label:"Batch Promotion",href:"/college/batch-promotion"},
    {label:"Lecture Halls",href:"/college/lecture-halls"},
    {label:"Electives",href:"/college/electives"},
    {label:"Attendance",href:"/college/attendance"},
  ]},
  {title:"Courses & Content",tabs:[
    {label:"Courses",href:"/college/courses"},
    {label:"Lessons",href:"/college/lessons"},
    {label:"Video",href:"/college/videos"},
    {label:"Resources",href:"/college/resources"},
    {label:"Live Classes",href:"/college/live-classes"},
    {label:"Assignments",href:"/college/assignments"},
    {label:"Quizzes",href:"/college/quizzes"},
    {label:"Progress",href:"/college/course-progress"},
  ]},
  {title:"People",tabs:[
    {label:"Faculty",href:"/college/faculty"},
    {label:"Faculty Assignment",href:"/college/faculty-assignment"},
    {label:"Students",href:"/college/students"},
    {label:"People Directory",href:"/college/people"},
  ]},
  {title:"Placements",tabs:[
    {label:"Drives",href:"/college/placements"},
    {label:"Companies",href:"/college/companies"},
    {label:"Interviews",href:"/college/placements/calendar"},
    {label:"Analytics",href:"/college/hiring-dashboard"},
  ]},
  {title:"Projects",tabs:[
    {label:"Workspaces",href:"/college/projects"},
    {label:"At Risk",href:"/college/projects/at-risk"},
    {label:"Readiness",href:"/college/projects/readiness"},
    {label:"Submissions",href:"/college/projects/submissions"},
    {label:"Templates",href:"/college/projects/templates"},
    {label:"Audit",href:"/college/projects/audit"},
  ]},
];

export function collegeLegacyGroupForPath(pathname: string): CollegeLegacyGroup | null {
  const match = COLLEGE_LEGACY_GROUPS.flatMap(group=>group.tabs.map(tab=>({group,tab})))
    .filter(({tab})=>pathname===tab.href||pathname.startsWith(tab.href+"/"))
    .sort((a,b)=>b.tab.href.length-a.tab.href.length)[0];
  return match?.group ?? null;
}

export function collegeLegacyTabActive(pathname: string, href: string): boolean {
  const matches = (candidate: string) => pathname === candidate || pathname.startsWith(candidate + "/");
  if (!matches(href)) return false;
  return !COLLEGE_LEGACY_GROUPS.some(group => group.tabs.some(tab =>
    tab.href !== href && tab.href.length > href.length &&
    tab.href.startsWith(href + "/") && matches(tab.href)
  ));
}
