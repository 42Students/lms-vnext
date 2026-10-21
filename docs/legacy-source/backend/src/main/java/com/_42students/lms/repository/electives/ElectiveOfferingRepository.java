package com._42students.lms.repository.electives;

import com._42students.lms.model.electives.ElectiveOffering;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ElectiveOfferingRepository extends JpaRepository<ElectiveOffering, Long> {

    Optional<ElectiveOffering> findByIdAndIsDeletedFalse(Long id);

    List<ElectiveOffering> findBySlotIdAndIsDeletedFalseOrderByIdAsc(Long slotId);

    List<ElectiveOffering> findBySlotIdInAndIsDeletedFalse(Collection<Long> slotIds);

    Optional<ElectiveOffering> findByGroupIdAndIsDeletedFalse(Long groupId);

    List<ElectiveOffering> findByGroupIdInAndStatusAndIsDeletedFalse(Collection<Long> groupIds, String status);

    /**
     * Whether the slot already has a LIVE offering of this course. Deliberately status-aware
     * (not just non-deleted): an archived offering must not permanently block re-adding the same
     * course to the same slot, since ARCHIVED is a terminal status with no path back. The DB-level
     * uk_elective_offering_slot_active_course (V168) backs this against the remaining TOCTOU race.
     */
    boolean existsBySlotIdAndCourseIdAndStatusAndIsDeletedFalse(Long slotId, Integer courseId, String status);

    Optional<ElectiveOffering> findByBackedClassIdAndIsDeletedFalse(Integer backedClassId);

    /**
     * Is this learner ACTIVE in a live offering of this course? Grants course access even before
     * faculty is assigned. Checks lms_group.status directly (not just elective_offering.status):
     * the generic Student Groups console can archive a group without going through
     * ElectiveService#archiveOffering, which would otherwise leave this offering row reading
     * ACTIVE while the group that actually gates access is archived. Checks {@code <> 'ARCHIVED'},
     * not {@code = 'ACTIVE'}: a CLOSED group (self-join closed, e.g. via the generic groups
     * console) must not revoke an already-enrolled learner's course access.
     */
    @Query(value = "SELECT COUNT(*) FROM elective_offering eo " +
            "JOIN lms_group_member m ON m.group_id = eo.group_id " +
            "JOIN lms_group g ON g.id = eo.group_id " +
            "JOIN elective_slot s ON s.id = eo.slot_id " +
            "WHERE eo.course_id = :courseId AND eo.status = 'ACTIVE' AND (eo.is_deleted = false OR eo.is_deleted IS NULL) " +
            "AND g.status <> 'ARCHIVED' AND (g.is_deleted = false OR g.is_deleted IS NULL) " +
            "AND s.status = 'ACTIVE' AND (s.is_deleted = false OR s.is_deleted IS NULL) " +
            "AND m.member_type = 'LEARNER' AND m.member_id = :learnerId AND m.state = 'ACTIVE'", nativeQuery = true)
    long countActiveEnrolments(@Param("courseId") int courseId, @Param("learnerId") int learnerId);
}
