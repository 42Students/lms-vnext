package com._42students.lms.repository;

import com._42students.lms.model.Faculty;
import com._42students.lms.model.Learner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import javax.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
 
@Repository
public interface FacultyRepository extends JpaRepository<Faculty, Integer> {

    // JPQL with the enum type, not native SQL: faculty.faculty_type is an int ORDINAL column, and the
    // old native versions compared it with the string 'ADMIN', which MySQL casts to 0 (PERMANENT),
    // so the super admin's "college admins" list returned PERMANENT faculty instead of admins.
    @Query("SELECT f FROM faculty f WHERE f.facultyType = :facultyType AND (f.isDeleted = false OR f.isDeleted IS NULL)")
    List<Faculty> findByFacultyTypeAndNotDeleted(@Param("facultyType") com._42students.lms.enums.FacultyType facultyType);

    @Query("SELECT f FROM faculty f WHERE f.facultyType = :facultyType AND f.collegeId = :collegeId AND (f.isDeleted = false OR f.isDeleted IS NULL)")
    List<Faculty> findByFacultyTypeAndCollegeIdAndNotDeleted(@Param("facultyType") com._42students.lms.enums.FacultyType facultyType, @Param("collegeId") Integer collegeId);

    @Query("SELECT f FROM faculty f WHERE f.facultyType = :facultyType AND f.organizationId = :organizationId AND (f.isDeleted = false OR f.isDeleted IS NULL)")
    List<Faculty> findByFacultyTypeAndOrganizationIdAndNotDeleted(@Param("facultyType") com._42students.lms.enums.FacultyType facultyType, @Param("organizationId") Integer organizationId);
    @Query(value = "select * from faculty where (id=:instructorId or contact_mobile=:instructorId or " +
            "contact_phone=:instructorId) and (is_deleted = false or is_deleted is null) limit 1", nativeQuery = true)
    Faculty getInstructorDetails(@Param("instructorId") String instructorId);

    @Query(value = "select * from faculty where dept_id=:deptId", nativeQuery = true)
    List<Faculty> getFacultyByDeptId(@Param("deptId") int deptId);

    /** For the college-admin dashboard's "at a glance" numbers -- a count, not a fetch. */
    @Query(value = "select count(*) from faculty where college_id=:collegeId and (is_deleted = false or is_deleted is null)", nativeQuery = true)
    long countByCollegeId(@Param("collegeId") int collegeId);


    /**
     * Bounded admin faculty roster query. faculty_type is stored as enum ORDINAL, so the controller
     * converts an optional type name to its ordinal before reaching this native query.
     */
    @Query(value = "SELECT f.* FROM faculty f " +
            "WHERE f.college_id = :collegeId AND (f.is_deleted = 0 OR f.is_deleted IS NULL) " +
            "AND (:deptId IS NULL OR f.dept_id = :deptId) " +
            "AND (:facultyTypeOrdinal IS NULL OR f.faculty_type = :facultyTypeOrdinal) " +
            "AND (:status = '' OR (:status = 'ACTIVE' AND f.suspended_at IS NULL) " +
            "OR (:status = 'SUSPENDED' AND f.suspended_at IS NOT NULL)) " +
            "AND (:search = '' OR LOWER(COALESCE(f.first_name,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(f.last_name,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(CONCAT(COALESCE(f.first_name,''), ' ', COALESCE(f.last_name,''))) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(f.contact_mobile,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(f.contact_mail,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(f.unique_id,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(f.department,'')) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "ORDER BY f.first_name ASC, f.last_name ASC, f.id ASC",
            countQuery = "SELECT COUNT(*) FROM faculty f " +
            "WHERE f.college_id = :collegeId AND (f.is_deleted = 0 OR f.is_deleted IS NULL) " +
            "AND (:deptId IS NULL OR f.dept_id = :deptId) " +
            "AND (:facultyTypeOrdinal IS NULL OR f.faculty_type = :facultyTypeOrdinal) " +
            "AND (:status = '' OR (:status = 'ACTIVE' AND f.suspended_at IS NULL) " +
            "OR (:status = 'SUSPENDED' AND f.suspended_at IS NOT NULL)) " +
            "AND (:search = '' OR LOWER(COALESCE(f.first_name,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(f.last_name,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(CONCAT(COALESCE(f.first_name,''), ' ', COALESCE(f.last_name,''))) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(f.contact_mobile,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(f.contact_mail,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(f.unique_id,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(f.department,'')) LIKE LOWER(CONCAT('%', :search, '%')))",
            nativeQuery = true)
    Page<Faculty> findAdminRosterPage(
            @Param("collegeId") int collegeId,
            @Param("search") String search,
            @Param("deptId") Integer deptId,
            @Param("facultyTypeOrdinal") Integer facultyTypeOrdinal,
            @Param("status") String status,
            Pageable pageable);

