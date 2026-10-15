import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";

describe("staged recorded-outside schema contract",()=>{
 it("requires the relationship to belong to the recorded college",()=>{
  const sql=readFileSync("docs/proposed-migrations/recorded-outside-drives.sql","utf8");
  expect(sql).toContain("foreign key (company_relationship_id,college_id)");
  expect(sql).toContain("references placement_company_relationships(id,college_id)");
  expect(sql).toContain("outside_drives_relationship_college_parent_uq");
 });
});
