import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const script=fs.readFileSync("scripts/db-independent-verify.mjs","utf8");
const catalog=fs.readFileSync("scripts/db002-postgres-catalog-acceptance.mjs","utf8");

test("DB076 requires all independent safety gates in order and exact executed-step accounting",()=>{
  const labels=[
    "Migration journal integrity",
    "Canonical Drizzle generation",
    "Tracked Drizzle schema drift",
    "Untracked Drizzle schema drift",
    "Disposable database reset + zero-to-head migration + seed",
    "Migration idempotence smoke",
    "Read-only PostgreSQL migration/catalog witness",
    "Database parity source/static contracts",
    "PostgreSQL integration / negative witnesses",
  ];
  // Other lanes may add legitimate domain-specific PG checks, but they must
  // remain accounted for in the verifier's exact pass condition. Never loosen
  // the ordered mandatory safety gate contract.
  const executedSteps=[...script.matchAll(/run(?:EmptyOutput)?Step\(\s*"([^"]+)"\s*,/g)]
    .map((match)=>match[1]);
  const declared=script.match(/results\.length === (\d+)/);
  assert.ok(declared,"the verifier must require an exact completed-step count");
  assert.equal(Number(declared[1]),executedSteps.length,
    "all declared steps must be accounted for in the pass gate");
  assert.equal(new Set(executedSteps).size,executedSteps.length,
    "duplicate step names make acceptance receipts ambiguous");
  const positions=labels.map((label)=>executedSteps.indexOf(label));
  assert.ok(positions.every((position)=>position>=0),"a mandatory gate is missing");
  assert.deepEqual([...positions].sort((a,b)=>a-b),positions);
});

test("DB076 generation gate checks both tracked and untracked drizzle drift",()=>{
  assert.match(
    script,
    /"Tracked Drizzle schema drift"[\s\S]*"git"[\s\S]*"diff"[\s\S]*"--exit-code"[\s\S]*"HEAD"[\s\S]*"drizzle\//,
  );
  assert.match(
    script,
    /"Untracked Drizzle schema drift"[\s\S]*"git"[\s\S]*"ls-files"[\s\S]*"--others"[\s\S]*"--exclude-standard"[\s\S]*"drizzle\//,
  );
  assert.match(script,/expectedEmptyStdout:\s*true/);
  assert.match(script,/stdoutWasEmpty/);
  assert.match(script,/found unregistered files/);
});

test("DB076 catalog gate executes after replay idempotence and before domain tests",()=>{
  const migrate=script.indexOf('"Migration idempotence smoke"');
  const catalog=script.indexOf('"Read-only PostgreSQL migration/catalog witness"');
  const staticContracts=script.indexOf('"Database parity source/static contracts"');
  const integration=script.indexOf('"PostgreSQL integration / negative witnesses"');
  assert.ok(migrate>=0);
  assert.ok(catalog>migrate);
  assert.ok(staticContracts>catalog);
  assert.ok(integration>staticContracts);
  assert.match(script,/scripts\/db002-postgres-catalog-acceptance\.mjs/);
});

test("DB076 evidence cannot pass when empty-output drift gate reported files",()=>{
  assert.match(
    script,
    /step\.expectedEmptyStdout !== true \|\| step\.stdoutWasEmpty === true/,
  );
  assert.match(script,/outputSha256/);
  assert.match(script,/gitSha = shellText\("git", \["rev-parse", "HEAD"\]\)/);
});


test("DB076 catalog target policy reuses the fail-closed DB01 disposable target guard",()=>{
  assert.match(catalog,/assertSafeDb01TestTarget/);
  assert.match(catalog,/DB01_REMOTE_TEST_DATABASE_CONFIRM/);
  assert.doesNotMatch(
    catalog,
    /DB002 catalog inspection requires a local disposable PostgreSQL URL/,
  );
});

test("DB076 catalog witness requires the newly registered 0044 DB09 tables",()=>{
  for(const table of [
    "placement_college_rules",
    "placement_company_visibility_settings",
    "placement_tpo_leads",
    "placement_tpo_lead_activities",
    "placement_tpo_followups",
  ]) assert.ok(catalog.includes(`"${table}"`),table);
});


test("DB076 guards both staged and unstaged tracked migration drift relative to HEAD",()=>{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),"db076-index-"));
  const drizzle = path.join(dir,"drizzle");
  const git = (...args) => execFileSync("git",args,{cwd:dir,encoding:"utf8",stdio:["ignore","pipe","pipe"]});
  try {
    fs.mkdirSync(drizzle);
    fs.writeFileSync(path.join(drizzle,"0001_fixture.sql"),"SELECT 1;\n");
    git("init","-q");git("config","user.name","L10 Test");git("config","user.email","l10@example.invalid");
    git("add","drizzle");git("commit","-qm","fixture");
    const args=["diff","--exit-code","HEAD","--","drizzle/"];
    assert.equal(spawnSync("git",args,{cwd:dir}).status,0,"clean fixture");
    fs.writeFileSync(path.join(drizzle,"0001_fixture.sql"),"SELECT 2;\n");
    assert.equal(spawnSync("git",args,{cwd:dir}).status,1,"unstaged drift");
    git("add","drizzle");
    assert.equal(spawnSync("git",args,{cwd:dir}).status,1,"staged drift must not pass");
    git("reset","--hard","HEAD");
    assert.equal(spawnSync("git",args,{cwd:dir}).status,0,"reverted fixture");
  } finally {
    fs.rmSync(dir,{recursive:true,force:true});
  }
});

