import {describe,expect,it} from "vitest";
import {exportClassTeamsCsv} from "@/modules/projects/class-team-csv-export";

const membership="11111111-1111-4111-8111-111111111111";
const team=(name:string)=>[{name,membershipIds:[membership]}];

describe("PROJ-BREAK-TEAM-CSV-02: scoped class team exports cannot execute spreadsheet formulas",()=>{
 it.each([
   "\u034F=HYPERLINK(1)",
   "\u180E+SUM(1)",
   "\u2060@IMPORT(1)",
   "\u200D-CMD(1)",
   "\uFEFF=1+2",
   "\u2028=HYPERLINK(1)",
   "\u2029+SUM(1)",
   "\u00A0=1",
   "\t\r\n=1+2",
 ])("neutralizes invisible Unicode formula prefix %j",name=>{
   const csv=exportClassTeamsCsv(team(name),new Map([[membership,"ROLL-01"]]));
   expect(csv).toContain("\"'"+name+"\"");
   expect(csv).toContain("\""+membership+"\"");
 });
 it("also escapes untrusted roll labels, not only workspace/team names",()=>{
   const csv=exportClassTeamsCsv(team("Authorized team"),new Map([
    [membership,"\u2060=HYPERLINK(\"https://invalid.example\")"],
   ]));
   expect(csv).toContain('"Authorized team"');
   expect(csv).toContain("\"'\u2060=HYPERLINK(\"\"https://invalid.example\"\")\"");
 });
 it("keeps negative-looking names safe and preserves normal literal text",()=>{
   expect(exportClassTeamsCsv(team("-Team formula"),new Map())).toContain("\"'-Team formula\"");
   expect(exportClassTeamsCsv(team("Team A"),new Map())).toContain('"Team A"');
 });
 it("does not mutate authorized input groups or pull rows beyond the supplied page",()=>{
   const one=team("Authorized team");
   const original=JSON.stringify(one);
   const csv=exportClassTeamsCsv(one,new Map([[membership,"R1"],["hidden","DO NOT EXPORT"]]));
   expect(JSON.stringify(one)).toBe(original);
   expect(csv).not.toContain("hidden");
   expect(csv).not.toContain("DO NOT EXPORT");
   expect(csv.split("\r\n")).toHaveLength(3);
 });
});
