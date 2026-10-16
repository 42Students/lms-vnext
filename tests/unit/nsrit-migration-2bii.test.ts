import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { sha256Hex } from "../../scripts/migrate/nsrit/common";
import { STAGE_2B_TABLES, STAGE_2BII_TABLES, snapshotDigest, toNdjson, type Manifest, type ManifestTable } from "../../scripts/migrate/nsrit/export-lib";
import {
  addMonthsIso,
  cgpaToHundredths,
  inferWorkMode,
  lpaToInr,
  lpaToString,
  mapApplicationStage,
  mapDeliveryStatus,
  mapGrantCapabilities,
  mapGrantVerification,
  mapJobLifecycle,
  mapOfferStatus,
  mapTaskStatus,
  mapWorkspaceStatus,
  parseCtcRange,
  pctToBasisPoints,
  projectKey,
  splitLocations,
  uniqueKey,
} from "../../scripts/migrate/nsrit/mappers-2bii";
import { buildPlan } from "../../scripts/migrate/nsrit/plan";
import { buildPlan2bii, type Plan2bii } from "../../scripts/migrate/nsrit/plan-2bii";
import { BondAmountPresentError, UnsupportedLegacyRowsError, companyKey } from "../../scripts/migrate/nsrit/plan-placements";
import { buildReconciliation2bii, reconciliationMarkdown2bii, rejectionReportMarkdown2bii } from "../../scripts/migrate/nsrit/reports-2bii";
import { stageIsConsistent } from "../../scripts/migrate/nsrit/reconcile-2bii";
import { REQUIRED_TABLES, type Snapshot } from "../../scripts/migrate/nsrit/snapshot";
import { ROLLBACK_ONLY_STATEMENTS, WRITE_TABLE_ALLOWLIST, assertStatementAllowed } from "../../scripts/migrate/nsrit/guards";
import { ROLLBACK_ORDER } from "../../scripts/migrate/nsrit/db";

type Row = Record<string, unknown>;

