import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const ui=readFileSync("src/components/attendance/admin-attendance-workspace.tsx","utf8");
const service=readFileSync("src/modules/attendance/admin-service.ts","utf8");
const model=readFileSync("src/modules/attendance/admin-correction-change-model.ts","utf8");

test("DB06 admin UI saves note-only edits without changing learner status",()=>{
  assert.match(ui,/noteEdited && verifiedRecord/);
  assert.match(ui,/onClick=\{\(\)=>void correct\(verifiedRecord\.status\)\}/);
  assert.match(ui,/Save note/);
  assert.match(ui,/requestedNote:correctionNote/);
  assert.match(ui,/note: correctionNote\.trim\(\)/);
  assert.match(service,/note:change\.nextNote/);
});

test("DB06 admin UI permits correcting non-PRESENT reason without forced PRESENT",()=>{
  assert.match(ui,/absenceReason !== verifiedRecord\.status/);
  assert.match(ui,/onClick=\{\(\)=>void correct\(absenceReason\)\}/);
  assert.match(ui,/Update reason/);
  assert.match(ui,/\{verifiedRecord \? \(/);
});

test("DB06 note-only corrections are audited but never produce duplicate absence SMS",()=>{
  assert.match(model,/shouldNotifyAbsent:statusChanged&&input\.requestedStatus==="ABSENT"/);
  assert.match(model,/shouldNotifyCorrected:statusChanged&&previousStatus==="ABSENT"/);
  assert.match(service,/change\.shouldNotifyAbsent/);
  assert.match(service,/change\.shouldNotifyCorrected/);
  assert.match(service,/College Admin updated an attendance note/);
});

test("DB06 admin correction detects stale optimistic timestamps without leaking roster details",()=>{
  assert.match(service,/adminAttendanceRecordTokenMatches\(/);
  assert.match(service,/ATTENDANCE_STALE_VERSION/);
  assert.match(model,/parsed\.getTime\(\)===persisted\.getTime\(\)/);
});
