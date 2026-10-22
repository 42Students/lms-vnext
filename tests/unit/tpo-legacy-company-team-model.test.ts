import {describe,expect,it} from "vitest";
import {legacyCompanyTeamName,uniqueLegacyCompanyTeamId}
 from "@/modules/placements/tpo-legacy-company-team-model";

describe("historic Company Team name-keyed navigation",()=>{
 const companies=[{id:"c1",name:"  Core   Apps "},{id:"c2",name:"Other Co"}];
 it("normalizes old names without guessing an unrelated company",()=>{
  expect(legacyCompanyTeamName(" CORE apps ")).toBe("core apps");
  expect(uniqueLegacyCompanyTeamId(companies,"core apps")).toBe("c1");
  expect(uniqueLegacyCompanyTeamId(companies,"missing")).toBeNull();
 });
 it("fails closed on duplicate and malicious or invalid names",()=>{
  expect(uniqueLegacyCompanyTeamId([...companies,{id:"c3",name:"core apps"}],"Core Apps")).toBeNull();
  expect(uniqueLegacyCompanyTeamId(companies,"foo\\nbar")).toBeNull();
  expect(uniqueLegacyCompanyTeamId(companies,["Core Apps"])).toBeNull();
  expect(uniqueLegacyCompanyTeamId(companies,"")).toBeNull();
 });
});