// Every value is synthetic: reserved example domains, fake phones, made-up names.
function fixtureTables(): Record<string, Row[]> {
  const tables: Record<string, Row[]> = Object.fromEntries([...REQUIRED_TABLES, ...STAGE_2B_TABLES, ...STAGE_2BII_TABLES].map((t) => [t, []]));
  tables.organization = [{ id: 6, name: "Synthetic Org", created_at: "2026-05-01 10:00:00", updated_at: "2026-05-01 10:00:00", is_deleted: 0 }];
  tables.college = [{ id: 6, name: "Synthetic College", unique_id: "synth42", org_id: 6, created_at: "2026-05-01 10:00:00", updated_at: "2026-05-01 10:00:00", is_deleted: 0 }];
  tables.department = [{ id: 1, name: "Computing", college_id: 6, is_deleted: 0, created_at: "2026-05-02 10:00:00" }];
  tables.new_program = [{ id: 10, dept_id: 1, name: "BTech CSE", duration_years: 4, is_deleted: 0 }];
  tables.batch = [{ id: 30, program_id: 10, batch_name: "2026 Batch", academic_year: "2026-27", current_semester: 1, status: "ACTIVE" }];
  tables.semester = [{ id: 20, program_id: 10, semester_number: 1, name: "Semester 1", is_active: 1, total_credits: 20 }];
  tables.class = [{ id: 40, program_id: 10, batch_id: 30, name: "Sec A", class_type: "SECTION", upper_limit: 60, lower_limit: 1 }];
  const learner = (id: number, extra: Row = {}): Row => ({
    id,
    college_id: 6,
    class_id: 40,
    first_name: `Learner${id}`,
    last_name: "Synthetic",
    contact_mobile: `98765430${String(id).padStart(2, "0")}`,
    contact_mail: `learner${id}@college.example.edu`,
    roll_number: `R${id}`,
    created_at: `2026-06-0${id} 09:00:00`,
    is_deleted: 0,
    ...extra,
  });
  tables.learner = [learner(1), learner(2), learner(3), learner(4), learner(5, { first_name: "E2E" }), learner(6)];
  const faculty = (id: number, extra: Row): Row => ({
    id,
    college_id: 6,
    organization_id: 6,
    first_name: `Faculty${id}`,
    last_name: "Synthetic",
    contact_mobile: `98765435${String(id).padStart(2, "0")}`,
    contact_mail: `faculty${id}@college.example.edu`,
    created_at: "2026-05-03 09:00:00",
    ...extra,
  });
  tables.faculty = [
    faculty(1, { faculty_type: 4, dept_id: 1 }), // college admin
    faculty(2, { faculty_type: 13, dept_id: 1 }), // mentor
    faculty(3, { faculty_type: 14, first_name: "Test", dept_id: 1 }), // TPO rejected as test data
  ];
  // recruiters: 7 accepted, 8 test named, 9 shares a phone with learner 1
  tables.industry_company = [];
  tables.company = [
    { id: 1, name: "Acme Hiring", website: "https://www.acme.example.org/careers", is_deleted: 0, created_at: "2026-07-01 09:00:00", verified_by_42: 0 },
    { id: 2, name: "Globex Test Co", website: null, is_deleted: 0, created_at: "2026-07-01 09:00:00" },
    { id: 3, name: "Initech Ltd", website: "https://initech.example.org", is_deleted: 0, created_at: "2026-07-01 09:00:00" },
    { id: 4, name: "Initech Pvt Ltd", website: "https://initech-two.example.org", is_deleted: 0, created_at: "2026-07-02 09:00:00" },
    { id: 5, name: "Hooli", website: "https://hooli.example.org", is_deleted: 0, merged_into_company_id: 1 },
    { id: 6, name: "acme hiring", website: null, is_deleted: 0, created_at: "2026-07-03 09:00:00" },
  ];
  tables.company_domain = [
    { id: 1, company_id: 1, domain: "acme.example.org", verified_by_42: 1 },
    { id: 2, company_id: 3, domain: "acme.example.org", verified_by_42: 0 }, // conflicts with company 1
    { id: 3, company_id: 3, domain: "initech.example.org", verified_by_42: 0 },
  ];
  tables.company_alias = [{ id: 1, company_id: 3, alias: "Initech Technologies", alias_key: "initech technologies" }];
  tables.college_company = [
    { id: 1, college_id: 6, company_id: 1, trusted: 1, is_deleted: 0, created_at: "2026-07-01 09:00:00", join_link_opens: 1, join_link_joins: 0 },
    { id: 2, college_id: 6, company_id: 2, trusted: 0, is_deleted: 0 },
    { id: 3, college_id: 6, company_id: 3, trusted: 0, is_deleted: 0 },
  ];
  tables.recruiter = [
    { id: 7, first_name: "Recruiter", last_name: "Seven", contact_mobile: "9876543707", contact_mail: "r7@hire.example.org", designation: "Campus Recruiter", company_id: 1, created_at: "2026-07-02 09:00:00", is_deleted: 0 },
    { id: 8, first_name: "Test", last_name: "Recruiter", contact_mobile: "9876543708", contact_mail: "r8@hire.example.org", company_id: 1, is_deleted: 0 },
    { id: 9, first_name: "Recruiter", last_name: "Nine", contact_mobile: "9876543001", contact_mail: "r9@hire.example.org", company_id: 3, created_at: "2026-07-02 09:00:00", is_deleted: 0 },
  ];
  tables.recruiter_college_access = [
    { id: 70, recruiter_id: 7, college_id: 6, organization_id: 6, status: "ACTIVE", valid_until: null, granted_at: "2026-07-05 09:00:00", verification: "UNVERIFIED", is_deleted: 0, granted_by_user_id: 1 },
    { id: 71, recruiter_id: 7, college_id: 6, organization_id: 6, status: "REVOKED", valid_until: "2026-12-05 09:00:00", granted_at: "2026-06-05 09:00:00", revoked_at: "2026-06-20 09:00:00", revoke_reason: "Left the company", verification: "VERIFIED_DOMAIN", is_deleted: 0 },
    { id: 72, recruiter_id: 8, college_id: 6, organization_id: 6, status: "ACTIVE", is_deleted: 0 },
  ];
  tables.recruiter_college_access_capability = [
    { access_id: 70, capability: "DRIVE_REQUEST" },
    { access_id: 70, capability: "DRIVE_WORK" },
    { access_id: 70, capability: "COLLEGE_OVERVIEW" },
    { access_id: 71, capability: "COLLEGE_OVERVIEW" },
    { access_id: 72, capability: "DRIVE_WORK" },
  ];
  tables.tpo_college_settings = [{ college_id: 6, recruiter_access_months: 3 }];
  tables.placement_season = [{ id: 1, college_id: 6, name: "Placement Season 2026", start_date: "2026-07-01", end_date: null, is_current: 1, created_at: "2026-07-01 09:00:00" }];
  tables.app_setting = [
    { id: 1, scope_type: "COLLEGE", scope_id: 6, setting_key: "module.placements.enabled", setting_value: "true" },
    { id: 2, scope_type: "COLLEGE", scope_id: 6, setting_key: "module.projects.enabled", setting_value: "false" },
    { id: 3, scope_type: "COLLEGE", scope_id: 6, setting_key: "module.unknown.enabled", setting_value: "true" },
  ];
  tables.job = [
    // 10: published, role options, eligibility, one round, 2 applications
    {
      id: 10, college_id: 6, company_id: 1, job_title: "Software Engineer", job_type: "Full-time", location: "Hyderabad (hybrid)", lifecycle_status: "PUBLISHED",
      posted_date: "2026-07-10 09:00:00", application_deadline: "2026-09-30 18:00:00", season_id: 1, created_by: 2, created_at: "2026-07-09 09:00:00", is_deleted: 0, category: "DREAM",
      job_description: "Build things", ctc_range: "6 LPA", drive_mode: "ON_CAMPUS",
      role_options_json: [
        { name: "SDE", ctcLpa: 6, fixedLpa: 5, variableLpa: 1, joiningBonusLpa: 0.5, bondMonths: 12 },
        { name: "SDE", ctcLpa: 7 },
      ],
      eligibility_json: { minCgpa: 6.555, tenthMinPct: 60.125, passingYears: [2026, 1900, 2027], batchIds: [30, 99], branches: ["CSE", "MECH"], verifiedMarksOnly: true, minPctThroughout: 75 },
      target_class_id: 40,
    },
    // 11: request -> draft, stipend only, no season, no role options, company by name
    { id: 11, college_id: 6, company_id: null, company_name: "Initech", job_title: "Data Intern", job_type: "Internship", location: "Remote", lifecycle_status: "REQUEST", ctc_range: "₹25,000 a month", created_at: "2026-07-11 09:00:00", is_deleted: 0 },
    // 12: cancelled
    { id: 12, college_id: 6, company_id: 3, job_title: "Analyst", job_type: "Full-time", lifecycle_status: "CANCELLED", posted_date: "2026-07-12 09:00:00", cancelled_at: "2026-08-01 09:00:00", season_id: 1, is_deleted: 0 },
    // 13: test named, 14: soft deleted, 15: company rejected
    { id: 13, college_id: 6, company_id: 1, job_title: "QA live check drive", job_type: "Full-time", lifecycle_status: "DRAFT", is_deleted: 0 },
    { id: 14, college_id: 6, company_id: 1, job_title: "Old drive", job_type: "Full-time", lifecycle_status: "DRAFT", is_deleted: 1 },
    { id: 15, college_id: 6, company_id: 2, job_title: "Rejected company drive", job_type: "Full-time", lifecycle_status: "DRAFT", is_deleted: 0 },
    // 16: off campus with an external URL and no applications
    // 16: off campus with an external URL and one internal application -> hybrid; 17: same without applications -> external only
    { id: 16, college_id: 6, company_id: 3, job_title: "Off campus analyst", job_type: "Full-time", lifecycle_status: "PUBLISHED", drive_mode: "OFF_CAMPUS", external_apply_url: "https://apply.example.org/x", posted_date: "2026-07-13 09:00:00", season_id: 1, is_deleted: 0 },
    { id: 17, college_id: 6, company_id: 3, job_title: "Off campus analyst two", job_type: "Contract", drive_mode: "OFF_CAMPUS", external_apply_url: "https://apply.example.org/y", lifecycle_status: "CLOSED", closed_at: "2026-09-01 09:00:00", posted_date: "2026-07-14 09:00:00", season_id: 1, is_deleted: 0 },
  ];
  tables.job_round = [
    { id: 100, job_id: 10, seq: 1, kind: "TEST", name: "Online test", mode: "VIRTUAL", status: "COMPLETED", scheduled_date: "2026-08-10 10:00:00", meeting_url: "https://meet.example.org/t", created_at: "2026-07-20 09:00:00" },
    { id: 101, job_id: 10, seq: 2, kind: "INTERVIEW", name: "Interview", mode: "IN_PERSON", status: "SCHEDULED", scheduled_date: "2026-08-20 10:00:00", venue: "Seminar Hall" },
    { id: 102, job_id: 10, seq: 3, kind: "GD", name: "Group discussion", mode: "ON_CAMPUS", status: "SCHEDULED" }, // no date: becomes PENDING
    { id: 103, job_id: 10, seq: 4, kind: "INTERVIEW", name: "HR", mode: null, status: "COMPLETED", scheduled_date: null, updated_at: "2026-08-25 09:00:00" }, // completed without detail
    { id: 104, job_id: 13, seq: 1, kind: "TEST", name: "Round of rejected drive", status: "PENDING" },
  ];
  tables.round_slot = [{ id: 1, round_id: 101, starts_at: "2026-08-20 10:00:00", ends_at: "2026-08-20 10:30:00", room: "Room 1", panel: "Panel A", capacity: 2, status: "CONFIRMED" }];
  tables.round_assignment = [
    { id: 1, round_id: 101, application_id: 1000, slot_id: 1 },
    { id: 2, round_id: 101, application_id: 1001, slot_id: 1 },
  ];
  const app = (id: number, learnerId: number, status: string, extra: Row = {}): Row => ({
    id,
    job_id: 10,
    learner_id: learnerId,
    application_status: status,
    applied_at: `2026-07-15 0${id % 10}:00:00`,
    created_at: "2026-07-15 08:00:00",
    updated_at: "2026-08-30 09:00:00",
    status_updated_at: "2026-08-02 09:00:00",
    is_deleted: 0,
    ...extra,
  });
  tables.job_application = [
    app(1000, 1, "HIRED"),
    app(1001, 2, "REJECTED", { rejection_reason: "Not cleared: Online test" }),
    app(1002, 3, "APPLIED"),
    app(1003, 4, "REJECTED", { rejection_reason: "Not a fit" }), // screening rejection
    app(1004, 1, "APPLIED", { job_id: 10 }), // duplicate learner + role
    app(1005, 5, "APPLIED"), // learner rejected as test data
    app(1006, 2, "WITHDRAWN", { job_id: 12, withdrawal_reason: "Found another job" }),
    app(1007, 3, "INTERVIEW", { job_id: 16 }),
    app(1008, 4, "BOGUS", { job_id: 10 }),
    app(1009, 4, "APPLIED", { job_id: 13 }), // job rejected
    app(1010, 6, "OFFERED", { applied_by_college: 1 }),
  ];
  tables.job_application_status_history = [
    { id: 1, application_id: 1000, old_status: "APPLIED", new_status: "SHORTLISTED", changed_at: "2026-07-20 09:00:00", changed_by: 2 },
    { id: 2, application_id: 1000, old_status: "SHORTLISTED", new_status: "INTERVIEW", changed_at: "2026-07-21 09:00:00", changed_by: 2 },
    { id: 3, application_id: 1999, old_status: "APPLIED", new_status: "SHORTLISTED", changed_at: "2026-07-21 09:00:00", changed_by: 2 },
  ];
  tables.application_screening = [{ id: 1, application_id: 1000, overall_score: null }];
  tables.round_result = [
    { id: 1, round_id: 100, application_id: 1000, outcome: "PASS", score: "81.5", submitted_at: "2026-08-11 09:00:00", applied_at: "2026-08-11 10:00:00", applied_by: 2, submitted_by_type: "FACULTY", submitted_by_id: 2 },
    { id: 2, round_id: 100, application_id: 1001, outcome: "PASS", score: "30", submitted_at: "2026-08-11 09:00:00", applied_at: "2026-08-11 10:00:00" },
    { id: 3, round_id: 100, application_id: 1001, outcome: "FAIL", score: "55", submitted_at: "2026-08-12 09:00:00", applied_at: "2026-08-12 10:00:00" }, // newer wins, earlier superseded
    { id: 4, round_id: 101, application_id: 1000, outcome: "HOLD", waitlist_rank: null, submitted_at: "2026-08-21 09:00:00" }, // invalid: HOLD needs a rank
    { id: 5, round_id: 100, application_id: 9999, outcome: "PASS" },
    { id: 6, round_id: 104, application_id: 1009, outcome: "PASS" },
  ];
  tables.job_offer = [
    { id: 1, application_id: 1000, kind: "OFFER", status: "ACCEPTED", role_option_name: "SDE", ctc_lpa: "6.00", fixed_lpa: "5.00", variable_lpa: "1.00", joining_bonus_lpa: "0.50", released_at: "2026-08-26 09:00:00", respond_by: "2026-09-05 09:00:00", responded_at: "2026-08-27 09:00:00", acceptance_channel: "IN_APP", created_by_id: 2, created_at: "2026-08-26 09:00:00", cascade_id: "9c900047-d39c-47ba-aa46-de50b8b4a7a1" },
    { id: 2, application_id: 1010, kind: "OFFER", status: "RELEASED", role_option_name: "SDE", ctc_lpa: "6.50", released_at: "2026-08-26 09:00:00", respond_by: "2026-08-26 08:00:00", created_at: "2026-08-26 09:00:00" }, // expiry before issue
    { id: 3, application_id: 1010, kind: "OFFER", status: "RELEASED", role_option_name: "SDE", ctc_lpa: "7.00", released_at: "2026-08-28 09:00:00", created_at: "2026-08-28 09:00:00" }, // newer active offer supersedes #2
    { id: 4, application_id: 1002, kind: "OFFER", status: "WEIRD", ctc_lpa: "1.00" },
    { id: 5, application_id: 4242, kind: "OFFER", status: "RELEASED" },
  ];
  tables.placement_batch = [{ batch_id: 30, college_id: 6, invited_at: "2026-07-01 09:00:00", registration_deadline: "2026-07-31 18:00:00", created_at: "2026-07-01 09:00:00" }];
  tables.placement_registration = [
    { id: 1, learner_id: 1, season_id: 1, choice: "PLACEMENTS", consent_version: "v1", consent_at: "2026-07-02 09:00:00", source: "SELF" },
    { id: 2, learner_id: 2, season_id: 1, choice: "HIGHER_STUDIES", source: "SELF" },
    { id: 3, learner_id: 3, season_id: 1, choice: "PLACEMENTS", consent_version: null, consent_at: null, source: "SELF" }, // no consent
    { id: 4, learner_id: 4, season_id: 1, choice: "BOGUS", source: "SELF" },
    { id: 5, learner_id: 5, season_id: 1, choice: "PLACEMENTS", consent_version: "v1", consent_at: "2026-07-02 09:00:00" },
  ];
  tables.placement_eligibility = [
    { id: 1, college_id: 6, scope_type: "BATCH", scope_id: 30, status: "ELIGIBLE", decided_by_type: "TPO", decided_by_id: 3, decided_at: "2026-07-03 09:00:00" },
    { id: 2, college_id: 6, scope_type: "LEARNER", scope_id: 2, status: "INELIGIBLE", reason: "Backlogs", decided_by_type: "TPO", decided_by_id: 3, decided_at: "2026-07-03 09:00:00" },
    { id: 3, college_id: 6, scope_type: "LEARNER", scope_id: 3, status: "INELIGIBLE", decided_at: "2026-07-03 09:00:00" }, // reason required
    { id: 4, college_id: 6, scope_type: "BATCH", scope_id: 77, status: "ELIGIBLE" },
  ];
  tables.placement_eligibility_event = [{ id: 1, college_id: 6, scope_type: "BATCH", scope_id: 30 }];
  tables.learner_saved_job = [{ id: 1, learner_id: 1, job_id: 10, created_at: "2026-07-16 09:00:00" }, { id: 2, learner_id: 1, job_id: 13 }];
  tables.job_preferences = [{ id: 1, learner_id: 2, role_preference: "Engineer", specific_role_preference: "Backend", work_shift_preference: "Day Shift", preferred_employment_city: "Pune", job_notifications_enabled: 0, is_deleted: 0 }];

  // ---- projects
  tables.project_template = [
    { id: 1, slug: "real-template", title: "Real Template", lifecycle_status: "PUBLISHED", template_version: 1, college_id: 6, created_by: 2, is_deleted: 0, created_at: "2026-07-01 09:00:00", overview: { goal: "Ship", deliverables: ["App"] }, sprints: [{ key: "s1", title: "Sprint 1" }], tasks: [{ key: "t1", sprintKey: "s1", title: "Task 1" }], resources: [] },
    { id: 2, slug: "e2e-template", title: "E2E Template 1", lifecycle_status: "DRAFT", template_version: 1, college_id: 6, is_deleted: 0 },
    { id: 3, slug: "gone", title: "Gone", lifecycle_status: "ARCHIVED", is_deleted: 1 },
  ];
  tables.project_template_version = [
    { id: 1, template_id: 1, template_version: 1, lifecycle_status: "PUBLISHED", snapshot_json: { sprints: [{ key: "s1", title: "Sprint 1" }], tasks: [], resources: [], overview: {} }, changed_by: 2 },
    { id: 2, template_id: 1, template_version: 1, lifecycle_status: "PUBLISHED" }, // duplicate version number
  ];
  tables.project_template_college = [{ id: 1, template_id: 1, college_id: 6, assigned_by: 2, is_deleted: 0, created_at: "2026-07-02 09:00:00" }, { id: 2, template_id: 2, college_id: 6 }];
  tables.project_workspace = [
    { id: 1, slug: "alpha-team", title: "Alpha Project", status: "ACTIVE", template_id: 1, created_by: 2, created_at: "2026-08-01 09:00:00", updated_at: "2026-09-01 09:00:00", progress: 10, is_deleted: 0, overview: { goal: "Alpha goal" } },
    { id: 2, slug: "beta", title: "Beta Project", status: "IN_PROGRESS", template_id: 2, created_by: 2, created_at: "2026-08-01 09:00:00", progress: 0, is_deleted: 0 }, // own template rejected: synthetic one
    { id: 3, slug: "old", title: "Old Project", status: "ARCHIVED", is_deleted: 0 },
    { id: 4, slug: "dead", title: "Dead Project", status: "ACTIVE", is_deleted: 1 },
    { id: 5, slug: "e2e", title: "E2E Workspace 123", status: "ACTIVE", is_deleted: 0 },
    { id: 6, slug: "weird", title: "Weird Project", status: "WEIRD", is_deleted: 0 },
  ];
  tables.project_member = [
    { id: 1, project_id: 1, user_id: 2, user_type: "FACULTY", role_label: "Project Mentor", member_status: "ACTIVE", is_deleted: 0, created_at: "2026-08-01 09:00:00" },
    { id: 2, project_id: 1, user_id: 1, user_type: "LEARNER", role_label: "Lead", is_deleted: 0 },
    { id: 3, project_id: 1, user_id: 2, user_type: "LEARNER", role_label: "Contributor", is_deleted: 1, updated_at: "2026-09-01 09:00:00" }, // removed member keeps history
    { id: 4, project_id: 1, user_id: 1, user_type: "LEARNER", is_deleted: 0 }, // duplicate active member
    { id: 5, project_id: 1, user_id: 99, user_type: "LEARNER", is_deleted: 0 }, // not loaded
    { id: 6, project_id: 3, user_id: 1, user_type: "LEARNER", is_deleted: 0 }, // workspace rejected
    { id: 7, project_id: 2, user_id: 1, user_type: "FACULTY", is_deleted: 0 }, // faculty id 1 (admin) is loaded
  ];
  tables.project_release = [{ id: 1, project_id: 1, release_key: "release-one", title: "Release One", status: "SHIPPED", sort_order: 0 }];
  tables.project_sprint = [
    { id: 1, project_id: 1, sprint_key: "sprint-1", title: "Sprint 1", sprint_state: "ACTIVE", release_id: 1, sprint_number: 1, sort_order: 0, goal: "Goal 1" },
    { id: 2, project_id: 1, sprint_key: "sprint-2", title: "Sprint 2", sprint_state: "ACTIVE", release_id: 1, sprint_number: 2, sort_order: 1 }, // second ACTIVE is demoted
    { id: 3, project_id: 1, sprint_key: "sprint-3", title: "Sprint 3", sprint_state: "COMPLETED", release_id: null, sprint_number: 3, sort_order: 2 },
    { id: 4, project_id: 1, sprint_key: "sprint-4", title: "Sprint 4", sprint_state: "NOPE", sprint_number: 4 },
  ];
  tables.project_task = [
    { id: 1, project_id: 1, task_key: "task-a", title: "Task A", task_status: "DONE", priority: "HIGH", sprint_key: "sprint-1", assignee_id: 1, assignee_type: "LEARNER", estimate_points: 5, task_type: "STORY", sort_order: 0, due_date: "2026-09-10" },
    { id: 2, project_id: 1, task_key: "task-b", title: "Task B", task_status: "BLOCKED", priority: "URGENT", sprint_key: "sprint-1", blocker_reason: null, assignee_id: 99, assignee_type: "LEARNER", estimate_points: 2000, sort_order: 1 },
    { id: 3, project_id: 1, task_key: "task-c", title: "Task C", task_status: "TO_DO", sprint_key: null, sort_order: 2 }, // backlog sprint
    { id: 4, project_id: 1, task_key: "task-d", title: "E2E check of the build", task_status: "TO_DO", sprint_key: "sprint-1", sort_order: 3 }, // E2E named
    { id: 8, project_id: 1, task_key: "task-h", title: "Write unit tests for the parser", task_status: "TO_DO", sprint_key: "sprint-1", sort_order: 4 }, // a real task about tests stays
    { id: 5, project_id: 1, task_key: "task-e", title: "Gone task", task_status: "TO_DO", sprint_key: "sprint-1", is_deleted: 1 },
    { id: 6, project_id: 1, task_key: "task-f", title: "Odd status", task_status: "???", sprint_key: "sprint-1" },
    { id: 7, project_id: 3, task_key: "task-g", title: "Task of archived project", task_status: "DONE" },
  ];
  tables.project_task_comment = [
    { id: 1, project_id: 1, project_task_id: 1, commenter_id: 1, commenter_type: "LEARNER", message: "Looks good", created_at: "2026-09-02 09:00:00", is_deleted: 0 },
    { id: 2, project_id: 1, project_task_id: 5, commenter_id: 1, commenter_type: "LEARNER", message: "On a removed task", is_deleted: 0 },
    { id: 3, project_id: 1, project_task_id: 1, commenter_id: 99, commenter_type: "LEARNER", message: "Unknown author", is_deleted: 0 },
  ];
  tables.project_resource = [
    { id: 1, project_id: 1, resource_key: "r1", title: "Spec", resource_kind: "Link", resource_url: "https://docs.example.org/spec", visibility: "Mentor Only", is_required: 1, resource_order: 0, is_deleted: 0 },
    { id: 2, project_id: 1, resource_key: "r2", title: "Slides", resource_kind: "PDF", file_url: "https://storage.example.org/o/slides.pdf", visibility: "Shared", is_deleted: 0, resource_order: 1 },
  ];
  tables.project_meeting = [
    { id: 1, project_id: 1, meeting_key: "m1", title: "Kickoff", meeting_status: "SCHEDULED", meeting_type: "GENERAL", meeting_date: "2026-09-05", start_time: "15:30:00.000000", end_time: "16:00:00.000000", timezone: "Asia/Calcutta", meet_link: null, created_by: 2, created_by_type: "FACULTY", is_deleted: 0, linked_task_key: "task-a", linked_sprint_key: "sprint-1" },
    { id: 2, project_id: 1, meeting_key: "m2", title: "Demo", meeting_status: "SCHEDULED", meeting_type: "RETRO", meeting_date: "2026-09-06", start_time: "10:00:00", end_time: null, meet_link: "https://meet.example.org/demo", organizer_id: 2, created_by: 2, is_deleted: 0 },
    { id: 3, project_id: 1, meeting_key: "m3", title: "Gone", meeting_status: "REQUESTED", is_deleted: 1 },
  ];
  tables.project_delivery = [
    { id: 1, project_id: 1, status: "Submitted", review_status: "Approved", notes: "Final build", submitted_at: "2026-09-20 09:00:00", submitted_by_id: 1, submitted_by_type: "LEARNER", reviewed_at: "2026-09-21 09:00:00", reviewed_by_id: 2, reviewed_by_type: "FACULTY", source_url: "https://git.example.org/repo", attachment_url: "https://storage.example.org/a.zip", is_deleted: 0 },
    { id: 2, project_id: 3, status: "Draft", is_deleted: 0 },
  ];
  tables.project_delivery_event = [
    { id: 1, project_id: 1, delivery_id: 1, action: "LOCKED", actor_id: 2, actor_type: "FACULTY", created_at: "2026-09-21 10:00:00", is_deleted: 0 },
    { id: 2, project_id: 1, delivery_id: 1, action: "DRAFT_SAVED", actor_id: 2, actor_type: "FACULTY", is_deleted: 0 },
  ];

  // ---- notifications
  tables.notification = [
    { id: 1, learner_id: 1, title: "New task assigned", message: "You were assigned Task A", is_read: 0, is_deleted: 0, created_at: "2026-09-02 09:00:00", updated_at: "2026-09-02 09:00:00", notification_type: "PROJECT" },
    { id: 2, learner_id: 1, title: "Meeting requested", message: "Alpha Project meeting", is_read: 1, is_deleted: 0, created_at: "2026-09-03 09:00:00", updated_at: "2026-09-04 09:00:00", notification_type: "PROJECT" },
    { id: 3, learner_id: 1, title: "Removed", message: "Deleted", is_deleted: 1 },
    { id: 4, learner_id: null, title: "Class notice", message: "For faculty", is_deleted: 0 },
    { id: 5, learner_id: 99, title: "Unknown learner", message: "x", is_deleted: 0 },
    { id: 6, learner_id: 1, title: "About a test project", message: "Task in Old Project changed", is_deleted: 0, created_at: "2026-09-05 09:00:00" }, // mentions a rejected workspace title
    { id: 7, learner_id: 1, title: "Application Submitted", message: "Applied", application_id: 9999, is_deleted: 0 }, // application not loaded
    { id: 8, learner_id: 1, title: "E2E notice", message: "nope", is_deleted: 0 },
    { id: 9, learner_id: 2, title: "Offer", message: "Your offer is ready", application_id: 1000, is_deleted: 0, is_read: 0, created_at: "2026-08-26 09:00:00", notification_type: "JOB" },
    { id: 10, learner_id: 2, title: "", message: "no title", is_deleted: 0 },
  ];
  return tables;
}

