package com._42students.lms.repository;

import com._42students.lms.model.Learner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import javax.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

@Repository
public interface LearnerRepository extends JpaRepository<Learner, Integer> {

    /**
     * Active learners per class and per program for one college, in a single grouped query.
     *
     * <p>Feeds the module-access grid's "how many students does this node cover" column, which is
     * the blast-radius figure shown before a broad change is confirmed. Returns rows of
     * [classId, programId, count]; either id may be null (a learner not yet assigned to a class
     * still counts toward their program and the college), so the caller rolls these up rather than
     * assuming every learner sits under a class.
     */
    // Entity name is the lowercase "learner" (see @Entity on the model) — every other query in
    // this repository uses it, and "FROM Learner" fails query validation at startup.
    // Suspended learners are excluded: they cannot log in, so counting them inflated the
    // blast-radius figure shown before a destructive confirm. isDeleted IS NULL is included
    // because `= false` evaluates to NULL (not true) for a null column, and legacy rows have it —
    // every other learner query in this file carries the same guard.
    @Query("SELECT l.classId, l.programId, COUNT(l) FROM learner l "
            + "WHERE l.collegeId = :collegeId AND (l.isDeleted = false OR l.isDeleted IS NULL) "
            + "AND l.suspendedAt IS NULL "
            + "GROUP BY l.classId, l.programId")
    List<Object[]> countActiveByClassAndProgram(@Param("collegeId") Integer collegeId);

    /** Active learners in a college, for cross-referencing per-student module overrides. */
    @Query("SELECT l FROM learner l WHERE l.collegeId = :collegeId "
            + "AND (l.isDeleted = false OR l.isDeleted IS NULL)")
    List<Learner> findActiveByCollegeIdForOverrides(@Param("collegeId") Integer collegeId);

    // B3: bulk-import undo. Grouped by batch so "Import History" can show one row per import
    // (batch id, when, how many) rather than 200 individual learner rows.
    @Query("SELECT l.bulkImportBatchId, COUNT(l), MIN(l.createdAt) FROM learner l " +
           "WHERE l.collegeId = :collegeId AND l.bulkImportBatchId IS NOT NULL AND l.isDeleted = false " +
           "GROUP BY l.bulkImportBatchId ORDER BY MIN(l.createdAt) DESC")
    List<Object[]> findBulkImportBatchesByCollegeId(@Param("collegeId") Integer collegeId);

    List<Learner> findByBulkImportBatchIdAndCollegeIdAndIsDeletedFalse(String bulkImportBatchId, Integer collegeId);

    // Serializes concurrent Interview scheduling for the same learner across DIFFERENT job
    // applications — InterviewServiceImpl.scheduleInterview only locks the JobApplication row
    // (via JobApplicationRepository#findByIdForUpdate), so two concurrent requests for the same
    // learner but two different applications lock two different rows and can both pass the
    // learner-level overlap check before either commits. Locking the Learner row here serializes
    // any two schedule attempts for that learner regardless of which application they target.
    // JPQL entity name is lowercase ("learner", see Learner.java's @Entity(name = "learner")) —
    // this was the only custom JPQL query referencing the entity by name and had gone stale after
    // that rename. It only surfaces as a boot-time failure (Hibernate validates every @Query at
    // context startup), so a long-lived dev server that started before the rename never caught it.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT l FROM learner l WHERE l.id = :id")
    Optional<Learner> findByIdForUpdate(@Param("id") Integer id);

    @Query(value = "select * from learner where (id=:studentId or contact_mobile=:studentId or roll_number=" +
            ":studentId or contact_phone=:studentId) and (is_deleted = false or is_deleted is null) limit 1", nativeQuery = true)
    Learner getStudentDetails(@Param("studentId") String studentId);
 
    // Roster queries go through RosterSql so a GROUP_BACKED class (elective offering) has the same
    // roster everywhere a section does. Learners' own class_id is never rewritten.
    @Query(value = "select l.* from learner l where " + RosterSql.LEARNER_IN_CLASS, nativeQuery = true)
    List<Learner> getStudentDetailsByClassId(@Param("classId") int classId);

