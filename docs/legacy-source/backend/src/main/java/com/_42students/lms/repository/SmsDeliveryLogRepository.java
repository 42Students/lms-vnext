package com._42students.lms.repository;

import com._42students.lms.model.SmsDeliveryLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SmsDeliveryLogRepository extends JpaRepository<SmsDeliveryLog, Integer> {

    /**
     * Newest first, optionally narrowed by the last digits of a number and by purpose — the two
     * ways support actually looks: "what went out around then" and "what happened to this number".
     */
    @Query("SELECT l FROM SmsDeliveryLog l "
            + "WHERE (:suffix IS NULL OR l.recipientSuffix = :suffix) "
            + "AND (:purpose IS NULL OR l.purpose = :purpose) "
            + "ORDER BY l.createdAt DESC, l.id DESC")
    Page<SmsDeliveryLog> search(@Param("suffix") String suffix,
                                @Param("purpose") String purpose,
                                Pageable pageable);
}
