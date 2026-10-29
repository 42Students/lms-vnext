import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const review = JSON.parse(
  fs.readFileSync("docs/planning/db07-w03-field-review.json", "utf8"),
);

test("DB07 keeps every current Project source field active and unverified", () => {
  assert.equal(review.counts.tables, 16);
  assert.equal(review.counts.fields, 358);
  assert.equal(review.counts.verified, 0);
  assert.equal(review.counts.approvedRetired, 0);
  assert.equal(review.rows.length, 358);

  assert.ok(
    review.rows.every(
      (row) =>
        row.sourceDisposition === "ACTIVE_SOURCE_CONTRACT" &&
        row.reconciliationStatus ===
          "SOURCE_ACTIVE_TARGET_SEMANTICS_UNVERIFIED" &&
        row.semanticStatus === "UNVERIFIED" &&
        row.sqlExecution === "NOT_EXECUTED" &&
        row.approvedRetirement === false,
    ),
  );
});

test("DB07 missing target concepts stay explicit", () => {
  assert.deepEqual(
    [...review.sharedPhaseReconciliation.missingDedicatedTargetConcepts].sort(),
    [
      "project_delivery_event",
      "project_meeting_history",
      "project_resource_audit",
      "project_task_comment",
    ].sort(),
  );
  assert.deepEqual(
    [...review.counts.missingTargetTables].sort(),
    [...review.sharedPhaseReconciliation.missingDedicatedTargetConcepts].sort(),
  );
  assert.equal(
    review.sharedPhaseReconciliation.runtimeVerification,
    "BLOCKED_BY_DB-001",
  );
});

test("DB07 staged SQL remains outside the migration journal and preserves core invariants", () => {
  const read = (name) =>
    fs.readFileSync(`docs/planning/sql/${name}`, "utf8");

  const relationship = read(
    "db07-w03-core-project-relationship-integrity-candidate.sql",
  );
  const task = read(
    "db07-w03-task-allocation-parity-candidate.sql",
  );
  const workspace = read(
    "db07-w03-workspace-state-parity-candidate.sql",
  );

  for (const sql of [relationship, task, workspace]) {
    assert.match(sql, /DRAFT ONLY/);
  }

  for (const constraint of [
    "project_sprints_project_release_fk",
    "project_tasks_project_sprint_fk",
    "project_task_submissions_project_task_fk",
    "project_submission_reviews_project_submission_fk",
    "project_evaluations_project_submission_fk",
    "project_meetings_project_sprint_fk",
    "project_meetings_project_task_fk",
  ]) {
    assert.ok(relationship.includes(constraint));
  }

  for (const token of [
    "assignee_project_member_id",
    "blocker_reason",
    "carried_over_from_sprint_id",
    "version bigint",
  ]) {
    assert.ok(task.includes(token));
  }

  for (const token of [
    "readiness_override",
    "deleted_at",
    "deleted_by_user_id",
    "recoverable_content",
    "version bigint",
  ]) {
    assert.ok(workspace.includes(token));
  }
});


const fieldReconciliation = JSON.parse(
  fs.readFileSync(
    "docs/planning/database-parity-db07-field-reconciliation.json",
    "utf8",
  ),
);

test("DB07 field reconciliation accounts for all 358 active source fields exactly once", () => {
  assert.equal(fieldReconciliation.counts.tables, 16);
  assert.equal(fieldReconciliation.counts.sourceFields, 358);
  assert.equal(fieldReconciliation.counts.fieldDispositions, 358);
  assert.equal(fieldReconciliation.counts.semanticVerifiedFields, 0);
  assert.equal(fieldReconciliation.counts.runtimeVerifiedFields, 0);
  assert.equal(fieldReconciliation.counts.approvedRetirements, 0);

  const expected = new Set(
    review.rows.map((row) => `${row.legacyTable}.${row.legacyColumn}`),
  );
  const actualRows = fieldReconciliation.tables.flatMap((table) =>
    table.fields.map((field) => ({
      key: `${table.legacyTable}.${field.legacyField}`,
      field,
    })),
  );
  const actual = new Set(actualRows.map((row) => row.key));

  assert.equal(expected.size, 358);
  assert.equal(actual.size, 358);
  assert.deepEqual([...actual].sort(), [...expected].sort());

  for (const { field } of actualRows) {
    assert.ok(field.decision);
    assert.ok(field.reason);
    assert.equal(field.semanticVerified, false);
    assert.equal(field.runtimeVerified, false);
    assert.equal(field.validationEvidence, null);
  }
});

