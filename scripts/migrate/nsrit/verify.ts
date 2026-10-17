/**
 * Read-only verification that the loaded NSRIT data shows up through vNext's
 * own services (not raw SQL): course list, course workspace (lessons, content,
 * assignments, quizzes, progress), attendance workspace, assessment overview,
 * discussion, faculty course list, gradebook; and (stage 2b-ii) the learner
 * applications, offers, journey, notification history and projects services, the
 * college drive list/overview/applications/placement report, the project admin
 * snapshots and a project workspace. Counts only; no names, phones or e-mails
 * are printed.
 *
 *   DATABASE_URL=postgresql://...@127.0.0.1:.../<db> \
 *   NODE_OPTIONS=--conditions=react-server \
 *   tsx scripts/migrate/nsrit/verify.ts [--snapshot=<dir>] [--out=<report dir>]
 *
 * The target must be a loopback database (same guard as the loader; a dev cluster
 * database needs --allow-remote-dev and ALLOW_NSRIT_REMOTE_DEV). The
 * script only reads: it builds request contexts from existing rows and calls
 * read services. A service that throws or returns less than the database
 * holds is reported as a finding (a vNext defect or an explained filter).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";
import type { RequestContext } from "../../../src/modules/identity/context";
import { assertTargetAllowed, safeErrorMessage } from "./guards";
import { pct2 } from "./mappers-academics";

type Finding = { actor: string; check: string; status: "OK" | "EMPTY_EXPECTED" | "EMPTY_UNEXPECTED" | "MISMATCH" | "ERROR"; detail: string };

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.slice(name.length + 3);
}

async function main() {
  // Read-only, but the same target rules as the loader: loopback unless --allow-remote-dev plus the dev acknowledgement.
  const target = assertTargetAllowed(process.env.DATABASE_URL, { allowRemoteDev: process.argv.includes("--allow-remote-dev"), env: process.env });
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const q = async <R extends Record<string, unknown>>(sql: string, params: unknown[] = []) => {
    if (!/^\s*select\b/i.test(sql)) throw new Error("verify.ts runs SELECT statements only");
    return (await client.query(sql, params)).rows as R[];
  };
  const findings: Finding[] = [];
  const add = (f: Finding) => findings.push(f);

  const contextFor = async (membershipId: string): Promise<RequestContext> => {
    const [row] = await q<{ user_id: string; identity_uid: string; platform_status: string; college_id: string; organization_id: string; status: string }>(
      `SELECT u.id AS user_id, u.identity_uid, u.platform_status, cm.college_id, c.organization_id, cm.status
         FROM college_memberships cm JOIN users u ON u.id = cm.user_id JOIN colleges c ON c.id = cm.college_id WHERE cm.id = $1`,
      [membershipId],
    );
    const roles = await q<{ role: string }>(`SELECT role::text AS role FROM membership_roles WHERE membership_id = $1`, [membershipId]);
    return {
      user: {
        id: row.user_id,
        identityUid: row.identity_uid,
        platformStatus: row.platform_status as "ACTIVE",
        systemRoles: [],
      },
      membership: {
        id: membershipId,
        collegeId: row.college_id,
        organizationId: row.organization_id,
        status: row.status as "ACTIVE",
        roles: roles.map((r) => r.role) as never,
      },
    };
  };

  const nsrit = await q<{ id: string }>(`SELECT new_id AS id FROM legacy_id_map WHERE new_entity_type = 'colleges' AND source_system = 'LMS_LEGACY' LIMIT 1`);
  const nsritCollege = nsrit[0]?.id;
  if (!nsritCollege) throw new Error("No NSRIT college in the target: apply stages 2a and 2b first");

  // ---- actors (selected by data volume, never by name)
  const learnerPick = async (label: string, sql: string) => {
    const [r] = await q<{ membership_id: string }>(sql, [nsritCollege]);
    return r ? { label, membershipId: r.membership_id } : null;
  };
  const actors = [
    await learnerPick(
      "learner (section with most courses)",
      `SELECT le.membership_id FROM learner_program_enrollments le JOIN section_enrollments se ON se.learner_enrollment_id = le.id
         JOIN college_memberships cm ON cm.id = le.membership_id AND cm.college_id = $1 AND cm.status = 'ACTIVE'
        WHERE se.status = 'ACTIVE'
        ORDER BY (SELECT count(*) FROM course_section_deliveries d WHERE d.section_id = se.section_id) DESC, le.membership_id LIMIT 1`,
    ),
    await learnerPick(
      "learner (section with fewest courses)",
      `SELECT le.membership_id FROM learner_program_enrollments le JOIN section_enrollments se ON se.learner_enrollment_id = le.id
         JOIN college_memberships cm ON cm.id = le.membership_id AND cm.college_id = $1 AND cm.status = 'ACTIVE'
        WHERE se.status = 'ACTIVE' AND EXISTS (SELECT 1 FROM course_section_deliveries d WHERE d.section_id = se.section_id)
        ORDER BY (SELECT count(*) FROM course_section_deliveries d WHERE d.section_id = se.section_id) ASC, le.membership_id LIMIT 1`,
    ),
    await learnerPick(
      "learner (has quiz attempts)",
      `SELECT qa.membership_id FROM quiz_attempts qa JOIN college_memberships cm ON cm.id = qa.membership_id AND cm.college_id = $1 ORDER BY qa.membership_id LIMIT 1`,
    ),
    await learnerPick(
      "learner (has progress)",
      `SELECT p.membership_id FROM learner_content_progress p JOIN college_memberships cm ON cm.id = p.membership_id AND cm.college_id = $1 ORDER BY p.membership_id LIMIT 1`,
    ),
  ].filter((a): a is { label: string; membershipId: string } => a !== null);
  const seen = new Set<string>();
  const learnerActors = actors.filter((a) => (seen.has(a.membershipId) ? false : (seen.add(a.membershipId), true)));

  const facultyRow = await q<{ membership_id: string }>(
    `SELECT t.membership_id FROM course_teaching_assignments t JOIN college_memberships cm ON cm.id = t.membership_id AND cm.college_id = $1
      WHERE t.ended_at IS NULL GROUP BY t.membership_id ORDER BY count(*) DESC LIMIT 1`,
    [nsritCollege],
  );
  const adminRow = await q<{ membership_id: string }>(
    `SELECT mr.membership_id FROM membership_roles mr JOIN college_memberships cm ON cm.id = mr.membership_id AND cm.college_id = $1
      WHERE mr.role = 'COLLEGE_ADMIN' AND cm.status = 'ACTIVE' ORDER BY mr.membership_id LIMIT 1`,
    [nsritCollege],
  );

  // ---- service imports happen after the guard so a wrong target never connects
  const { listLearnerCourseDeliveries, getLearnerCourseWorkspace } = await import("../../../src/modules/courses/learner-course-service");
  const { getLearnerAssessmentOverview } = await import("../../../src/modules/courses/learner-assessment-service");
  const { getLearnerAttendanceWorkspace } = await import("../../../src/modules/attendance/learner-service");
  const { listCourseDiscussionMessages } = await import("../../../src/modules/courses/discussion-service");
  const { getFacultyCourseList } = await import("../../../src/modules/courses/faculty-course-list-service");
  const { getFacultyPublishedGradebook } = await import("../../../src/modules/courses/faculty-gradebook-service");
  const { closeDatabaseConnection } = await import("../../../src/db/client");

  const guard = async <T>(actor: string, check: string, fn: () => Promise<T>, summarize: (value: T) => { status: Finding["status"]; detail: string }) => {
    try {
      const value = await fn();
      const s = summarize(value);
      add({ actor, check, ...s });
    } catch (error) {
      const e = error as { code?: string; name?: string };
      add({ actor, check, status: "ERROR", detail: `${e.name ?? "Error"} ${e.code ?? ""} ${safeErrorMessage(error).slice(0, 120)}`.trim() });
    }
  };

  for (const a of learnerActors) {
    const ctx = await contextFor(a.membershipId);
    const [expected] = await q<{ deliveries: string; contents: string; assignments: string; quizzes: string; absent: string; records: string; attempts: string }>(
      `SELECT
         (SELECT count(*) FROM course_section_deliveries d JOIN section_enrollments se ON se.section_id = d.section_id AND se.status = 'ACTIVE'
            JOIN learner_program_enrollments le ON le.id = se.learner_enrollment_id AND le.membership_id = $1 WHERE d.ended_at IS NULL) AS deliveries,
         (SELECT count(*) FROM lesson_contents lc JOIN course_section_deliveries d ON d.id = lc.delivery_id
            JOIN section_enrollments se ON se.section_id = d.section_id AND se.status = 'ACTIVE'
            JOIN learner_program_enrollments le ON le.id = se.learner_enrollment_id AND le.membership_id = $1
           WHERE lc.status = 'PUBLISHED' AND lc.visible_to_students) AS contents,
         (SELECT count(*) FROM course_assignments ca JOIN course_section_deliveries d ON d.id = ca.delivery_id
            JOIN section_enrollments se ON se.section_id = d.section_id AND se.status = 'ACTIVE'
            JOIN learner_program_enrollments le ON le.id = se.learner_enrollment_id AND le.membership_id = $1
           WHERE ca.status = 'PUBLISHED') AS assignments,
         (SELECT count(*) FROM course_quizzes cq JOIN course_section_deliveries d ON d.id = cq.delivery_id
            JOIN section_enrollments se ON se.section_id = d.section_id AND se.status = 'ACTIVE'
            JOIN learner_program_enrollments le ON le.id = se.learner_enrollment_id AND le.membership_id = $1
           WHERE cq.status = 'PUBLISHED') AS quizzes,
         (SELECT count(*) FROM attendance_records WHERE membership_id = $1 AND status <> 'PRESENT') AS absent,
         (SELECT count(*) FROM attendance_records WHERE membership_id = $1) AS records,
         (SELECT count(*) FROM quiz_attempts WHERE membership_id = $1) AS attempts`,
      [a.membershipId],
    );
    let firstDelivery: string | null = null;
    let sumContents = 0;
    let sumAssignments = 0;
    let sumQuizzes = 0;
    await guard(
      a.label,
      "course list (listLearnerCourseDeliveries)",
      () => listLearnerCourseDeliveries(ctx),
      (rows) => {
        firstDelivery = rows[0]?.deliveryId ?? null;
        const want = Number(expected.deliveries);
        return rows.length === want
          ? { status: want === 0 ? "EMPTY_EXPECTED" : "OK", detail: `${rows.length} courses (database holds ${want})` }
          : { status: rows.length === 0 ? "EMPTY_UNEXPECTED" : "MISMATCH", detail: `${rows.length} courses, database holds ${want}` };
      },
    );
    if (firstDelivery) {
      const deliveries = await listLearnerCourseDeliveries(ctx).catch(() => []);
      for (const d of deliveries) {
        try {
          const ws = await getLearnerCourseWorkspace(ctx, d.deliveryId);
          for (const lesson of ws.lessons) {
            sumContents += lesson.contents.length;
            sumAssignments += lesson.assignments.length;
            sumQuizzes += lesson.quizzes.length;
          }
        } catch (error) {
          const e = error as { code?: string; name?: string };
          add({ actor: a.label, check: "course workspace (getLearnerCourseWorkspace)", status: "ERROR", detail: `${e.name ?? "Error"} ${e.code ?? ""}`.trim() });
        }
      }
      add({
        actor: a.label,
        check: "course workspace totals (contents / assignments / quizzes)",
        status:
          sumContents === Number(expected.contents) && sumAssignments === Number(expected.assignments) && sumQuizzes === Number(expected.quizzes)
            ? "OK"
            : "MISMATCH",
        detail: `service ${sumContents}/${sumAssignments}/${sumQuizzes}, database ${expected.contents}/${expected.assignments}/${expected.quizzes}`,
      });
    }
    await guard(
      a.label,
      "assessment overview (getLearnerAssessmentOverview)",
      () => getLearnerAssessmentOverview(ctx),
      (o) => ({
        status: o.assignments.length === Number(expected.assignments) && o.quizzes.length === Number(expected.quizzes) ? "OK" : "MISMATCH",
        detail: `${o.assignments.length} assignments, ${o.quizzes.length} quizzes (database ${expected.assignments}/${expected.quizzes})`,
      }),
    );
    await guard(
      a.label,
      "attendance (getLearnerAttendanceWorkspace)",
      () => getLearnerAttendanceWorkspace(ctx),
      (w) => {
        const want = Number(expected.records);
        const held = w.overall.heldSessions;
        if (want === 0) {
          return { status: "EMPTY_EXPECTED", detail: `${w.records.length} records, database holds 0 attendance rows (real-data-only load rejected the demo schedule)` };
        }
        return {
          status: w.records.length === want ? "OK" : "MISMATCH",
          detail: `${w.records.length} records, held ${held}, absent ${w.overall.absent}, percent ${w.overall.percentage} (database ${want} rows, ${expected.absent} absences)`,
        };
      },
    );
    if (firstDelivery) {
      await guard(
        a.label,
        "discussion (listCourseDiscussionMessages)",
        () => listCourseDiscussionMessages(ctx, firstDelivery!),
        (m) => ({ status: "OK", detail: `${m.messages?.length ?? 0} messages` }),
      );
    }
  }

  if (facultyRow[0]) {
    const ctx = await contextFor(facultyRow[0].membership_id);
    const [expected] = await q<{ deliveries: string }>(
      `SELECT count(*) AS deliveries FROM course_teaching_assignments WHERE membership_id = $1 AND ended_at IS NULL`,
      [facultyRow[0].membership_id],
    );
    await guard(
      "faculty (most teaching assignments)",
      "course list (getFacultyCourseList)",
      () => getFacultyCourseList(ctx, {}),
      (list) => ({
        status: list.scopeCount === Number(expected.deliveries) ? "OK" : "MISMATCH",
        detail: `${list.scopeCount} courses in scope (database ${expected.deliveries} active teaching assignments)`,
      }),
    );
    // Gradebook of the delivery that holds the most published quiz attempts.
    const [gb] = await q<{ delivery_id: string; roster: string; attempts: string }>(
      `SELECT d.id AS delivery_id,
              (SELECT count(*) FROM section_enrollments se WHERE se.section_id = d.section_id AND se.status = 'ACTIVE') AS roster,
              (SELECT count(*) FROM quiz_attempts qa JOIN course_quizzes cq ON cq.id = qa.quiz_id
                WHERE qa.delivery_id = d.id AND cq.results_published AND cq.status IN ('PUBLISHED','CLOSED')) AS attempts
         FROM course_teaching_assignments t JOIN course_section_deliveries d ON d.id = t.delivery_id
        WHERE t.membership_id = $1 AND t.ended_at IS NULL
        ORDER BY 3 DESC, d.id LIMIT 1`,
      [facultyRow[0].membership_id],
    );
    if (gb) {
      await guard(
        "faculty (most teaching assignments)",
        "gradebook (getFacultyPublishedGradebook)",
        () => getFacultyPublishedGradebook(ctx, { deliveryId: gb.delivery_id }),
        (g) => {
          const scored = g.rows.reduce((n, r) => n + r.gradedCount, 0);
          const rosterOk = g.rosterSize === Number(gb.roster);
          return {
            status: rosterOk && scored === Number(gb.attempts) ? "OK" : "MISMATCH",
            detail: `roster ${g.rosterSize} (database ${gb.roster}), scored cells ${scored} (published quiz attempts in database ${gb.attempts}), published assessments ${g.publishedAssessments}`,
          };
        },
      );
    }
  } else {
    add({ actor: "faculty", check: "course list", status: "EMPTY_UNEXPECTED", detail: "no active teaching assignment loaded" });
  }
  void adminRow;

  // ================= stage 2b-ii: placements, projects, notifications =================
  const has2bii = Number((await q<{ n: string }>(`SELECT count(*) AS n FROM legacy_id_map WHERE college_id = $1 AND new_entity_type = 'placement_jobs'`, [nsritCollege]))[0]?.n ?? 0) > 0;
  if (!has2bii) {
    add({ actor: "all", check: "stage 2b-ii services", status: "EMPTY_EXPECTED", detail: "stage 2b-ii is not applied in this database" });
  } else {
    const { listOwnPlacementApplications } = await import("../../../src/modules/placements/application-service");
    const { getOwnLearnerOfferBrowse } = await import("../../../src/modules/placements/learner-offers-browse-service");
    const { getLearnerPlacementJourney } = await import("../../../src/modules/placements/learner-journey-service");
    const { getOwnLearnerNotificationHistory } = await import("../../../src/modules/activity/learner-notification-history-service");
    const { listMyProjectInstances } = await import("../../../src/modules/projects/member-service");
    const { getProjectInstanceWorkspace } = await import("../../../src/modules/projects/instance-service");
    const { listProjectAdminSnapshots } = await import("../../../src/modules/projects/admin-insights-service");
    const { listCollegeDrives } = await import("../../../src/modules/placements/college-drive-read-service");
    const { getCollegeDriveOverview } = await import("../../../src/modules/placements/college-drive-overview-service");
    const { listCollegeDriveApplications } = await import("../../../src/modules/placements/college-drive-applications-service");
    const { getPlacementReportWorkspace } = await import("../../../src/modules/placements/report-service");
    const len = (value: unknown): number => (Array.isArray(value) ? value.length : 0);

    const pick = async (sql: string, params: unknown[] = [nsritCollege]) => (await q<{ membership_id: string }>(sql, params))[0]?.membership_id ?? null;
    const learners2 = [
      ["learner (most applications)", await pick(`SELECT a.membership_id FROM placement_applications a JOIN college_memberships cm ON cm.id = a.membership_id AND cm.college_id = $1 GROUP BY a.membership_id ORDER BY count(*) DESC, a.membership_id LIMIT 1`)],
      ["learner (has an offer)", await pick(`SELECT a.membership_id FROM placement_offers o JOIN placement_applications a ON a.id = o.application_id JOIN college_memberships cm ON cm.id = a.membership_id AND cm.college_id = $1 ORDER BY a.membership_id LIMIT 1`)],
      ["learner (most notifications)", await pick(`SELECT cm.id AS membership_id FROM in_app_notifications n JOIN college_memberships cm ON cm.user_id = n.user_id AND cm.college_id = $1 GROUP BY cm.id ORDER BY count(*) DESC, cm.id LIMIT 1`)],
      ["learner (project member)", await pick(`SELECT pm.membership_id FROM project_members pm JOIN project_instances i ON i.id = pm.project_id AND i.college_id = $1 JOIN membership_roles mr ON mr.membership_id = pm.membership_id AND mr.role = 'LEARNER' WHERE pm.ended_at IS NULL ORDER BY pm.membership_id LIMIT 1`)],
    ] as [string, string | null][];
    const seen2 = new Set<string>();
    for (const [label, membershipId] of learners2) {
      if (!membershipId || seen2.has(membershipId)) continue;
      seen2.add(membershipId);
      const ctx = await contextFor(membershipId);
      const [want] = await q<{ apps: string; offers: string; notifications: string; unread: string; projects: string }>(
        `SELECT (SELECT count(*) FROM placement_applications WHERE membership_id = $1) AS apps,
                (SELECT count(*) FROM placement_offers o JOIN placement_applications a ON a.id = o.application_id WHERE a.membership_id = $1) AS offers,
                (SELECT count(*) FROM in_app_notifications n JOIN college_memberships cm ON cm.user_id = n.user_id WHERE cm.id = $1) AS notifications,
                (SELECT count(*) FROM in_app_notifications n JOIN college_memberships cm ON cm.user_id = n.user_id WHERE cm.id = $1 AND n.read_at IS NULL) AS unread,
                (SELECT count(*) FROM project_members WHERE membership_id = $1 AND ended_at IS NULL) AS projects`,
        [membershipId],
      );
      await guard(
        label,
        "applications (listOwnPlacementApplications)",
        () => listOwnPlacementApplications(ctx),
        (rows) =>
          rows.length === Number(want.apps)
            ? { status: rows.length === 0 ? "EMPTY_EXPECTED" : "OK", detail: `${rows.length} applications (database ${want.apps})` }
            : { status: rows.length === 0 ? "EMPTY_UNEXPECTED" : "MISMATCH", detail: `${rows.length} applications, database ${want.apps}` },
      );
      await guard(
        label,
        "offers (getOwnLearnerOfferBrowse)",
        () => getOwnLearnerOfferBrowse(ctx, "all"),
        (r) => {
          const n = len((r as unknown as { rows?: unknown }).rows) || len((r as unknown as { items?: unknown }).items) || len((r as unknown as { offers?: unknown }).offers);
          return Number(want.offers) === 0
            ? { status: "EMPTY_EXPECTED", detail: "no offers for this learner" }
            : { status: n === Number(want.offers) ? "OK" : n === 0 ? "EMPTY_UNEXPECTED" : "MISMATCH", detail: `service ${n} offers, database ${want.offers}` };
        },
      );
      await guard(
        label,
        "journey (getLearnerPlacementJourney)",
        () => getLearnerPlacementJourney(ctx),
        (j) => ({ status: "OK", detail: `keys: ${Object.keys(j as object).join(",")}` }),
      );
      await guard(
        label,
        "notifications (getOwnLearnerNotificationHistory)",
        () => getOwnLearnerNotificationHistory(ctx, {}),
        (h) => {
          const n = len((h as unknown as { items?: unknown }).items);
          const expected = Math.min(40, Number(want.notifications));
          return Number(want.notifications) === 0
            ? { status: "EMPTY_EXPECTED", detail: "no notifications for this learner" }
            : { status: n === expected ? "OK" : n === 0 ? "EMPTY_UNEXPECTED" : "MISMATCH", detail: `first page ${n} (database ${want.notifications}, unread ${want.unread})` };
        },
      );
      await guard(
        label,
        "projects (listMyProjectInstances)",
        () => listMyProjectInstances(ctx),
        (rows) =>
          Number(want.projects) === 0
            ? { status: "EMPTY_EXPECTED", detail: "not a project member" }
            : { status: rows.length === Number(want.projects) ? "OK" : rows.length === 0 ? "EMPTY_UNEXPECTED" : "MISMATCH", detail: `${rows.length} projects (database ${want.projects})` },
      );
    }

    // mentor of a loaded project: list + a full workspace
    const mentor = await pick(`SELECT pm.membership_id FROM project_members pm JOIN project_instances i ON i.id = pm.project_id AND i.college_id = $1 WHERE pm.is_primary AND pm.ended_at IS NULL GROUP BY pm.membership_id ORDER BY count(*) DESC, pm.membership_id LIMIT 1`);
    if (mentor) {
      const ctx = await contextFor(mentor);
      const [want] = await q<{ projects: string }>(`SELECT count(*) AS projects FROM project_members WHERE membership_id = $1 AND ended_at IS NULL`, [mentor]);
      let firstProject: string | null = null;
      await guard(
        "mentor (primary mentor of the most projects)",
        "projects (listMyProjectInstances)",
        () => listMyProjectInstances(ctx),
        (rows) => {
          firstProject = rows[0]?.project.id ?? null;
          return { status: rows.length === Number(want.projects) ? "OK" : "MISMATCH", detail: `${rows.length} projects (database ${want.projects})` };
        },
      );
      const [biggest] = await q<{ id: string; releases: string; sprints: string; tasks: string; resources: string }>(
        `SELECT i.id, (SELECT count(*) FROM project_releases WHERE project_id = i.id) AS releases, (SELECT count(*) FROM project_sprints WHERE project_id = i.id) AS sprints,
                (SELECT count(*) FROM project_tasks WHERE project_id = i.id) AS tasks, (SELECT count(*) FROM project_resources WHERE project_id = i.id) AS resources
           FROM project_instances i JOIN project_members pm ON pm.project_id = i.id AND pm.membership_id = $1 AND pm.ended_at IS NULL
          ORDER BY 4 DESC, i.id LIMIT 1`,
        [mentor],
      );
      void firstProject;
      if (biggest) {
        await guard(
          "mentor (primary mentor of the most projects)",
          "project workspace (getProjectInstanceWorkspace)",
          () => getProjectInstanceWorkspace(ctx, biggest.id),
          (w) => {
            const ws = w as unknown as { releases?: unknown; sprints?: unknown; tasks?: unknown; resources?: unknown };
            const got = [len(ws.releases), len(ws.sprints), len(ws.tasks), len(ws.resources)];
            const want2 = [biggest.releases, biggest.sprints, biggest.tasks, biggest.resources].map(Number);
            return { status: got.every((v, i) => v === want2[i]) ? "OK" : "MISMATCH", detail: `service ${got.join("/")} (releases/sprints/tasks/resources), database ${want2.join("/")}` };
          },
        );
      }
    } else {
      add({ actor: "mentor", check: "project services", status: "EMPTY_UNEXPECTED", detail: "no primary mentor loaded for any project" });
    }

    // college admin: drives list, drive overview and applications, placement report, project snapshots
    if (adminRow[0]) {
      const ctx = await contextFor(adminRow[0].membership_id);
      const [want] = await q<{ jobs: string; topJob: string | null; apps: string; projects: string }>(
        `SELECT (SELECT count(*) FROM placement_jobs WHERE college_id = $1) AS jobs,
                (SELECT j.id FROM placement_jobs j LEFT JOIN placement_applications a ON a.job_id = j.id WHERE j.college_id = $1 GROUP BY j.id ORDER BY count(a.id) DESC, j.id LIMIT 1) AS "topJob",
                (SELECT count(*) FROM placement_applications a JOIN placement_jobs j ON j.id = a.job_id WHERE j.college_id = $1) AS apps,
                (SELECT count(*) FROM project_instances WHERE college_id = $1) AS projects`,
        [nsritCollege],
      );
      await guard(
        "college admin",
        "drives (listCollegeDrives)",
        () => listCollegeDrives(ctx, { status: "ALL" }),
        (r) => ({ status: r.total === Number(want.jobs) ? "OK" : "MISMATCH", detail: `${r.total} drives (database ${want.jobs})` }),
      );
      if (want.topJob) {
        await guard("college admin", "drive overview (getCollegeDriveOverview)", () => getCollegeDriveOverview(ctx, want.topJob), (o) => ({ status: o ? "OK" : "EMPTY_UNEXPECTED", detail: `keys: ${Object.keys(o as object).join(",")}` }));
        await guard(
          "college admin",
          "drive applications (listCollegeDriveApplications)",
          () => listCollegeDriveApplications(ctx, want.topJob, {}),
          (r) => {
            const rr = r as unknown as { total?: number; rows?: unknown[]; items?: unknown[] };
            const n = rr.total ?? rr.rows?.length ?? rr.items?.length ?? 0;
            return { status: n > 0 ? "OK" : "EMPTY_UNEXPECTED", detail: `${n} applications on the busiest drive` };
          },
        );
      }
      await guard(
        "college admin",
        "placement report (getPlacementReportWorkspace)",
        () => getPlacementReportWorkspace(ctx, { collegeId: nsritCollege }),
        (r) => ({ status: r ? "OK" : "EMPTY_UNEXPECTED", detail: `keys: ${Object.keys(r as object).join(",")}` }),
      );
      await guard(
        "college admin",
        "project snapshots (listProjectAdminSnapshots)",
        () => listProjectAdminSnapshots(ctx, nsritCollege, {}),
        (r) => {
          const n = len(r) || len((r as unknown as { items?: unknown }).items) || len((r as unknown as { snapshots?: unknown }).snapshots);
          return { status: n === Number(want.projects) ? "OK" : n === 0 ? "EMPTY_UNEXPECTED" : "MISMATCH", detail: `${n} projects (database ${want.projects})` };
        },
      );
    }
    // Recruiter pipeline: only meaningful when a recruiter account passed the real-data filter.
    const [recruiters] = await q<{ n: string }>(`SELECT count(*) AS n FROM placement_recruiter_college_grants g JOIN placement_company_relationships r ON r.id = g.company_relationship_id WHERE r.college_id = $1`, [nsritCollege]);
    add({
      actor: "recruiter",
      check: "recruiter pipeline (getHrJobRead)",
      status: "EMPTY_EXPECTED",
      detail: Number(recruiters.n) === 0 ? "no recruiter grant loaded: both legacy recruiter accounts were rejected as test data" : `${recruiters.n} grants loaded; recruiter services need the recruiter session and are exercised by the e2e suites`,
    });
  }

  // ---- optional comparison with the legacy attendance percent
  const snapshotDir = arg("snapshot");
  if (snapshotDir) {
    const { readSnapshot } = await import("./snapshot");
    const { buildPlan } = await import("./plan");
    const { buildAcademicsPlan } = await import("./plan-academics");
    const snapshot = readSnapshot(path.resolve(snapshotDir));
    const base = buildPlan(snapshot);
    const plan = buildAcademicsPlan(snapshot, base, { asOf: new Date(snapshot.manifest.exportedAt), keepNameJunkFor: process.argv.includes("--rehearsal-keep-demo") ? ["class_schedule"] : [] });
    const sample = plan.legacyFacts.attendance.slice(0, 5);
    let compared = 0;
    let matching = 0;
    for (const f of sample) {
      const person = base.people.find((p) => p.legacyType === "learner" && p.legacyId === f.learner);
      if (!person) continue;
      const ctx = await contextFor(person.data.membershipId).catch(() => null);
      if (!ctx) continue;
      try {
        const w = await getLearnerAttendanceWorkspace(ctx);
        compared += 1;
        const legacyRounded = f.percent === null ? null : Math.round(f.percent);
        if (w.overall.percentage === legacyRounded) matching += 1;
        else add({ actor: `learner#${f.learner}`, check: "attendance percent vs legacy", status: "MISMATCH", detail: `legacy ${pct2(f.percent)} (rounded ${legacyRounded}), service ${w.overall.percentage}` });
      } catch (error) {
        add({ actor: `learner#${f.learner}`, check: "attendance percent vs legacy", status: "ERROR", detail: safeErrorMessage(error).slice(0, 120) });
      }
    }
    if (sample.length) add({ actor: "sample", check: "attendance percent vs legacy", status: matching === compared ? "OK" : "MISMATCH", detail: `${matching}/${compared} sampled learners match (service rounds to a whole percent)` });
    else add({ actor: "sample", check: "attendance percent vs legacy", status: "EMPTY_EXPECTED", detail: "no learner has held sessions in this load" });
  }

  await closeDatabaseConnection();
  await client.end();

  const lines = [`# NSRIT verification through vNext services (${target.host}/${target.database})`, "", "| actor | check | status | detail |", "| --- | --- | --- | --- |"];
  for (const f of findings) lines.push(`| ${f.actor} | ${f.check} | ${f.status} | ${f.detail} |`);
  const text = `${lines.join("\n")}\n`;
  process.stdout.write(text);
  const out = arg("out");
  if (out) {
    mkdirSync(path.resolve(out), { recursive: true });
    writeFileSync(path.join(path.resolve(out), "verify-services.md"), text, "utf8");
  }
  if (findings.some((f) => f.status === "ERROR" || f.status === "MISMATCH" || f.status === "EMPTY_UNEXPECTED")) process.exitCode = 2;
}

main().catch((error) => {
  process.stderr.write(`NSRIT verify stopped: ${safeErrorMessage(error)}\n`);
  process.exitCode = 1;
});