    // Same roster as getStudentDetailsByClassId but excludes soft-deleted learners — used where the
    // caller's contract explicitly promises "active" learners only (e.g. bulk workspace creation),
    // unlike getStudentDetailsByClassId's other callers (attendance/scheduling/notifications), which
    // aren't in scope to re-audit here.
    @Query(value = "select l.* from learner l where " + RosterSql.LEARNER_IN_CLASS
            + " and (l.is_deleted = false or l.is_deleted is null)", nativeQuery = true)
    List<Learner> getActiveStudentDetailsByClassId(@Param("classId") int classId);

    @Query(value = "SELECT DISTINCT l.* FROM learner l " +
            "JOIN lesson_contents lc ON lc.id = :lessonContentId " +
            "JOIN course c ON c.id = lc.course_id AND (c.is_deleted = false OR c.is_deleted IS NULL) " +
            "JOIN department course_dept ON course_dept.id = c.dept_id AND (course_dept.is_deleted = false OR course_dept.is_deleted IS NULL) " +
            "JOIN class learner_class ON learner_class.id = l.class_id AND (learner_class.is_deleted = false OR learner_class.is_deleted IS NULL) " +
            "JOIN new_program learner_program ON learner_program.id = learner_class.program_id AND (learner_program.is_deleted = false OR learner_program.is_deleted IS NULL) " +
            "JOIN department learner_dept ON learner_dept.id = learner_program.dept_id AND (learner_dept.is_deleted = false OR learner_dept.is_deleted IS NULL) " +
            "WHERE (l.is_deleted = false OR l.is_deleted IS NULL) " +
            "AND course_dept.college_id = learner_dept.college_id " +
            "AND (lc.class_id = l.class_id OR lc.class_id IS NULL OR lc.class_id < 1) " +
            "AND (EXISTS (SELECT 1 FROM faculty_teaching_assignment teaching " +
            "             WHERE teaching.class_id = l.class_id AND teaching.course_id = lc.course_id " +
            "             AND teaching.is_active = true AND (teaching.is_deleted = false OR teaching.is_deleted IS NULL)) " +
            "     OR EXISTS (SELECT 1 FROM semester_course mapped " +
            "                JOIN semester term ON term.id = mapped.semester_id " +
            "                WHERE term.program_id = learner_class.program_id AND mapped.course_id = lc.course_id " +
            "                AND (mapped.is_deleted = false OR mapped.is_deleted IS NULL) " +
            "                AND (term.is_deleted = false OR term.is_deleted IS NULL)))", nativeQuery = true)
    List<Learner> findEligibleLearnersForAssignment(@Param("lessonContentId") int lessonContentId);

    @Query(value = "select * from learner where college_id=:collegeId", nativeQuery = true)
    List<Learner> fetchContactsByCollegeId(@Param("collegeId") int collegeId);

    @Query(value = "SELECT l.* FROM learner l " +
            "INNER JOIN college c ON l.college_id = c.id " +
            "WHERE c.org_id = :orgId", nativeQuery = true)
    List<Learner> fetchContactsByOrganizationId(@Param("orgId") int orgId);

    @Query(value = "SELECT l.* FROM learner l " +
            "WHERE (l.is_deleted = 0 OR l.is_deleted IS NULL) " +
            "AND (EXISTS (SELECT 1 FROM college c1 WHERE c1.id = l.college_id AND c1.org_id = :orgId) " +
            "OR EXISTS (SELECT 1 FROM class cl " +
            "JOIN new_program p ON cl.program_id = p.id " +
            "JOIN department d ON p.dept_id = d.id " +
            "JOIN college c2 ON d.college_id = c2.id AND c2.org_id = :orgId " +
            "WHERE cl.id = l.class_id))", nativeQuery = true)
    List<Learner> findLearnersByOrganizationIdIncludingViaClass(@Param("orgId") int orgId);

