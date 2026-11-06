import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";
import { withTenantScope } from "./tenant-pool";
import {
  getDatabaseConnectionConfig,
  getServerEnv,
} from "@/lib/env";
import {
  assertRuntimeDatabasePrincipal,
  enforceProductionDatabasePrincipal,
  type DatabasePrincipalCapability,
} from "./runtime-principal-policy";

type DbState = {
  pool?: Pool | undefined;
  db?: ReturnType<typeof drizzle> | undefined;
};

const globalForDb = globalThis as typeof globalThis & {
  __lmsDb?: DbState;
};

const state = globalForDb.__lmsDb ?? {};

if (process.env.NODE_ENV !== "production") {
  globalForDb.__lmsDb = state;
}

function poolConfig(): PoolConfig {
  const database = getDatabaseConnectionConfig(getServerEnv());
  const common = {
    max: database.max,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  };

  if (database.mode === "url") {
    return {
      ...common,
      connectionString: database.connectionString,
    };
  }

  return {
    ...common,
    host: database.host,
    user: database.user,
    password: database.password,
    database: database.database,
  };
}

function getPool() {
  // DB_TENANT_SCOPE=on makes every connection carry the request's college/user/role for row-level security.
  state.pool ??= withTenantScope(new Pool(poolConfig()), process.env["DB_TENANT_SCOPE"] === "on");
  return state.pool;
}

export function getDb() {
  state.db ??= drizzle(getPool());
  return state.db;
}

