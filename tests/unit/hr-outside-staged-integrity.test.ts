import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";

describe("registered recorded-outside schema contract",()=>{
 it("requires the relationship to belong to the recorded college",()=>{
  const sql=readFileSync("drizzle/0079_placement_outside_drive_records.sql","utf8");
  expect(sql).toContain('FOREIGN KEY ("company_relationship_id","college_id")');
  expect(sql).toContain('REFERENCES "public"."placement_company_relationships"("id","college_id")');
  expect(sql.indexOf("outside_drives_relationship_college_parent_uq")).toBeLessThan(sql.indexOf("outside_drives_relationship_college_fk"));
 });
});
