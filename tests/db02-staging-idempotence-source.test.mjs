import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const sql=readFileSync("scripts/sql/db02-academic-progression-and-rooms-staging.sql","utf8");
test("db02 staging can be applied after registered cohort and section migrations",()=>{
  for(const table of ["cohorts","sections","course_offerings"]){
    assert.match(sql,new RegExp("ALTER TABLE "+table+"[\\s\\S]*?ADD COLUMN IF NOT EXISTS"));
  }
  for(const column of ["start_date","end_date","minimum_capacity","program_term_id","program_term_course_id"]){
    assert.match(sql,new RegExp("ADD COLUMN IF NOT EXISTS "+column+"\\b"));
  }
  for(const constraint of [
    "db02_course_offerings_credits_ck","course_offerings_curriculum_ref_ck",
    "cohorts_lifecycle_date_order_ck","sections_capacity_ck",
    "sections_minimum_capacity_ck","sections_capacity_range_ck",
    "sections_lifecycle_date_order_ck",
  ]){
    assert.match(sql,new RegExp("conname = '"+constraint+"'"));
    assert.match(sql,new RegExp("ADD CONSTRAINT "+constraint+"\\b"));
  }
  assert.match(sql,/CREATE EXTENSION IF NOT EXISTS btree_gist/);
  assert.match(sql,/DROP CONSTRAINT IF EXISTS section_schedule_events_hall_no_overlap_excl/);
});
