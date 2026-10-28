import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const sql=fs.readFileSync(path.resolve("drizzle/0075_db09_tpo_collaboration.sql"),"utf8");
const schema=fs.readFileSync(path.resolve("src/db/schema/tpo-collaboration.ts"),"utf8");

function fn(name) {
  const start=sql.indexOf("CREATE FUNCTION "+name+"(");
  assert.notEqual(start,-1,"missing "+name);
  const end=sql.indexOf("\nEND $$;",start);
  assert.notEqual(end,-1,"missing terminator "+name);
  return sql.slice(start,end+8);
}
function trigger(name) {
  const m=sql.match(new RegExp("CREATE TRIGGER "+name+"\\s+([\\s\\S]*?);"));
  assert.ok(m,"missing trigger "+name);
  return m[1];
}
function model(name) {
  const start=schema.indexOf("export const "+name+" = pgTable(");
  assert.notEqual(start,-1,"missing "+name);
  const end=schema.indexOf("\nexport const ",start+1);
  return schema.slice(start,end<0?schema.length:end);
}
const prefs=()=>fn("db09_restrict_tpo_user_preferences_lifecycle");
const saved=()=>fn("db09_restrict_tpo_saved_view_lifecycle");

test("preference data model has exactly five typed booleans with source defaults",()=>{
  const m=model("placementTpoUserPreferences");
  assert.match(m,/boolean\("morning_digest"\)\.notNull\(\)\.default\(false\)/);
  for(const k of ["recruiter_messages","requests","results_ready","follow_ups"])
    assert.match(m,new RegExp('boolean\\("'+k+'"\\)\\.notNull\\(\\)\\.default\\(true\\)'));
});
test("preference identity is a composite college and user key",()=>{
  const m=model("placementTpoUserPreferences");
  assert.match(m,/placement_tpo_user_preferences_pk/);
  assert.match(m,/columns:\s*\[table\.collegeId,\s*table\.userId\]/);
});
test("preference actor membership is rechecked on every INSERT or UPDATE",()=>{
  assert.match(trigger("db09_tpo_user_preferences_scope_guard"),/BEFORE INSERT OR UPDATE\s+ON placement_tpo_user_preferences/);
  assert.match(fn("db09_assert_tpo_user_state_scope"),/db09_has_active_tpo_actor/);
});
test("preference lifecycle trigger covers INSERT UPDATE DELETE",()=>{
  assert.match(trigger("db09_tpo_user_preferences_lifecycle_guard"),/BEFORE INSERT OR UPDATE OR DELETE\s+ON placement_tpo_user_preferences/);
});
test("preference row cannot be deleted",()=>{
  assert.match(prefs(),/IF TG_OP = 'DELETE' THEN[\s\S]*?RAISE EXCEPTION 'TPO user preference record cannot be deleted'/);
});
test("preference tenant and owner are immutable",()=>{
  assert.match(prefs(),/NEW\.college_id IS DISTINCT FROM OLD\.college_id/);
  assert.match(prefs(),/NEW\.user_id IS DISTINCT FROM OLD\.user_id/);
  assert.match(prefs(),/TPO preference owner identity cannot be changed/);
});
test("preference INSERT rejects future timestamps",()=>{
  assert.match(prefs(),/IF TG_OP = 'INSERT' THEN[\s\S]*?NEW\.updated_at > statement_timestamp\(\)/);
});
test("preference UPDATE rejects forged future clock values without rejecting DB-owned monotonic ticks",()=>{
  assert.match(prefs(),/NEW\.updated_at IS DISTINCT FROM OLD\.updated_at[\s\S]*?NEW\.updated_at > statement_timestamp\(\)/);
  assert.doesNotMatch(prefs(),/IF OLD\.updated_at > statement_timestamp\(\)/);
});
test("preference changes compare every source boolean",()=>{
  const block=prefs().match(/IF ROW\(([\s\S]*?)\) IS DISTINCT FROM ROW\(([\s\S]*?)\) THEN/);
  assert.ok(block);
  for(const key of ["morning_digest","recruiter_messages","requests","results_ready","follow_ups"]) {
    assert.match(block[1],new RegExp("NEW\\."+key+"\\b"));
    assert.match(block[2],new RegExp("OLD\\."+key+"\\b"));
  }
});
test("preference mutations receive strictly monotonic database timestamps",()=>{
  assert.match(prefs(),/NEW\.updated_at := GREATEST\(\s*clock_timestamp\(\), OLD\.updated_at \+ interval '1 microsecond'\s*\)/);
});
test("no-op preference updates preserve timestamp",()=>{
  assert.match(prefs(),/ELSE\s+NEW\.updated_at := OLD\.updated_at;/);
});
test("preference trigger returns NEW for safe mutations",()=>{
  assert.match(prefs(),/RETURN NEW;\s*END \$\$;$/);
});
test("saved views contain owner scope name filters and creation timestamp",()=>{
  const m=model("placementTpoSavedViews");
  for(const k of ["college_id","user_id","scope","name","filters","created_at"])
    assert.ok(m.includes('"'+k+'"'),k);
});
test("saved views retain tenant/user scoped insert guard",()=>{
  assert.match(trigger("db09_tpo_saved_views_scope_guard"),/BEFORE INSERT OR UPDATE OF college_id,user_id\s+ON placement_tpo_saved_views/);
});
test("saved views have independent lifecycle trigger for every UPDATE",()=>{
  assert.match(trigger("db09_tpo_saved_views_lifecycle_guard"),/BEFORE INSERT OR UPDATE\s+ON placement_tpo_saved_views/);
});
test("saved view INSERT rejects future created_at",()=>{
  assert.match(saved(),/IF TG_OP = 'INSERT' THEN[\s\S]*?NEW\.created_at > statement_timestamp\(\)/);
});
test("saved view UPDATE unconditionally rejects all changes",()=>{
  assert.match(saved(),/RETURN NEW;\s*END IF;\s*RAISE EXCEPTION 'TPO saved views are immutable after creation'/);
});
test("saved view DELETE remains legal (create/delete-only source lifecycle)",()=>{
  assert.doesNotMatch(trigger("db09_tpo_saved_views_lifecycle_guard"),/DELETE/);
});
test("new trigger names are unique and each function has exactly one call site",()=>{
  for(const k of ["db09_tpo_user_preferences_lifecycle_guard","db09_tpo_saved_views_lifecycle_guard"])
    assert.equal((sql.match(new RegExp("CREATE TRIGGER "+k+"\\b","g"))||[]).length,1,k);
  for(const k of ["db09_restrict_tpo_user_preferences_lifecycle","db09_restrict_tpo_saved_view_lifecycle"]) {
    assert.equal((sql.match(new RegExp("CREATE FUNCTION "+k+"\\b","g"))||[]).length,1,k);
    assert.equal((sql.match(new RegExp("EXECUTE FUNCTION "+k+"\\(","g"))||[]).length,1,k);
  }
});
test("staged SQL does not destructively drop the two source tables",()=>{
  assert.doesNotMatch(sql,/DROP\s+TABLE\s+placement_tpo_(?:user_preferences|saved_views)/i);
});