function toSnapshot(tables: Record<string, Row[]>): Snapshot {
  const manifestTables: Record<string, ManifestTable> = {};
  for (const [name, rows] of Object.entries(tables)) {
    manifestTables[name] = { file: `${name}.ndjson`, rows: rows.length, sha256: sha256Hex(toNdjson(rows)), scope: "synthetic", columns: [], deniedColumns: [], scrubbedJsonKeys: 0 };
  }
  const manifest: Manifest = {
    format: "nsrit-snapshot-1",
    exporter: "test",
    legacyDatabase: "synthetic",
    exportedAt: "2026-10-16T00:00:00Z",
    college: { legacyCollegeId: 6, legacyOrgId: 6 },
    snapshotSha256: snapshotDigest(manifestTables),
    tables: manifestTables,
  };
  return { dir: "memory", manifest, tables };
}

const TODAY = new Date("2026-10-16T00:00:00Z");
function plans(mutate?: (tables: Record<string, Row[]>) => void) {
  const tables = fixtureTables();
  mutate?.(tables);
  const snapshot = toSnapshot(tables);
  const base = buildPlan(snapshot, { today: TODAY });
  const plan = buildPlan2bii(snapshot, base, { asOf: TODAY });
  return { base, plan, snapshot };
}
const rejected = (plan: Plan2bii, entity: string) => Object.fromEntries(Object.entries(plan.stats[entity]?.rejected ?? {}));
const byLegacy = <T>(items: { legacyId: string; data: T }[], id: string) => items.find((i) => i.legacyId === id)?.data;