test("DB07 keeps active missing histories/comments and high-risk state gaps explicit", () => {
  const byKey = new Map(
    fieldReconciliation.tables.flatMap((table) =>
      table.fields.map((field) => [
        `${table.legacyTable}.${field.legacyField}`,
        field,
      ]),
    ),
  );

  for (const key of [
    "project_delivery_event.delivery_id",
    "project_meeting_history.project_meeting_id",
    "project_resource_audit.project_resource_id",
    "project_task_comment.project_task_id",
  ]) {
    assert.equal(byKey.get(key)?.decision, "TARGET_GAP_ACTIVE_CONCEPT");
  }

  assert.equal(
    byKey.get("project_task.assignee_id")?.decision,
    "TARGET_GAP_STAGED",
  );
  assert.equal(
    byKey.get("project_task.carried_over_from_sprint_key")?.decision,
    "TARGET_GAP_STAGED",
  );
  assert.equal(
    byKey.get("project_workspace.readiness_override")?.decision,
    "TARGET_GAP_STAGED",
  );
  assert.equal(
    byKey.get("project_delivery.locked_at")?.decision,
    "REVISION_HISTORY_CONTRACT_REQUIRED",
  );
  assert.equal(
    byKey.get("project_resource.file_url")?.decision,
    "SECURITY_REDESIGN_REQUIRED",
  );
});

test("DB07 cross-domain invariants remain blockers until atomic/runtime evidence exists", () => {
  const byId = new Map(
    fieldReconciliation.openCrossDomainInvariants.map((row) => [
      row.id,
      row,
    ]),
  );

  assert.equal(
    byId.get("DB07_PROJECT_TEAM_ATOMIC_MATERIALIZATION")?.status,
    "TARGET_GAP_REQUIRED",
  );
  assert.match(
    byId.get("DB07_PROJECT_TEAM_ATOMIC_MATERIALIZATION")?.requiredContract ?? "",
    /rolls back the whole team/i,
  );
  assert.equal(
    byId.get("DB07_TENANT_SCOPED_PROJECT_EVENTS")?.status,
    "TARGET_INTEGRITY_GAP",
  );
  assert.match(
    byId.get("DB07_TENANT_SCOPED_PROJECT_EVENTS")?.requiredContract ?? "",
    /cross-college/i,
  );
});


// L06 DB07 transaction-boundary regression proofs (also run by test:db:parity).
test("DB07 meeting link parents are checked and locked inside the scheduling transaction", () => {
  const source=fs.readFileSync("src/modules/projects/meeting-service.ts","utf8");
  const helper=source.slice(source.indexOf("async function validateMeetingLinks("),
    source.indexOf("export type ProjectMeetingListOptions"));
  const body=source.slice(source.indexOf("export async function scheduleProjectMeeting("),
    source.indexOf("export async function transitionProjectMeeting("));
  const tx=body.indexOf("return getDb().transaction(async (tx) =>");
  const projectLock=body.indexOf('.for("update").limit(1)',tx);
  const actor=body.indexOf("await assertPersistedProjectMutationActor(",projectLock);
  const links=body.indexOf("validateMeetingLinks(tx,scope.project.id,effectiveSprintId,effectiveTaskId)",actor);
  const insert=body.indexOf("await tx.insert(projectMeetings)",links);
  const update=body.indexOf("await tx.update(projectMeetings)",links);
  assert.ok(tx>=0&&projectLock>tx&&actor>projectLock&&links>actor);
  assert.ok(insert>links&&update>links);
  assert.equal((helper.match(/\.for\("share"\)/g)??[]).length,2);
  assert.match(helper,/eq\(projectSprints\.projectId, projectId\)/);
  assert.match(helper,/eq\(projectTasks\.projectId, projectId\)/);
  assert.match(helper,/task\.sprintId !== sprint\.id/);
  assert.ok(!body.slice(0,tx).includes("validateMeetingLinks("));
});

