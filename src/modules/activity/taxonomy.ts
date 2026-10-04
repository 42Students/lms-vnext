export const ACTIVITY_MODULES = [
  "PLATFORM",
  "IDENTITY",
  "ACADEMICS",
  "COURSES",
  "PROJECTS",
  "PLACEMENTS",
] as const;

export type ActivityModule =
  (typeof ACTIVITY_MODULES)[number];

export const ACTIVITY_IMPORTANCE = [
  "LOW",
  "NORMAL",
  "HIGH",
  "CRITICAL",
] as const;

export type ActivityImportance =
  (typeof ACTIVITY_IMPORTANCE)[number];

export const ACTIVITY_EVENT_TYPES = {
  PLATFORM_COLLEGE_CREATED:
    "platform.college.created",
  IDENTITY_PERSON_ONBOARDED:
    "identity.person.onboarded",
  IDENTITY_ROLES_CHANGED:
    "identity.membership.roles_changed",
  IDENTITY_MEMBERSHIP_SUSPENDED:
    "identity.membership.suspended",
  IDENTITY_MEMBERSHIP_REACTIVATED:
    "identity.membership.reactivated",
  IDENTITY_MEMBERSHIP_ENDED:
    "identity.membership.ended",
  ACADEMICS_PROGRAM_CREATED:
    "academics.program.created",
  ACADEMICS_LEARNER_ENROLLED:
    "academics.learner.enrolled",
  COURSES_LEARNING_PATH_PUBLISHED:
    "courses.learning_path.published",
  COURSES_ASSIGNMENT_PUBLISHED:
    "courses.assignment.published",
  PROJECTS_PROJECT_CREATED:
    "projects.project.created",
  PROJECTS_TASK_SUBMITTED:
    "projects.task.submitted",
  PROJECTS_EVALUATION_RECORDED:
    "projects.evaluation.recorded",
  PLACEMENTS_SEASON_STARTED:
    "placements.season.started",
  PLACEMENTS_SEASON_CLOSED:
    "placements.season.closed",
  PLACEMENTS_JOB_PUBLISHED:
    "placements.job.published",
  PLACEMENTS_JOB_CLOSED:
    "placements.job.closed",
  PLACEMENTS_APPLICATION_SUBMITTED:
    "placements.application.submitted",
  PLACEMENTS_APPLICATION_WITHDRAWN:
    "placements.application.withdrawn",
  PLACEMENTS_SCREENING_DECIDED:
    "placements.screening.decided",
  PLACEMENTS_ROUND_COMPLETED:
    "placements.round.completed",
  PLACEMENTS_RESULT_APPLIED:
    "placements.result.applied",
  PLACEMENTS_OFFER_ISSUED:
    "placements.offer.issued",
  PLACEMENTS_OFFER_RESPONDED:
    "placements.offer.responded",
  PLACEMENTS_JOINING_RECORDED:
    "placements.joining.recorded",
  PLACEMENTS_REQUEST_SUBMITTED:
    "placements.request.submitted",
  PLACEMENTS_REQUEST_DECIDED:
    "placements.request.decided",
} as const;

export type ActivityEventType =
  (typeof ACTIVITY_EVENT_TYPES)[keyof typeof ACTIVITY_EVENT_TYPES];

const highImportance = new Set<ActivityEventType>([
  ACTIVITY_EVENT_TYPES.IDENTITY_MEMBERSHIP_SUSPENDED,
  ACTIVITY_EVENT_TYPES.IDENTITY_MEMBERSHIP_ENDED,
  ACTIVITY_EVENT_TYPES.PLACEMENTS_OFFER_ISSUED,
  ACTIVITY_EVENT_TYPES.PLACEMENTS_JOINING_RECORDED,
]);

export function defaultActivityImportance(
  eventType: ActivityEventType,
): ActivityImportance {
  return highImportance.has(eventType)
    ? "HIGH"
    : "NORMAL";
}