    @Query(value = "SELECT l.* FROM learner l " +
            "WHERE (l.is_deleted = 0 OR l.is_deleted IS NULL) " +
            "AND (EXISTS (SELECT 1 FROM college c1 WHERE c1.id = l.college_id AND c1.org_id = :orgId) " +
            "OR EXISTS (SELECT 1 FROM class cl " +
            "JOIN new_program p ON cl.program_id = p.id " +
            "JOIN department d ON p.dept_id = d.id " +
            "JOIN college c2 ON d.college_id = c2.id AND c2.org_id = :orgId " +
            "WHERE cl.id = l.class_id))",
            countQuery = "SELECT COUNT(*) FROM learner l " +
            "WHERE (l.is_deleted = 0 OR l.is_deleted IS NULL) " +
            "AND (EXISTS (SELECT 1 FROM college c1 WHERE c1.id = l.college_id AND c1.org_id = :orgId) " +
            "OR EXISTS (SELECT 1 FROM class cl " +
            "JOIN new_program p ON cl.program_id = p.id " +
            "JOIN department d ON p.dept_id = d.id " +
            "JOIN college c2 ON d.college_id = c2.id AND c2.org_id = :orgId " +
            "WHERE cl.id = l.class_id))",
            nativeQuery = true)
    Page<Learner> findLearnersByOrganizationIdIncludingViaClass(@Param("orgId") int orgId, Pageable pageable);

    @Query(value = "SELECT l.* FROM learner l " +
            "WHERE (l.is_deleted = 0 OR l.is_deleted IS NULL) " +
            "AND (l.college_id = :collegeId " +
            "OR EXISTS (SELECT 1 FROM class cl " +
            "JOIN new_program p ON cl.program_id = p.id " +
            "JOIN department d ON p.dept_id = d.id AND d.college_id = :collegeId " +
            "WHERE cl.id = l.class_id))",
            countQuery = "SELECT COUNT(*) FROM learner l " +
            "WHERE (l.is_deleted = 0 OR l.is_deleted IS NULL) " +
            "AND (l.college_id = :collegeId " +
            "OR EXISTS (SELECT 1 FROM class cl " +
            "JOIN new_program p ON cl.program_id = p.id " +
            "JOIN department d ON p.dept_id = d.id AND d.college_id = :collegeId " +
            "WHERE cl.id = l.class_id))",
            nativeQuery = true)
    Page<Learner> findLearnersByCollegeIdIncludingViaClass(@Param("collegeId") int collegeId, Pageable pageable);


