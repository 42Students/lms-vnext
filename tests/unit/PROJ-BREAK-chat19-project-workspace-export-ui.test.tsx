import {describe,expect,it} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {ProjectAdminWorkspacePageExport} from "@/components/projects/project-admin-workspace-page-export";

describe("PROJ-BREAK-EXPORT-02: project export UI only permits authorized visible rows",()=>{
 it("never offers a clickable CSV download for an empty authorized page",()=>{
  const html=renderToStaticMarkup(<ProjectAdminWorkspacePageExport items={[]}/>);
  const button=html.match(/<button\b[^>]*>Export this page<\/button>/)?.[0];
  expect(button).toBeDefined();
  expect(button).toMatch(/\sdisabled(?=[\s=>])/);
  expect(button).toContain("min-h-11");
 });
 it("enables an exported page without any all-tenants lookup or hidden row download link",()=>{
  const html=renderToStaticMarkup(<ProjectAdminWorkspacePageExport items={[{
   id:"11111111-1111-4111-8111-111111111111",title:"IIT Dharwad Project",
   summary:null,status:"ACTIVE",mentorName:"Mentor",memberCount:4,
   progressPercent:25,riskReasons:[],updatedAt:new Date("2026-10-18T12:00:00.000Z"),
  }]}/>);
  const button=html.match(/<button\b[^>]*>Export this page<\/button>/)?.[0];
  expect(button).toBeDefined();
  // Button retains CSS disabled:* classes in BOTH states; only the actual HTML
  // disabled attribute determines whether the action can be invoked.
  expect(button).not.toMatch(/\sdisabled(?=[\s=>])/);
  expect(button).toContain("min-h-11");
  expect(html).not.toContain("href=/api/");
 });
});