    @Query(value = "select * from faculty where college_id=:collegeId", nativeQuery = true)
    List<Faculty> fetchContactsByCollegeId(@Param("collegeId") int collegeId);

    /**
     * DB-level search variant of fetchContactsByCollegeId, used by the mentor-reassignment
     * picker (getFacultyByCollegeId) so a college with many faculty doesn't require loading
     * every row into memory just to filter a handful matching the search term.
     */
    @Query(value = "select * from faculty where college_id=:collegeId and (" +
            "LOWER(first_name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(last_name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(CONCAT(first_name, ' ', last_name)) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(contact_mobile) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(contact_mail) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(unique_id) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(department) LIKE LOWER(CONCAT('%', :search, '%'))" +
            ")", nativeQuery = true)
    List<Faculty> searchContactsByCollegeId(@Param("collegeId") int collegeId, @Param("search") String search);

    /**
     * Project-scoped faculty picker search. Unlike the older contacts search, this excludes
     * deleted/suspended accounts and lets the caller cap the result at the DB.
     */
    @Query(value = "SELECT f.* FROM faculty f " +
            "WHERE f.college_id = :collegeId " +
            "AND (f.is_deleted = 0 OR f.is_deleted IS NULL) AND f.suspended_at IS NULL " +
            "AND (:search = '' OR LOWER(COALESCE(f.first_name,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(f.last_name,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(CONCAT(COALESCE(f.first_name,''), ' ', COALESCE(f.last_name,''))) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(f.unique_id,'')) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "ORDER BY f.first_name ASC, f.last_name ASC, f.id ASC LIMIT 100",
            nativeQuery = true)
    List<Faculty> searchProjectMemberCandidatesByCollegeId(
            @Param("collegeId") int collegeId,
            @Param("search") String search);

    /** Same search, excluding faculty already active on the project before the 100-row cap (Projects audit R9-01). */
    @Query(value = "SELECT f.* FROM faculty f " +
            "WHERE f.college_id = :collegeId " +
            "AND (f.is_deleted = 0 OR f.is_deleted IS NULL) AND f.suspended_at IS NULL " +
            "AND NOT EXISTS (SELECT 1 FROM project_member pm WHERE pm.project_id = :projectId AND pm.user_id = f.id " +
            "AND pm.user_type = 'FACULTY' AND pm.is_deleted = 0) " +
            "AND (:search = '' OR LOWER(COALESCE(f.first_name,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(f.last_name,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(CONCAT(COALESCE(f.first_name,''), ' ', COALESCE(f.last_name,''))) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(f.unique_id,'')) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "ORDER BY f.first_name ASC, f.last_name ASC, f.id ASC LIMIT 100",
            nativeQuery = true)
    List<Faculty> searchProjectMemberCandidatesForProject(
            @Param("collegeId") int collegeId,
            @Param("projectId") int projectId,
            @Param("search") String search);

    @Query(value = "SELECT f.* FROM faculty f " +
            "INNER JOIN college c ON f.college_id = c.id " +
            "WHERE c.org_id = :orgId", nativeQuery = true)
    List<Faculty> fetchContactsByOrganizationId(@Param("orgId") int orgId);
    