    /**
     * Server-side admin roster query. Paging/search/filtering happens in SQL so a large college
     * never has to hydrate its complete learner PII set in one browser tab.
     */
    @Query(value = "SELECT l.* FROM learner l " +
            "LEFT JOIN class cl ON cl.id = l.class_id " +
            "WHERE (l.is_deleted = 0 OR l.is_deleted IS NULL) " +
            "AND (l.college_id = :collegeId OR EXISTS (SELECT 1 FROM class scope_cl " +
            "JOIN new_program scope_p ON scope_cl.program_id = scope_p.id " +
            "JOIN department scope_d ON scope_p.dept_id = scope_d.id AND scope_d.college_id = :collegeId " +
            "WHERE scope_cl.id = l.class_id)) " +
            "AND (:classId IS NULL OR l.class_id = :classId) " +
            "AND (:programId IS NULL OR l.program_id = :programId OR cl.program_id = :programId) " +
            "AND (:batchId IS NULL OR cl.batch_id = :batchId) " +
            "AND (:status = '' OR (:status = 'ACTIVE' AND l.suspended_at IS NULL) " +
            "OR (:status = 'SUSPENDED' AND l.suspended_at IS NOT NULL)) " +
            "AND (:search = '' OR LOWER(COALESCE(l.first_name,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(l.last_name,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(CONCAT(COALESCE(l.first_name,''), ' ', COALESCE(l.last_name,''))) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(l.roll_number,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(l.contact_mail,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(l.contact_mobile,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(l.unique_id,'')) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "ORDER BY l.first_name ASC, l.last_name ASC, l.id ASC",
            countQuery = "SELECT COUNT(*) FROM learner l " +
            "LEFT JOIN class cl ON cl.id = l.class_id " +
            "WHERE (l.is_deleted = 0 OR l.is_deleted IS NULL) " +
            "AND (l.college_id = :collegeId OR EXISTS (SELECT 1 FROM class scope_cl " +
            "JOIN new_program scope_p ON scope_cl.program_id = scope_p.id " +
            "JOIN department scope_d ON scope_p.dept_id = scope_d.id AND scope_d.college_id = :collegeId " +
            "WHERE scope_cl.id = l.class_id)) " +
            "AND (:classId IS NULL OR l.class_id = :classId) " +
            "AND (:programId IS NULL OR l.program_id = :programId OR cl.program_id = :programId) " +
            "AND (:batchId IS NULL OR cl.batch_id = :batchId) " +
            "AND (:status = '' OR (:status = 'ACTIVE' AND l.suspended_at IS NULL) " +
            "OR (:status = 'SUSPENDED' AND l.suspended_at IS NOT NULL)) " +
            "AND (:search = '' OR LOWER(COALESCE(l.first_name,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(l.last_name,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(CONCAT(COALESCE(l.first_name,''), ' ', COALESCE(l.last_name,''))) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(l.roll_number,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(l.contact_mail,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(l.contact_mobile,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(l.unique_id,'')) LIKE LOWER(CONCAT('%', :search, '%')))",
            nativeQuery = true)
    Page<Learner> findAdminRosterPage(
            @Param("collegeId") int collegeId,
            @Param("search") String search,
            @Param("programId") Integer programId,
            @Param("batchId") Integer batchId,
            @Param("classId") Integer classId,
            @Param("status") String status,
            Pageable pageable);

    /**
     * All learners that belong to the given college: either direct college_id match,
     * or linked via class -> new_program -> department -> college.
     * Used for college-scoped admin so students in classes under this college are shown
     * even when learner.college_id is not set.
     */
    @Query(value = "SELECT l.* FROM learner l " +
            "WHERE (l.is_deleted = 0 OR l.is_deleted IS NULL) " +
            "AND (l.college_id = :collegeId " +
            "OR EXISTS (SELECT 1 FROM class cl " +
            "JOIN new_program p ON cl.program_id = p.id " +
            "JOIN department d ON p.dept_id = d.id AND d.college_id = :collegeId " +
            "WHERE cl.id = l.class_id))", nativeQuery = true)
    List<Learner> findLearnersByCollegeIdIncludingViaClass(@Param("collegeId") int collegeId);

    /**
     * Project-scoped member picker search. The project service performs the authorization check;
     * this query only returns active learners that resolve to the project's college and caps the
     * DB result before it reaches the application layer.
     */
    @Query(value = "SELECT l.* FROM learner l " +
            "WHERE (l.is_deleted = 0 OR l.is_deleted IS NULL) AND l.suspended_at IS NULL " +
            "AND (l.college_id = :collegeId OR EXISTS (SELECT 1 FROM class cl " +
            "JOIN new_program p ON cl.program_id = p.id " +
            "JOIN department d ON p.dept_id = d.id AND d.college_id = :collegeId " +
            "WHERE cl.id = l.class_id)) " +
            "AND (:search = '' OR LOWER(COALESCE(l.first_name,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(l.last_name,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(CONCAT(COALESCE(l.first_name,''), ' ', COALESCE(l.last_name,''))) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(l.unique_id,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(l.roll_number,'')) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "ORDER BY l.first_name ASC, l.last_name ASC, l.id ASC LIMIT 100",
            nativeQuery = true)
    List<Learner> searchProjectMemberCandidatesByCollegeId(
            @Param("collegeId") int collegeId,
            @Param("search") String search);

