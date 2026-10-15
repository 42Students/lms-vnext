export type SuperAdminLegacyTab = Readonly<{label:string;href:string}>;
export type SuperAdminLegacyGroup = Readonly<{title:string;tabs:readonly SuperAdminLegacyTab[]}>;

/** lms-dev-2026 Super Admin grouped navigation. Add groups in the audit's order. */
export const SUPER_ADMIN_LEGACY_GROUPS: readonly SuperAdminLegacyGroup[] = [
  {title:"Tenant Setup",tabs:[
    {label:"Tenant Setup",href:"/admin/tenants"},
    {label:"Organizations",href:"/admin/organizations"},
    {label:"Colleges",href:"/admin/colleges"},
  ]},
];

export function superAdminLegacyNavigationPath(pathname:string):string {
  return pathname;
}
export function superAdminLegacyGroupForPath(pathname:string):SuperAdminLegacyGroup|null {
  const path=superAdminLegacyNavigationPath(pathname);
  const found=SUPER_ADMIN_LEGACY_GROUPS.flatMap(group=>group.tabs.map(tab=>({group,tab})))
    .filter(({tab})=>path===tab.href||path.startsWith(tab.href+"/"))
    .sort((a,b)=>b.tab.href.length-a.tab.href.length)[0];
  return found?.group??null;
}
export function superAdminLegacyTabActive(pathname:string,href:string):boolean {
  const path=superAdminLegacyNavigationPath(pathname);
  if(path!==href&&!path.startsWith(href+"/"))return false;
  return !SUPER_ADMIN_LEGACY_GROUPS.some(group=>group.tabs.some(tab=>
    tab.href!==href&&tab.href.startsWith(href+"/")&&
    (path===tab.href||path.startsWith(tab.href+"/"))
  ));
}