    /**
     * Find faculty by email (case-insensitive, non-deleted only)
     * Used to prevent duplicate account creation
     */
    @Query(value = "SELECT * FROM faculty WHERE LOWER(contact_mail) = LOWER(:email) AND is_deleted = false LIMIT 1", nativeQuery = true)
    Optional<Faculty> findByContactMailIgnoreCase(@Param("email") String email);
    
    /**
     * Find faculty by mobile number (non-deleted only)
     * Used to prevent duplicate account creation
     */
    @Query(value = "SELECT * FROM faculty WHERE contact_mobile = :mobile AND is_deleted = false LIMIT 1", nativeQuery = true)
    Optional<Faculty> findByContactMobile(@Param("mobile") String mobile);

    @Query(value = "SELECT * FROM faculty WHERE contact_mobile = :mobile AND (is_deleted = false OR is_deleted IS NULL)", nativeQuery = true)
    List<Faculty> findAllByContactMobileAndNotDeleted(@Param("mobile") String mobile);

    @Query(value = "SELECT * FROM faculty WHERE contact_mobile = :mobile AND college_id = :collegeId AND is_deleted = false LIMIT 1", nativeQuery = true)
    Optional<Faculty> findByContactMobileAndCollegeId(@Param("mobile") String mobile, @Param("collegeId") Integer collegeId);
    
    /**
     * Find faculty by phone number (non-deleted only)
     * Used to prevent duplicate account creation
     */
    @Query(value = "SELECT * FROM faculty WHERE contact_phone = :phone AND is_deleted = false LIMIT 1", nativeQuery = true)
    Optional<Faculty> findByContactPhone(@Param("phone") String phone);

    @Query(value = "SELECT * FROM faculty WHERE contact_phone = :phone AND (is_deleted = false OR is_deleted IS NULL)", nativeQuery = true)
    List<Faculty> findAllByContactPhoneAndNotDeleted(@Param("phone") String phone);

    @Query(value = "SELECT * FROM faculty WHERE contact_phone = :phone AND college_id = :collegeId AND is_deleted = false LIMIT 1", nativeQuery = true)
    Optional<Faculty> findByContactPhoneAndCollegeId(@Param("phone") String phone, @Param("collegeId") Integer collegeId);

    /**
     * For scope resolution: return faculty only if not soft-deleted.
     */
    @Query(value = "SELECT * FROM faculty WHERE id = :id AND (is_deleted = false OR is_deleted IS NULL) LIMIT 1", nativeQuery = true)
    Optional<Faculty> findByIdAndNotDeleted(@Param("id") Integer id);

    /**
     * Find non-deleted faculty whose contact_mobile is in the given list.
     * Used by bulk-validate to report existing mobiles.
     */
    @Query(value = "SELECT * FROM faculty WHERE contact_mobile IN :mobiles AND (is_deleted = false OR is_deleted IS NULL)", nativeQuery = true)
    List<Faculty> findByContactMobileInAndNotDeleted(@Param("mobiles") List<String> mobiles);

    /**
     * Find non-deleted faculty whose contact_mail (lowercased) is in the given list.
     * Caller must pass lowercased emails.
     */
    @Query(value = "SELECT * FROM faculty WHERE LOWER(contact_mail) IN :emailsLower AND (is_deleted = false OR is_deleted IS NULL)", nativeQuery = true)
    List<Faculty> findByContactMailLowerInAndNotDeleted(@Param("emailsLower") List<String> emailsLower);

    /**
     * Row-level PESSIMISTIC_WRITE lock, held for the remainder of the caller's transaction.
     * Used by ProjectWorkspaceServiceImpl's meeting organizer-conflict check: a JVM-local
     * synchronized lock only serializes concurrent requests within one pod, which is not enough
     * once the app runs multiple backend replicas — two requests on two different pods can both
     * pass the in-memory lock. Locking the organizer's own faculty row via the DB gives real
     * cross-pod serialization for the check-then-insert critical section.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT f FROM faculty f WHERE f.id = :id")
    Optional<Faculty> findByIdForUpdate(@Param("id") Integer id);
}
 

