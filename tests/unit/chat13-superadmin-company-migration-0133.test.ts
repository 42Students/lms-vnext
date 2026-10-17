import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const sql=readFileSync("drizzle/0133_lanes_round_1.sql","utf8");
describe("chat-13 Super Admin company migration registration checks",()=>{
 it("SA-placements-projects-24 registers verification fields and verifier invariant",()=>{
  expect(sql).toContain("ALTER TABLE placement_companies ADD COLUMN IF NOT EXISTS verified_at");
  expect(sql).toContain("verified_by_user_id uuid REFERENCES users");
  expect(sql).toContain("placement_companies_verifier_ck");
 });
 it("SA-placements-projects-26 registers global employer profile fields",()=>{
  for(const field of ["industry varchar(160)","about text","logo_public_url text"])
   expect(sql).toContain("ALTER TABLE placement_companies ADD COLUMN IF NOT EXISTS "+field);
 });
 it("SA-placements-projects-27 registers unique normalized domains with college seed",()=>{
  expect(sql).toContain("CREATE TABLE placement_company_domains");
  expect(sql).toContain("placement_company_domains_lower_domain_uq");
  expect(sql).toContain("INSERT INTO placement_company_domains(company_id,domain,added_by_user_id)");
 });
 it("SA-placements-projects-28 registers alias table and case-insensitive uniqueness",()=>{
  expect(sql).toContain("CREATE TABLE placement_company_aliases");
  expect(sql).toContain("placement_company_aliases_lower_alias_uq");
 });
});
