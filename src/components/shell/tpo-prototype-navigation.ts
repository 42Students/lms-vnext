import type {ShellNavItem} from "./shell-model";

/** The 42LMS 56-screen HTML specifies exactly eight TPO top-level items.
 * The older actions remain reachable in the corresponding section tabs. */
export const TPO_PROTOTYPE_NAV: readonly ShellNavItem[]=[
 {label:"Home",href:"/tpo/home",shortLabel:"H"},
 {label:"Students",href:"/tpo/students",shortLabel:"S"},
 {label:"Drives",href:"/tpo/placements",shortLabel:"D"},
 {label:"Companies",href:"/tpo/companies/today",shortLabel:"C"},
 {label:"Calendar",href:"/tpo/calendar",shortLabel:"C"},
 {label:"Team",href:"/tpo/team",shortLabel:"T"},
 {label:"Reports",href:"/tpo/reports",shortLabel:"R"},
 {label:"Settings",href:"/tpo/settings",shortLabel:"S"},
];
export const TPO_PROTOTYPE_SECTIONS={
 Students:[
  {label:"All students",href:"/tpo/students"},
  {label:"Who's in placements",href:"/tpo/batches"},
  {label:"To verify",href:"/tpo/verification"},
  {label:"Requests",href:"/tpo/requests"},
  {label:"Announcements",href:"/tpo/announcements"},
 ],
 Drives:[
  {label:"Drives",href:"/tpo/placements"},
  {label:"Drive day",href:"/tpo/drive-day"},
 ],
 Companies:[
  {label:"Today",href:"/tpo/companies/today"},
  {label:"Recruiters",href:"/tpo/recruiters"},
  {label:"Companies",href:"/tpo/companies?directory=1"},
  {label:"Emails",href:"/tpo/recruiters?view=campaigns"},
  {label:"Messages",href:"/tpo/messages?tab=recruiters"},
 ],
 Team:[
  {label:"Chat",href:"/tpo/messages?tab=team"},
  {label:"People",href:"/tpo/settings/team"},
 ],
 Reports:[{label:"Reports",href:"/tpo/reports"}],
 Settings:[
  {label:"Settings",href:"/tpo/settings"},
  {label:"Audit log",href:"/tpo/audit"},
 ],
} as const;

export function tpoPrototypeSectionForPath(pathname:string,tab?:string|null):
 "Home"|"Students"|"Drives"|"Companies"|"Calendar"|"Team"|"Reports"|"Settings"{
 if(pathname==="/tpo/home"||pathname==="/tpo")return "Home";
 if(pathname.startsWith("/tpo/messages")&&tab==="team")return "Team";
 if(/^\/tpo\/(?:students|requests|verification|announcements|batches)(?:\/|$)/.test(pathname))
  return "Students";
 if(/^\/tpo\/(?:placements|drives|drive-day)(?:\/|$)/.test(pathname))
  return "Drives";
 if(/^\/tpo\/(?:companies|recruiters|follow-ups|messages)(?:\/|$)/.test(pathname))
  return "Companies";
 if(pathname.startsWith("/tpo/calendar"))return "Calendar";
 if(pathname.startsWith("/tpo/team")||pathname.startsWith("/tpo/settings/team"))
  return "Team";
 if(pathname.startsWith("/tpo/reports"))return "Reports";
 return "Settings";
}
export function tpoPrototypeSidebarActive(pathname:string,item:Pick<ShellNavItem,"label"|"href">,tab?:string|null):boolean{
 return item.label===tpoPrototypeSectionForPath(pathname,tab);
}
