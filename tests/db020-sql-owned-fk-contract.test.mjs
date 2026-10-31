// DB-020 SQL-owned FK exception contract. Run only after real registered PG17
// replay and read-only catalog diagnosis. Do not treat this as phase certification.
import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// child, constraint, parent, ordered child columns, ordered parent columns,
// on delete, on update. These are deliberate SQL-owned FK relations whose
// typed declarations would induce module cycles or omit SQL-level protections.
const expected=[
 ["colleges","colleges_chair_membership_scope_fk","college_memberships",["chair_membership_id","id"],["id","college_id"],"restrict","no action"],
 ["colleges","colleges_vice_chair_membership_scope_fk","college_memberships",["vice_chair_membership_id","id"],["id","college_id"],"restrict","no action"],
 ["placement_recruiter_college_grants","pending_recruiter_lead_fk","placement_tpo_leads",["pending_recruiter_lead_id"],["id"],"restrict","no action"],
 ["course_offerings","course_offerings_program_term_id_fkey","program_terms",["program_term_id"],["id"],"restrict","no action"],
 ["course_offerings","course_offerings_program_term_course_id_fkey","program_term_courses",["program_term_course_id"],["id"],"restrict","no action"],
 ["project_templates","project_templates_current_version_snapshot_fk","project_template_versions",["id","current_version"],["template_id","version"],"no action","no action"],
 ["project_templates","project_templates_published_version_snapshot_fk","project_template_versions",["id","published_version"],["template_id","version"],"no action","no action"],
];
const signature=e=>JSON.stringify([e.child,e.name,e.parent,e.columnsFrom,e.columnsTo,e.onDelete,e.onUpdate]);
const expectedSignatures=expected.map(x=>JSON.stringify(x)).sort();
const report=JSON.parse(readFileSync(".verification/db020-catalog-disposition.json","utf8"));
test("DB020 exact registered SQL-owned FK shapes on seven typed tables",()=>{
 assert.equal(report.kind,"DB020_DISPOSABLE_PG17_REGISTERED_VS_GENERATED_DIAGNOSIS");
 assert.ok(report.registeredMigrations>=323,"requires registered 0323+ on disposable PG17");
 assert.equal(report.passCertification,false,"diagnostic must never become phase acceptance");
 for(const key of ["generatedAbsentInRegisteredPg","generatedTypedMissingColumns",
  "registeredExtraColumnsOnTypedTables","typedFkShapesMissingFromCatalog","unvalidatedFks"])
   assert.equal(report.counts[key],0,key+" requires DB020 review");
 const actual=report.fkCatalogTypedTableEdges;
 assert.equal(actual.length,7,"every newly unmodeled typed-table FK requires review");
 assert.equal(report.counts.catalogOnlyFkShapesOnTypedTables,7);
 assert.equal(new Set(actual.map(signature)).size,7);
 assert.deepEqual(actual.map(signature).sort(),expectedSignatures,
  "SQL-owned FK shape, name, ordered columns, delete or update rule drifted");
});
test("DB020 separate SQL-only tables account for all remaining catalog-only FK edges",()=>{
 const tables=new Set(report.sqlOnlyTables), edges=report.fkCatalogSqlOnlyTableEdges;
 assert.equal(tables.size,10,"new SQL-only table requires review");
 assert.equal(edges.length,30,"new SQL-only FK requires review");
 assert.ok(edges.every(e=>tables.has(e.child)),"unclassified typed-table SQL-only FK");
 assert.equal(report.counts.catalogOnlyFkShapesOnSqlOnlyTables,30);
 assert.equal(report.counts.catalogFkShapesMissingFromTypedSnapshot,37,
  "all unmodeled catalog FK shapes must be explicitly accounted for");
});