test("DB07 mentor reschedule write clock is checked after project and meeting locks", () => {
  const source=fs.readFileSync("src/modules/projects/mentor-meeting-reschedule-service.ts","utf8");
  const tx=source.indexOf("return getDb().transaction(async tx=>");
  const projectLock=source.indexOf('.for("update").limit(1)',tx);
  const meetingLock=source.indexOf('.for("update").limit(1)',projectLock+1);
  const stateCheck=source.indexOf("mentorMeetingCanReschedule(meeting.status,project.status)",meetingLock);
  const timeCheck=source.indexOf("if(start.getTime()<=Date.now())",stateCheck);
  const write=source.indexOf("await tx.update(projectMeetings)",timeCheck);
  assert.ok(tx>=0&&projectLock>tx&&meetingLock>projectLock);
  assert.ok(stateCheck>meetingLock&&timeCheck>stateCheck&&write>timeCheck);
  assert.equal((source.match(/if\(start\.getTime\(\)<=Date\.now\(\)\)/g)??[]).length,2);
});


// DB07 project meetings must fail closed for soft-deleted rows on schedule edits.
test("DB07 scheduling cannot mutate a soft-deleted meeting",()=>{
  const source=fs.readFileSync("src/modules/projects/meeting-service.ts","utf8");
  const schedule=source.slice(source.indexOf("export async function scheduleProjectMeeting("),
    source.indexOf("export async function transitionProjectMeeting("));
  const existing= schedule.slice(schedule.indexOf("const [existing] = meetingIdInput"),
    schedule.indexOf("if (meetingIdInput && !existing)"));
  assert.match(existing,/eq\(projectMeetings\.id,projectMeetingIdSchema\.parse\(meetingIdInput\)\)/);
  assert.match(existing,/eq\(projectMeetings\.projectId,scope\.project\.id\)/);
  assert.match(existing,/isNull\(projectMeetings\.deletedAt\)/);
  assert.match(existing,/\.for\("update"\)/);
});


// L06 DB07 parent tombstone and assignment-retention regressions.
test("DB07 Mentor task writes lock assignment and reject deleted project or sprint ancestry",()=>{
  const source=fs.readFileSync("src/modules/projects/mentor-task-create-service.ts","utf8");
  const tx=source.indexOf("return await getDb().transaction(async tx=>");
  const project=source.indexOf("const [project]=await tx.select(",tx);
  const projectLock=source.indexOf('.for("update").limit(1)',project);
  const deleted=source.indexOf("project.deletedAt",project);
  const sprint=source.indexOf("const [sprint]=input.sprintId?",projectLock);
  const deletedSprint=source.indexOf("isNull(projectSprints.deletedAt)",sprint);
  const assignee=source.indexOf("if(input.assigneeMembershipId)",sprint);
  const memberLock=source.indexOf('.for("share").limit(1)',assignee);
  const write=source.indexOf("await tx.insert(projectTasks)",assignee);
  assert.ok(tx>=0&&project>tx&&projectLock>project&&deleted>projectLock);
  assert.ok(sprint>deleted&&deletedSprint>sprint&&deletedSprint<assignee);
  assert.ok(memberLock>assignee&&memberLock<write);
  for(const term of [
    "eq(projectMembers.projectId,scope.project.id)",
    "eq(projectMembers.membershipId,input.assigneeMembershipId)",
    "eq(projectMembers.role,\"LEARNER\")",
    "isNull(projectMembers.endedAt)",
    "eq(collegeMemberships.collegeId,scope.collegeId)",
    "eq(collegeMemberships.status,\"ACTIVE\")",
    "eq(users.platformStatus,\"ACTIVE\")",
  ]) assert.ok(source.includes(term),term);
});

test("DB07 Mentor sprint and release writers recheck deleted project under write lock",()=>{
  for(const path of [
    "src/modules/projects/mentor-sprint-write-service.ts",
    "src/modules/projects/mentor-release-write-service.ts",
  ]){
    const source=fs.readFileSync(path,"utf8");
    const project=source.indexOf("const [project]=await tx.select(");
    const lock=source.indexOf('.for("update").limit(1)',project);
    const deleted=source.indexOf("project.deletedAt",project);
    const actor=source.indexOf("await assertPersistedProjectMutationActor(",project);
    assert.ok(project>=0&&lock>project&&deleted>lock&&actor>deleted,path);
  }
});