test("DB076 source cleanliness gate precedes Docker and supplied PostgreSQL connections",()=>{
  const cleanAt=script.indexOf('const dirtyEntries = shellText("git"');
  const probeAt=script.indexOf("postgresVersion: providedPostgresVersion(env)");
  const dockerAt=script.indexOf("provider = await startDockerPostgres()");
  assert.ok(cleanAt>0 && probeAt>cleanAt && dockerAt>cleanAt);
  assert.match(script,/sourceTreeClean:\s*false|let sourceTreeClean = false/);
  assert.match(script,/sourceTreeClean = true/);
  assert.match(script,/passed:\s*sourceTreeClean\s*&&/);
  assert.match(script,/requires a clean tracked and untracked source tree/);
});

test("DB076 clean checkout preflight refuses tracked, staged and untracked changes",()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"db076-clean-source-"));
  const git=(...args)=>execFileSync("git",args,{cwd:dir,encoding:"utf8"});
  const status=()=>git("status","--porcelain=v1","--untracked-files=normal").trim();
  try {
    git("init","-q");
    git("config","user.name","L10 Test");
    git("config","user.email","l10@example.invalid");
    fs.writeFileSync(path.join(dir,"source.txt"),"initial\n");
    git("add","source.txt");
    git("commit","-qm","initial");
    assert.equal(status(),"");
    fs.writeFileSync(path.join(dir,"source.txt"),"unstaged\n");
    assert.notEqual(status(),"","unstaged edits must refuse");
    git("add","source.txt");
    assert.notEqual(status(),"","staged edits must refuse");
    git("reset","--hard","HEAD");
    fs.writeFileSync(path.join(dir,"untracked-sensitive-file.txt"),"not included in output");
    assert.notEqual(status(),"","untracked files must refuse");
    fs.rmSync(path.join(dir,"untracked-sensitive-file.txt"));
    assert.equal(status(),"","clean checkout can proceed");
  } finally {
    fs.rmSync(dir,{recursive:true,force:true});
  }
});

test("DB076 final acceptance requires the original HEAD and a clean checkout",()=>{
  const lastIntegration=script.indexOf('"PostgreSQL integration / negative witnesses"');
  const finalHead=script.indexOf('const finalHead = shellText("git", ["rev-parse", "HEAD"])');
  const finalStatus=script.indexOf('sourceTreeCleanAtEnd = !shellText("git"');
  assert.ok(lastIntegration>=0 && finalHead>lastIntegration && finalStatus>finalHead,
    "final source attestation must happen after all database gates");
  assert.match(script,/gitHeadUnchanged = finalHead === gitSha/);
  assert.match(script,/if \(!gitHeadUnchanged \|\| !sourceTreeCleanAtEnd\)/);
  assert.match(script,/passed:\s*sourceTreeClean\s*&&\s*sourceTreeCleanAtEnd\s*&&\s*gitHeadUnchanged\s*&&/);
  assert.match(script,/source checkout changed during the run/);
});

