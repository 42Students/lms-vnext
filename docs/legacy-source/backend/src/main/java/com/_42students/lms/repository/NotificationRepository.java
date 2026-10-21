package com._42students.lms.repository;

import com._42students.lms.model.Notification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import javax.transaction.Transactional;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    @Query(value = "select * from notification where is_deleted=0 or is_deleted is null order by id desc", nativeQuery = true)
    List<Notification> findAllActive();

    /**
     * Soft-deleted rows only, for the admin recycle bin. Unlike the academic-structure tables that
     * screen also lists, this one grows with students x events rather than with the size of the
     * institution, so it is the one type there that cannot afford a findAll() filtered in Java.
     */
    @Query(value = "select * from notification where is_deleted=1 order by id desc", nativeQuery = true)
    List<Notification> findAllDeleted();

    /** NC-17: paginated variant to avoid loading all notifications into memory */
    @Query(value = "select * from notification where is_deleted=0 or is_deleted is null order by id desc",
           countQuery = "select count(*) from notification where is_deleted=0 or is_deleted is null",
           nativeQuery = true)
    org.springframework.data.domain.Page<Notification> findAllActivePaged(Pageable pageable);

    /**
     * Superadmin scoped fetch (college-scoped).
     * - class_id maps to college via class -> new_program -> department -> college
     * - course_id maps to college via course -> department -> college
     */
    @Query(value = "select n.* from notification n " +
            "where (n.is_deleted=0 or n.is_deleted is null) and (" +
            " (n.class_id > 0 and n.class_id in (" +
            "   select cl.id from class cl " +
            "   join new_program p on cl.program_id = p.id " +
            "   join department d on p.dept_id = d.id " +
            "   where d.college_id = :collegeId" +
            " )) or " +
            " (n.course_id > 0 and n.course_id in (" +
            "   select c.id from course c " +
            "   join department d2 on c.dept_id = d2.id " +
            "   where d2.college_id = :collegeId" +
            " ))" +
            ") order by n.id desc",
            countQuery = "select count(*) from notification n " +
                    "where (n.is_deleted=0 or n.is_deleted is null) and (" +
                    " (n.class_id > 0 and n.class_id in (" +
                    "   select cl.id from class cl " +
                    "   join new_program p on cl.program_id = p.id " +
                    "   join department d on p.dept_id = d.id " +
                    "   where d.college_id = :collegeId" +
                    " )) or " +
                    " (n.course_id > 0 and n.course_id in (" +
                    "   select c.id from course c " +
                    "   join department d2 on c.dept_id = d2.id " +
                    "   where d2.college_id = :collegeId" +
                    " ))" +
                    ")",
            nativeQuery = true)
    org.springframework.data.domain.Page<Notification> findAllActivePagedByCollegeScope(@Param("collegeId") Integer collegeId, Pageable pageable);

    /**
     * Superadmin scoped fetch (org-scoped).
     * Uses org -> colleges -> joins.
     */
    @Query(value = "select n.* from notification n " +
            "where (n.is_deleted=0 or n.is_deleted is null) and (" +
            " (n.class_id > 0 and n.class_id in (" +
            "   select cl.id from class cl " +
            "   join new_program p on cl.program_id = p.id " +
            "   join department d on p.dept_id = d.id " +
            "   join college co on d.college_id = co.id " +
            "   where co.org_id = :orgId" +
            " )) or " +
            " (n.course_id > 0 and n.course_id in (" +
            "   select c.id from course c " +
            "   join department d2 on c.dept_id = d2.id " +
            "   join college co2 on d2.college_id = co2.id " +
            "   where co2.org_id = :orgId" +
            " ))" +
            ") order by n.id desc",
            countQuery = "select count(*) from notification n " +
                    "where (n.is_deleted=0 or n.is_deleted is null) and (" +
                    " (n.class_id > 0 and n.class_id in (" +
                    "   select cl.id from class cl " +
                    "   join new_program p on cl.program_id = p.id " +
                    "   join department d on p.dept_id = d.id " +
                    "   join college co on d.college_id = co.id " +
                    "   where co.org_id = :orgId" +
                    " )) or " +
                    " (n.course_id > 0 and n.course_id in (" +
                    "   select c.id from course c " +
                    "   join department d2 on c.dept_id = d2.id " +
                    "   join college co2 on d2.college_id = co2.id " +
                    "   where co2.org_id = :orgId" +
                    " ))" +
                    ")",
            nativeQuery = true)
    org.springframework.data.domain.Page<Notification> findAllActivePagedByOrgScope(@Param("orgId") Integer orgId, Pageable pageable);

    // class_id=0 alongside an exact classId match means "course-wide — every class of this
    // course", not "no class" — without the OR, a notification created that way (e.g.
    // ProjectWorkspaceServiceImpl's classless-workspace path) was invisible to every learner,
    // reachable only via superadmin's unscoped fetchAll.
    // Staff class feeds. A class-0 row is shared only when it names nobody: a personal class-0 row (a mentor's "You were assigned
    // as mentor", a student's project task) belongs to its recipient's own feed, not to every staff member of every class.
    @Query(value = "select * from notification where (class_id=:classId or (class_id=0 and (learner_id is null or learner_id=0))) and course_id=:courseId and (is_deleted=0 or is_deleted is null) order by id desc", nativeQuery = true)
    List<Notification> fetch(@Param("classId") int classId, @Param("courseId") int courseId);

    // A notification with no learner reaches the students of its own class only, and never a placement (JOB) one: those are
    // personal or meant for admins ("Rohit accepted the offer"), and class-wide they showed every classmate's applications;
    // class 0 with no learner ("Project created") reached every student of every college (full test run, 15 Oct 2026).
    // learner_id holds a faculty id when recipient_type is FACULTY, so a match on the number alone is not "mine" (V227).
    @Query(value = "select * from notification where course_id=:courseId "
            + "and (((learner_id is null or learner_id=0) and ((:classId > 0 and class_id=:classId) or (class_id=0 and course_id > 0)) "
            + "and (notification_type is null or notification_type <> 'JOB')) "
            + "or (learner_id=:learnerId and (recipient_type is null or recipient_type <> 'FACULTY'))) "
            + "and (is_deleted=0 or is_deleted is null) and (scheduled_at is null or scheduled_at <= now()) order by id desc", nativeQuery = true)
    List<Notification> fetchForLearner(@Param("classId") int classId, @Param("courseId") int courseId, @Param("learnerId") int learnerId);

    @Modifying
    @Transactional
    @Query("UPDATE notification n SET n.isDeleted = true WHERE n.id = :notificationId")
    int deleteNotification(@Param("notificationId") int notificationId);

    @Query(value = "select * from notification where (class_id=:classId or (class_id=0 and (learner_id is null or learner_id=0))) and (is_deleted=0 or is_deleted is null) order by id desc", nativeQuery = true)
    List<Notification> getNotificationsByClassId(@Param("classId") int classId);

    @Query(value = "select * from notification where "
            + "(((learner_id is null or learner_id=0) and :classId > 0 and class_id=:classId and (notification_type is null or notification_type <> 'JOB')) "
            + "or (learner_id=:learnerId and (recipient_type is null or recipient_type <> 'FACULTY'))) "
            + "and (is_deleted=0 or is_deleted is null) and (scheduled_at is null or scheduled_at <= now()) order by id desc", nativeQuery = true)
    List<Notification> getNotificationsByClassIdForLearner(@Param("classId") int classId, @Param("learnerId") int learnerId);

    @Query(value = "select * from notification where (class_id=:classId or (class_id=0 and (learner_id is null or learner_id=0))) and (is_deleted=0 or is_deleted is null) order by id desc", nativeQuery = true)
    List<Notification> getNotificationsByClassId(@Param("classId") int classId, Pageable pageable);

    @Query(value = "select * from notification where "
            + "(((learner_id is null or learner_id=0) and :classId > 0 and class_id=:classId and (notification_type is null or notification_type <> 'JOB')) "
            + "or (learner_id=:learnerId and (recipient_type is null or recipient_type <> 'FACULTY'))) "
            + "and (is_deleted=0 or is_deleted is null) and (scheduled_at is null or scheduled_at <= now()) order by id desc", nativeQuery = true)
    List<Notification> getNotificationsByClassIdForLearner(@Param("classId") int classId, @Param("learnerId") int learnerId, Pageable pageable);

    @Query(value = "select count(*) from notification where (class_id=:classId or (class_id=0 and (learner_id is null or learner_id=0))) and (is_deleted=0 or is_deleted is null)", nativeQuery = true)
    long countByClassId(@Param("classId") int classId);

    /**
     * Cross-class fetch by recipient: learner_id holds the id, recipient_type whose it is (LEARNER or FACULTY; V227). Used to
     * surface mentor/faculty notifications that aren't scoped to a single class, e.g. classless project workspaces.
     */
    @Query(value = "select * from notification where learner_id=:recipientId and coalesce(recipient_type, 'LEARNER')=:recipientType "
            + "and (is_deleted=0 or is_deleted is null) and (scheduled_at is null or scheduled_at <= now()) order by id desc", nativeQuery = true)
    List<Notification> findByRecipientId(@Param("recipientId") int recipientId, @Param("recipientType") String recipientType, Pageable pageable);

    /**
     * M2: notifications whose send-later time has arrived but which have not been released yet.
     * Ordered oldest-first so a backlog (a job outage, say) drains in the order it was queued.
     */
    @Query(value = "select * from notification where delivery_status = 'SCHEDULED' and scheduled_at is not null "
            + "and scheduled_at <= :now and (is_deleted=0 or is_deleted is null) order by scheduled_at asc",
           nativeQuery = true)
    List<Notification> findDueScheduled(@Param("now") java.time.LocalDateTime now, Pageable pageable);

    /** NC-03: soft-delete notifications older than the given cutoff to prevent unbounded table growth */
    @Modifying
    @Transactional
    @Query(value = "UPDATE notification SET is_deleted = 1 WHERE created_at < :cutoff AND (is_deleted = 0 OR is_deleted IS NULL)",
           countQuery = "SELECT COUNT(*) FROM notification WHERE created_at < :cutoff AND (is_deleted = 0 OR is_deleted IS NULL)",
           nativeQuery = true)
    int softDeleteOlderThan(@Param("cutoff") java.time.LocalDateTime cutoff);
}

