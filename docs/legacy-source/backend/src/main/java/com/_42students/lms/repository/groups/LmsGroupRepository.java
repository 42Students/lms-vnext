package com._42students.lms.repository.groups;

import com._42students.lms.model.groups.LmsGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LmsGroupRepository extends JpaRepository<LmsGroup, Long> {

    Optional<LmsGroup> findByIdAndIsDeletedFalse(Long id);

    List<LmsGroup> findByCollegeIdAndIsDeletedFalseOrderByCreatedAtDesc(Integer collegeId);

    List<LmsGroup> findByCollegeIdAndKindAndIsDeletedFalseOrderByCreatedAtDesc(Integer collegeId, String kind);

    List<LmsGroup> findByCollegeIdIsNullAndIsDeletedFalseOrderByCreatedAtDesc();

    /**
     * The seat claim. One statement, so two learners racing for the last seat cannot both win:
     * MySQL serialises the row update and only the first sees {@code active_count < capacity}.
     * Returns 1 when a seat was taken, 0 when the group is full.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update LmsGroup g set g.activeCount = g.activeCount + 1 "
            + "where g.id = :id and g.isDeleted = false and (g.capacity is null or g.activeCount < g.capacity)")
    int claimSeat(@Param("id") Long id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    /** Never goes below zero: the guard is in the WHERE, since HQL forbids arithmetic inside CASE in SET. */
    @Query("update LmsGroup g set g.activeCount = g.activeCount - 1 where g.id = :id and g.activeCount > 0")
    int releaseSeat(@Param("id") Long id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update LmsGroup g set g.activeCount = :count where g.id = :id")
    int setActiveCount(@Param("id") Long id, @Param("count") int count);

    /** Groups a learner of this college may currently join on their own; callers filter by kind. */
    @Query("select g from LmsGroup g where g.isDeleted = false and g.status = 'ACTIVE' "
            + "and (g.collegeId = :collegeId or g.collegeId is null) "
            + "and g.selfJoinOpenFrom is not null and g.selfJoinOpenFrom <= :now "
            + "and (g.selfJoinOpenUntil is null or g.selfJoinOpenUntil >= :now) order by g.name")
    List<LmsGroup> findOpenForSelfJoin(@Param("collegeId") Integer collegeId, @Param("now") LocalDateTime now);
}
