import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { topbarCommands, topbarConfigForPath, topbarInitials, topbarSearchDestinations } from
  "@/components/shell/topbar/portal-config";
import type { ShellNavItem } from "@/components/shell/shell-model";

const items: ShellNavItem[] = [
  {label:"Home",href:"/tpo/home",shortLabel:"H"},
  {label:"Messages",href:"/tpo/messages",shortLabel:"M"},
  {label:"Students",href:"/tpo/students",shortLabel:"S"},
  {label:"Courses",href:"/teacher/courses",shortLabel:"C"},
  {label:"Projects",href:"/mentor/projects",shortLabel:"P"},
  {label:"Companies",href:"/admin/companies",shortLabel:"C"},
  {label:"Messages",href:"/hr/conversations",shortLabel:"M"},
];
const read = (p: string) => readFileSync(p,"utf8");

describe("chat-13 legacy header portal navigation and measured shell values",()=>{
 it("TOPBAR-01 keeps distinct portal placeholder/search/quick-create paths",()=>{
   expect(topbarConfigForPath("/tpo/home")).toMatchObject({
     portal:"tpo",placeholder:"Find a student, recruiter or company",
     newHref:"/tpo/placements/new",messagesHref:"/tpo/messages",
     notificationsHref:"/tpo/notifications",
   });
   expect(topbarConfigForPath("/admin/placements/analytics").newHref).toBe("/admin/placements/new");
   expect(topbarConfigForPath("/admin/projects/submissions").newHref).toBe("/admin/projects/workspaces/new");
   expect(topbarConfigForPath("/admin/academics").newHref).toBe("/admin/tenants/create");
   expect(topbarConfigForPath("/college/projects").newHref).toBe("/college/projects/create");
   expect(topbarConfigForPath("/college/classes").newHref).toBeNull();
   expect(topbarConfigForPath("/hr/drives").newHref).toBe("/hr/drives/new");
   expect(topbarConfigForPath("/learn/courses").newHref).toBeNull();
   expect(topbarConfigForPath("/teacher/courses").newHref).toBeNull();
 });
 it("TOPBAR-02 never offers TPO items in Faculty command search or foreign portals",()=>{
   expect(topbarCommands("/tpo/home",items).map(x=>x.href)).toEqual([
     "/tpo/home","/tpo/messages","/tpo/students",
   ]);
   expect(topbarCommands("/teacher/courses",items).map(x=>x.href)).toEqual([
     "/teacher/courses",
   ]);
   expect(topbarCommands("/admin/companies",items).map(x=>x.href)).toEqual([
     "/admin/companies",
   ]);
 });
 it("TOPBAR-02B routes TPO and Admin global text to supported scoped directories, not an unscoped aggregate",()=>{
   expect(topbarSearchDestinations("/tpo/home"," Acme & Co ")).toEqual([
     {label:"Search students",href:"/tpo/students?q=Acme%20%26%20Co"},
     {label:"Search recruiter leads",href:"/tpo/recruiters?q=Acme%20%26%20Co"},
     {label:"Search companies",href:"/tpo/companies?search=Acme%20%26%20Co"},
   ]);
   expect(topbarSearchDestinations("/admin/companies","Acme")).toEqual([
     {label:"Search people",href:"/admin/people/directory?q=Acme"},
     {label:"Search companies",href:"/admin/companies?q=Acme"},
     {label:"Search placement drives",href:"/admin/placements/drives?q=Acme"},
     {label:"Search project workspaces",href:"/admin/projects?search=Acme"},
   ]);
   expect(topbarSearchDestinations("/hr/drives","Jobs")).toEqual([
     {label:"Search drives",href:"/hr/drives?q=Jobs"},
     {label:"Search conversations",href:"/hr/conversations?q=Jobs"},
   ]);
   expect(topbarSearchDestinations("/college/courses","Mathematics")).toEqual([
     {label:"Search students",href:"/college/students?q=Mathematics"},
     {label:"Search courses",href:"/college/courses?q=Mathematics"},
   ]);
   expect(topbarSearchDestinations("/teacher/courses","Acme")).toEqual([]);
   expect(topbarSearchDestinations("/tpo/home","  ")).toEqual([]);
 });
 it("TOPBAR-03 derives circular initials without showing arbitrary IDs",()=>{
   expect(topbarInitials("Alice.Doe@example.edu")).toBe("AD");
   expect(topbarInitials("phanindra@example.edu")).toBe("PH");
   expect(topbarInitials("6931-7af3-55ab")).toBe("42");
   expect(topbarInitials("opaque-oauth-user-id", "Super Admin")).toBe("SA");
 });
 it("TOPBAR-04 replaces only the app header slot, keeping the sidebar and drawer",()=>{
   const shell=read("src/components/shell/app-shell.tsx");
   expect(shell).toContain("<LegacyTopbar");
   expect(shell).toContain("<SidebarNav items={navigation}");
   expect(shell).not.toContain("<header className=");
   expect(shell).not.toContain("<AccountActions ");
   const topbar=read("src/components/shell/topbar/legacy-topbar.tsx");
   expect(topbar).toContain("<MobileNavigation items={navigation}");
   expect(topbar).toContain("<TopbarCommandSearch key={pathname} items={navigation}");
   expect(topbar).toContain("<TopbarNotifications key={config.portal} config={config}");
   expect(topbar).toContain("<TopbarAccountMenu");
 });
 it("TOPBAR-05 precisely specifies the old white, 68px and 36px actions",()=>{
   const css=read("src/components/shell/topbar/topbar.module.css");
   for(const value of ["height: 68px","min-height: 68px","padding: 0 20px",
     "background: var(--lms-white)","1px solid var(--lms-header-border)",
     "box-shadow: var(--lms-header-shadow)","width:291px",
     "height:36px","border-radius:var(--lms-control-radius)",
     "background:var(--lms-button-primary)",
     "color:var(--lms-white)","background:var(--topbar-unread)"])
     expect(css).toContain(value);
 });
});
