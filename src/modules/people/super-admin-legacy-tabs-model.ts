import {COLLEGE_LEGACY_GROUPS} from "./college-legacy-tabs-model";

export type SuperAdminLegacyTab = Readonly<{label:string;href:string}>;
export type SuperAdminLegacyGroup = Readonly<{title:string;tabs:readonly SuperAdminLegacyTab[]}>;


/** Reuse verbatim College Admin shared group names, remapping only the account prefix. */
function sharedGroup(index:number):SuperAdminLegacyGroup {
  const shared=COLLEGE_LEGACY_GROUPS[index];
  if(!shared)throw new Error("Unknown legacy navigation group");
  return {title:shared.title,tabs:shared.tabs.map(tab=>({
    label:tab.label,href:tab.href.replace(/^\/college\//,"/admin/"),
  }))};
}
/** lms-dev-2026 Super Admin grouped navigation. Add groups in the audit's order. */
export const SUPER_ADMIN_LEGACY_GROUPS: readonly SuperAdminLegacyGroup[] = [
  {title:"Tenant Setup",tabs:[
    {label:"Tenant Setup",href:"/admin/tenants"},
    {label:"Organizations",href:"/admin/organizations"},
    {label:"Colleges",href:"/admin/colleges"},
  ]},
  sharedGroup(0),
  sharedGroup(1),
  sharedGroup(2),
  {title:"Placements",tabs:[
    {label:"Drives",href:"/admin/placements"},
    {label:"Companies",href:"/admin/companies"},
    {label:"Interviews",href:"/admin/placements/calendar"},
    {label:"Analytics",href:"/admin/placements/analytics"},
    {label:"Recruiter accounts",href:"/admin/recruiters"},
    {label:"Announcements",href:"/admin/announcements"},
  ]},
  {title:"Projects",tabs:[
    {label:"Templates",href:"/admin/projects/templates"},
    {label:"Workspaces",href:"/admin/projects"},
    {label:"At Risk",href:"/admin/projects/at-risk"},
    {label:"Readiness",href:"/admin/projects/readiness"},
    {label:"Submissions",href:"/admin/projects/submissions"},
    {label:"Audit",href:"/admin/projects/audit"},
  ]},
];

export function superAdminLegacyNavigationPath(pathname:string):string {
  // The retained /admin/hr implementation serves the Recruiter accounts tab.
  if(pathname==="/admin/hr"||pathname.startsWith("/admin/hr/"))
    return "/admin/recruiters";
  if(pathname==="/admin/domains"||pathname.startsWith("/admin/domains/"))
    return "/admin/tenants";
  if(pathname==="/admin/academics"||pathname.startsWith("/admin/academics/"))
    return "/admin/departments";
  if(pathname==="/admin/placements/hiring"||pathname.startsWith("/admin/placements/hiring/"))
    return "/admin/placements/analytics";
  if(pathname==="/admin/placements/interviews"||
     pathname.startsWith("/admin/placements/interviews/"))
    return "/admin/placements/calendar";
  if(pathname==="/admin/projects/reassign-mentor" ||
     pathname.startsWith("/admin/projects/workspaces/"))return "/admin/projects";
  return pathname;
}

/** Project/template detail surfaces own their inner section strips. */
export function superAdminProjectDetailPath(pathname:string):boolean {
  if(pathname.startsWith("/admin/projects/templates/"))
    return pathname!=="/admin/projects/templates";
  if(!pathname.startsWith("/admin/projects/"))return false;
  const first=pathname.slice("/admin/projects/".length).split("/")[0];
  return Boolean(first&&!["at-risk","readiness","submissions","audit",
    "reassign-mentor","workspaces","templates"].includes(first));
}
export function superAdminLegacyGroupForPath(pathname:string):SuperAdminLegacyGroup|null {
  if(superAdminProjectDetailPath(pathname))return null;
  const path=superAdminLegacyNavigationPath(pathname);
  const found=SUPER_ADMIN_LEGACY_GROUPS.flatMap(group=>group.tabs.map(tab=>({group,tab})))
    .filter(({tab})=>path===tab.href||path.startsWith(tab.href+"/"))
    .sort((a,b)=>b.tab.href.length-a.tab.href.length)[0];
  return found?.group??null;
}
export function superAdminLegacyTabActive(pathname:string,href:string):boolean {
  if(superAdminProjectDetailPath(pathname))return false;
  const path=superAdminLegacyNavigationPath(pathname);
  if(path!==href&&!path.startsWith(href+"/"))return false;
  return !SUPER_ADMIN_LEGACY_GROUPS.some(group=>group.tabs.some(tab=>
    tab.href!==href&&tab.href.startsWith(href+"/")&&
    (path===tab.href||path.startsWith(tab.href+"/"))
  ));
}
