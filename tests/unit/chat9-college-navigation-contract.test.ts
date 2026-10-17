import {describe,expect,it} from "vitest";
import {existsSync,readFileSync} from "node:fs";
import {join} from "node:path";
import {collegeAdminItems,getShellNavigation} from "@/components/shell/shell-model";
import {COLLEGE_LEGACY_GROUPS} from "@/modules/people/college-legacy-tabs-model";
import type {RequestContext} from "@/modules/identity/context";

const expected=[
  ["Dashboard","/college"],["Activity Log","/college/activity"],
  ["Academic Setup","/college/departments"],["Courses & Content","/college/courses"],
  ["People","/college/faculty"],["Profile verification","/college/verification"],
  ["Placements","/college/placements"],["Placement cell","/tpo/home"],
  ["Projects","/college/projects"],["Profile","/college/profile"],
] as const;
const ctx:RequestContext={
  user:{id:"staff",identityUid:"staff",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"member",collegeId:"college",organizationId:"org",
    status:"ACTIVE",roles:["COLLEGE_ADMIN"]},recruiter:null,
};
const root=join(process.cwd(),"src/app/(authenticated)");
const routeFile=(href:string)=>join(root,href.replace(/^\//,""),"page.tsx");

describe("legacy College Admin full sidebar + group href contract",()=>{
  it("has exactly the ten legacy labels and exact ordering",()=>{
    expect(collegeAdminItems.map(item=>[item.label,item.href])).toEqual(expected);
    expect(getShellNavigation(ctx).map(item=>[item.label,item.href])).toEqual(expected);
  });
  it("every sidebar href resolves to a registered Next.js page",()=>{
    for(const [label,href] of expected){
      expect(existsSync(routeFile(href)),label+" => "+href).toBe(true);
    }
  });
  it("every visible nested legacy tab resolves to a registered College Admin page",()=>{
    for(const group of COLLEGE_LEGACY_GROUPS){
      for(const tab of group.tabs){
        expect(existsSync(routeFile(tab.href)),group.title+" / "+tab.label).toBe(true);
      }
    }
  });
  it("has the correct placements tabs and only one College Projects strip",()=>{
    expect(COLLEGE_LEGACY_GROUPS.find(g=>g.title==="Placements")?.tabs.map(t=>t.label))
      .toEqual(["Drives","Companies","Interviews","Analytics"]);
    const project=COLLEGE_LEGACY_GROUPS.find(g=>g.title==="Projects")!;
    expect(project.tabs[0]).toEqual({label:"Workspaces",href:"/college/projects"});
    const nav=readFileSync(join(process.cwd(),"src/components/projects/project-admin-nav.tsx"),"utf8");
    expect(nav).toContain('if (basePath === "/college/projects" || basePath === "/admin/projects") return null;');
    const collegeNav=readFileSync(join(process.cwd(),"src/components/college/college-legacy-group-tabs.tsx"),"utf8");
    expect(collegeNav).toContain('>{group.title}</h2>');
  });
  it("links all six formerly orphaned pages from an authorized College page",()=>{
    const anchors=[
      ["college/page.tsx",'/college/announcements'],
      ["college/profile/page.tsx",'/college/domains'],
      ["college/people/manage/page.tsx",'/college/groups'],
      ["college/projects/page.tsx",'/college/projects/reassign-mentor'],
      ["college/attendance/page.tsx",'/college/attendance/departments'],
      ["college/hiring-dashboard/page.tsx",'/college/placements/readiness-by-department'],
    ];
    for(const [source,target] of anchors){
      const code=readFileSync(join(root,source),"utf8");
      expect(code.includes('href="'+target+'"'),source).toBe(true);
      expect(existsSync(routeFile(target)),target).toBe(true);
    }
  });
});