test("DB076 git-head witness detects commit movement while source is otherwise clean",()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"db076-head-"));
  const git=(...args)=>execFileSync("git",args,{cwd:dir,encoding:"utf8"}).trim();
  try {
    git("init","-q");
    git("config","user.name","L10 Test");
    git("config","user.email","l10@example.invalid");
    fs.writeFileSync(path.join(dir,"source.txt"),"first\n");
    git("add","source.txt");
    git("commit","-qm","first");
    const original=git("rev-parse","HEAD");
    fs.writeFileSync(path.join(dir,"source.txt"),"second\n");
    git("add","source.txt");
    git("commit","-qm","second");
    assert.notEqual(git("rev-parse","HEAD"),original,"original SHA must become invalid");
    assert.equal(git("status","--porcelain=v1","--untracked-files=normal"),"",
      "clean worktree alone is insufficient proof of the original SHA");
  } finally {
    fs.rmSync(dir,{recursive:true,force:true});
  }
});


// DB-072–DB-081 independent tail-backlog acceptance preconditions
// These ten are SOURCE-LEVEL guardrails, NOT an assertion that the corresponding
// DB task is accepted. Full registered PostgreSQL, producer/consumer, tenant,
// concurrency and migration evidence remains a separate required gate.
const tailRead = p => fs.readFileSync(p,"utf8");
const tailJournal = () => JSON.parse(tailRead("drizzle/meta/_journal.json"));
const tailTracker = () => JSON.parse(tailRead("docs/tracker.json"));

