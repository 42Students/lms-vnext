import {describe,expect,it} from "vitest";
import {legacyWorkspaceSummaryQuery} from "@/modules/projects/legacy-workspace-summary-query";

describe("G2-7-009-001: old workspace deep links",()=>{
 it("preserves both known template state and future non-id query keys",()=>{
  const query=legacyWorkspaceSummaryQuery({
   from:"templates",reason:"review",openTemplate:"1",page:"0",
   search:"roadmap",view:"board",custom:["first","second"],workspaceId:"skip",
  });
  const values=new URLSearchParams(query);
  expect(values.get("from")).toBe("templates");
  expect(values.get("reason")).toBe("review");
  expect(values.get("openTemplate")).toBe("1");
  expect(values.get("page")).toBe("0");
  expect(values.get("search")).toBe("roadmap");
  expect(values.get("view")).toBe("board");
  expect(values.getAll("custom")).toEqual(["first","second"]);
  expect(values.has("workspaceId")).toBe(false);
 });
 it("drops identity overrides, unsafe characters and invalid template prompts",()=>{
  const values=new URLSearchParams(legacyWorkspaceSummaryQuery({
   id:"other",workspaceId:"wrong",openTemplate:"0",
   from:"a<b",reason:"\u0001",safe:"back to list",
  }));
  expect(values.toString()).toBe("safe=back+to+list");
 });
});
