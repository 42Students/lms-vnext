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
  PLATFORM_COLLEGE_UPDATED:"platform.college.updated",
  PLATFORM_COLLEGE_ARCHIVED:"platform.college.archived",
  PLATFORM_ORGANIZATION_CREATED:"platform.organization.created",
  PLATFORM_ORGANIZATION_RENAMED:"platform.organization.renamed",
  PLATFORM_ORGANIZATION_ARCHIVED:"platform.organization.archived",
  PLATFORM_COLLEGE_BRANDING_UPDATED:"platform.college.branding_updated",
  PLATFORM_COLLEGE_ANNOUNCEMENT_PUBLISHED:"platform.announcement.college_published",
  PLATFORM_COLLEGE_MODULE_RULE_CHANGED:"platform.module_access.college_rule_changed",
  PLATFORM_STUDENT_MODULE_RULE_CHANGED:"platform.module_access.student_rule_changed",
  PLATFORM_COLLEGE_CONTACT_UPDATED:
    "platform.college.contact_updated",
  IDENTITY_PERSON_ONBOARDED:
    "identity.person.onboarded",
  IDENTITY_ROLES_CHANGED:
    "identity.membership.roles_changed",
  IDENTITY_LEARNER_PROFILE_SECTION_UPDATED: "identity.learner_profile_section.updated",
  IDENTITY_LEARNER_CONTACT_UPDATED: "identity.learner_contact.updated",
  IDENTITY_COLLEGE_PERSON_PROFILE_UPDATED: "identity.college_person_profile.updated",
  IDENTITY_MENTOR_NOTIFICATION_ACKNOWLEDGED: "identity.mentor_notification.acknowledged",
  IDENTITY_TPO_NOTIFICATION_ACKNOWLEDGED: "identity.tpo_notification.acknowledged",
  IDENTITY_MEMBERSHIP_SUSPENDED:
    "identity.membership.suspended",
  IDENTITY_MEMBERSHIP_REACTIVATED:
    "identity.membership.reactivated",
  IDENTITY_MEMBERSHIP_ENDED:
    "identity.membership.ended",
  ACADEMICS_DEPARTMENT_CREATED: "academics.department.created",
  ACADEMICS_DEPARTMENT_UPDATED: "academics.department.updated",
  ACADEMICS_DEPARTMENT_ARCHIVED: "academics.department.archived",
  ACADEMICS_PROGRAM_CREATED:
    "academics.program.created",
  ACADEMICS_PROGRAM_UPDATED: "academics.program.updated",
  ACADEMICS_PROGRAM_ARCHIVED: "academics.program.archived",
  ACADEMICS_PERIOD_CLOSED: "academics.period.closed",
  ACADEMICS_PERIOD_REOPENED: "academics.period.reopened",
  ACADEMICS_SEMESTER_CREATED: "academics.semester.created",
  ACADEMICS_SEMESTER_UPDATED: "academics.semester.updated",
  ACADEMICS_SEMESTER_DELETED: "academics.semester.deleted",
  ACADEMICS_BATCH_CREATED: "academics.batch.created",
  ACADEMICS_BATCH_UPDATED: "academics.batch.updated",
  ACADEMICS_BATCH_PROMOTED: "academics.batch.promoted",
  ACADEMICS_CLASS_CREATED: "academics.class.created",
  ACADEMICS_CLASS_UPDATED: "academics.class.updated",
  ACADEMICS_ELECTIVE_SLOT_CREATED: "academics.elective_slot.created",
  ACADEMICS_ELECTIVE_SLOT_UPDATED: "academics.elective_slot.updated",
  ACADEMICS_LECTURE_HALL_CREATED: "academics.lecture_hall.created",
  ACADEMICS_LECTURE_HALL_UPDATED: "academics.lecture_hall.updated",
  ACADEMICS_GROUP_CREATED: "academics.group.created",
  ACADEMICS_GROUP_UPDATED: "academics.group.updated",
  ACADEMICS_GROUP_STATUS_CHANGED: "academics.group.status_changed",
  ACADEMICS_LEARNER_ENROLLED:
    "academics.learner.enrolled",
  COURSES_CATALOG_CREATED: "courses.catalog.created",
  COURSES_CATALOG_UPDATED: "courses.catalog.updated",
  COURSES_CATALOG_ARCHIVED: "courses.catalog.archived",
  COURSES_OFFERING_CREATED: "courses.offering.created",
  COURSES_OFFERING_UPDATED: "courses.offering.updated",
  COURSES_OFFERING_ARCHIVED: "courses.offering.archived",
  COURSES_OFFERING_RESTORED: "courses.offering.restored",
  COURSES_LEARNING_PATH_PUBLISHED:
    "courses.learning_path.published",
  COURSES_LEARNING_PATH_UNPUBLISHED: "courses.learning_path.unpublished",
  COURSES_LESSON_CREATED: "courses.lesson.created",
  COURSES_LESSON_UPDATED: "courses.lesson.updated",
  COURSES_LESSON_CONTENT_VISIBILITY_CHANGED: "courses.lesson_content.visibility_changed",
  COURSES_LESSON_MATERIAL_UPDATED: "courses.lesson_content.material_updated",
  COURSES_LESSON_REORDERED: "courses.lesson.reordered",
  COURSES_TEACHING_ASSIGNED:
    "courses.teaching_assignment.assigned",
  COURSES_TEACHING_ENDED:
    "courses.teaching_assignment.ended",
  COURSES_LEARNER_CONTENT_COMPLETED:
    "courses.learner_content.completed",
  COURSES_ASSIGNMENT_CREATED:"courses.assignment.created",
  COURSES_ASSIGNMENT_UPDATED:"courses.assignment.updated",
  COURSES_ASSIGNMENT_ARCHIVED:"courses.assignment.archived",
  COURSES_QUIZ_CREATED:"courses.quiz.created",
  COURSES_QUIZ_UPDATED:"courses.quiz.updated",
  COURSES_QUIZ_PUBLISHED:"courses.quiz.published",
  COURSES_QUIZ_RESULTS_CHANGED:"courses.quiz.results_changed",
  COURSES_QUIZ_ARCHIVED:"courses.quiz.archived",
  COURSES_QUIZ_CLOSED:"courses.quiz.closed",
  COURSES_ASSIGNMENT_SUBMITTED:
    "courses.assignment.submitted",
  COURSES_ASSIGNMENT_PUBLISHED:
    "courses.assignment.published",
  COURSES_ASSIGNMENT_GRADED:
    "courses.assignment.graded",
  COURSES_ASSIGNMENT_GRADE_PUBLISHED:
    "courses.assignment.grade_published",
  COURSES_ATTENDANCE_MARKED:
    "courses.attendance.marked",
  COURSES_CLASS_SCHEDULED:
    "courses.class.scheduled",
  COURSES_DISCUSSION_POSTED:
    "courses.discussion.posted",
  COURSES_DISCUSSION_REPLIED:"courses.discussion.replied",
  COURSES_DISCUSSION_PIN_CHANGED:
    "courses.discussion.pin_changed",
  COURSES_DISCUSSION_DELETED:
    "courses.discussion.deleted",
  PROJECTS_TEMPLATE_METADATA_UPDATED: "projects.template.metadata_updated",
  PROJECTS_PROJECT_CREATED:
    "projects.project.created",
  PROJECTS_PROJECT_COMPLETED: "projects.project.completed",
  PROJECTS_PROJECT_SUMMARY_UPDATED: "projects.project.summary_updated",
  // Lifecycle events are emitted only after W03's persisted mutation succeeds.
  // W06 owns the shared names; W03 owns actor authorization and the mutation.
  PROJECTS_PROJECT_ARCHIVED:
    "projects.project.archived",
  PROJECTS_PROJECT_RESTORED:
    "projects.project.restored",
  PROJECTS_PROJECT_DELETED:
    "projects.project.deleted",
  PROJECTS_MENTOR_REASSIGNED:
    "projects.mentor.reassigned",
  PROJECTS_READINESS_OVERRIDDEN:
    "projects.readiness.overridden",
  PROJECTS_SPRINT_UPDATED:
    "projects.sprint.updated",
  PROJECTS_MEETING_DECIDED: "projects.meeting.decided",
  PROJECTS_MEETING_NOTES_UPDATED: "projects.meeting.notes_updated",
  PROJECTS_MEETING_RESCHEDULED: "projects.meeting.rescheduled",
  PROJECTS_DELIVERY_DRAFT_CREATED: "projects.delivery.draft_created",
  PROJECTS_DELIVERY_DRAFT_UPDATED: "projects.delivery.draft_updated",
  PROJECTS_DELIVERY_SUBMITTED: "projects.delivery.submitted",
  PROJECTS_DELIVERY_REVIEWED: "projects.delivery.reviewed",
  PROJECTS_DELIVERY_LOCKED: "projects.delivery.locked",
  PROJECTS_DELIVERY_REOPENED: "projects.delivery.reopened",
  PROJECTS_TEAM_MEMBER_ADDED: "projects.team_member.added",
  PROJECTS_TEAM_MEMBER_UPDATED: "projects.team_member.updated",
  PROJECTS_TEAM_MEMBER_ENDED: "projects.team_member.ended",
  PROJECTS_RESOURCE_CREATED: "projects.resource.created",
  PROJECTS_RESOURCE_UPDATED: "projects.resource.updated",
  PROJECTS_RESOURCE_ARCHIVED: "projects.resource.archived",
  PROJECTS_TASK_CREATED:
    "projects.task.created",
  PROJECTS_TASK_DETAILS_UPDATED:
    "projects.task.details_updated",
  PROJECTS_TASK_STATUS_CHANGED:
    "projects.task.status_changed",
  PROJECTS_TASK_SUBMITTED:
    "projects.task.submitted",
  PROJECTS_TASK_REVIEWED:
    "projects.task.reviewed",
  PROJECTS_EVALUATION_RECORDED:
    "projects.evaluation.recorded",
  PLACEMENTS_SEASON_STARTED:
    "placements.season.started",
  PLACEMENTS_SEASON_CLOSED:
    "placements.season.closed",
  PLACEMENTS_COMPANY_DOMAIN_UPDATED: "placements.company.domain_updated",
  PLACEMENTS_COMPANY_RELATIONSHIP_ARCHIVED: "placements.company.relationship_archived",
  PLACEMENTS_COMPANY_RELATIONSHIP_RESTORED: "placements.company.relationship_restored",
  PLACEMENTS_COMPANY_ALIAS_UPDATED: "placements.company.alias_updated",
  PLACEMENTS_COMPANY_UPDATED: "placements.company.updated",
  PLACEMENTS_COMPANY_VERIFIED: "placements.company.verified",
  PLACEMENTS_COMPANY_UNVERIFIED: "placements.company.unverified",
  PLACEMENTS_COMPANY_LINKED:
    "placements.company.linked",
  PLACEMENTS_JOB_DRAFT_CREATED:
    "placements.job.draft_created",
  PLACEMENTS_JOB_PUBLISHED:
    "placements.job.published",
  PLACEMENTS_JOB_PUBLISHED_EDITED: "placements.job.published_edited",
  PLACEMENTS_JOB_ARCHIVED: "placements.job.archived",
  PLACEMENTS_JOB_REOPENED: "placements.job.reopened",
  PLACEMENTS_JOB_CLOSED:
    "placements.job.closed",
  PLACEMENTS_APPLICATION_SUBMITTED:
    "placements.application.submitted",
  PLACEMENTS_APPLICATION_WITHDRAWN:
    "placements.application.withdrawn",
  PLACEMENTS_SCREENING_DECIDED:
    "placements.screening.decided",
  PLATFORM_ADMIN_SESSIONS_REVOKED:
    "platform.admin.sessions_revoked",
  PLACEMENTS_BULK_RUN:
    "placements.bulk.run",
  PLACEMENTS_APPLICANT_STAGE_MOVED:
    "placements.applicant.stage_moved",
  PLACEMENTS_ROUND_COMPLETED:
    "placements.round.completed",
  PLACEMENTS_RESULT_STAGED:
    "placements.result.staged",
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
  PLACEMENTS_CANDIDATE_PREFERENCES_UPDATED:
    "placements.candidate_preferences.updated",
  PLACEMENTS_NOTIFICATION_PREFERENCES_UPDATED:
    "placements.notification_preferences.updated",
  PLACEMENTS_RECRUITER_CREATED: "placements.recruiter.created",
  PLACEMENTS_RECRUITER_UPDATED: "placements.recruiter.updated",
  PLACEMENTS_RECRUITER_SUSPENDED: "placements.recruiter.suspended",
  PLACEMENTS_RECRUITER_REACTIVATED: "placements.recruiter.reactivated",
  PLACEMENTS_RECRUITER_SESSIONS_REVOKED: "placements.recruiter.sessions_revoked",
  PLACEMENTS_RECRUITER_COLLEGE_GRANTED: "placements.recruiter.college_granted",
  PLACEMENTS_RECRUITER_COLLEGE_REVOKED: "placements.recruiter.college_revoked",
  PLACEMENTS_RECRUITER_PROFILE_UPDATED:
    "placements.recruiter.profile_updated",
} as const;

export type ActivityEventType =
  (typeof ACTIVITY_EVENT_TYPES)[keyof typeof ACTIVITY_EVENT_TYPES];

const highImportance = new Set<ActivityEventType>([
  ACTIVITY_EVENT_TYPES.IDENTITY_MEMBERSHIP_SUSPENDED,
  ACTIVITY_EVENT_TYPES.IDENTITY_MEMBERSHIP_ENDED,
  ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_ARCHIVED,
  ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_DELETED,
  ACTIVITY_EVENT_TYPES.PROJECTS_READINESS_OVERRIDDEN,
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
