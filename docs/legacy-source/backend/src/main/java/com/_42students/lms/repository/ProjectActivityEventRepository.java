package com._42students.lms.repository;

import com._42students.lms.model.ProjectActivityEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ProjectActivityEventRepository extends JpaRepository<ProjectActivityEvent, Integer> {

    // Bounded via the required Pageable (loadProjectActivity passes PageRequest.of(0, 100)) —
    // this previously had no limit at all and loaded a project's ENTIRE activity history into
    // memory on every dashboard render, only truncating to 100 in Java after the full fetch.
    @Query("SELECT e FROM ProjectActivityEvent e WHERE e.projectId = :projectId ORDER BY e.createdAt DESC, e.id DESC")
    List<ProjectActivityEvent> findRecentByProjectId(@Param("projectId") Integer projectId, Pageable pageable);

    // #11: fromDate/toDate follow the exact same "IS NULL OR '' skips the clause" pattern as
    // eventType/sourceTab above — both optional, independently, so a caller can filter by just a
    // start, just an end, or a full range.
    @Query(
            value = """
                    SELECT e
                    FROM ProjectActivityEvent e
                    WHERE e.projectId = :projectId
                      AND (:eventType IS NULL OR :eventType = '' OR UPPER(e.eventType) LIKE UPPER(CONCAT('%', :eventType, '%')))
                      AND (:sourceTab IS NULL OR :sourceTab = '' OR UPPER(e.sourceTab) LIKE UPPER(CONCAT('%', :sourceTab, '%')))
                      AND (:fromDate IS NULL OR e.createdAt >= :fromDate)
                      AND (:toDate IS NULL OR e.createdAt <= :toDate)
                    ORDER BY e.createdAt DESC, e.id DESC
                    """,
            countQuery = """
                    SELECT COUNT(e)
                    FROM ProjectActivityEvent e
                    WHERE e.projectId = :projectId
                      AND (:eventType IS NULL OR :eventType = '' OR UPPER(e.eventType) LIKE UPPER(CONCAT('%', :eventType, '%')))
                      AND (:sourceTab IS NULL OR :sourceTab = '' OR UPPER(e.sourceTab) LIKE UPPER(CONCAT('%', :sourceTab, '%')))
                      AND (:fromDate IS NULL OR e.createdAt >= :fromDate)
                      AND (:toDate IS NULL OR e.createdAt <= :toDate)
                    """
    )
    Page<ProjectActivityEvent> findPagedByProjectId(
            @Param("projectId") Integer projectId,
            @Param("eventType") String eventType,
            @Param("sourceTab") String sourceTab,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable
    );
}
