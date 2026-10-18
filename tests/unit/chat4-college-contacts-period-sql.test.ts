import {describe,expect,it,vi} from "vitest";
import {PgDialect} from "drizzle-orm/pg-core";
import {collegeContactAcademicScope} from "@/modules/people/college-contacts-academic-scope";

vi.mock("@/db/client",async()=>{
 const {drizzle}=await import("drizzle-orm/node-postgres");
 const {Pool}=await import("pg");
 // SQL construction only: query rendering never opens a PostgreSQL connection.
 const pool=new Pool({max:1});
 return {getDb:()=>drizzle(pool)};
});
const college="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const section="33333333-3333-4333-8333-333333333333";

describe("College Admin contacts academic-period tenant isolation",()=>{
 it("COL-people-contacts-PERIOD-01 active class requires persisted period owned by current college",()=>{
  const query=new PgDialect().sqlToQuery(collegeContactAcademicScope(college).activeClass);
  expect(query.sql).toContain('"academic_periods"');
  expect(query.sql).toContain('"academic_periods"."id" = "sections"."academic_period_id"');
  expect(query.sql).toContain('"academic_periods"."college_id"');
  expect(query.params).toContain(college);
  expect(new PgDialect().sqlToQuery(collegeContactAcademicScope(other).activeClass).params)
   .toContain(other);
 });
 it("COL-people-contacts-PERIOD-02 section-scoped and combined placement filters bind the same college as the period",()=>{
  const scope=collegeContactAcademicScope(college);
  for(const expression of [
   scope.inSection(section),
   scope.inCombinedPlacement({sectionId:section,classPresence:"ASSIGNED"}),
   scope.inCombinedPlacement({classPresence:"NONE"}),
  ]){
   const compiled=new PgDialect().sqlToQuery(expression);
   expect(compiled.sql).toContain('"academic_periods"');
   expect(compiled.sql).toContain('"academic_periods"."college_id"');
   expect(compiled.params).toContain(college);
  }
  const selected=new PgDialect().sqlToQuery(scope.inSection(section));
  expect(selected.params).toContain(section);
 });
 it("COL-people-contacts-PERIOD-03 unscoped program and cohort choices retain an explicit department tenant predicate",()=>{
  const scope=collegeContactAcademicScope(college);
  for(const expression of [
   scope.inProgram("44444444-4444-4444-8444-444444444444"),
   scope.inCohort("55555555-5555-4555-8555-555555555555"),
  ]){
   const compiled=new PgDialect().sqlToQuery(expression);
   expect(compiled.sql).toContain('"departments"."college_id"');
   expect(compiled.params).toContain(college);
  }
 });
});