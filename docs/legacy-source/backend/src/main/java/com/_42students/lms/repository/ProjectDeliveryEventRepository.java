package com._42students.lms.repository;

import com._42students.lms.model.ProjectDeliveryEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectDeliveryEventRepository extends JpaRepository<ProjectDeliveryEvent, Integer> {

    // No code ever sets isDeleted on a ProjectDeliveryEvent — it's a write-once audit trail, same
    // as ProjectResourceAudit/ProjectMeetingHistory/ProjectTemplateVersion/ProjectActivityEvent,
    // none of which filter on isDeleted for the same reason (audit history must stay visible even
    // if its parent record is later soft-deleted). Match that here instead of filtering on a flag
    // this entity never sets.
    @Query("SELECT e FROM ProjectDeliveryEvent e WHERE e.projectId = :projectId AND e.deliveryId = :deliveryId ORDER BY e.id DESC")
    List<ProjectDeliveryEvent> findActiveByDeliveryId(@Param("projectId") Integer projectId, @Param("deliveryId") Integer deliveryId);
}
