package com._42students.lms.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com._42students.lms.enums.AnnouncementType;
import com._42students.lms.model.Announcement;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    // You can add custom query methods if needed

    @Query("SELECT a FROM Announcement a WHERE (a.isDeleted IS NULL OR a.isDeleted = false) ORDER BY a.createdAt DESC")
    List<Announcement> findAllActive();

    /**
     * Soft-deleted announcements, newest-deleted first. Backs the restore screen; per-row access
     * (has this caller ever had access to this announcement's receiver?) is checked in the
     * controller the same way fetchById already does, since receiver-based scoping can't be
     * expressed as a single WHERE clause here.
     */
    @Query("SELECT a FROM Announcement a WHERE a.isDeleted = true ORDER BY a.updatedAt DESC")
    List<Announcement> findAllDeleted();

    /** DB-level paginated variant of {@link #findAllActive()} — avoids loading the full table into memory. */
    @Query("SELECT a FROM Announcement a WHERE (a.isDeleted IS NULL OR a.isDeleted = false)")
    Page<Announcement> findAllActive(Pageable pageable);

    /**
     * Superadmin scoped fetch (college-scoped).
     *
     * Announcements don't store orgId/collegeId directly; they store receiverType + receiverValue.
     * This query maps receiverValue -> collegeId through the corresponding entity tables.
     * :collegeId is compared only with Integer id columns: comparing it directly with the Long receiverValue made
     * Hibernate type the parameter as Long and reject the Integer college id, so every admin listing answered 500.
     */
    @Query("SELECT a FROM Announcement a WHERE " +
            "(a.isDeleted IS NULL OR a.isDeleted = false) AND (" +
            " (a.receiverType = :collegeType AND a.receiverValue IN (SELECT c.id FROM college c WHERE c.id = :collegeId)) OR " +
            " (a.receiverType = :departmentType AND a.receiverValue IN (SELECT d.id FROM department d WHERE d.collegeId = :collegeId)) OR " +
            " (a.receiverType = :programType AND a.receiverValue IN (SELECT p.id FROM NewProgram p WHERE p.deptId IN (SELECT d2.id FROM department d2 WHERE d2.collegeId = :collegeId))) OR " +
            " (a.receiverType = :classType AND a.receiverValue IN (SELECT cl.id FROM class cl, NewProgram p2, department d3 " +
            "    WHERE cl.programId = p2.id AND p2.deptId = d3.id AND d3.collegeId = :collegeId)) OR " +
            " (a.receiverType = :facultyType AND a.receiverValue IN (SELECT f.id FROM faculty f WHERE f.collegeId = :collegeId)) OR " +
            " (a.receiverType = :learnerType AND a.receiverValue IN (SELECT l.id FROM learner l WHERE l.collegeId = :collegeId)) " +
            ") ORDER BY a.createdAt DESC")
    List<Announcement> findAllActiveByCollegeScope(
            @Param("collegeId") Integer collegeId,
            @Param("collegeType") AnnouncementType collegeType,
            @Param("departmentType") AnnouncementType departmentType,
            @Param("programType") AnnouncementType programType,
            @Param("classType") AnnouncementType classType,
            @Param("facultyType") AnnouncementType facultyType,
            @Param("learnerType") AnnouncementType learnerType
    );

    /** DB-level paginated variant of {@link #findAllActiveByCollegeScope}. */
    @Query("SELECT a FROM Announcement a WHERE " +
            "(a.isDeleted IS NULL OR a.isDeleted = false) AND (" +
            " (a.receiverType = :collegeType AND a.receiverValue IN (SELECT c.id FROM college c WHERE c.id = :collegeId)) OR " +
            " (a.receiverType = :departmentType AND a.receiverValue IN (SELECT d.id FROM department d WHERE d.collegeId = :collegeId)) OR " +
            " (a.receiverType = :programType AND a.receiverValue IN (SELECT p.id FROM NewProgram p WHERE p.deptId IN (SELECT d2.id FROM department d2 WHERE d2.collegeId = :collegeId))) OR " +
            " (a.receiverType = :classType AND a.receiverValue IN (SELECT cl.id FROM class cl, NewProgram p2, department d3 " +
            "    WHERE cl.programId = p2.id AND p2.deptId = d3.id AND d3.collegeId = :collegeId)) OR " +
            " (a.receiverType = :facultyType AND a.receiverValue IN (SELECT f.id FROM faculty f WHERE f.collegeId = :collegeId)) OR " +
            " (a.receiverType = :learnerType AND a.receiverValue IN (SELECT l.id FROM learner l WHERE l.collegeId = :collegeId)) " +
            ")")
    Page<Announcement> findAllActiveByCollegeScope(
            @Param("collegeId") Integer collegeId,
            @Param("collegeType") AnnouncementType collegeType,
            @Param("departmentType") AnnouncementType departmentType,
            @Param("programType") AnnouncementType programType,
            @Param("classType") AnnouncementType classType,
            @Param("facultyType") AnnouncementType facultyType,
            @Param("learnerType") AnnouncementType learnerType,
            Pageable pageable
    );

    /**
     * Superadmin scoped fetch (org-scoped).
     *
     * Uses org -> colleges -> entity tables to map receiverValue -> orgId.
     */
    @Query("SELECT a FROM Announcement a WHERE " +
            "(a.isDeleted IS NULL OR a.isDeleted = false) AND (" +
            " (a.receiverType = :collegeType AND a.receiverValue IN (SELECT c.id FROM college c WHERE c.orgId = :orgId)) OR " +
            " (a.receiverType = :departmentType AND a.receiverValue IN (SELECT d.id FROM department d WHERE d.collegeId IN (SELECT c2.id FROM college c2 WHERE c2.orgId = :orgId))) OR " +
            " (a.receiverType = :programType AND a.receiverValue IN (SELECT p.id FROM NewProgram p WHERE p.deptId IN (SELECT d2.id FROM department d2 WHERE d2.collegeId IN (SELECT c3.id FROM college c3 WHERE c3.orgId = :orgId)))) OR " +
            " (a.receiverType = :classType AND a.receiverValue IN (SELECT cl.id FROM class cl, NewProgram p2, department d3, college c4 " +
            "    WHERE cl.programId = p2.id AND p2.deptId = d3.id AND d3.collegeId = c4.id AND c4.orgId = :orgId)) OR " +
            " (a.receiverType = :facultyType AND a.receiverValue IN (SELECT f.id FROM faculty f WHERE f.collegeId IN (SELECT c5.id FROM college c5 WHERE c5.orgId = :orgId))) OR " +
            " (a.receiverType = :learnerType AND a.receiverValue IN (SELECT l.id FROM learner l WHERE l.collegeId IN (SELECT c6.id FROM college c6 WHERE c6.orgId = :orgId))) " +
            ") ORDER BY a.createdAt DESC")
    List<Announcement> findAllActiveByOrgScope(
            @Param("orgId") Integer orgId,
            @Param("collegeType") AnnouncementType collegeType,
            @Param("departmentType") AnnouncementType departmentType,
            @Param("programType") AnnouncementType programType,
            @Param("classType") AnnouncementType classType,
            @Param("facultyType") AnnouncementType facultyType,
            @Param("learnerType") AnnouncementType learnerType
    );

    /** DB-level paginated variant of {@link #findAllActiveByOrgScope}. */
    @Query("SELECT a FROM Announcement a WHERE " +
            "(a.isDeleted IS NULL OR a.isDeleted = false) AND (" +
            " (a.receiverType = :collegeType AND a.receiverValue IN (SELECT c.id FROM college c WHERE c.orgId = :orgId)) OR " +
            " (a.receiverType = :departmentType AND a.receiverValue IN (SELECT d.id FROM department d WHERE d.collegeId IN (SELECT c2.id FROM college c2 WHERE c2.orgId = :orgId))) OR " +
            " (a.receiverType = :programType AND a.receiverValue IN (SELECT p.id FROM NewProgram p WHERE p.deptId IN (SELECT d2.id FROM department d2 WHERE d2.collegeId IN (SELECT c3.id FROM college c3 WHERE c3.orgId = :orgId)))) OR " +
            " (a.receiverType = :classType AND a.receiverValue IN (SELECT cl.id FROM class cl, NewProgram p2, department d3, college c4 " +
            "    WHERE cl.programId = p2.id AND p2.deptId = d3.id AND d3.collegeId = c4.id AND c4.orgId = :orgId)) OR " +
            " (a.receiverType = :facultyType AND a.receiverValue IN (SELECT f.id FROM faculty f WHERE f.collegeId IN (SELECT c5.id FROM college c5 WHERE c5.orgId = :orgId))) OR " +
            " (a.receiverType = :learnerType AND a.receiverValue IN (SELECT l.id FROM learner l WHERE l.collegeId IN (SELECT c6.id FROM college c6 WHERE c6.orgId = :orgId))) " +
            ")")
    Page<Announcement> findAllActiveByOrgScope(
            @Param("orgId") Integer orgId,
            @Param("collegeType") AnnouncementType collegeType,
            @Param("departmentType") AnnouncementType departmentType,
            @Param("programType") AnnouncementType programType,
            @Param("classType") AnnouncementType classType,
            @Param("facultyType") AnnouncementType facultyType,
            @Param("learnerType") AnnouncementType learnerType,
            Pageable pageable
    );

    List<Announcement> findByReceiverTypeAndReceiverValue(AnnouncementType receiverType, Long receiverValue);

    // Visibility window (Part B: schedule/expiry/pin) applies to RECIPIENT-facing queries only --
    // a scheduled announcement stays hidden until its time, an expired one drops out on its own,
    // and pinned rows sort above the rest. Admin-facing listings above deliberately skip this
    // filter so an admin can still see and manage what they scheduled.
    @Query("SELECT a FROM Announcement a WHERE " +
        "((a.receiverType = :collegeType AND a.receiverValue = :collegeId) OR " +
        "(a.receiverType = :programType AND a.receiverValue = :programId) OR " +
        "(a.receiverType = :classType AND a.receiverValue = :classId) OR " +
        "(a.receiverType = :learnerType AND a.receiverValue = :learnerId)) " +
        "AND (a.isDeleted IS NULL OR a.isDeleted = false) " +
        "AND (a.scheduledAt IS NULL OR a.scheduledAt <= CURRENT_TIMESTAMP) " +
        "AND (a.expiresAt IS NULL OR a.expiresAt > CURRENT_TIMESTAMP) " +
        "ORDER BY a.isPinned DESC, a.createdAt DESC")
    List<Announcement> findByLearnerAnnouncements(
        @Param("collegeType") AnnouncementType collegeType,
        @Param("collegeId") Long collegeId,
        @Param("programType") AnnouncementType programType,
        @Param("programId") Long programId,
        @Param("classType") AnnouncementType classType,
        @Param("classId") Long classId,
        @Param("learnerType") AnnouncementType learnerType,
        @Param("learnerId") Long learnerId
    );

    /** DB-level paginated variant of {@link #findByLearnerAnnouncements}. */
    @Query("SELECT a FROM Announcement a WHERE " +
        "((a.receiverType = :collegeType AND a.receiverValue = :collegeId) OR " +
        "(a.receiverType = :programType AND a.receiverValue = :programId) OR " +
        "(a.receiverType = :classType AND a.receiverValue = :classId) OR " +
        "(a.receiverType = :learnerType AND a.receiverValue = :learnerId)) " +
        "AND (a.isDeleted IS NULL OR a.isDeleted = false) " +
        "AND (a.scheduledAt IS NULL OR a.scheduledAt <= CURRENT_TIMESTAMP) " +
        "AND (a.expiresAt IS NULL OR a.expiresAt > CURRENT_TIMESTAMP)")
    Page<Announcement> findByLearnerAnnouncements(
        @Param("collegeType") AnnouncementType collegeType,
        @Param("collegeId") Long collegeId,
        @Param("programType") AnnouncementType programType,
        @Param("programId") Long programId,
        @Param("classType") AnnouncementType classType,
        @Param("classId") Long classId,
        @Param("learnerType") AnnouncementType learnerType,
        @Param("learnerId") Long learnerId,
        Pageable pageable
    );

    // Faculty can create PROGRAM/CLASS/LEARNER-scoped announcements too (see
    // AnnouncementController#createAnnouncement, which access-checks all 6 receiver types for a
    // faculty caller) — but this query previously only matched COLLEGE/DEPARTMENT/FACULTY, so a
    // faculty member who created e.g. a CLASS-scoped announcement could never see it again on
    // their own notifications page afterward. "OR sender = me" guarantees you can always find
    // what you created, regardless of its receiver scope.
    @Query("SELECT a FROM Announcement a WHERE " +
        "((a.receiverType = :collegeType AND a.receiverValue = :collegeId) OR " +
        "(a.receiverType = :departmentType AND a.receiverValue = :departmentId) OR " +
        "(a.receiverType = :facultyType AND a.receiverValue = :facultyId) OR " +
        "(a.senderId = :facultyId AND :facultyId <> 0)) " +
        "AND (a.isDeleted IS NULL OR a.isDeleted = false) " +
        "AND (a.scheduledAt IS NULL OR a.scheduledAt <= CURRENT_TIMESTAMP OR a.senderId = :facultyId) " +
        "AND (a.expiresAt IS NULL OR a.expiresAt > CURRENT_TIMESTAMP OR a.senderId = :facultyId) " +
        "ORDER BY a.isPinned DESC, a.createdAt DESC")
    List<Announcement> findByFacultyAnnouncements(
        @Param("collegeType") AnnouncementType collegeType,
        @Param("collegeId") Long collegeId,
        @Param("departmentType") AnnouncementType departmentType,
        @Param("departmentId") Long departmentId,
        @Param("facultyType") AnnouncementType facultyType,
        @Param("facultyId") Long facultyId
    );

    /** DB-level paginated variant of {@link #findByFacultyAnnouncements}. */
    @Query("SELECT a FROM Announcement a WHERE " +
        "((a.receiverType = :collegeType AND a.receiverValue = :collegeId) OR " +
        "(a.receiverType = :departmentType AND a.receiverValue = :departmentId) OR " +
        "(a.receiverType = :facultyType AND a.receiverValue = :facultyId) OR " +
        "(a.senderId = :facultyId AND :facultyId <> 0)) " +
        "AND (a.isDeleted IS NULL OR a.isDeleted = false) " +
        "AND (a.scheduledAt IS NULL OR a.scheduledAt <= CURRENT_TIMESTAMP OR a.senderId = :facultyId) " +
        "AND (a.expiresAt IS NULL OR a.expiresAt > CURRENT_TIMESTAMP OR a.senderId = :facultyId)")
    Page<Announcement> findByFacultyAnnouncements(
        @Param("collegeType") AnnouncementType collegeType,
        @Param("collegeId") Long collegeId,
        @Param("departmentType") AnnouncementType departmentType,
        @Param("departmentId") Long departmentId,
        @Param("facultyType") AnnouncementType facultyType,
        @Param("facultyId") Long facultyId,
        Pageable pageable
    );
}

