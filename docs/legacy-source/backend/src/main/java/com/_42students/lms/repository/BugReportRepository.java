package com._42students.lms.repository;

import com._42students.lms.model.BugReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.Optional;

public interface BugReportRepository extends JpaRepository<BugReport, Long> {
    Optional<BugReport> findByPublicIdIgnoreCase(String publicId);

    /** Correlation signal for the Logs alerting poller: were students also reporting bugs around this time? */
    long countByEnvironmentAndCreatedAtBetween(String environment, LocalDateTime from, LocalDateTime to);

    @Query("SELECT b FROM BugReport b WHERE " +
            "(:status IS NULL OR b.status = :status) AND " +
            "(:environment IS NULL OR b.environment = :environment) AND " +
            "(:reporter IS NULL OR LOWER(b.reporterName) = LOWER(:reporter)) AND " +
            "(:search IS NULL OR " +
            "LOWER(b.publicId) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(b.description) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(b.page) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(COALESCE(b.screen, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(COALESCE(b.section, '')) LIKE LOWER(CONCAT('%', :search, '%'))) ")
    Page<BugReport> search(@Param("status") String status,
                           @Param("environment") String environment,
                           @Param("reporter") String reporter,
                           @Param("search") String search,
                           Pageable pageable);
}
