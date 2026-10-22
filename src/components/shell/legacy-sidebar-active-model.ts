import type {ShellNavItem} from "./shell-model";

/** Never allow a broad landing route to highlight a second role's menu row. */
export function legacySidebarItemActive(
 pathname:string,
 item:Pick<ShellNavItem,"label"|"href">,
 superAdminGroup:string|null,
 collegeGroup:string|null,
):boolean{
 const href=item.href;
 const admin=href.startsWith("/admin/");
 const college=href.startsWith("/college/")||href==="/college";
 const featureDetail=pathname.startsWith("/admin/features/");
 const exact=pathname===href;
 const utilityOwners:Record<string,string>={
  "/college/announcements":"/college",
  "/college/domains":"/college/profile",
  "/college/college-profile":"/college/profile",
  "/college/branding":"/college/profile",
  "/college/contacts":"/college/faculty",
 };
 const utilityOwner=Object.entries(utilityOwners).some(([base,owner])=>
   href===owner&&(pathname===base||pathname.startsWith(base+"/")));
 /** Recruiter jobs, results, and conversations have legacy alias routes outside
  * the five top-level /hr sidebar paths. Keep the owning item highlighted. */
 const recruiterDriveArea=href==="/hr/drives"&&(
   pathname==="/hr/placements"||pathname.startsWith("/hr/placements/")||
   pathname==="/hr/round-results"||
   pathname==="/recruiter/drives"||pathname.startsWith("/recruiter/drives/")
 );
 const recruiterMessagesArea=href==="/hr/conversations"&&(
   pathname==="/hr/messages"||pathname.startsWith("/hr/messages/")||
   pathname==="/recruiter/messages"||pathname.startsWith("/recruiter/messages/")
 );
 /** Historical recruiter entry points re-export canonical HR pages. Their
  * active states must follow the destination, not the alias in the URL. */
 const recruiterAliasOwners:Readonly<Record<string,string>>={
  "/recruiter":"/hr/home",
  "/recruiter/home":"/hr/home",
  "/recruiter/calendar":"/hr/calendar",
  "/recruiter/company":"/hr/company",
 };
 const recruiterAlias=Object.entries(recruiterAliasOwners).some(([alias,owner])=>
   href===owner&&(pathname===alias||(alias!=="/recruiter"&&pathname.startsWith(alias+"/"))));
 const descendant=href!=="/dashboard"&&href!=="/college"&&
   pathname.startsWith(href+"/")&&!(href==="/admin/features"&&featureDetail);
 return exact||descendant||utilityOwner||recruiterDriveArea||recruiterMessagesArea||recruiterAlias||
   (href==="/tpo/recruiters"&&(pathname==="/tpo/companies"||pathname.startsWith("/tpo/companies/")))||
   (admin&&superAdminGroup!==null&&superAdminGroup===item.label)||
   (college&&collegeGroup!==null&&collegeGroup===item.label)||
   (href==="/admin/module-access"&&featureDetail)||
   (href==="/admin/audit"&&
     (pathname==="/tracker/audit-findings"||pathname.startsWith("/tracker/audit-findings/")))||
   (href==="/admin/projects/templates"&&pathname.startsWith("/admin/projects/"));
}