export async function checkDatabaseConnection() {
  const client = await getPool().connect();

  try {
    // Never certify a production application that is connected using a
    // migration owner, superuser, RLS-bypass or DDL-capable database role.
    // A failed metadata read also prevents readiness: no unsafe fallback.
    if (enforceProductionDatabasePrincipal({
      nodeEnv: process.env.NODE_ENV,
      appEnv: process.env["APP_ENV"],
    })) {
      const principal = await client.query<DatabasePrincipalCapability>(`
        SELECT
          r.rolsuper AS is_superuser,
          r.rolbypassrls AS can_bypass_rls,
          r.rolcreaterole AS can_create_role,
          r.rolcreatedb AS can_create_database,
          -- Creating objects in ANY application schema is unsafe for the
          -- runtime principal, not only creating them in public.
          EXISTS (
            SELECT 1 FROM pg_catalog.pg_namespace ns
            WHERE ns.nspname NOT IN ('pg_catalog','information_schema')
              AND ns.nspname NOT LIKE 'pg_toast%'
              AND ns.nspname NOT LIKE 'pg_temp_%'
              AND (
                has_schema_privilege(current_user, ns.oid, 'CREATE')
                OR EXISTS (
                  SELECT 1 FROM pg_catalog.pg_roles candidate
                  WHERE pg_has_role(session_user,candidate.oid,'SET')
                    AND has_schema_privilege(candidate.oid, ns.oid, 'CREATE')
                )
              )
          ) AS can_create_schema,
          (
            has_database_privilege(current_user, current_database(), 'CREATE')
            OR EXISTS (
              SELECT 1 FROM pg_catalog.pg_roles candidate
              WHERE pg_has_role(session_user,candidate.oid,'SET')
                AND has_database_privilege(candidate.oid,current_database(),'CREATE')
            )
          ) AS can_create_in_database,
          -- The login may SET ROLE to an elevated role even if the
          -- initial current_user itself lacks special attributes.
          EXISTS (
            SELECT 1 FROM pg_catalog.pg_roles elevated
            WHERE (elevated.rolsuper OR elevated.rolbypassrls
               OR elevated.rolcreatedb OR elevated.rolcreaterole)
              AND pg_has_role(session_user, elevated.oid, 'SET')
          ) AS can_set_privileged_role,
          -- A runtime role with effective ownership rights can bypass
          -- tenant-key table RLS unless FORCE ROW LEVEL SECURITY is on.
          EXISTS (
            SELECT 1 FROM pg_catalog.pg_class owned
            JOIN pg_catalog.pg_namespace ns ON ns.oid=owned.relnamespace
            WHERE owned.relkind IN ('r','p')
              AND ns.nspname NOT IN ('pg_catalog','information_schema')
              AND ns.nspname NOT LIKE 'pg_toast%'
              AND ns.nspname NOT LIKE 'pg_temp_%'
              AND (
                pg_has_role(current_user, owned.relowner, 'USAGE')
                OR pg_has_role(session_user, owned.relowner, 'SET')
              )
              AND (NOT owned.relforcerowsecurity OR NOT owned.relrowsecurity)
              AND EXISTS (
                SELECT 1 FROM pg_catalog.pg_attribute a
                WHERE a.attrelid=owned.oid
                  AND a.attnum>0 AND NOT a.attisdropped
                  AND a.attname IN ('college_id','organization_id')
              )
          ) AS can_bypass_tenant_rls_by_ownership,
          -- RLS does not apply to TRUNCATE. Even a perfectly restricted
          -- SELECT/UPDATE/DELETE policy cannot prevent this operation.
          EXISTS (
            SELECT 1 FROM pg_catalog.pg_class target
            JOIN pg_catalog.pg_namespace ns ON ns.oid=target.relnamespace
            WHERE target.relkind IN ('r','p')
              AND ns.nspname NOT IN ('pg_catalog','information_schema')
              AND ns.nspname NOT LIKE 'pg_toast%'
              AND ns.nspname NOT LIKE 'pg_temp_%'
              AND EXISTS (
                SELECT 1 FROM pg_catalog.pg_attribute a
                WHERE a.attrelid=target.oid
                  AND a.attnum>0 AND NOT a.attisdropped
                  AND a.attname IN ('college_id','organization_id')
              )
              AND (
                has_table_privilege(current_user,target.oid,'TRUNCATE')
                OR EXISTS (
                  SELECT 1 FROM pg_catalog.pg_roles candidate
                  WHERE pg_has_role(session_user,candidate.oid,'SET')
                    AND has_table_privilege(candidate.oid,target.oid,'TRUNCATE')
                )
              )
          ) AS can_truncate_tenant_tables
        FROM pg_catalog.pg_roles r
        WHERE r.rolname = current_user
      `);
      assertRuntimeDatabasePrincipal(principal.rows[0]);
    }
    const result = await client.query<{
      organizations: string | null;
      users: string | null;
      memberships: string | null;
      programs: string | null;
      academicPeriods: string | null;
      cohorts: string | null;
      sections: string | null;
      learnerProgramEnrollments: string | null;
      sectionEnrollments: string | null;
      sectionFacultyAssignments: string | null;
      sectionScheduleEvents: string | null;
      courses: string | null;
      courseOfferings: string | null;
      courseSectionDeliveries: string | null;
      courseTeachingAssignments: string | null;
      courseLearningPaths: string | null;
      courseLessons: string | null;
      lessonContents: string | null;
      learnerContentProgress: string | null;
      courseAssignments: string | null;
      assignmentSubmissions: string | null;
      courseQuizzes: string | null;
      quizQuestions: string | null;
      quizOptions: string | null;
      quizAttempts: string | null;
      quizAttemptAnswers: string | null;
      projectTemplates: string | null;
      projectTemplateVersions: string | null;
      projectTemplateCollegeAssignments: string | null;
      projectInstances: string | null;
      projectReleases: string | null;
      projectSprints: string | null;
      projectTasks: string | null;
      projectResources: string | null;
      projectMembers: string | null;
      projectTaskSubmissions: string | null;
      projectSubmissions: string | null;
      projectSubmissionReviews: string | null;
      projectEvaluations: string | null;
      projectEvaluationItems: string | null;
      projectMeetings: string | null;
      activityEvents: string | null;
      inAppNotifications: string | null;
      moduleAccessRules: string | null;
      placementEligibilityDecisions: string | null;
      placementDriveDayCoordinatorAssignments: string | null;
      placementRoundAttendance: string | null;
    }>(
      `select
         to_regclass('public.organizations')::text as organizations,
         to_regclass('public.users')::text as users,
         to_regclass('public.college_memberships')::text as memberships,
         to_regclass('public.programs')::text as "programs",
         to_regclass('public.academic_periods')::text as "academicPeriods",
         to_regclass('public.cohorts')::text as "cohorts",
         to_regclass('public.sections')::text as "sections",
         to_regclass('public.learner_program_enrollments')::text as "learnerProgramEnrollments",
         to_regclass('public.section_enrollments')::text as "sectionEnrollments",
         to_regclass('public.section_faculty_assignments')::text as "sectionFacultyAssignments",
         to_regclass('public.section_schedule_events')::text as "sectionScheduleEvents",
         to_regclass('public.courses')::text as "courses",
         to_regclass('public.course_offerings')::text as "courseOfferings",
         to_regclass('public.course_section_deliveries')::text as "courseSectionDeliveries",
         to_regclass('public.course_teaching_assignments')::text as "courseTeachingAssignments",
         to_regclass('public.course_learning_paths')::text as "courseLearningPaths",
         to_regclass('public.course_lessons')::text as "courseLessons",
         to_regclass('public.lesson_contents')::text as "lessonContents",
         to_regclass('public.learner_content_progress')::text as "learnerContentProgress",
         to_regclass('public.course_assignments')::text as "courseAssignments",
         to_regclass('public.assignment_submissions')::text as "assignmentSubmissions",
         to_regclass('public.course_quizzes')::text as "courseQuizzes",
         to_regclass('public.quiz_questions')::text as "quizQuestions",
         to_regclass('public.quiz_options')::text as "quizOptions",
         to_regclass('public.quiz_attempts')::text as "quizAttempts",
         to_regclass('public.quiz_attempt_answers')::text as "quizAttemptAnswers",
         to_regclass('public.project_templates')::text as "projectTemplates",
         to_regclass('public.project_template_versions')::text as "projectTemplateVersions",
         to_regclass('public.project_template_college_assignments')::text as "projectTemplateCollegeAssignments",
         to_regclass('public.project_instances')::text as "projectInstances",
         to_regclass('public.project_releases')::text as "projectReleases",
         to_regclass('public.project_sprints')::text as "projectSprints",
         to_regclass('public.project_tasks')::text as "projectTasks",
         to_regclass('public.project_resources')::text as "projectResources",
         to_regclass('public.project_members')::text as "projectMembers",
         to_regclass('public.project_task_submissions')::text as "projectTaskSubmissions",
         to_regclass('public.project_submissions')::text as "projectSubmissions",
         to_regclass('public.project_submission_reviews')::text as "projectSubmissionReviews",
         to_regclass('public.project_evaluations')::text as "projectEvaluations",
         to_regclass('public.project_evaluation_items')::text as "projectEvaluationItems",
         to_regclass('public.project_meetings')::text as "projectMeetings",
         to_regclass('public.activity_events')::text as "activityEvents",
         to_regclass('public.in_app_notifications')::text as "inAppNotifications",
         to_regclass('public.module_access_rules')::text as "moduleAccessRules",
         to_regclass('public.placement_eligibility_decisions')::text as "placementEligibilityDecisions",
         to_regclass('public.placement_drive_day_coordinator_assignments')::text as "placementDriveDayCoordinatorAssignments",
         to_regclass('public.placement_round_attendance')::text as "placementRoundAttendance"`,
    );

    const schema = result.rows[0];
    if (
      !schema?.organizations ||
      !schema.users ||
      !schema.memberships ||
      !schema.programs ||
      !schema.academicPeriods ||
      !schema.cohorts ||
      !schema.sections ||
      !schema.learnerProgramEnrollments ||
      !schema.sectionEnrollments ||
      !schema.sectionFacultyAssignments ||
      !schema.sectionScheduleEvents ||
      !schema.courses ||
      !schema.courseOfferings ||
      !schema.courseSectionDeliveries ||
      !schema.courseTeachingAssignments ||
      !schema.courseLearningPaths ||
      !schema.courseLessons ||
      !schema.lessonContents ||
      !schema.learnerContentProgress ||
      !schema.courseAssignments ||
      !schema.assignmentSubmissions ||
      !schema.courseQuizzes ||
      !schema.quizQuestions ||
      !schema.quizOptions ||
      !schema.quizAttempts ||
      !schema.quizAttemptAnswers ||
      !schema.projectTemplates ||
      !schema.projectTemplateVersions ||
      !schema.projectTemplateCollegeAssignments ||
      !schema.projectInstances ||
      !schema.projectReleases ||
      !schema.projectSprints ||
      !schema.projectTasks ||
      !schema.projectResources ||
      !schema.projectMembers ||
      !schema.projectTaskSubmissions ||
      !schema.projectSubmissions ||
      !schema.projectSubmissionReviews ||
      !schema.projectEvaluations ||
      !schema.projectEvaluationItems ||
      !schema.projectMeetings ||
      !schema.activityEvents ||
      !schema.inAppNotifications ||
      !schema.moduleAccessRules ||
      !schema.placementEligibilityDecisions ||
      !schema.placementDriveDayCoordinatorAssignments ||
      !schema.placementRoundAttendance
    ) {
      throw new Error(
        "Database schema is not fully migrated",
      );
    }
  } finally {
    client.release();
  }
}

export async function closeDatabaseConnection() {
  if (state.pool) {
    await state.pool.end();
  }

  state.pool = undefined;
  state.db = undefined;
}