// ------------------------------------------------------------------ mappers

describe("stage 2b-ii mappers", () => {
  it("converts LPA to rupees and strings without losing precision", () => {
    expect(lpaToInr("4.5")).toBe(450000);
    expect(lpaToInr(3.36)).toBe(336000);
    expect(lpaToInr("abc")).toBeNull();
    expect(lpaToInr(-1)).toBeNull();
    expect(lpaToInr(100_000)).toBeNull(); // beyond int4
    expect(lpaToString("6")).toBe("6.00");
    expect(lpaToString("0.5")).toBe("0.50");
    expect(lpaToString(null)).toBeNull();
    expect(lpaToString("-2")).toBeNull();
  });
  it("converts percentages and CGPA with round half up and counts rounded values", () => {
    const counter = { rounded: 0 };
    expect(pctToBasisPoints(75.25)).toBe(7525);
    expect(pctToBasisPoints(60.125, counter)).toBe(6013); // 6012.5 rounds half up
    expect(counter.rounded).toBe(1);
    expect(pctToBasisPoints(101)).toBeNull();
    expect(cgpaToHundredths(6.555)).toBe(656);
    expect(cgpaToHundredths(11)).toBeNull();
  });
  it("parses the free-text CTC range and keeps stipends out of annual CTC", () => {
    expect(parseCtcRange("3.36-7 LPA")).toEqual({ minInr: 336000, maxInr: 700000, stipendPerMonth: null });
    expect(parseCtcRange("4.5 LPA")).toEqual({ minInr: 450000, maxInr: 450000, stipendPerMonth: null });
    expect(parseCtcRange("₹25,000 a month")).toEqual({ minInr: null, maxInr: null, stipendPerMonth: 25000 });
    expect(parseCtcRange("negotiable")).toEqual({ minInr: null, maxInr: null, stipendPerMonth: null });
  });
  it("maps lifecycles: a drive request is a draft, deleted-style values are unknown", () => {
    expect(mapJobLifecycle("REQUEST")).toEqual({ status: "DRAFT", wasRequest: true });
    expect(mapJobLifecycle("CANCELLED")?.status).toBe("CANCELLED");
    expect(mapJobLifecycle("???")).toBeNull();
  });
  it("splits locations and infers the work mode", () => {
    expect(splitLocations("Hyderabad (hybrid), Chennai / Pune")).toEqual(["Hyderabad", "Chennai", "Pune"]);
    expect(inferWorkMode("Hyderabad (hybrid)")).toBe("HYBRID");
    expect(inferWorkMode("Remote")).toBe("REMOTE");
    expect(inferWorkMode("Chennai")).toBe("ONSITE");
  });
  it("maps application stages, offer statuses, and grant fields", () => {
    expect(mapApplicationStage("ASSESSMENT")).toBe("SHORTLISTED");
    expect(mapApplicationStage("HIRED")).toBe("HIRED");
    expect(mapApplicationStage("BOGUS")).toBeNull();
    expect(mapOfferStatus("RELEASED")).toBe("ISSUED");
    expect(mapOfferStatus("REVOKED")).toBe("WITHDRAWN");
    expect(mapOfferStatus("WEIRD")).toBeNull();
    expect(mapGrantVerification("VERIFIED_DOMAIN")).toBe("VERIFIED");
    expect(mapGrantVerification("UNVERIFIED")).toBe("PENDING");
    expect(mapGrantCapabilities(["DRIVE_REQUEST", "DRIVE_WORK", "COLLEGE_OVERVIEW"])).toEqual({ capabilities: ["DRIVES"], dropped: ["COLLEGE_OVERVIEW"], defaulted: false });
    expect(mapGrantCapabilities(["COLLEGE_OVERVIEW"])).toEqual({ capabilities: ["DRIVES"], dropped: ["COLLEGE_OVERVIEW"], defaulted: true });
  });
  it("adds calendar months with month-end clamping", () => {
    expect(addMonthsIso("2026-01-31T00:00:00.000Z", 1)).toBe("2026-02-28T00:00:00.000Z");
    expect(addMonthsIso("2026-07-05T03:30:00.000Z", 6)).toBe("2027-01-05T03:30:00.000Z");
  });
  it("makes project keys that satisfy the vNext key format and stay unique", () => {
    expect(projectKey("Sprint 1 - Loan fo...", "x")).toBe("sprint-1-loan-fo");
    expect(projectKey("***", "fallback")).toBe("fallback");
    const used = new Set<string>();
    expect(uniqueKey("task", used)).toBe("task");
    expect(uniqueKey("task", used)).toBe("task-2");
    expect(uniqueKey("task", used)).toBe("task-3");
    expect(projectKey("a".repeat(80), "x").length).toBeLessThanOrEqual(64);
  });
  it("maps task, workspace and delivery states", () => {
    expect(mapTaskStatus("TO_DO")).toBe("TODO");
    expect(mapTaskStatus("COMPLETED")).toBe("DONE");
    expect(mapTaskStatus("???")).toBeNull();
    expect(mapWorkspaceStatus("IN_PROGRESS")).toBe("ACTIVE");
    expect(mapDeliveryStatus("Submitted", "Approved")).toBe("APPROVED");
    expect(mapDeliveryStatus("Draft", null)).toBe("DRAFT");
    expect(companyKey("Infosys Pvt. Ltd.")).toBe("infosys");
  });
});