    /**
     * Same search, excluding learners already active on the project inside the query, before the 100-row cap. Filtering
     * them afterwards could return nothing when the first 100 matches were all members (Projects audit R9-01).
     */
    @Query(value = "SELECT l.* FROM learner l " +
            "WHERE (l.is_deleted = 0 OR l.is_deleted IS NULL) AND l.suspended_at IS NULL " +
            "AND (l.college_id = :collegeId OR EXISTS (SELECT 1 FROM class cl " +
            "JOIN new_program p ON cl.program_id = p.id " +
            "JOIN department d ON p.dept_id = d.id AND d.college_id = :collegeId " +
            "WHERE cl.id = l.class_id)) " +
            "AND NOT EXISTS (SELECT 1 FROM project_member pm WHERE pm.project_id = :projectId AND pm.user_id = l.id " +
            "AND pm.user_type = 'LEARNER' AND pm.is_deleted = 0) " +
            "AND (:search = '' OR LOWER(COALESCE(l.first_name,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(l.last_name,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(CONCAT(COALESCE(l.first_name,''), ' ', COALESCE(l.last_name,''))) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(l.unique_id,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(l.roll_number,'')) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "ORDER BY l.first_name ASC, l.last_name ASC, l.id ASC LIMIT 100",
            nativeQuery = true)
    List<Learner> searchProjectMemberCandidatesForProject(
            @Param("collegeId") int collegeId,
            @Param("projectId") int projectId,
            @Param("search") String search);

    @Query(value = "select * from learner where roll_number=:rollNumber and college_id=:collegeId", nativeQuery = true)
    Learner getStudentDetailsForAlternateLogin(@Param("rollNumber") String rollNumber, 
                                                @Param("collegeId") String collegeId);

    @Query(value = "SELECT * FROM learner WHERE program_id = :programId", nativeQuery = true)
    List<Learner> getLearnersByProgramId(@Param("programId") int programId);
        
    Page<Learner> findByCollegeId(Integer collegeId, Pageable pageable);

    Learner findByCollegeIdAndRollNumber(Integer collegeId, String rollNumber);

    @Query(value = "SELECT * FROM learner WHERE college_id = :collegeId AND roll_number = :rollNumber", nativeQuery = true)
    Learner getLearnerByCollegeAndRoll(@Param("collegeId") Integer collegeId, @Param("rollNumber") String rollNumber);

    /** One DB lookup for the entire candidate roster, case-insensitive within the selected college. */
    @Query("SELECT l.rollNumber FROM learner l WHERE l.collegeId = :collegeId "
            + "AND (l.isDeleted = false OR l.isDeleted IS NULL) "
            + "AND LOWER(l.rollNumber) IN :rollNumbers")
    List<String> findExistingRollNumbersForCollege(@Param("collegeId") Integer collegeId,
                                                   @Param("rollNumbers") List<String> rollNumbers);
 
 
    @Query(value = "select count(*) from learner l where " + RosterSql.LEARNER_IN_CLASS, nativeQuery = true)
    int getStudentCountByClassId(@Param("classId") int classId);
    
    /**
     * Find learner by email (case-insensitive, non-deleted only)
     * Used for application form tracking across steps
     */
    @Query(value = "SELECT * FROM learner WHERE LOWER(contact_mail) = LOWER(:email) AND is_deleted = false LIMIT 1", nativeQuery = true)
    Optional<Learner> findByContactMailIgnoreCase(@Param("email") String email);
    
    /**
     * Find learner by mobile number (non-deleted only)
     * Used to prevent duplicate account creation
     */
    @Query(value = "SELECT * FROM learner WHERE contact_mobile = :mobile AND is_deleted = false LIMIT 1", nativeQuery = true)
    Optional<Learner> findByContactMobile(@Param("mobile") String mobile);

    @Query(value = "SELECT * FROM learner WHERE contact_mobile = :mobile AND (is_deleted = false OR is_deleted IS NULL)", nativeQuery = true)
    List<Learner> findAllByContactMobileAndNotDeleted(@Param("mobile") String mobile);

