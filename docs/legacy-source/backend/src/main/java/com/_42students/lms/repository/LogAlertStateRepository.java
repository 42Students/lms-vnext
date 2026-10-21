package com._42students.lms.repository;

import com._42students.lms.model.LogAlertState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface LogAlertStateRepository extends JpaRepository<LogAlertState, Long> {
    Optional<LogAlertState> findByStateKey(String stateKey);

    // Column-scoped updates rather than load-the-whole-row-then-save: the poller (writes
    // pollCursorAt) and an admin's "mark viewed" click (writes adminLastViewedAt) both touch this
    // one state row, and a plain save() of a whole entity loaded slightly earlier can overwrite
    // whichever column the OTHER writer just changed with its own stale in-memory copy of it.
    @Modifying
    @Transactional
    @Query("UPDATE log_alert_state s SET s.pollCursorAt = :cursor WHERE s.stateKey = :key")
    int updatePollCursor(@Param("key") String stateKey, @Param("cursor") Instant cursor);

    @Modifying
    @Transactional
    @Query("UPDATE log_alert_state s SET s.adminLastViewedAt = :viewedAt WHERE s.stateKey = :key")
    int updateAdminLastViewed(@Param("key") String stateKey, @Param("viewedAt") Instant viewedAt);
}
