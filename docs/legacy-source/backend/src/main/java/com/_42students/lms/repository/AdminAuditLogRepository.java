package com._42students.lms.repository;

import com._42students.lms.model.AdminAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, Long> {

    @Query("SELECT a FROM AdminAuditLog a WHERE " +
            "(:actionKey IS NULL OR a.actionKey = :actionKey) AND " +
            "(:actorUserId IS NULL OR a.actorUserId = :actorUserId) AND " +
            "(:organizationId IS NULL OR a.organizationId = :organizationId) AND " +
            // SAA-02/04: template-lifecycle rows (auditTemplateAction) always carry a null
            // collegeId — templates went global in V136, and only a super-admin (whose own
            // collegeId is also null) can trigger create/publish/archive/rollback/college-assign,
            // so `a.collegeId` on a PROJECT_TEMPLATE row is never anything else. A plain
            // `a.collegeId = :collegeId` match can therefore never surface them for a
            // college-scoped request, no matter which college is selected — 9 filter options on
            // the super-admin audit page existed purely to look like they worked.
            // `includeGlobalTemplateEvents` (true only for a super-admin caller — see
            // AdminProjectController#getAuditLog) is the narrow, role-gated escape hatch: it lets
            // PROJECT_TEMPLATE rows through regardless of collegeId, without loosening the match
            // for any other entity type, and without ever surfacing template rows to a
            // college-admin's own (deliberately collegeId-scoped) audit feed.
            "(:collegeId IS NULL OR a.collegeId = :collegeId OR (:includeGlobalTemplateEvents = TRUE AND a.entityType = 'PROJECT_TEMPLATE')) AND " +
            // entityId is the human-readable slug/key most PROJECT_* rows are stamped with (see
            // auditProjectAction) — an exact match lets a workspace/template detail page deep-link
            // straight to "everything that happened on this entity" instead of the whole college feed.
            "(:entityId IS NULL OR a.entityId = :entityId) AND " +
            // entityType narrows an entityId match to a specific table (e.g. "user") so that a
            // Faculty row and a Learner row that happen to share a numeric id don't bleed into
            // each other's audit trail when only entityId is supplied.
            // Suspend/reactivate used to be stamped with the generic "user" type (the id is still the
            // learner's or faculty's own id), so a "learner"/"faculty" trail also picks up those
            // older rows by their action prefix, without a learner and a faculty sharing an id
            // seeing each other's.
            "(:entityType IS NULL OR a.entityType = :entityType OR (a.entityType = 'user' AND (" +
            "(:entityType = 'learner' AND a.actionKey LIKE 'LEARNER%') OR (:entityType = 'faculty' AND a.actionKey LIKE 'FACULTY%')))) AND " +
            // CAA-01: "Project audit" (AdminProjectController#getAuditLog) shares this same table/
            // query with every other admin controller that calls adminAuditLogService.log
            // (courses, faculty, learners, quizzes, attendance, announcements, ...) — with no
            // action filter selected it previously showed every admin event in the college, not
            // just project ones, silently under-flagging cross-module destructive actions (the
            // caller's DESTRUCTIVE_ACTIONS set only recognizes PROJECT_* keys) and duplicating the
            // real Activity Log under a misleading label. auditProjectAction/auditTemplateAction/
            // auditTaskAction consistently stamp entityType as PROJECT/PROJECT_TEMPLATE/
            // PROJECT_TASK, so restricting to that set (only when the caller opts in) scopes this
            // endpoint to the project domain without touching every other caller of this query.
            "(:projectDomainOnly = FALSE OR a.entityType IN ('PROJECT', 'PROJECT_TEMPLATE', 'PROJECT_TASK')) AND " +
            "(:since IS NULL OR a.createdAt >= :since) AND " +
            // Part B "Audit log: filter by date range" -- only a lower bound existed, so an
            // admin could say "since Monday" but never "Monday to Wednesday".
            "(:until IS NULL OR a.createdAt <= :until) " +
            "ORDER BY a.createdAt DESC")
    Page<AdminAuditLog> search(@Param("actionKey") String actionKey,
                               @Param("actorUserId") Integer actorUserId,
                               @Param("organizationId") Integer organizationId,
                               @Param("collegeId") Integer collegeId,
                               @Param("entityId") String entityId,
                               @Param("entityType") String entityType,
                               @Param("since") LocalDateTime since,
                               @Param("until") java.time.LocalDateTime until,
                               @Param("includeGlobalTemplateEvents") boolean includeGlobalTemplateEvents,
                               @Param("projectDomainOnly") boolean projectDomainOnly,
                               Pageable pageable);

    /**
     * College activity feed by category. The plain feed is dominated by day-to-day project chatter
     * (task status moves, comments, reorders, syncs), which buried the handful of entries an admin
     * actually needs to see: deletions, promotions, suspensions, access and feature changes.
     * Categories are decided here, server-side, so paging and totals stay correct.
     *   important - deletions/restores, promotions and semester changes, suspensions/reactivations,
     *               impersonation, module access and feature toggles, identity reads, bulk status.
     *   setup     - departments, programs, semesters, batches, classes, courses, lessons, halls.
     *   people    - faculty, students, accounts and their access.
     *   teaching  - class schedule, attendance, announcements, quizzes, lesson content.
     *   projects  - project workspaces and tasks.
     */
    @Query("SELECT a FROM AdminAuditLog a WHERE " +
            "(:collegeId IS NULL OR a.collegeId = :collegeId) AND " +
            "(:organizationId IS NULL OR a.organizationId = :organizationId) AND " +
            "(:actorUserId IS NULL OR a.actorUserId = :actorUserId) AND " +
            "(:since IS NULL OR a.createdAt >= :since) AND " +
            "(:until IS NULL OR a.createdAt <= :until) AND (" +
            " (:category = 'important' AND (a.actionKey LIKE '%DELETE%' OR a.actionKey LIKE '%RESTORE%' " +
            "   OR a.actionKey LIKE '%PROMOTE%' OR a.actionKey = 'BATCH_SEMESTER_UPDATE' OR a.actionKey LIKE '%SUSPEND%' " +
            "   OR a.actionKey LIKE '%REACTIVAT%' OR a.actionKey LIKE '%IMPERSONAT%' OR a.actionKey LIKE 'MODULE_ACCESS%' " +
            "   OR a.actionKey LIKE '%FEATURE_TOGGLE%' OR a.actionKey LIKE '%IDENTITY_READ%' OR a.actionKey LIKE '%BULK_STATUS%')) " +
            " OR (:category = 'setup' AND LOWER(a.entityType) IN ('department', 'program', 'semester', 'batch', 'class', 'course', 'lesson', 'lecture_hall')) " +
            " OR (:category = 'people' AND (LOWER(a.entityType) IN ('faculty', 'learner', 'learner_profile', 'user') OR a.actionKey LIKE 'MODULE_ACCESS%')) " +
            " OR (:category = 'teaching' AND LOWER(a.entityType) IN ('class_schedule', 'announcement', 'quiz', 'lesson_content')) " +
            " OR (:category = 'projects' AND a.entityType IN ('PROJECT', 'PROJECT_TASK', 'PROJECT_TEMPLATE')) " +
            ") ORDER BY a.createdAt DESC")
    Page<AdminAuditLog> searchByCategory(@Param("category") String category,
                                         @Param("actorUserId") Integer actorUserId,
                                         @Param("organizationId") Integer organizationId,
                                         @Param("collegeId") Integer collegeId,
                                         @Param("since") LocalDateTime since,
                                         @Param("until") LocalDateTime until,
                                         Pageable pageable);
}


