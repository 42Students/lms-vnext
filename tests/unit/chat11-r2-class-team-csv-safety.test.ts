import {expect,it} from "vitest";
import {exportClassTeamsCsv} from "@/modules/projects/class-team-csv-export";
it("neutralizes formulas even with leading invisible Unicode characters",()=>{
 const csv=exportClassTeamsCsv([{name:"\u200B=2+2",membershipIds:["m1"]}],new Map([["m1","\uFEFF+1+2"]]));
 expect(csv).toContain("\"'\u200B=2+2\"");
 expect(csv).toContain("\"'\uFEFF+1+2\"");
 expect(csv.endsWith("\r\n")).toBe(true);
});
it("quotes embedded spreadsheet delimiters without changing literal text",()=>{
 const csv=exportClassTeamsCsv([{name:'Team "West", A',membershipIds:["m1"]}],new Map([["m1","REG-10"]]));
 expect(csv).toContain('"Team ""West"", A"');
 expect(csv).toContain('"REG-10"');
});