test("DB070/071 Mentor integration fixture cleanup preserves immutable template versions",()=>{
  for(const path of [
    "tests/integration/mentor-task-create.test.ts",
    "tests/integration/mentor-sprint-details-update.test.ts",
  ]){
    const source=fs.readFileSync(path,"utf8");
    assert.match(source,/db07_project_template_versions_append_only/);
    assert.match(source,/project_templates_current_version_snapshot_fk/);
    assert.match(source,/if\(!retention\.rows\[0\]\?\.retainHistory\)/);
    const revDelete=source.indexOf('"delete from project_template_versions');
    const retention=source.indexOf('if(!retention.rows[0]?.retainHistory)');
    assert.ok(retention>=0&&revDelete>retention,path);
  }
});


// L06 DB07 deleted ancestor guards in remaining learner and Mentor edit writers.
test("DB07 Mentor metadata edit writers fail closed on deleted parents",()=>{
 const sources=[
   "src/modules/projects/mentor-task-details-service.ts",
   "src/modules/projects/mentor-sprint-details-service.ts",
 ];
 for(const path of sources){
   const source=fs.readFileSync(path,"utf8");
   const project=source.indexOf("const [project] = await tx.select(")>=0
     ?source.indexOf("const [project] = await tx.select(")
     :source.indexOf("const [project]=await tx.select(");
   const lock=source.indexOf('.for("update").limit(1)',project);
   const tombstone=source.indexOf("project.deletedAt",project);
   const actor=source.indexOf("assertPersistedProjectMutationActor(tx,context,scope)",lock);
   assert.ok(project>=0&&lock>project&&tombstone>lock&&actor>tombstone,path);
 }
 const task=fs.readFileSync(sources[0],"utf8");
 assert.match(task,/isNull\(projectTasks\.deletedAt\)/);
 assert.match(task,/isNull\(projectSprints\.deletedAt\)/);
});

test("DB07 both learner-owned task mutations recheck project and sprint tombstones",()=>{
 const source=fs.readFileSync("src/modules/projects/learner-own-task-service.ts","utf8");
 assert.equal((source.match(/project\.deletedAt/g)??[]).length,2);
 assert.equal((source.match(/isNull\(projectSprints\.deletedAt\)/g)??[]).length,2);
 assert.equal((source.match(/assertPersistedLearnerProjectMutation\(tx,context,projectId,scope\.collegeId\)/g)??[]).length,2);
 assert.match(source,/isNull\(projectTasks\.deletedAt\)/);
});

test("DB070 mentor task-details integration fixture also preserves permanent history",()=>{
 const source=fs.readFileSync("tests/integration/mentor-task-details-update.test.ts","utf8");
 assert.match(source,/db07_project_template_versions_append_only/);
 assert.match(source,/project_templates_current_version_snapshot_fk/);
 assert.match(source,/if\(!retention\.rows\[0\]\?\.retainHistory\)/);
 assert.match(source,/refuses edits to a deleted task, deleted sprint, or deleted project/);
});


// L06 DB07 task discussion tombstone write guard.
test("DB07 historical comments cannot be posted to deleted project/task rows",()=>{
 const source=fs.readFileSync("src/modules/projects/task-comment-service.ts","utf8");
 const writer=source.slice(source.indexOf("export async function postProjectTaskComment("));
 const tx=writer.indexOf("return getDb().transaction(async tx=>");
 const project=writer.indexOf("const [project]=await tx.select(",tx);
 const projectLock=writer.indexOf('.for("update").limit(1)',project);
 const deleted=writer.indexOf("project.deletedAt",projectLock);
 const task=writer.indexOf("const [task]=await tx.select()",deleted);
 const deletedTask=writer.indexOf("isNull(projectTasks.deletedAt)",task);
 const insert=writer.indexOf("await tx.insert(projectTaskComments)",deletedTask);
 assert.ok(tx>=0&&project>tx&&projectLock>project&&deleted>projectLock);
 assert.ok(task>deleted&&deletedTask>task&&insert>deletedTask);
 assert.match(writer,/eq\(projectTasks\.projectId,scope\.project\.id\)/);
 assert.match(writer,/eq\(projectTasks\.id,taskId\)/);
 const integration=fs.readFileSync("tests/integration/mentor-task-create.test.ts","utf8");
 assert.match(integration,/refuses new comments on soft-deleted tasks and deleted projects/);
});


