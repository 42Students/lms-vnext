package com._42students.lms.repository.tpo;

import com._42students.lms.model.tpo.JobRound;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import javax.persistence.LockModeType;
import java.util.Optional;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobRoundRepository extends JpaRepository<JobRound, Long> {
    List<JobRound> findByJobIdOrderBySeqAsc(Integer jobId);

    /** Locks the round row, so two "apply results" at once run one after the other (the second finds nothing pending). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from JobRound r where r.id = :id")
    Optional<JobRound> findByIdForUpdate(@Param("id") Long id);
}
