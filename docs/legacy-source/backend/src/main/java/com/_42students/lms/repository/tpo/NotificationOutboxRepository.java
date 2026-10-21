package com._42students.lms.repository.tpo;

import com._42students.lms.model.tpo.NotificationOutboxEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationOutboxRepository extends JpaRepository<NotificationOutboxEntry, Long> {

    /**
     * Claims due, pending rows for one worker. SKIP LOCKED lets several pods poll concurrently
     * without double-sending (MySQL 8 supports it). No @Lock: Hibernate rejects lock modes on native
     * queries, and FOR UPDATE in the SQL already takes the row locks. See TPO V1 - Locked.docx §10.
     */
    @Query(value = "SELECT * FROM notification_outbox WHERE status = 'PENDING' AND send_after <= :now " +
            "ORDER BY send_after ASC LIMIT :limit FOR UPDATE SKIP LOCKED", nativeQuery = true)
    List<NotificationOutboxEntry> claimDue(@Param("now") LocalDateTime now, @Param("limit") int limit);

    List<NotificationOutboxEntry> findByUndoGroupIdAndStatus(String undoGroupId, String status);
}