// L06 DB074 final evaluation and delivery-review deletion guards.
test("DB074 evaluation writes lock a tenant-scoped project and reject deletion before grading",()=>{
 const source=fs.readFileSync("src/modules/projects/evaluation-service.ts","utf8");
 const body=source.slice(source.indexOf("export async function createProjectEvaluation("),
   source.indexOf("export async function getProjectEvaluation("));
 const tx=body.indexOf("return await db.transaction(async (tx) =>");
 const read=body.indexOf(".select({ status: projectInstances.status, deletedAt:projectInstances.deletedAt })",tx);
 const scope=body.indexOf("eq(projectInstances.collegeId,scope.collegeId)",read);
 const lock=body.indexOf('.for("update")',scope);
 const deleted=body.indexOf("project.deletedAt",lock);
 const evalInsert=body.indexOf(".insert(projectEvaluations)",deleted);
 assert.ok(tx>=0&&read>tx&&scope>read&&lock>scope&&deleted>lock&&evalInsert>deleted);
 assert.match(body,/eq\(projectSubmissions\.projectId, scope\.project\.id\)/);
 const unit=fs.readFileSync("tests/unit/PROJ-BREAK-chat9-evaluation-mutation-auth.test.ts","utf8");
 assert.match(unit,/DB074 denies grading after project soft deletion/);
});

test("DB074 final lock and review deny deletion before idempotent success or mutation",()=>{
 const source=fs.readFileSync("src/modules/projects/admin-submission-review-service.ts","utf8");
 const lockBody=source.slice(source.indexOf("export async function lockAdminProjectSubmission("),
   source.indexOf("const adminReviewInput="));
 const reviewBody=source.slice(source.indexOf("export async function reviewAdminProjectSubmission("),
   source.indexOf("export async function listAdminProjectDeliveryHistory("));
 for(const body of [lockBody,reviewBody]){
   const project=body.indexOf("const [project]=await tx.select({status:projectInstances.status,deletedAt:projectInstances.deletedAt})");
   const lock=body.indexOf('.for("update").limit(1)',project);
   const check=body.indexOf("project.deletedAt",lock);
   const returnSuccess=body.indexOf("return {submission",check);
   const update=body.indexOf("await tx.update(projectSubmissions)",check);
   assert.ok(project>=0&&lock>project&&check>lock);
   assert.ok(returnSuccess<0||returnSuccess>check);
   assert.ok(update>check);
   assert.match(body,/eq\(projectInstances\.collegeId,scope\.collegeId\)/);
 }
 const unit=fs.readFileSync("tests/unit/PROJ-BREAK-chat9-admin-delivery-lock.test.ts","utf8");
 assert.match(unit,/DB074 denies both a new lock and an idempotent retry after project deletion/);
 assert.match(unit,/DB074 denies College Admin final review on a deleted project/);
});


// L06 DB07 disposable-Postgres project integration safety.
test("DB07 destructive Projects integration suites require isolated disposable PostgreSQL",()=>{
  for(const path of [
    "tests/integration/projects-p5-lifecycle.test.ts",
    "tests/integration/projects-p6b-final-evaluation.test.ts",
    "tests/integration/projects-adversarial.test.ts",
  ]){
    const source=fs.readFileSync(path,"utf8");
    assert.match(source,/import \{assertDb018DisposableTarget\} from "\.\.\/support\/db018-test-target\.mjs"/);
    assert.match(source,/const databaseUrl = process\.env\.TEST_DATABASE_URL/);
    assert.match(source,/assertDb018DisposableTarget\(process\.env,\{serviceBound:true\}\)/);
    assert.doesNotMatch(source,/\?\?\s*process\.env\.DATABASE_URL/);
    assert.ok(source.indexOf("assertDb018DisposableTarget(")<
      source.indexOf("const pool = new Pool("),path);
  }
});
