// DB045 ORIGINAL 30-CHECK ACCEPTANCE CROSSWALK. Source coverage is not a
// PostgreSQL result by itself; the same workflow must execute the referenced
// services/SQL suites against registered disposable PostgreSQL 17.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const witnesses = [
  {
    "id": "G01",
    "description": "Grade without immutable GRADE event rejected",
    "file": "tests/integration/courses-c4a-assignments.test.ts",
    "needles": [
      "update assignment_submissions set grading_status='GRADED'",
      "DB045: a direct SQL grade or feedback edit cannot commit"
    ]
  },
  {
    "id": "G02",
    "description": "Feedback-only grade edit without event rejected",
    "file": "tests/integration/courses-c4a-assignments.test.ts",
    "needles": [
      "feedback='unaudited edit'",
      "version=version+1"
    ]
  },
  {
    "id": "G03",
    "description": "Forged grade college or delivery scope denied",
    "file": "tests/integration/courses-c4a-assignments.test.ts",
    "needles": [
      "{name:\"foreign college\"",
      "{name:\"unrelated delivery\""
    ]
  },
  {
    "id": "G04",
    "description": "Unassigned Faculty grade-history actor denied",
    "file": "tests/integration/courses-c4a-assignments.test.ts",
    "needles": [
      "active Faculty without teaching assignment",
      "detachedFacultyMembership"
    ]
  },
  {
    "id": "G05",
    "description": "Forged grade actor role denied",
    "file": "tests/integration/courses-c4a-assignments.test.ts",
    "needles": [
      "learner impersonates Faculty"
    ]
  },
  {
    "id": "G06",
    "description": "SUPER_ADMIN scoped membership shape rejected",
    "file": "tests/integration/courses-c4a-assignments.test.ts",
    "needles": [
      "SUPER_ADMIN with scoped membership"
    ]
  },
  {
    "id": "G07",
    "description": "Grade publication is attributed to actual publisher",
    "file": "tests/integration/courses-c4a-assignments.test.ts",
    "needles": [
      "DB045 attributes grade publication to its College Admin publisher",
      "actor_user_id:collegeAdmin.user.id"
    ]
  },
  {
    "id": "G08",
    "description": "Concurrent same-version grades yield one event",
    "file": "tests/integration/courses-c4a-assignments.test.ts",
    "needles": [
      "DB045 two real concurrent grade submissions with the SAME CAS token",
      "expect(beforePublish.rows[0]?.n).toBe(1)"
    ]
  },
  {
    "id": "G09",
    "description": "Grade ledger immutable and forged HIDE rejected",
    "file": "tests/integration/courses-c4a-assignments.test.ts",
    "needles": [
      "HIDE_GRADE",
      "assignment_grade_events_shape_ck",
      "UPDATE assignment_grade_events SET action=action"
    ]
  },
  {
    "id": "A10",
    "description": "Initial explicit PRESENT creates version-zero MARK",
    "file": "tests/integration/college-admin-attendance.test.ts",
    "needles": [
      "DB045 first explicit PRESENT mark has durable version-zero row",
      "action:\"MARK\""
    ]
  },
  {
    "id": "A11",
    "description": "Initial explicit ABSENT creates version-zero MARK",
    "file": "tests/integration/college-admin-attendance.test.ts",
    "needles": [
      "insertDisposableAttendanceMark(pool,{",
      "actorRole:\"SUPER_ADMIN\",status:\"ABSENT\""
    ]
  },
  {
    "id": "A12",
    "description": "Attendance correction without immutable CORRECT denied",
    "file": "tests/integration/college-admin-attendance.test.ts",
    "needles": [
      "DB045 rejects direct attendance status and marker edits lacking a CORRECT event"
    ]
  },
  {
    "id": "A13",
    "description": "Unversioned status note marker timestamp denied",
    "file": "tests/integration/college-admin-attendance.test.ts",
    "needles": [
      "DB045 rejects unversioned $label changes",
      "correction requires next version"
    ]
  },
  {
    "id": "A14",
    "description": "Attendance version-only changes without state denied",
    "file": "tests/integration/college-admin-attendance.test.ts",
    "needles": [
      "DB045 rejects version-only attendance rewrites"
    ]
  },
  {
    "id": "A15",
    "description": "Wrong learner or college in history event denied",
    "file": "tests/integration/college-admin-attendance.test.ts",
    "needles": [
      "tenant metadata from another college",
      "wrong learner membership"
    ]
  },
  {
    "id": "A16",
    "description": "Incorrect course delivery snapshot denied",
    "file": "tests/integration/college-admin-attendance.test.ts",
    "needles": [
      "wrong course delivery"
    ]
  },
  {
    "id": "A17",
    "description": "Faculty lacking exact delivery scope denied",
    "file": "tests/integration/college-admin-attendance.test.ts",
    "needles": [
      "Faculty without exact delivery teaching scope"
    ]
  },
  {
    "id": "A18",
    "description": "Attendance actor role spoof denied",
    "file": "tests/integration/college-admin-attendance.test.ts",
    "needles": [
      "unrecognized actor role",
      "actor claims COLLEGE_ADMIN using learner membership"
    ]
  },
  {
    "id": "A19",
    "description": "Event post-state mismatch denied",
    "file": "tests/integration/college-admin-attendance.test.ts",
    "needles": [
      "event does not match current row post-state"
    ]
  },
  {
    "id": "A20",
    "description": "Forged historical before-state denied at COMMIT",
    "file": "tests/integration/college-admin-attendance.test.ts",
    "needles": [
      "DB045 rejects an otherwise valid correction event with a forged previous snapshot at COMMIT"
    ]
  },
  {
    "id": "A21",
    "description": "Duplicate attendance event version denied",
    "file": "tests/integration/college-admin-attendance.test.ts",
    "needles": [
      "DB045 rejects duplicate immutable event versions"
    ]
  },
  {
    "id": "A22",
    "description": "Attendance current row cannot be hard deleted",
    "file": "tests/integration/college-admin-attendance.test.ts",
    "needles": [
      "delete from attendance_records where schedule_event_id=$1"
    ]
  },
  {
    "id": "A23",
    "description": "Attendance event UPDATE DELETE TRUNCATE denied",
    "file": "tests/integration/college-admin-attendance.test.ts",
    "needles": [
      "DB045 rejects in-place event changes, deletion and wholesale TRUNCATE"
    ]
  },
  {
    "id": "A24",
    "description": "Two competing corrections yield single version",
    "file": "tests/integration/college-admin-attendance.test.ts",
    "needles": [
      "DB045 two concurrent admin corrections with one row token cannot both commit"
    ]
  },
  {
    "id": "A25",
    "description": "Direct cross-college CORRECT event denied",
    "file": "tests/integration/college-admin-attendance.test.ts",
    "needles": [
      "DB045 rejects forged cross-college CORRECT event even with a real record"
    ]
  },
  {
    "id": "I26",
    "description": "Learner report treats retained PRESENT correctly",
    "file": "tests/integration/college-admin-attendance.test.ts",
    "needles": [
      "DB045 learner and Admin readers count persisted PRESENT exactly like a marked no-exception session"
    ]
  },
  {
    "id": "I27",
    "description": "Faculty and Admin attendance consumers use retained rows",
    "file": "tests/integration/faculty-c4-reports-audit-contact.test.ts",
    "needles": [
      "marks attendance, requires a reason for corrections, rejects stale tokens and retains audit history"
    ]
  },
  {
    "id": "I28",
    "description": "Clean registered PostgreSQL 17 replay with seed",
    "file": ".github/workflows/db045-grade-history-guards.yml",
    "needles": [
      "Disposable full registered replay and seed",
      "db:test:prepare"
    ]
  },
  {
    "id": "I29",
    "description": "Registered migration idempotence",
    "file": ".github/workflows/db045-grade-history-guards.yml",
    "needles": [
      "Registered migration idempotence",
      "npm run db:migrate"
    ]
  },
  {
    "id": "I30",
    "description": "DB06 parent tenant/composite FK protections persist",
    "file": "tests/db045-registered-grade-history-pg.test.mjs",
    "needles": [
      "DB045 attendance history retains validated composite record and delivery identity FKs"
    ]
  }
];
test("DB045 all original 30 numbered acceptance requirements have concrete executable witnesses", () => {
  assert.equal(witnesses.length, 30);
  assert.equal(new Set(witnesses.map(w => w.id)).size, 30);
  assert.deepEqual(witnesses.map(w=>w.id), [
    ...Array.from({length:9},(_,i)=>"G"+String(i+1).padStart(2,"0")),
    ...Array.from({length:16},(_,i)=>"A"+String(i+10).padStart(2,"0")),
    ...Array.from({length:5},(_,i)=>"I"+String(i+26).padStart(2,"0")),
  ]);
  const workflow = readFileSync(".github/workflows/db045-grade-history-guards.yml","utf8");
  for(const witness of witnesses){
    const source=readFileSync(witness.file,"utf8");
    assert.ok(witness.needles.length >= 1, witness.id+": missing concrete assertion");
    for(const needle of witness.needles)
      assert.ok(source.includes(needle), witness.id+" missing source: "+needle);
    if(witness.file!==".github/workflows/db045-grade-history-guards.yml")
      assert.ok(workflow.includes(witness.file), witness.id+": integration file not executed in PostgreSQL acceptance workflow");
  }
  for(const gate of ["db:journal:verify","db:test:prepare","db:migrate","DB045_DISPOSABLE_PG"])
    assert.ok(workflow.includes(gate),"Missing registered PG17 gate "+gate);
});
