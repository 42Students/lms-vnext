import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

// DB-010: authorization before a concurrent soft delete is insufficient.
// Each mutation must reject deleted parent rows while holding FOR UPDATE.
const cases = [
  ["learner-task-progress-service.ts", ["learner task status/reorder"]],
  ["readiness-override-service.ts", ["readiness override"]],
  ["mentor-overview-edit-service.ts", ["mentor project overview"]],
  ["resource-service.ts", ["resource create", "resource update", "resource archive", "resource reorder"]],
  ["task-assignment-service.ts", ["mentor task reassignment"]],
  ["mentor-task-transition-service.ts", ["mentor task transition"]],
  ["project-resource-library-service.ts", ["resource library save"]],
  ["mentor-task-delete-service.ts", ["mentor task deletion"]],
  ["mentor-sprint-delete-service.ts", ["mentor sprint deletion"]],
  ["project-task-plan-service.ts", ["admin task plan update"]],
  ["project-sprint-plan-service.ts", ["admin sprint plan update"]],
  ["learner-backlog-pull-service.ts", ["learner backlog pull"]],
  ["admin-task-plan-create-service.ts", ["admin task creation"]],
  ["learner-task-status-service.ts", ["learner own-task status"]],
  ["mentor-backlog-service.ts", ["mentor backlog move", "mentor backlog create"]],
];
const read = name => fs.readFileSync("src/modules/projects/" + name,"utf8");

for (const [path, operations] of cases) {
  const source=read(path);
  const locks=[...source.matchAll(/const \[(?:project|current)\]\s*=\s*await tx[\s\S]*?\.from\(projectInstances\)[\s\S]*?\.for\("update"\)\s*\.limit\(1\)/g)].map(m=>m[0]);
  test("DB010 "+path+" enumerates every locked project write",()=>{
    assert.equal(locks.length,operations.length);
  });
  operations.forEach((operation,index)=>{
    test("DB010 "+operation+" rejects a deleted project under its row lock",()=>{
      assert.match(locks[index],/isNull\(projectInstances\.deletedAt\)/);
    });
  });
}

test("DB010 learner progress excludes deleted task/sprint ancestry",()=>{
  const s=read("learner-task-progress-service.ts");
  assert.match(s.slice(s.indexOf("const [candidate]"),s.indexOf("if (!candidate)")),/isNull\(projectTasks\.deletedAt\)/);
  assert.match(s.slice(s.indexOf("const [sprint]"),s.indexOf("if (!sprint")),/isNull\(projectSprints\.deletedAt\)/);
  const siblings=s.slice(s.indexOf("const allSiblings"),s.indexOf("const task = siblings"));
  assert.match(siblings,/const siblings = allSiblings\.filter\(item => !item\.deletedAt\)/);
  assert.doesNotMatch(siblings,/isNull\(projectTasks\.deletedAt\)/);
  assert.match(s,/Math\.max\(\.\.\.allSiblings\.map\(item => item\.sequence\)\)/);
});
test("DB010 mentor transitions exclude deleted task and sprint ancestors",()=>{
  const s=read("mentor-task-transition-service.ts");
  assert.match(s.slice(s.indexOf("const [task]"),s.indexOf("if (!task)")),/isNull\(projectTasks\.deletedAt\)/);
  assert.match(s.slice(s.indexOf("const [sprint]"),s.indexOf("if (!sprint")),/isNull\(projectSprints\.deletedAt\)/);
  assert.match(s.slice(s.indexOf("const [updated]"),s.indexOf("if (!updated)")),/isNull\(projectTasks\.deletedAt\)/);
});
test("DB010 mentor overview CAS rejects deleted project at write",()=>{
  const s=read("mentor-overview-edit-service.ts");
  assert.match(s.slice(s.indexOf("const [updated]"),s.indexOf("if(!updated)")),/isNull\(projectInstances\.deletedAt\)/);
});

test("DB010 primary mentor reassignment refuses a deleted parent under project lock",()=>{
  const s=read("member-service.ts");
  const start=s.indexOf("export async function reassignProjectPrimaryMentor(");
  const section=s.slice(start,s.indexOf("await assertPersistedPlatformPermission",start));
  assert.ok(start>=0);
  assert.match(section,/isNull\(projectInstances\.deletedAt\)/);
  assert.ok(section.indexOf("isNull(projectInstances.deletedAt)")<section.indexOf('.for("update")'));
});
test("DB010 backlog pull refuses deleted task and sprint ancestry",()=>{
  const s=read("learner-backlog-pull-service.ts");
  assert.match(s.slice(s.indexOf("const [task]"),s.indexOf("if(!task")),/isNull\(projectTasks\.deletedAt\)/);
  assert.match(s.slice(s.indexOf("const [sprint]"),s.indexOf("if(sprint?.")),/isNull\(projectSprints\.deletedAt\)/);
  // Deleted rows keep unique (sprint_id, sequence) slots reserved.
  assert.doesNotMatch(s.slice(s.indexOf("const [last]"),s.indexOf("const [updated]")),/isNull\(projectTasks\.deletedAt\)/);
  assert.match(s.slice(s.indexOf("const [updated]"),s.indexOf("if(!updated)")),/isNull\(projectTasks\.deletedAt\)/);
});
test("DB010 learner own task status refuses deleted task and sprint",()=>{
  const s=read("learner-task-status-service.ts");
  assert.match(s.slice(s.indexOf("const [task]"),s.indexOf("if(!task)")),/isNull\(projectTasks\.deletedAt\)/);
  assert.match(s.slice(s.indexOf("const [sprint]"),s.indexOf("if(sprint?.")),/isNull\(projectSprints\.deletedAt\)/);
  assert.match(s.slice(s.indexOf("const [updated]"),s.indexOf("if(!updated)")),/isNull\(projectTasks\.deletedAt\)/);
});

test("DB010 the registered all-row task sequence index requires tombstone-aware allocation",()=>{
  const schema=fs.readFileSync("src/db/schema/projects.ts","utf8");
  assert.match(schema,/uniqueIndex\("project_tasks_sprint_sequence_uq"\)\.on\(/);
  const progress=read("learner-task-progress-service.ts");
  assert.match(progress,/maxReservedSequence >= 2147483647/);
  assert.match(progress,/const siblings = allSiblings\.filter\(item => !item\.deletedAt\)/);
  const backlog=read("learner-backlog-pull-service.ts");
  assert.doesNotMatch(backlog.slice(backlog.indexOf("const [last]"),backlog.indexOf("const [updated]")),
    /isNull\(projectTasks\.deletedAt\)/);
});

test("DB010 mentor backlog move forbids deleted task, sprint and direct CAS",()=>{
  const src=read("mentor-backlog-service.ts");
  const move=src.slice(src.indexOf("export async function moveMentorBacklogTask("),
    src.indexOf("export async function createMentorBacklogTask("));
  assert.match(move.slice(move.indexOf("const [task]"),move.indexOf("if(!task")),/isNull\(projectTasks\.deletedAt\)/);
  assert.match(move.slice(move.indexOf("const [sprint]"),move.indexOf("if(!sprint")),/isNull\(projectSprints\.deletedAt\)/);
  assert.match(move.slice(move.indexOf("const [updated]"),move.indexOf("if(!updated")),/isNull\(projectTasks\.deletedAt\)/);
});
test("DB010 admin task creation cannot target a soft-deleted release",()=>{
  const src=read("admin-task-plan-create-service.ts");
  const release=src.slice(src.indexOf("const [release]"),src.indexOf("if(!release"));
  assert.match(release,/isNull\(projectReleases\.deletedAt\)/);
});