// -------------------------------------------------------------- placements

describe("stage 2b-ii placements planner", () => {
  const { base, plan } = plans();
  const p = plan.placements;

  it("rejects test, merged and duplicate companies, resolves domains, and synthesizes companies for jobs with no company id", () => {
    expect(rejected(plan, "company")).toEqual({ NAME_TESTWORD: 1, MERGED_COMPANY: 1, DUPLICATE_NAME: 1 });
    const acme = p.companies.find((c) => c.legacyId === "1")!;
    expect(acme.data.primaryDomain).toBe("acme.example.org");
    const initech = p.companies.find((c) => c.legacyId === "3")!;
    expect(initech.data.primaryDomain).toBe("initech.example.org"); // acme.example.org is owned by company 1
    // job 11 names "Initech": matches the key of companies 3 and 4 -> ambiguous -> synthesized
    expect(p.companies.some((c) => c.legacyType === "job_company_name")).toBe(true);
    expect(plan.notes.companySynthesizedAmbiguousName).toBe(1);
    expect(plan.notes.companyDomainConflictDropped).toBeGreaterThanOrEqual(1);
    // college_company of the rejected company is rejected with its parent
    expect(rejected(plan, "college_company")).toEqual({ PARENT_REJECTED: 1 });
  });
  it("loads an accepted recruiter as a platform user with a profile and grants that follow the access rules", () => {
    expect(p.recruiterUsers.map((u) => u.legacyId)).toEqual(["7"]);
    expect(rejected(plan, "recruiter")).toEqual({});
    expect(base.rejections.some((r) => r.entity === "recruiter" && r.legacyId === "8")).toBe(true);
    // recruiter 9 shares a phone with learner 1 and is blocked, never merged
    expect(plan.blocked.map((b) => b.legacyId)).toEqual(["9"]);
    const active = byLegacy(p.grants, "70")!;
    expect(active.status).toBe("ACTIVE");
    expect(active.verificationStatus).toBe("PENDING"); // legacy UNVERIFIED stays unverified, documented
    expect(active.capabilities).toEqual(["DRIVES"]);
    // no valid_until in legacy: granted_at + recruiter_access_months (3), converted from IST
    expect(active.validUntil).toBe(addMonthsIso(new Date("2026-07-05T03:30:00Z").toISOString(), 3));
    expect(plan.notes.grantValidityDerivedFromAccessMonths).toBe(1);
    expect(plan.notes.activeGrantNotVerified).toBe(1);
    const revoked = byLegacy(p.grants, "71")!;
    expect(revoked.status).toBe("REVOKED");
    expect(revoked.revokeReason).toBe("Left the company");
    expect(revoked.verificationStatus).toBe("VERIFIED");
    expect(revoked.revokedByUserId).toBeTruthy();
    expect(p.grants.find((g) => g.legacyId === "70")!.metadata?.unmapped).toMatchObject({ reasonIfUnverified: expect.any(String) });
    expect(rejected(plan, "recruiter_college_access")).toEqual({ PARENT_REJECTED: 1 });
    expect(p.recruiterProfiles[0].newId).toBe(p.recruiterUsers[0].newId); // profile keyed by user id
  });
  it("maps module switches and rejects unknown keys", () => {
    expect(p.moduleRules.map((r) => `${r.data.module}:${r.data.enabled}`).sort()).toEqual(["placements:true", "projects:false"]);
    expect(rejected(plan, "app_setting")).toEqual({ UNKNOWN_ENUM: 1 });
  });
  it("derives the season end date and defaults jobs without a season", () => {
    expect(p.season).toHaveLength(1);
    expect(p.season[0].data.endDate).toBe("2027-07-01");
    expect(p.season[0].data.status).toBe("ACTIVE");
    expect(plan.notes.jobSeasonDefaulted).toBeGreaterThanOrEqual(1);
  });
  it("loads real jobs with pay breakdown, dream flag, work mode and statuses; rejects test, deleted and parentless ones", () => {
    expect(rejected(plan, "job")).toEqual({ NAME_TESTWORD: 1, SOFT_DELETED: 1, PARENT_REJECTED: 1 });
    const job = byLegacy(p.jobs, "10")!;
    expect(job).toMatchObject({ status: "PUBLISHED", workMode: "HYBRID", isDream: true, employmentType: "FULL_TIME", locations: ["Hyderabad"] });
    expect(job.publishedAt).toBe("2026-07-10T03:30:00.000Z");
    expect(job.applicationDeadline).toBe("2026-09-30T12:30:00.000Z");
    expect(job.minimumAnnualCtcInr).toBe(600000);
    expect(job.maximumAnnualCtcInr).toBe(700000);
    const draft = byLegacy(p.jobs, "11")!;
    expect(draft.status).toBe("DRAFT");
    expect(draft.publishedAt).toBeNull();
    expect(draft.minimumAnnualCtcInr).toBeNull(); // stipend is not annual CTC
    expect(p.jobs.find((j) => j.legacyId === "11")!.metadata?.unmapped).toMatchObject({ wasDriveRequest: true, stipendOnly: 25000 });
    const cancelled = byLegacy(p.jobs, "12")!;
    expect(cancelled.status).toBe("CANCELLED");
    expect(cancelled.publishedAt).not.toBeNull();
    expect(cancelled.closedAt).toBe("2026-08-01T03:30:00.000Z");
    expect(byLegacy(p.jobs, "16")!.applicationMode).toBe("HYBRID"); // has an internal application
    expect(byLegacy(p.jobs, "17")).toMatchObject({ applicationMode: "EXTERNAL_ONLY", status: "CLOSED", employmentType: "CONTRACT" });
    expect(byLegacy(p.jobs, "17")!.externalApplicationUrl).toBe("https://apply.example.org/y");
    expect(plan.notes.jobDriveRequestLoadedAsDraft).toBe(1);
  });
  it("loads role options with the typed pay columns and never a bond amount", () => {
    const roles = p.roleOptions.filter((r) => r.legacyId.startsWith("10#"));
    expect(roles.map((r) => r.data.title)).toEqual(["SDE", "SDE (2)"]);
    expect(roles[0].data).toMatchObject({ fixedLpa: "5.00", variableLpa: "1.00", joiningBonusLpa: "0.50", bondMonths: 12, isPrimary: true, minimumAnnualCtcInr: 600000 });
    expect(roles[1].data.isPrimary).toBe(false);
    // a job with no role options gets one default option named after the job
    expect(p.roleOptions.filter((r) => r.legacyId.startsWith("11#"))).toHaveLength(1);
    const withBond = () =>
      plans((t) => {
        (t.job[0].role_options_json as Row[])[0].bondAmount = 50000;
      });
    expect(withBond).toThrow(BondAmountPresentError);
    const offerBond = () =>
      plans((t) => {
        t.job_offer[0].bond_amount = "1.00";
      });
    expect(offerBond).toThrow(BondAmountPresentError);
  });
  it("maps eligibility to basis points, hundredths, cohorts, sections and programs", () => {
    const policy = byLegacy(p.policies, "10")!;
    expect(policy.minCgpaHundredths).toBe(656);
    expect(policy.minTenthPctBasisPoints).toBe(6013);
    expect(policy.minPctThroughoutBasisPoints).toBe(7500);
    expect(policy.requireVerifiedEvidence).toBe(true);
    expect(policy.allowedPassingYears).toEqual([2026, 2027]);
    expect(policy.allowedCohortIds).toEqual([base.cohorts[0].newId]);
    expect(policy.allowedSectionIds).toEqual([base.sections[0].newId]);
    expect(policy.allowedProgramIds).toEqual([base.programs[0].newId]); // CSE matches, MECH does not
    expect(plan.notes.policyCohortUnmapped).toBe(1);
    expect(plan.notes.policyBranchUnmapped).toBe(1);
    expect(p.policies).toHaveLength(p.jobs.length);
  });
  it("normalizes rounds so every vNext lifecycle rule holds", () => {
    expect(rejected(plan, "job_round")).toEqual({ PARENT_REJECTED: 1 });
    const done = byLegacy(p.rounds, "100")!;
    expect(done).toMatchObject({ status: "COMPLETED", mode: "VIRTUAL", timezone: "Asia/Kolkata", sequence: 1 });
    expect(done.completedAt).not.toBeNull();
    expect(byLegacy(p.rounds, "101")).toMatchObject({ status: "SCHEDULED", mode: "ON_CAMPUS", venue: "Seminar Hall", meetingUrl: null });
    expect(byLegacy(p.rounds, "102")).toMatchObject({ status: "PENDING", scheduledAt: null, timezone: null });
    const forced = byLegacy(p.rounds, "103")!;
    expect(forced.status).toBe("COMPLETED");
    expect(forced.scheduledAt).toBe("2026-08-25T03:30:00.000Z");
    expect(forced.mode).toBe("ON_CAMPUS");
    expect(forced.venue).toMatch(/not recorded/i);
    expect(plan.notes.roundScheduledWithoutDateAsPending).toBe(1);
    expect(plan.notes.roundDeliveryDefaulted).toBe(1);
  });
  it("keeps per-slot booking counts and reports the per-learner assignment rows as having no vNext target", () => {
    expect(p.slots).toHaveLength(1);
    expect(p.slots[0].data).toMatchObject({ capacity: 2, bookedCount: 2, status: "BOOKED", meetingLocation: "Room 1", panelLabel: "Panel A", mode: "ON_CAMPUS" });
    expect(rejected(plan, "round_assignment")).toEqual({ NO_VNEXT_TARGET: 2 });
  });
  it("decomposes the legacy application status into submission, screening, results and offers", () => {
    expect(rejected(plan, "job_application")).toEqual({ DUPLICATE_SOURCE: 1, PERSON_NOT_LOADED: 1, UNKNOWN_ENUM: 1, PARENT_REJECTED: 1 });
    const ids = p.applications.map((a) => a.legacyId).sort();
    expect(ids).toEqual(["1000", "1001", "1002", "1003", "1006", "1007", "1010"]);
    // the application of a learner added by the college is submitted by an actor, not the learner
    const college = p.applications.find((a) => a.legacyId === "1010")!;
    expect(college.data.submittedByUserId).not.toBe(college.data.learnerUserId);
    expect(college.metadata?.unmapped).toMatchObject({ appliedByCollege: true });
    const withdrawn = p.applications.find((a) => a.legacyId === "1006")!;
    expect(withdrawn.data.status).toBe("WITHDRAWN");
    expect(withdrawn.data.withdrawnAt).not.toBeNull();
    const history = p.appHistory.filter((h) => h.data.applicationId === withdrawn.newId);
    expect(history.map((h) => `${h.data.fromStatus}>${h.data.toStatus}`)).toEqual(["null>SUBMITTED", "SUBMITTED>WITHDRAWN"]);
    const screening = (id: string) => p.screenings.find((s) => s.legacyId === id)!.data;
    expect(screening("1000").status).toBe("SHORTLISTED"); // hired
    expect(screening("1001").status).toBe("SHORTLISTED"); // rejected after a failed round
    expect(screening("1002").status).toBe("PENDING");
    expect(screening("1003")).toMatchObject({ status: "REJECTED", candidateMessage: "Not a fit" });
    expect(screening("1007").status).toBe("SHORTLISTED"); // interview
    expect(screening("1010").status).toBe("SHORTLISTED"); // offered
    // only the first decision (APPLIED -> SHORTLISTED/REJECTED) maps to screening history; the rest is derived
    expect(p.screeningHistory.length).toBe(p.screenings.filter((s) => s.data.status !== "PENDING").length);
    expect(rejected(plan, "job_application_status_history")).toEqual({ NO_VNEXT_TARGET: 1, PARENT_REJECTED: 1 });
    expect(rejected(plan, "application_screening")).toEqual({ NO_VNEXT_TARGET: 1 });
  });
  it("loads round results with versions, supersession, rounded scores and defaults for failing candidates", () => {
    expect(rejected(plan, "round_result")).toEqual({ INVALID_VALUE: 1, PARENT_REJECTED: 2 });
    const forApp = (id: string) => p.results.filter((r) => r.data.applicationId === p.applications.find((a) => a.legacyId === id)!.newId);
    const hired = forApp("1000");
    expect(hired).toHaveLength(1);
    expect(hired[0].data).toMatchObject({ outcome: "PASS", status: "APPLIED", scorePercent: 82, version: 1 });
    const second = forApp("1001").sort((a, b) => a.data.version - b.data.version);
    expect(second.map((r) => `${r.data.outcome}:${r.data.status}`)).toEqual(["PASS:SUPERSEDED", "FAIL:APPLIED"]);
    expect(second[1].data.candidateMessage).toBe("Not cleared: Online test");
    expect(second[0].data.supersededAt).not.toBeNull();
    expect(second[0].data.appliedAt).toBeNull();
  });
  it("loads offers with pay breakdown, history, superseded active offers and the right responder", () => {
    expect(rejected(plan, "job_offer")).toEqual({ UNKNOWN_ENUM: 1, PARENT_REJECTED: 1 });
    const accepted = byLegacy(p.offers, "1")!;
    expect(accepted).toMatchObject({ status: "ACCEPTED", annualCtcInr: 600000, fixedLpa: "5.00", variableLpa: "1.00", joiningBonusLpa: "0.50", bondMonths: null, acceptanceChannel: "IN_APP" });
    const learner = base.people.find((x) => x.legacyType === "learner" && x.legacyId === "1")!;
    expect(accepted.respondedByUserId).toBe(learner.newId);
    expect(accepted.cascadeId).toBe("9c900047-d39c-47ba-aa46-de50b8b4a7a1");
    const history = p.offerHistory.filter((h) => h.data.offerId === p.offers.find((o) => o.legacyId === "1")!.newId);
    expect(history.map((h) => h.data.toStatus)).toEqual(["ISSUED", "ACCEPTED"]);
    // two active offers on one application: the older one becomes WITHDRAWN, the newer stays ISSUED
    expect(byLegacy(p.offers, "2")).toMatchObject({ status: "WITHDRAWN", version: 1 });
    expect(byLegacy(p.offers, "2")!.revokeReason).toMatch(/superseded/i);
    expect(byLegacy(p.offers, "3")).toMatchObject({ status: "ISSUED", version: 2 });
    expect(plan.notes.offerSupersededWithdrawn).toBe(1);
    expect(plan.notes.offerExpiryNotAfterIssue).toBe(1);
  });
  it("exposes legacy-computed derived numbers for the reconciliation", () => {
    expect(p.facts.placedLearners).toEqual(["1"]);
    expect(p.facts.offerCtcInr).toBe(600000);
    const job10 = p.facts.jobs.find((j) => j.job === "10")!;
    expect(job10.accepted).toBe(1);
    expect(job10.ctcInr).toBe(600000);
    expect(p.facts.applications.find((a) => a.application === "1010")!.offers).toBe(2);
  });
  it("checks stage consistency against the loaded screening, results and offers", () => {
    expect(stageIsConsistent("HIRED", { status: "SUBMITTED", screening: "SHORTLISTED", accepted: 1, issued: 0, declinedOrWithdrawn: 0, failResults: 0 })).toBe(true);
    expect(stageIsConsistent("HIRED", { status: "SUBMITTED", screening: "SHORTLISTED", accepted: 0, issued: 1, declinedOrWithdrawn: 0, failResults: 0 })).toBe(false);
    expect(stageIsConsistent("REJECTED", { status: "SUBMITTED", screening: "SHORTLISTED", accepted: 0, issued: 0, declinedOrWithdrawn: 0, failResults: 1 })).toBe(true);
    expect(stageIsConsistent("REJECTED", { status: "SUBMITTED", screening: "SHORTLISTED", accepted: 0, issued: 0, declinedOrWithdrawn: 0, failResults: 0 })).toBe(false);
    expect(stageIsConsistent("APPLIED", { status: "SUBMITTED", screening: "PENDING", accepted: 0, issued: 0, declinedOrWithdrawn: 0, failResults: 0 })).toBe(true);
    expect(stageIsConsistent("WITHDRAWN", { status: "WITHDRAWN", screening: "PENDING", accepted: 0, issued: 0, declinedOrWithdrawn: 0, failResults: 0 })).toBe(true);
  });
  it("loads batch lifecycle, registrations (consent required), eligibility decisions, saved jobs and preferences", () => {
    expect(p.batchLifecycles).toHaveLength(1);
    expect(p.batchLifecycles[0].newId).toBe(base.cohorts[0].newId); // keyed by cohort id
    expect(p.registrations.map((r) => r.legacyId).sort()).toEqual(["1", "2"]);
    expect(p.registrations[0].data.source).toBe("BACKFILL");
    expect(byLegacy(p.registrations, "2")).toMatchObject({ choice: "HIGHER_STUDIES", consentAt: null, consentVersion: null });
    expect(rejected(plan, "placement_registration")).toEqual({ NO_CONSENT: 1, UNKNOWN_ENUM: 1, PERSON_NOT_LOADED: 1 });
    expect(p.decisions.map((d) => `${d.data.scopeType}:${d.data.status}`).sort()).toEqual(["COHORT:ELIGIBLE", "MEMBERSHIP:INELIGIBLE"]);
    expect(rejected(plan, "placement_eligibility")).toEqual({ INVALID_VALUE: 1, PARENT_REJECTED: 1 });
    expect(rejected(plan, "placement_eligibility_event")).toEqual({ AUDIT_HISTORY_SKIPPED: 1 });
    expect(p.savedJobs).toHaveLength(1);
    expect(rejected(plan, "learner_saved_job")).toEqual({ PARENT_REJECTED: 1 });
    expect(p.preferences[0].data).toMatchObject({ preferredRoleTitles: ["Engineer", "Backend"], preferredLocations: ["Pune"], shiftPreference: "DAY", notifyMatchingJobs: false });
  });
  it("stops (instead of dropping rows silently) when a table without a loader has rows", () => {
    for (const table of ["placement_debarment", "external_placement", "learner_academic_record", "interview"]) {
      expect(() => plans((t) => (t[table] = [{ id: 1 }]))).toThrow(UnsupportedLegacyRowsError);
    }
  });
  it("reuses a global company that already exists under another owner instead of duplicating it", () => {
    const tables = fixtureTables();
    const snapshot = toSnapshot(tables);
    const base2 = buildPlan(snapshot, { today: TODAY });
    const existing = "11111111-1111-4111-8111-111111111111";
    const out = buildPlan2bii(snapshot, base2, { asOf: TODAY, externalCompanies: { byName: new Map([["acme hiring", existing]]), byDomain: new Map() } });
    expect(out.placements.reusedCompanies.map((c) => c.newId)).toEqual([existing]);
    expect(out.placements.companies.some((c) => c.legacyId === "1")).toBe(false);
    // the relationship points at the existing company
    expect(out.placements.relationships.some((r) => r.data.companyId === existing)).toBe(true);
  });
});

