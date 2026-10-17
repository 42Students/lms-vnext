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
    {label:"Academic periods",href:"/college/academics"},
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

/** Secondary pages inherit the selected legacy section without adding new tabs. */
export function collegeLegacyNavigationPath(pathname: string): string {
  if (pathname === "/college/groups" || pathname.startsWith("/college/groups/")) {
    return "/college/people";
  }
  if (pathname === "/college/placements/readiness-by-department" ||
      pathname.startsWith("/college/placements/readiness-by-department/")) {
    return "/college/hiring-dashboard";
  }
  return pathname;
}

export function collegeLegacyGroupForPath(pathname: string): CollegeLegacyGroup | null {
  const active = collegeLegacyNavigationPath(pathname);
  const match = COLLEGE_LEGACY_GROUPS.flatMap(group=>group.tabs.map(tab=>({group,tab})))
    .filter(({tab})=>active===tab.href||active.startsWith(tab.href+"/"))
    .sort((a,b)=>b.tab.href.length-a.tab.href.length)[0];
  return match?.group ?? null;
}

export function collegeLegacyTabActive(pathname: string, href: string): boolean {
  const active = collegeLegacyNavigationPath(pathname);
  const matches = (candidate: string) => active === candidate || active.startsWith(candidate + "/");
  if (!matches(href)) return false;
  return !COLLEGE_LEGACY_GROUPS.some(group => group.tabs.some(tab =>
    tab.href !== href && tab.href.length > href.length &&
    tab.href.startsWith(href + "/") && matches(tab.href)
  ));
}

/** Individual project workspaces render their own Summary/Team/Sprints/etc tabs.
 * List-level legacy group tabs must not be duplicated above those detail tabs.
 */
export function collegeProjectWorkspaceOwnsTabs(pathname:string):boolean {
  const prefix="/college/projects/";
  if(!pathname.startsWith(prefix))return false;
  const rest=pathname.slice(prefix.length).split("/").filter(Boolean);
  if(rest.length<1)return false;
  const reserved=new Set(["at-risk","readiness","submissions","templates","audit",
    "reassign-mentor","workspaces"]);
  return !reserved.has(rest[0]!);
}

/** COL-academic-setup-13: six guided setup steps, separate from later utility tabs. */
export function collegeAcademicSetupStep(pathname:string){
 const group=COLLEGE_LEGACY_GROUPS.find(g=>g.title==="Academic Setup");
 const steps=group?.tabs.slice(0,6)??[];
 const step=steps.findIndex(t=>pathname===t.href||pathname.startsWith(t.href+"/"));
 if(step<0)return null;
 return {index:step+1,total:steps.length,title:steps[step]!.label,
  previous:step>0?steps[step-1]:null,
  next:step<steps.length-1?steps[step+1]:null};
}
