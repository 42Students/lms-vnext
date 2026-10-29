import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";

const source = readFileSync(
  new URL("../src/modules/projects/meeting-service.ts", import.meta.url),
  "utf8",
);
const helperStart = source.indexOf("async function validateMeetingLinks(");
const listStart = source.indexOf("export type ProjectMeetingListOptions");
const scheduleStart = source.indexOf("export async function scheduleProjectMeeting(");
const transitionStart = source.indexOf("export async function transitionProjectMeeting(");
const helper = source.slice(helperStart, listStart);
const schedule = source.slice(scheduleStart, transitionStart);

function ancestryValidatedInsideLockedWrite(body) {
  const tx = body.indexOf("return getDb().transaction(async (tx) =>");
  const projectRead = body.indexOf("const [project] = await tx.select(", tx);
  const projectLock = body.indexOf('.for("update").limit(1)', projectRead);
  const persistedActor = body.indexOf("await assertPersistedProjectMutationActor(", projectRead);
  const effective = body.indexOf("const effectiveSprintId=", tx);
  const finalCheck = body.indexOf("validateMeetingLinks(tx,scope.project.id,effectiveSprintId,effectiveTaskId)", tx);
  const meetingWrite = body.indexOf("const [created] = await tx.insert(projectMeetings)", tx);
  const updateWrite = body.indexOf("const [updated] = await tx.update(projectMeetings)", tx);
  return tx >= 0 && projectRead > tx && projectLock > projectRead &&
    projectLock < persistedActor && effective > persistedActor &&
    finalCheck > effective && meetingWrite > finalCheck && updateWrite > finalCheck &&
    body.slice(0,tx).indexOf("validateMeetingLinks(") === -1;
}

test("DB075: every schedule validates final (including retained) links inside the write transaction", () => {
  assert(helperStart >= 0 && listStart > helperStart);
  assert(scheduleStart >= 0 && transitionStart > scheduleStart);
  assert(ancestryValidatedInsideLockedWrite(schedule));
  assert.match(schedule, /existing\?\.linkedSprintId\?\?null : input\.linkedSprintId/);
  assert.match(schedule, /existing\?\.linkedTaskId\?\?null : input\.linkedTaskId/);
  assert.match(schedule, /linkedSprintId: links\.linkedSprintId, linkedTaskId: links\.linkedTaskId/);
});

test("DB075: hold locks on both referenced parent rows until meeting transaction commits", () => {
  assert.match(helper, /tx: ProjectMeetingTx/);
  assert.doesNotMatch(helper, /await getDb\(\)/);
  assert.equal((helper.match(/\.for\("share"\)/g) ?? []).length, 2);
  assert.match(helper, /eq\(projectSprints\.projectId, projectId\)/);
  assert.match(helper, /eq\(projectTasks\.projectId, projectId\)/);
  assert.match(helper, /task\.sprintId !== sprint\.id/);
});

test("DB075: source regression catches validation moved back outside the transaction", () => {
  const altered = schedule.replace(
    "const links=await validateMeetingLinks(tx,scope.project.id,effectiveSprintId,effectiveTaskId);",
    "",
  );
  assert.notEqual(altered,schedule);
  assert.equal(ancestryValidatedInsideLockedWrite(altered), false);
});

test("DB075: source regression catches missing project lock or missing parent locks", () => {
  assert.equal(ancestryValidatedInsideLockedWrite(
    schedule.replace('.for("update").limit(1)', '.limit(1)'),
  ), false);
  const unlocked = helper.replaceAll('.for("share")', "");
  assert.equal((unlocked.match(/\.for\("share"\)/g) ?? []).length, 0);
  assert.notEqual(unlocked,helper);
});
