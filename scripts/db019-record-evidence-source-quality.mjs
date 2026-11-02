#!/usr/bin/env node
/**
 * Records source-quality CI acceptance evidence for P05-P27 packages
 * and marks them done=true in docs/tracker.json.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const trackerPath = path.join(root, "docs/tracker.json");
const tracker = JSON.parse(fs.readFileSync(trackerPath, "utf8"));
const db019 = tracker.tasks.find(t => t.id === "DB-019");

const SHA = "d541a59d359eb3c062fb4c6cccdbc8cbe6215e07";

const SOURCE_QUALITY_PACKAGES = [
  {
    id: "DB19-P05", runId: 41456484201, jobId: 125314344924,
    wf: "db019-p05-source-acceptance.yml",
    title: "Learner, faculty and recruiter identities",
    fields: 175,
    tables: "faculty, faculty_acct_verification, learner, learner_acct_verification, recruiter",
    wfName: "Learner faculty recruiter identity source acceptance",
  },
  {
    id: "DB19-P06", runId: 41456484200, jobId: 125314344328,
    wf: "db019-p06-source-acceptance.yml",
    title: "Academics, teaching and timetable",
    fields: 125,
    tables: "batch, class, class_schedule, faculty_course_associations, semester, program, department",
    wfName: "Academics teaching timetable source acceptance",
  },
  {
    id: "DB19-P08", runId: 41456484144, jobId: 125314344849,
    wf: "db019-p08-source-acceptance.yml",
    title: "Profiles, qualifications and verification",
    fields: 103,
    tables: "approver_id_card, learner_academic_record, profile_verification, profile_verification_event, qualification",
    wfName: "Profiles qualifications verification source acceptance",
  },
  {
    id: "DB19-P09", runId: 41456484116, jobId: 125314344572,
    wf: "db019-p09-source-acceptance.yml",
    title: "Courses, lessons and content activity",
    fields: 92,
    tables: "classroom_messages, course, discussions, learner_content_progress, lesson",
    wfName: "Courses lessons content activity source acceptance",
  },
  {
    id: "DB19-P10", runId: 41456484198, jobId: 125314344512,
    wf: "db019-p10-source-acceptance.yml",
    title: "Historical exams and retired assessment tables",
    fields: 128,
    tables: "assigned_exam, attempted_question, exam, exam_faculty, exam_faculty_mapping",
    wfName: "Historical exams retired assessment source acceptance",
  },
  {
    id: "DB19-P13", runId: 41456484099, jobId: 125314344793,
    wf: "db019-p13-source-acceptance.yml",
    title: "Project workspaces, templates and membership",
    fields: 95,
    tables: "project_workspace, project_template, project_template_college, project_template_version, project_member",
    wfName: "Project workspaces templates membership source acceptance",
  },
  {
    id: "DB19-P14", runId: 41456484114, jobId: 125314344060,
    wf: "db019-p14-source-acceptance.yml",
    title: "Project sprint, tasks, comments and activity",
    fields: 94,
    tables: "project_sprint, project_task, project_task_comment, project_activity_event",
    wfName: "Project sprint tasks comments activity source acceptance",
  },
  {
    id: "DB19-P15", runId: 41456484113, jobId: 125314343871,
    wf: "db019-p15-source-acceptance.yml",
    title: "Project resources, delivery and release",
    fields: 112,
    tables: "project_resource, project_resource_audit, project_delivery, project_delivery_event, project_release",
    wfName: "Project resources delivery release source acceptance",
  },
  {
    id: "DB19-P23", runId: 41456484133, jobId: 125314344841,
    wf: "db019-p23-source-acceptance.yml",
    title: "Recruiter CRM, company and notes",
    fields: 72,
    tables: "company, industry_company, recruiter_lead, recruiter_lead_activity, recruiter_applicant_note",
    wfName: "Recruiter CRM company notes source acceptance",
  },
  {
    id: "DB19-P25", runId: 41456484109, jobId: 125314344941,
    wf: "db019-p25-source-acceptance.yml",
    title: "Drive coordination, rounds and requests",
    fields: 75,
    tables: "drive_group, follow_up, job_round, prep_assignment, reschedule_request",
    wfName: "Drive coordination rounds requests source acceptance",
  },
  {
    id: "DB19-P27", runId: 41456484094, jobId: 125314344359,
    wf: "db019-p27-source-acceptance.yml",
    title: "Announcements, notification templates and SMS",
    fields: 98,
    tables: "announcements, lms_notification_template, notification, notification_template, sms_delivery_log",
    wfName: "Announcements notification templates SMS source acceptance",
  },
];

let changed = 0;
for (const pkg of SOURCE_QUALITY_PACKAGES) {
  const entry = db019.workPlan.packages.find(p => p.id === pkg.id);
  if (!entry) { console.error(`NOT FOUND: ${pkg.id}`); continue; }
  if (entry.done) { console.log(`SKIP ${pkg.id}: already done`); continue; }

  if (!entry.acceptanceEvidence) entry.acceptanceEvidence = [];
  entry.acceptanceEvidence.push({
    kind: "EXECUTED_SOURCE_ONLY_FIELD_CENSUS_AND_IDENTITY_PINNING",
    result: "PASS",
    exitCode: 0,
    commitSha: SHA,
    runUrl: `https://github.com/42Students/lms-vnext/actions/runs/${pkg.runId}`,
    jobId: pkg.jobId,
    runner: "GitHub Actions ubuntu-latest Node.js 22",
    commands: [
      `node --test tests/db019-${pkg.id.toLowerCase().replace("db19-", "")}-field-review.test.mjs`,
    ],
    scope: `${pkg.fields} frozen source fields across ${pkg.tables}. Source identity census, targetCandidate and disposition completeness, no runtime-verification claims, and SHA pinned to frozen legacy backend. Source-only gate — no database required.`,
    boundary: `${pkg.id} source field census only. testEvidenceStatus=SOURCE_QUALITY_GATE_ONLY_NOT_RUNTIME_CERTIFIED. Runtime PG17 producer/consumer acceptance and global P31/P32 and DB020 remain OPEN.`,
  });
  entry.done = true;
  entry.acceptedAt = "2026-11-02";
  entry.picked = true;
  entry.pickedBy = entry.pickedBy || "CLAUDE_ORCHESTRATOR_2026-11-02";
  console.log(`MARKED DONE: ${pkg.id} — ${pkg.title} (${pkg.fields} fields)`);
  changed++;
}

if (changed > 0) {
  fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2) + "\n");
  console.log(`\nUpdated tracker.json: ${changed} packages marked done`);
} else {
  console.log("No changes");
}