// ------------------------------------------------------------------ projects

describe("stage 2b-ii projects planner", () => {
  const { plan } = plans();
  const q = plan.projects;

  it("rejects archived, deleted, test and unknown workspaces and their children", () => {
    expect(rejected(plan, "project_workspace")).toEqual({ ARCHIVED_WORKSPACE: 1, SOFT_DELETED: 1, NAME_E2E: 1, UNKNOWN_ENUM: 1 });
    expect(q.instances.map((i) => i.legacyId)).toEqual(["1", "2"]);
    expect(rejected(plan, "project_member").PARENT_REJECTED).toBe(1);
    expect(rejected(plan, "project_delivery")).toEqual({ PARENT_REJECTED: 1 });
    expect(rejected(plan, "project_task").PARENT_REJECTED).toBe(1);
  });
  it("uses the workspace's own template when loaded, otherwise a synthetic archived one", () => {
    expect(rejected(plan, "project_template")).toEqual({ NAME_E2E: 1, SOFT_DELETED: 1 });
    const alpha = q.instances.find((i) => i.legacyId === "1")!;
    const real = q.templates.find((t) => t.legacyId === "1" && t.legacyType === "project_template")!;
    expect(alpha.data.templateId).toBe(real.newId);
    expect(real.data.status).toBe("PUBLISHED");
    expect(real.data.slug.startsWith("nsrit-1-")).toBe(true);
    const beta = q.instances.find((i) => i.legacyId === "2")!;
    const synthetic = q.templates.find((t) => t.newId === beta.data.templateId)!;
    expect(synthetic.legacyType).toBe("project_workspace");
    expect(synthetic.data.status).toBe("ARCHIVED");
    expect(synthetic.data.archivedAt).not.toBeNull();
    expect(plan.notes.templateSynthesizedForWorkspace).toBe(1);
    // duplicate version numbers keep the first, a missing blueprint is rebuilt from the template columns
    expect(q.templateVersions.filter((v) => v.data.templateId === real.newId)).toHaveLength(1);
    expect(rejected(plan, "project_template_version")).toMatchObject({ DUPLICATE_SOURCE: 1 });
    expect(q.templateAssignments).toHaveLength(1);
    expect(rejected(plan, "project_template_college")).toEqual({ PARENT_REJECTED: 1 });
  });
  it("builds blueprints that satisfy the vNext template schema", () => {
    for (const v of q.templateVersions) {
      const bp = v.data.blueprint as { releases: unknown[]; sprints: unknown[]; tasks: unknown[] };
      expect(Array.isArray(bp.releases)).toBe(true);
      if (bp.sprints.length) expect(bp.releases.length).toBeGreaterThan(0);
    }
  });
  it("keeps one primary mentor, ended members as history, and rejects duplicate or unloaded members", () => {
    const members = q.members.filter((m) => m.data.projectId === q.instances[0].newId);
    expect(members.map((m) => m.legacyId)).toEqual(["1", "2", "3"]);
    expect(byLegacy(members, "1")).toMatchObject({ role: "MENTOR", roleKind: "MENTOR", isPrimary: true, endedAt: null });
    expect(byLegacy(members, "2")).toMatchObject({ role: "LEARNER", roleKind: "LEARNER", isPrimary: false });
    expect(byLegacy(members, "3")!.endedAt).not.toBeNull();
    expect(rejected(plan, "project_member")).toMatchObject({ DUPLICATE_SOURCE: 1, PERSON_NOT_LOADED: 1 });
  });
  it("builds releases, sprints (dense sequence, one active, backlog) and tasks that satisfy the vNext constraints", () => {
    const own = (list: { data: { projectId: string } }[]) => list.filter((x) => x.data.projectId === q.instances[0].newId);
    const sprints = own(q.sprints) as typeof q.sprints;
    expect(sprints.filter((s) => s.data.status === "ACTIVE")).toHaveLength(1);
    expect(plan.notes.sprintSecondActiveDemoted).toBe(1);
    expect(rejected(plan, "project_sprint")).toEqual({ UNKNOWN_ENUM: 1 });
    const byRelease = new Map<string, number[]>();
    for (const s of sprints) byRelease.set(s.data.releaseId, [...(byRelease.get(s.data.releaseId) ?? []), s.data.sequence]);
    for (const seqs of byRelease.values()) expect([...seqs].sort((a, b) => a - b)).toEqual(seqs.map((_, i) => i));
    expect(sprints.some((s) => s.data.title.startsWith("Backlog"))).toBe(true);
    const tasks = own(q.tasks) as typeof q.tasks;
    expect(tasks.map((t) => t.legacyId).sort()).toEqual(["1", "2", "3", "8"]);
    const blocked = byLegacy(tasks, "2")!;
    expect(blocked).toMatchObject({ status: "BLOCKED", priority: "CRITICAL", estimatePoints: null, assigneeMembershipId: null });
    expect(blocked.blockerReason).toMatch(/not recorded/);
    expect(byLegacy(tasks, "1")).toMatchObject({ status: "DONE", estimatePoints: 5, taskType: "STORY", dueDate: "2026-09-10" });
    expect(byLegacy(tasks, "1")!.assigneeMembershipId).not.toBeNull();
    expect(rejected(plan, "project_task")).toMatchObject({ NAME_E2E: 1, SOFT_DELETED: 1, UNKNOWN_ENUM: 1 });
    expect(plan.notes.taskAssigneeNotLoaded).toBe(1);
  });
  it("loads comments, link resources with visibility and file resources as pending", () => {
    expect(q.comments).toHaveLength(1);
    expect(rejected(plan, "project_task_comment")).toEqual({ PARENT_REJECTED: 1, PERSON_NOT_LOADED: 1 });
    const spec = byLegacy(q.resources, "1")!;
    expect(spec).toMatchObject({ url: "https://docs.example.org/spec", visibility: "MENTOR_ONLY", required: true });
    const slides = byLegacy(q.resources, "2")!;
    expect(slides.url).toBeNull();
    expect(slides.description).toMatch(/pending file migration/i);
    expect(q.resources.find((r) => r.legacyId === "2")!.metadata?.unmapped).toMatchObject({ filePending: true });
    expect(plan.notes.projectResourceFilesPending).toBe(1);
  });
  it("downgrades meetings that cannot satisfy the schedule rules and derives missing end times", () => {
    const m1 = byLegacy(q.meetings, "1")!;
    expect(m1.status).toBe("REQUESTED"); // SCHEDULED needs a meeting URL, legacy has none
    expect(m1.timeZone).toBe("Asia/Kolkata");
    expect(m1.requestedByMembershipId).not.toBeNull();
    expect(m1.linkedTaskId).not.toBeNull();
    expect(m1.linkedSprintId).not.toBeNull();
    const m2 = byLegacy(q.meetings, "2")!;
    expect(m2).toMatchObject({ status: "SCHEDULED", meetingType: "RETRO", meetingUrl: "https://meet.example.org/demo" });
    expect(new Date(m2.endsAt).getTime() - new Date(m2.startsAt).getTime()).toBe(30 * 60_000);
    expect(m2.scheduledByUserId).not.toBeNull();
    expect(plan.notes.meetingDowngradedNoUrl).toBe(1);
    expect(rejected(plan, "project_meeting")).toMatchObject({ SOFT_DELETED: 1 });
  });
  it("loads the final delivery with its review and lock events, and files stay references only", () => {
    expect(q.submissions).toHaveLength(1);
    expect(q.submissions[0].data).toMatchObject({ status: "APPROVED", version: 1, sourceUrl: "https://git.example.org/repo" });
    expect(q.submissions[0].data.submittedByMembershipId).not.toBeNull();
    expect(q.reviews).toHaveLength(1);
    expect(q.reviews[0].data.decision).toBe("APPROVED");
    expect(q.deliveryEvents.map((e) => e.data.eventType)).toEqual(["LOCKED"]);
    expect(rejected(plan, "project_delivery_event")).toEqual({ NO_VNEXT_TARGET: 1 });
    expect(plan.notes.projectDeliveryFileReferences).toBe(1);
  });
  it("computes legacy-side progress with the same formula as vNext", () => {
    const alpha = q.facts.projects.find((f) => f.project === "1")!;
    expect(alpha).toMatchObject({ tasks: 4, doneTasks: 1, sprints: 4, completedSprints: 1, storedProgress: 10 });
    // (1 done task + 1 completed sprint) / (4 tasks + 4 sprints) -> 25
    expect(alpha.derivedPercent).toBe(25);
  });
});

