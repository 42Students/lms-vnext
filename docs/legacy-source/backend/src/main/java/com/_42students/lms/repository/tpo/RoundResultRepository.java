package com._42students.lms.repository.tpo;

import com._42students.lms.model.tpo.RoundResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoundResultRepository extends JpaRepository<RoundResult, Long> {
    List<RoundResult> findByRoundIdAndAppliedAtIsNull(Long roundId);

    List<RoundResult> findByApplicationIdOrderBySubmittedAtDesc(Integer applicationId);

    long countByRoundIdAndAppliedAtIsNull(Long roundId);

    /**
     * BE-0032: every other unapplied, not yet superseded result for this application and round now points at the newest one.
     * An UPDATE reads the latest committed rows (not the transaction's older snapshot), so a result staged by another
     * request a moment ago is superseded too.
     */
    @org.springframework.data.jpa.repository.Modifying(flushAutomatically = true)
    @org.springframework.data.jpa.repository.Query("UPDATE RoundResult r SET r.supersededBy = :newId WHERE r.roundId = :roundId AND r.applicationId = :appId " +
            "AND r.appliedAt IS NULL AND r.supersededBy IS NULL AND r.id <> :newId")
    int supersedeOthers(@org.springframework.data.repository.query.Param("roundId") Long roundId,
                        @org.springframework.data.repository.query.Param("appId") Integer applicationId,
                        @org.springframework.data.repository.query.Param("newId") Long newId);
}
