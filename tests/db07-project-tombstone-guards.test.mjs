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
  assert.match(s.slice(s.indexOf("const siblings"),s.indexOf("const task = siblings")),/isNull\(projectTasks\.deletedAt\)/);
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
