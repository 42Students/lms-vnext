import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";
import {
  getDatabaseConnectionConfig,
  getServerEnv,
} from "@/lib/env";

type DbState = {
  pool?: Pool;
  db?: ReturnType<typeof drizzle>;
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
  state.pool ??= new Pool(poolConfig());
  return state.pool;
}

export function getDb() {
  state.db ??= drizzle(getPool());
  return state.db;
}

export async function checkDatabaseConnection() {
  const client = await getPool().connect();

  try {
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
         to_regclass('public.project_template_college_assignments')::text as "projectTemplateCollegeAssignments"`,
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
      !schema.projectTemplateCollegeAssignments
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
