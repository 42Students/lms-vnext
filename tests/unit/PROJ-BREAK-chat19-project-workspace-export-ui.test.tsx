import {describe,expect,it} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {ProjectAdminWorkspacePageExport} from "@/components/projects/project-admin-workspace-page-export";

describe("PROJ-BREAK-EXPORT-02: project export UI only permits authorized visible rows",()=>{
 it("never offers a clickable CSV download for an empty authorized page",()=>{
  const html=renderToStaticMarkup(<ProjectAdminWorkspacePageExport items={[]}/>);
  expect(html).toContain("Export this page");
  expect(html).toContain("disabled");
  expect(html).toContain("min-h-11");
 });
 it("enables an exported page without any all-tenants lookup or hidden row download link",()=>{
  const html=renderToStaticMarkup(<ProjectAdminWorkspacePageExport items={[{
   id:"11111111-1111-4111-8111-111111111111",title:"IIT Dharwad Project",
   summary:null,status:"ACTIVE",mentorName:"Mentor",memberCount:4,
   progressPercent:25,riskReasons:[],updatedAt:new Date("2026-10-18T12:00:00.000Z"),
  }]}/>);
  expect(html).toContain("Export this page");
  expect(html).not.toContain("disabled");
  expect(html).not.toContain("href=/api/");
 });
});
