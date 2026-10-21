package com._42students.lms.service.tpo;

import com._42students.lms.model.tpo.LearnerAcademicRecord;
import com._42students.lms.repository.tpo.LearnerAcademicRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Student V1 §8 "Profile": the student's own read-only view of their academic record (Verified
 * vs Self-reported — see LearnerAcademicRecord.source) and "who has my data" — every company
 * their information was shared with or downloaded by, with dates. Corrections themselves go
 * through the existing student_request queue (type CORRECTION, see StudentRequest /
 * raiseStudentRequest) — this service only reads, it never writes the record.
 */
@Service
@RequiredArgsConstructor
public class LearnerPlacementProfileService {

    private final LearnerAcademicRecordRepository academicRecordRepository;
    private final NamedParameterJdbcTemplate jdbc;

    /** Null cgpa/percentages/etc and source=SELF (never verified) when the student has no record row yet. */
    public LearnerAcademicRecord academicRecord(Integer learnerId) {
        return academicRecordRepository.findById(learnerId).orElseGet(() -> {
            LearnerAcademicRecord r = new LearnerAcademicRecord();
            r.setLearnerId(learnerId);
            return r;
        });
    }

    /**
     * Every company a share (tpo_share_link) for a drive this student applied to went to, when it
     * was created, and when — if ever — it was downloaded. Simplification: this does not
     * re-evaluate TpoShareService's own per-row max_stage/retention exclusions for the student's
     * specific application, so it can occasionally list a share whose row for this student was
     * actually withheld — a transparency feature errs toward telling the student too much about
     * where a share touching their drive went, not too little.
     */
    public List<Map<String, Object>> dataAccessLog(Integer learnerId) {
        return jdbc.queryForList(
                "SELECT j.company_name AS company, j.job_title AS role, sl.recipient_email AS sharedWithEmail, " +
                "  sl.created_at AS sharedAt, " +
                "  (SELECT MIN(e.created_at) FROM tpo_share_event e WHERE e.share_id = sl.id " +
                "    AND e.action IN ('DOWNLOADED_LIST','DOWNLOADED_ZIP')) AS downloadedAt " +
                "FROM tpo_share_link sl " +
                "JOIN job j ON j.id = sl.job_id " +
                "JOIN job_application a ON a.job_id = sl.job_id " +
                "WHERE a.learner_id = :l AND (a.is_deleted = 0 OR a.is_deleted IS NULL) " +
                "ORDER BY sl.created_at DESC",
                new MapSqlParameterSource("l", learnerId));
    }
}
