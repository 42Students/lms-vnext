import {readFileSync} from "node:fs";
import {strict as assert} from "node:assert";
import test from "node:test";

const journal=JSON.parse(readFileSync("drizzle/meta/_journal.json","utf8"));
const stage=readFileSync("scripts/sql/db02-academic-progression-and-rooms-staging.sql","utf8");
const tag="0303_db02_academic_timetable_registered";
const registered=readFileSync("drizzle/"+tag+".sql","utf8");
const snapshot=JSON.parse(readFileSync("drizzle/meta/0303_snapshot.json","utf8"));

test("DB005 canonical stage is part of numbered migration journal, not a runtime overlay",()=>{
 const entry=journal.entries.find(e=>e.tag===tag);
 assert.ok(entry);
 assert.equal(entry.idx,303);
 assert.equal(entry.breakpoints,true);
 assert.equal(snapshot.prevId,
  JSON.parse(readFileSync("drizzle/meta/0302_snapshot.json","utf8")).id);
 assert.ok(registered.includes("program_term_id uuid"));
 assert.ok(registered.includes("cohort_progression_state"));
 assert.ok(registered.includes("cohort_progression_events"));
 assert.ok(registered.includes("section_schedule_events_hall_no_overlap_excl"));
 assert.ok(registered.includes("db02_guard_lecture_hall_archive"));
 assert.ok(registered.includes("faculty_course_associations"));
 assert.ok(registered.includes("db02_program_enrollment_reactivation_role_guard"));
 assert.match(registered,/--> statement-breakpoint/);
 assert.ok((registered.match(/--> statement-breakpoint/g)||[]).length>=200);
});
test("DB005 additive greenfield migration fails closed on unknown vNext offering term mapping",()=>{
 assert.match(registered,/existing vNext offerings need explicit program-term mapping/);
 assert.match(registered,/SELECT 1 FROM course_offerings WHERE program_term_id IS NULL/);
 assert.match(registered,/ALTER COLUMN program_term_id SET NOT NULL/);
 assert.doesNotMatch(registered,/DELETE FROM (?:users|college_memberships|course_offerings)\b/i);
 assert.match(stage,/DB02 staging proposal ONLY/);
});

test("DB005 registered compatibility safely binds omitted term without bypassing explicit source checks",()=>{
 assert.match(registered,/CREATE TRIGGER compat_course_offering_current_term/);
 assert.match(registered,/v_course_college IS DISTINCT FROM v_college/);
 assert.match(registered,/current_term_number/);
 assert.match(registered,/IF NEW.program_term_id IS NOT NULL THEN RETURN NEW/);
 assert.match(registered,/ON CONFLICT \(program_term_id,course_id\) DO NOTHING/);
 assert.match(registered,/Current course curriculum conflicts with CORE offering/);
});
