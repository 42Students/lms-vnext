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
 const descendant=href!=="/dashboard"&&href!=="/college"&&
   pathname.startsWith(href+"/")&&!(href==="/admin/features"&&featureDetail);
 return exact||descendant||
   (admin&&superAdminGroup!==null&&superAdminGroup===item.label)||
   (college&&collegeGroup!==null&&collegeGroup===item.label)||
   (href==="/admin/module-access"&&featureDetail)||
   (href==="/admin/audit"&&
     (pathname==="/tracker/audit-findings"||pathname.startsWith("/tracker/audit-findings/")))||
   (href==="/admin/projects/templates"&&pathname.startsWith("/admin/projects/"));
}