    @Query(value = "SELECT * FROM learner WHERE contact_mobile = :mobile AND college_id = :collegeId AND is_deleted = false LIMIT 1", nativeQuery = true)
    Optional<Learner> findByContactMobileAndCollegeId(@Param("mobile") String mobile, @Param("collegeId") Integer collegeId);
    
    /**
     * Find learner by phone number (non-deleted only)
     * Used to prevent duplicate account creation
     */
    @Query(value = "SELECT * FROM learner WHERE contact_phone = :phone AND is_deleted = false LIMIT 1", nativeQuery = true)
    Optional<Learner> findByContactPhone(@Param("phone") String phone);

    @Query(value = "SELECT * FROM learner WHERE contact_phone = :phone AND (is_deleted = false OR is_deleted IS NULL)", nativeQuery = true)
    List<Learner> findAllByContactPhoneAndNotDeleted(@Param("phone") String phone);

    @Query(value = "SELECT * FROM learner WHERE contact_phone = :phone AND college_id = :collegeId AND is_deleted = false LIMIT 1", nativeQuery = true)
    Optional<Learner> findByContactPhoneAndCollegeId(@Param("phone") String phone, @Param("collegeId") Integer collegeId);


    /**
     * Resolve organization ID for a learner: learner.organization_id, else college.org_id from learner.college_id,
     * else college.org_id via class -> new_program -> department -> college.
     * Used when JWT has no org/college (e.g. legacy learners).
     */
    @Query(value = "SELECT COALESCE(l.organization_id, c1.org_id, c2.org_id) FROM learner l "
            + "LEFT JOIN college c1 ON l.college_id = c1.id AND (c1.is_deleted = 0 OR c1.is_deleted IS NULL) "
            + "LEFT JOIN class cl ON l.class_id = cl.id "
            + "LEFT JOIN new_program p ON cl.program_id = p.id "
            + "LEFT JOIN department d ON p.dept_id = d.id "
            + "LEFT JOIN college c2 ON d.college_id = c2.id AND (c2.is_deleted = 0 OR c2.is_deleted IS NULL) "
            + "WHERE l.id = :learnerId AND (l.is_deleted = 0 OR l.is_deleted IS NULL) LIMIT 1", nativeQuery = true)
    Optional<Integer> findOrganizationIdByLearnerId(@Param("learnerId") int learnerId);

    /**
     * For scope resolution: return learner only if not soft-deleted. Resolving deleted entity returns null.
     */
    @Query(value = "SELECT * FROM learner WHERE id = :id AND (is_deleted = false OR is_deleted IS NULL) LIMIT 1", nativeQuery = true)
    Optional<Learner> findByIdAndNotDeleted(@Param("id") Integer id);

    /**
     * Find non-deleted learners where at least one of organizationId, collegeId,
     * or programId is null but classId is set (so hierarchy can be resolved).
     * Used by the startup backfill service.
     */
    @Query(value = "SELECT * FROM learner WHERE (is_deleted = false OR is_deleted IS NULL) "
            + "AND class_id IS NOT NULL "
            + "AND (organization_id IS NULL OR college_id IS NULL OR program_id IS NULL)",
            nativeQuery = true)
    List<Learner> findLearnersWithMissingScope();

    /**
     * Find non-deleted learners whose contact_mobile is in the given list.
     * Used by bulk-validate to report existing mobiles.
     */
    @Query(value = "SELECT * FROM learner WHERE contact_mobile IN :mobiles AND (is_deleted = false OR is_deleted IS NULL)", nativeQuery = true)
    List<Learner> findByContactMobileInAndNotDeleted(@Param("mobiles") List<String> mobiles);

    /**
     * Find non-deleted learners whose contact_mail (lowercased) is in the given list.
     * Caller must pass lowercased emails. Used by bulk-validate to report existing emails.
     */
    @Query(value = "SELECT * FROM learner WHERE LOWER(contact_mail) IN :emailsLower AND (is_deleted = false OR is_deleted IS NULL)", nativeQuery = true)
    List<Learner> findByContactMailLowerInAndNotDeleted(@Param("emailsLower") List<String> emailsLower);
}