test("DB072: two-phase recruiter-code cutover cannot silently lose HR compatibility",()=>{
  const sql=tailRead("docs/planning/sql/db08-recruiter-round-result-code-candidate.sql");
  const expand=sql.indexOf("DB072 EXPAND");
  const finalize=sql.indexOf("DB072 FINALIZE");
  assert.ok(expand>=0&&finalize>expand,"EXPAND must precede FINALIZE");
  assert.match(sql.slice(expand,finalize),/'HR'/);
  assert.match(sql.slice(finalize),/SET source='RECRUITER'/);
  assert.match(sql.slice(finalize),/WHERE source='HR'/);
});
test("DB073: staged release-sprint-task-submission ancestry names all three DB FKs",()=>{
  const sql=tailRead("docs/planning/sql/db07-project-lineage-fks-staging.sql");
  assert.match(sql,/DO \$db073_project_lineage_preflight\$/);
  for(const name of ["project_sprints_project_release_fk","project_tasks_project_sprint_fk",
    "project_task_submissions_project_task_fk"]){
    assert.ok(sql.includes("ADD CONSTRAINT "+name),name);
  }
});
test("DB074: review and evaluation parent-scope checks are distinct",()=>{
  const sql=tailRead("docs/planning/sql/db07-review-evaluation-parent-fks-staging.sql");
  assert.match(sql,/DO \$db074_review_evaluation_preflight\$/);
  for(const name of ["project_submission_reviews_project_submission_fk",
    "project_evaluations_project_submission_fk"]){
    assert.ok(sql.includes("ADD CONSTRAINT "+name),name);
  }
});
test("DB075: nullable meeting ancestry still checks each present link and paired sprint",()=>{
  const sql=tailRead("docs/planning/sql/db07-meeting-linked-ancestry-staging.sql");
  assert.match(sql,/DO \$db075_meeting_link_preflight\$/);
  assert.match(sql,/MATCH SIMPLE intentionally skips/);
  for(const name of ["project_meetings_project_sprint_fk",
    "project_meetings_project_task_fk","project_meetings_linked_sprint_task_fk"]){
    assert.ok(sql.includes("ADD CONSTRAINT "+name),name);
  }
});
test("DB076: the independent verifier fails closed on generator diagnostics and checkout movement",()=>{
  assert.match(script,/canonicalGeneration && !canonicalGeneration\.passed/);
  assert.match(script,/sourceTreeCleanAtEnd/);
  assert.match(script,/gitHeadUnchanged/);
  assert.match(script,/results\.every\(/);
});
test("DB077: both historical DB04 retirements cover 33 fields without shadow tables",()=>{
  const j=JSON.parse(tailRead("docs/planning/db04-chat05-historical-final-disposition-2026-10-12.json"));
  assert.equal(j.summary.fieldsDispositioned,33);
  assert.equal(j.summary.anonymousDispositionGaps,0);
  assert.deepEqual(j.dispositions.map(x=>x.legacyTable).sort(),["approver_id_card","student_registration"]);
  assert.ok(j.dispositions.every(x=>x.currentProductRequired===false&&x.replacementTarget===null));
});
test("DB078: retired physical course columns are checked in the registered PostgreSQL catalog",()=>{
  const witness=tailRead("tests/db078-registered-course-column-disposition-pg.test.mjs");
  assert.match(witness,/information_schema\.columns/);
  assert.match(witness,/default_subscription_days/);
  assert.match(witness,/formal_title/);
  assert.match(witness,/assertSafeDb01TestTarget/);
});
test("DB079: recruiter-note grant rechecks run on any UPDATE in the registered journal",()=>{
  const tag="0312_db09_recruiter_note_grant_on_update";
  const journal=tailJournal();
  assert.equal(journal.entries.filter(x=>x.tag===tag).length,1);
  const sql=tailRead("drizzle/"+tag+".sql");
  assert.match(sql,/BEFORE INSERT OR UPDATE\s+ON placement_recruiter_applicant_notes/);
  assert.doesNotMatch(sql,/UPDATE OF recruiter_user_id/);
});
test("DB080: registered image-gallery persistence binds owner, receipt and active state",()=>{
  assert.equal(tailJournal().entries.filter(x=>x.tag==="0283_chat14_learner_gallery").length,1);
  const sql=tailRead("drizzle/0283_chat14_learner_gallery.sql");
  assert.match(sql,/learner_profile_images_receipt_fk/);
  assert.match(sql,/receipt_id, learner_membership_id, receipt_purpose/);
  assert.match(sql,/learner_profile_images_active_ck/);
  assert.match(sql,/learner_profile_images_owner_receipt_uq/);
});
test("DB081: all 24 historical qualification fields map to normalized registered education",()=>{
  const crosswalk=JSON.parse(tailRead("docs/planning/db04-chat05-qualification-24-field-crosswalk-2026-10-12.json"));
  assert.equal(crosswalk.summary.sourceFields,24);
  assert.equal(crosswalk.summary.mappedFields,24);
  assert.equal(crosswalk.summary.anonymousGaps,0);
  assert.equal(crosswalk.rows.length,24);
  assert.equal(new Set(crosswalk.rows.map(x=>x.legacyField)).size,24);
  assert.ok(crosswalk.rows.every(x=>x.target&&x.kind));
  assert.equal(tailJournal().entries.filter(x=>x.tag==="0304_db04_normalized_profile_persistence").length,1);
  const sql=tailRead("drizzle/0304_db04_normalized_profile_persistence.sql");
  assert.match(sql,/CREATE TABLE learner_profile_education_entries/);
  assert.match(sql,/CREATE TABLE learner_profile_education_documents/);
  assert.match(sql,/'CGPA','GPA','Percentage','Grade'/);
});
test("tail backlog: source-only progress cannot be recorded as accepted DB engineering",()=>{
  const ids=Array.from({length:10},(_,i)=>"DB-"+String(72+i).padStart(3,"0"));
  const tasks=tailTracker().tasks.filter(x=>ids.includes(x.id));
  assert.equal(tasks.length,10);
  for(const task of tasks){
    if(!task.done) continue;
    assert.ok(task.acceptedAt||task.acceptanceEvidence?.length,
      task.id+" cannot be closed without acceptance metadata");
    assert.ok(task.acceptanceEvidence?.some(e=>e.result==="PASS"&&e.runUrl),
      task.id+" requires executed acceptance evidence, not source-only assertions");
  }
});