// ------------------------------------------------------------- notifications

describe("stage 2b-ii notifications planner", () => {
  const { plan } = plans();
  const n = plan.notifications;

  it("loads learner notifications with one synthesized event each and keeps legacy read state", () => {
    expect(n.notifications.map((x) => x.legacyId).sort()).toEqual(["1", "2", "9"]);
    expect(n.events).toHaveLength(n.notifications.length);
    const read = byLegacy(n.notifications, "2")!;
    expect(read.readAt).toBe("2026-09-04T03:30:00.000Z");
    expect(byLegacy(n.notifications, "1")!.readAt).toBeNull();
    for (const e of n.events) {
      expect(e.data.dedupeKey).toBe(`legacy-import:nsrit:notification:${e.legacyId}`);
      expect(e.data.summary.length).toBeGreaterThan(0);
    }
    // event and notification ids are deterministic and distinct
    expect(new Set([...n.events, ...n.notifications].map((x) => x.newId)).size).toBe(n.events.length * 2);
  });
  it("rejects deleted, recipient-less, unknown-learner, test, and parent-rejected notifications with reason codes", () => {
    expect(rejected(plan, "notification")).toEqual({ SOFT_DELETED: 1, NO_RECIPIENT: 1, PERSON_NOT_LOADED: 1, PARENT_REJECTED: 2, NAME_E2E: 1, INVALID_VALUE: 1 });
  });
  it("is idempotent: planning twice gives identical ids and hashes", () => {
    const again = plans().plan;
    expect(again.notifications.notifications.map((x) => [x.newId, x.hash])).toEqual(n.notifications.map((x) => [x.newId, x.hash]));
    expect(again.placements.jobs.map((x) => [x.newId, x.hash])).toEqual(plan.placements.jobs.map((x) => [x.newId, x.hash]));
    expect(again.projects.tasks.map((x) => [x.newId, x.hash])).toEqual(plan.projects.tasks.map((x) => [x.newId, x.hash]));
  });
});

