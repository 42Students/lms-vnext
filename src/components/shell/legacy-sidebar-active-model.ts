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
 const descendant=href!=="/dashboard"&&href!=="/college"&&
   pathname.startsWith(href+"/")&&!(href==="/admin/features"&&featureDetail);
 return exact||descendant||utilityOwner||
   (admin&&superAdminGroup!==null&&superAdminGroup===item.label)||
   (college&&collegeGroup!==null&&collegeGroup===item.label)||
   (href==="/admin/module-access"&&featureDetail)||
   (href==="/admin/audit"&&
     (pathname==="/tracker/audit-findings"||pathname.startsWith("/tracker/audit-findings/")))||
   (href==="/admin/projects/templates"&&pathname.startsWith("/admin/projects/"));
}
