/** Legacy TPO palette's explicit "go to" page command; never infer a
 * destination URL from arbitrary input or expose cross-portal routes. */
export const TPO_GO_TO_PAGES=[
 {label:"Home",href:"/tpo/home"},
 {label:"Students",href:"/tpo/students"},
 {label:"Placements",href:"/tpo/batches"},
 {label:"Verify",href:"/tpo/verification"},
 {label:"Requests",href:"/tpo/requests"},
 {label:"Announcements",href:"/tpo/announcements"},
 {label:"Drives",href:"/tpo/placements"},
 {label:"Engage",href:"/tpo/recruiters"},
 {label:"Companies",href:"/tpo/companies"},
 {label:"Messages",href:"/tpo/messages"},
 {label:"Calendar",href:"/tpo/calendar"},
 {label:"Team",href:"/tpo/team"},
 {label:"Reports",href:"/tpo/reports"},
 {label:"Settings",href:"/tpo/settings"},
 {label:"Audit log",href:"/tpo/audit"},
 {label:"Notifications",href:"/tpo/notifications"},
 {label:"Profile",href:"/tpo/profile"},
] as const;
export function tpoGoToTerm(query:string):string|null{
 const match=/^go\s+to\b\s*(.*)$/i.exec(query.trim());
 return match?match[1]!.trim().toLocaleLowerCase("en-IN"):null;
}
export function tpoGoToPageMatches(query:string){
 const term=tpoGoToTerm(query);
 if(term===null)return [];
 return TPO_GO_TO_PAGES.filter(page=>!term||page.label.toLocaleLowerCase("en-IN").includes(term));
}