// ------------------------------------------------------------ reports + guards

describe("stage 2b-ii reports and guards", () => {
  const { plan } = plans();
  it("reports carry no names, phones or e-mails", () => {
    const md = rejectionReportMarkdown2bii(plan);
    const rec = buildReconciliation2bii(plan, {}, { mode: "dry-run", batchId: null, snapshotSha256: "a".repeat(64), loaderVersion: "x" });
    const text = reconciliationMarkdown2bii(rec);
    for (const out of [md, text]) expect(out).not.toMatch(/@college\.example|@hire\.example|98765|Learner\d|Faculty\d|Recruiter|Synthetic|Acme|Initech/);
    expect(JSON.stringify(rec)).not.toMatch(/@college\.example|@hire\.example|98765|Acme|Initech/);
    expect(text).toContain("Legacy tables not loaded in this stage");
    expect(text).toContain("notification_outbox");
  });
  it("allowlists the stage tables, including notifications and events, but never an outbox or messaging table", () => {
    for (const table of ["placement_jobs", "placement_offers", "project_tasks", "module_access_rules", "in_app_notifications", "activity_events"]) {
      expect(WRITE_TABLE_ALLOWLIST.has(table)).toBe(true);
      expect(() => assertStatementAllowed(`INSERT INTO ${table} (id) VALUES ($1)`)).not.toThrow();
    }
    for (const table of ["outbound_messages", "general_notification_outbox", "placement_tpo_email_campaigns", "placement_tpo_email_campaign_recipients", "assignment_submission_files", "project_resource_files", "placement_batch_registration_events"]) {
      expect(() => assertStatementAllowed(`INSERT INTO ${table} (id) VALUES ($1)`)).toThrow(/not allowed/);
      expect(() => assertStatementAllowed(`DELETE FROM ${table} WHERE id = $1`)).toThrow();
    }
  });
  it("allows the registration audit trigger statements only in their exact rollback form", () => {
    const disable = "ALTER TABLE placement_batch_registration_events DISABLE TRIGGER db08_registration_events_no_mutation";
    const del =
      "DELETE FROM placement_batch_registration_events WHERE registration_id IN\n (SELECT new_id FROM legacy_id_map WHERE batch_id = $1 AND college_id = $2 AND new_entity_type = 'placement_batch_registrations')";
    expect(() => assertStatementAllowed(disable)).not.toThrow();
    expect(() => assertStatementAllowed(del)).not.toThrow();
    expect(ROLLBACK_ONLY_STATEMENTS.length).toBe(2);
    for (const bad of [
      "ALTER TABLE placement_offers DISABLE TRIGGER ALL",
      "ALTER TABLE placement_batch_registration_events DISABLE TRIGGER ALL",
      "DELETE FROM placement_batch_registration_events",
      "DELETE FROM placement_batch_registration_events WHERE registration_id IN (SELECT id FROM users)",
      "TRUNCATE placement_batch_registration_events",
    ]) {
      expect(() => assertStatementAllowed(bad)).toThrow();
    }
  });
  it("rollback order deletes children before parents for the stage tables", () => {
    const order = ROLLBACK_ORDER.map((x) => x.table);
    const before = (child: string, parent: string) => expect(order.indexOf(child)).toBeLessThan(order.indexOf(parent));
    before("in_app_notifications", "activity_events");
    before("placement_offers", "placement_applications");
    before("placement_round_results", "placement_job_rounds");
    before("placement_applications", "placement_job_role_options");
    before("placement_job_role_options", "placement_jobs");
    before("placement_jobs", "placement_company_relationships");
    before("placement_company_relationships", "placement_companies");
    before("project_tasks", "project_sprints");
    before("project_sprints", "project_releases");
    before("project_releases", "project_instances");
    before("project_instances", "project_template_versions");
    before("project_template_versions", "project_templates");
    before("placement_recruiter_college_grants", "placement_recruiter_profiles");
    before("placement_batch_registrations", "placement_batch_lifecycles");
    // stage 2b-ii before 2b-i before 2a
    before("placement_applications", "courses");
    before("courses", "departments");
    expect(new Set(order).size).toBe(order.length);
  });
  it("every table written by db-2bii.ts is on the allowlist and no storage key is written", () => {
    const dir = path.resolve(__dirname, "../../scripts/migrate/nsrit");
    const sql = readFileSync(path.join(dir, "db-2bii.ts"), "utf8");
    const tables = [...sql.matchAll(/(?:INSERT INTO\s+([a-z_]+)\s*\(|UPDATE\s+([a-z_]+)\s+SET|DELETE FROM\s+([a-z_]+)\s+WHERE)/g)].map((m) => m[1] ?? m[2] ?? m[3]);
    expect(tables.length).toBeGreaterThan(30);
    for (const table of new Set(tables)) expect(WRITE_TABLE_ALLOWLIST.has(table)).toBe(true);
    expect(sql).not.toMatch(/storage_key|object_key|upload_token|private_letter_object_path|logo_object_path/);
    // every ROLLBACK_ORDER table is an allowlisted write target too
    for (const { table } of ROLLBACK_ORDER) expect(WRITE_TABLE_ALLOWLIST.has(table)).toBe(true);
  });
  it("no loader source writes to an outbox, delivery or messaging table or names a provider", () => {
    const dir = path.resolve(__dirname, "../../scripts/migrate/nsrit");
    const write = /(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+"?([a-z_]*(?:outbox|outbound|campaign|sms|email|mail_log)[a-z_]*)/gi;
    const providers = /zeptomail|exotel|sendgrid|nodemailer|messaging\/providers/i;
    const offenders: string[] = [];
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".ts"))) {
      const text = readFileSync(path.join(dir, file), "utf8");
      for (const m of text.matchAll(write)) {
        // the one allowed form: the audit-trail cleanup of registrations during rollback (see guards.ts)
        if (!/registration_events/.test(m[1])) offenders.push(`${file}:${m[1]}`);
      }
      if (providers.test(text.replace(/^\s*(\/\/|\*|\/\*).*$/gm, ""))) offenders.push(`${file}:provider`);
    }
    expect(offenders).toEqual([]);
  });
});
