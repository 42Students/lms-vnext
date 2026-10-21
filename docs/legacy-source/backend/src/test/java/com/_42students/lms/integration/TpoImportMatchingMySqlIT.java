package com._42students.lms.integration;

import com._42students.lms.model.Job;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.service.tpo.TpoImportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Real-MySQL coverage for company results/selection file matching. A wrong match here is worse
 * than a rejected request: it can apply one student's result or offer to another student.
 */
@Transactional
@Rollback
class TpoImportMatchingMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE = 989930;
    private static final int OTHER_COLLEGE = 989931;
    private static final int L1 = 989941;
    private static final int L2 = 989942;
    private static final int L3 = 989943;
    private static final int L4 = 989944;
    private static final int APP1 = 989951;
    private static final int APP2 = 989952;
    private static final int APP3 = 989953;
    private static final int APP4 = 989954;
    private static final int FOREIGN_APP = 989955;

    @Autowired
    private TpoImportService imports;

    @Autowired
    private JobRepository jobs;

    private void seedBase() {
        seedCollege(COLLEGE, "Import Match College");
        seedCollege(OTHER_COLLEGE, "Import Match Other");
        seedLearner(L1, COLLEGE, "Alpha");
        seedLearner(L2, COLLEGE, "Beta");
        seedLearner(L3, COLLEGE, "Gamma");
        seedLearner(L4, COLLEGE, "Delta");
        jdbc.update("update learner set contact_mail='alpha@it.test', roll_number='ROLL-A', contact_mobile='9000000001' where id=?", L1);
        jdbc.update("update learner set contact_mail='beta@it.test', roll_number='ROLL-B', contact_mobile='9000000002' where id=?", L2);
        jdbc.update("update learner set contact_mail='gamma@it.test', roll_number='ROLL-C', contact_mobile='9000000003' where id=?", L3);
        jdbc.update("update learner set contact_mail='delta@it.test', roll_number='ROLL-D', contact_mobile='9000000004' where id=?", L4);
    }

    private Job job(int collegeId, String title) {
        Job j = new Job();
        j.setJobTitle(title);
        j.setCompanyName("Import Match Corp");
        j.setOrganizationId(1);
        j.setCollegeId(collegeId);
        j.setIsActive(true);
        j.setIsDraft(false);
        j.setLifecycleStatus("PUBLISHED");
        j.setDriveMode("ON_CAMPUS");
        j.setRecordedOutside(true);
        j.setCountsAsPlaced(true);
        j.setRequiresExternalRegistration(false);
        j.setResultsAutoApply(false);
        j.setIsDeleted(false);
        return jobs.saveAndFlush(j);
    }

    private void app(int id, int jobId, int learnerId, String publicRef, String externalRef, String status) {
        jdbc.update("insert into job_application "
                        + "(id, application_status, applied_at, organization_id, pap_requested, source, "
                        + "status_updated_at, job_id, learner_id, version, is_deleted, public_ref, external_ref) "
                        + "values (?, ?, now(), 1, 0, 'INTERNAL', now(), ?, ?, 0, 0, ?, ?)",
                id, status, jobId, learnerId, publicRef, externalRef);
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> rows(Map<String, Object> preview, String key) {
        return (List<Map<String, Object>>) preview.get(key);
    }

    @Test
    void resultsMatchInDocumentedPriorityOrderAcrossAllSupportedStableKeys() {
        seedBase();
        Job job = job(COLLEGE, "Priority Match");
        app(APP1, job.getId(), L1, "A-PUBLIC-1", "C-EXT-1", "APPLIED");
        app(APP2, job.getId(), L2, "A-PUBLIC-2", "C-EXT-2", "APPLIED");
        app(APP3, job.getId(), L3, "A-PUBLIC-3", "C-EXT-3", "APPLIED");
        app(APP4, job.getId(), L4, "A-PUBLIC-4", "C-EXT-4", "APPLIED");

        Map<String, Object> preview = imports.previewResults(job.getId(), List.of(
                Map.of("applicantId", "A-PUBLIC-1", "outcome", "PASS"),
                Map.of("companyId", "C-EXT-2", "outcome", "FAIL"),
                Map.of("email", "GAMMA@IT.TEST", "outcome", "HOLD"),
                Map.of("roll", " roll-d ", "outcome", "ABSENT")
        ));

        List<Map<String, Object>> matched = rows(preview, "matched");
        assertEquals(4, matched.size());
        assertEquals(List.of(APP1, APP2, APP3, APP4),
                matched.stream().map(m -> (Integer) m.get("applicationId")).toList());
        assertTrue(rows(preview, "unmatched").isEmpty());
        assertTrue(rows(preview, "notInFile").isEmpty());
    }

    @Test
    void ambiguousEmailNeverAutoMatchesAndPhoneIsSuggestionOnly() {
        seedBase();
        Job job = job(COLLEGE, "Ambiguous Match");
        app(APP1, job.getId(), L1, "A-AMB-1", "EXT-AMB-1", "APPLIED");
        app(APP2, job.getId(), L2, "A-AMB-2", "EXT-AMB-2", "APPLIED");
        jdbc.update("update learner set contact_mail='duplicate@it.test' where id in (?,?)", L1, L2);

        Map<String, Object> preview = imports.previewResults(job.getId(), List.of(
                Map.of("email", "duplicate@it.test", "phone", "9000000001", "outcome", "PASS")
        ));

        assertTrue(rows(preview, "matched").isEmpty());
        List<Map<String, Object>> unmatched = rows(preview, "unmatched");
        assertEquals(1, unmatched.size());
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> suggestions =
                (List<Map<String, Object>>) unmatched.get(0).get("suggestions");
        assertEquals(1, suggestions.size());
        assertEquals(APP1, suggestions.get(0).get("applicationId"),
                "phone may suggest the candidate but must never silently become the match");
    }

    @Test
    void duplicateApplicantRowsLeaveSecondRowUnmatched() {
        seedBase();
        Job job = job(COLLEGE, "Duplicate Rows");
        app(APP1, job.getId(), L1, "A-DUP-1", "EXT-DUP-1", "APPLIED");

        Map<String, Object> preview = imports.previewResults(job.getId(), List.of(
                Map.of("applicantId", "A-DUP-1", "outcome", "PASS"),
                Map.of("applicantId", "A-DUP-1", "outcome", "PASS")
        ));

        assertEquals(1, rows(preview, "matched").size());
        assertEquals(1, rows(preview, "unmatched").size());
        assertTrue(String.valueOf(rows(preview, "unmatched").get(0).get("reason")).contains("twice"));
    }

    @Test
    void invalidOutcomeIsRejectedBeforeAnyStaging() {
        seedBase();
        Job job = job(COLLEGE, "Invalid Outcome");
        app(APP1, job.getId(), L1, "A-OUT-1", "EXT-OUT-1", "APPLIED");

        Map<String, Object> preview = imports.previewResults(job.getId(), List.of(
                Map.of("applicantId", "A-OUT-1", "outcome", "MAYBE")
        ));

        assertTrue(rows(preview, "matched").isEmpty());
        assertEquals(1, rows(preview, "unmatched").size());
        assertTrue(String.valueOf(rows(preview, "unmatched").get(0).get("reason"))
                .contains("PASS, FAIL, HOLD or ABSENT"));
    }

    @Test
    void notInFileContainsOnlyStillActiveApplicants() {
        seedBase();
        Job job = job(COLLEGE, "Not In File");
        app(APP1, job.getId(), L1, "A-ACTIVE-1", "EXT-ACTIVE-1", "APPLIED");
        app(APP2, job.getId(), L2, "A-REJECTED-2", "EXT-REJECTED-2", "REJECTED");
        app(APP3, job.getId(), L3, "A-WITHDRAWN-3", "EXT-WITHDRAWN-3", "WITHDRAWN");
        app(APP4, job.getId(), L4, "A-NOTSEL-4", "EXT-NOTSEL-4", "NOT_SELECTED");

        Map<String, Object> preview = imports.previewResults(job.getId(), List.of());

        List<Map<String, Object>> missing = rows(preview, "notInFile");
        assertEquals(1, missing.size());
        assertEquals(APP1, missing.get(0).get("applicationId"));
    }

    @Test
    void explicitApplicationIdFromAnotherDriveCannotBeSmuggledIntoResultsCommit() {
        seedBase();
        Job own = job(COLLEGE, "Own Import Drive");
        Job foreign = job(OTHER_COLLEGE, "Foreign Import Drive");
        app(APP1, own.getId(), L1, "A-OWN-1", "EXT-OWN-1", "APPLIED");
        app(FOREIGN_APP, foreign.getId(), L2, "A-FOREIGN-1", "EXT-FOREIGN-1", "APPLIED");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                imports.commitResults(own.getId(), 999999L,
                        List.of(Map.of("applicationId", FOREIGN_APP, "outcome", "PASS")),
                        "LEAVE_PENDING", 123));

        assertTrue(ex.getMessage().contains("unmatched"));
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from round_result where application_id = ?", Integer.class, FOREIGN_APP));
    }

    @Test
    void selectionPreviewUsesSameNoAmbiguousAutoMatchRule() {
        seedBase();
        Job job = job(COLLEGE, "Selection Match");
        app(APP1, job.getId(), L1, "A-SEL-1", "EXT-SEL-1", "APPLIED");
        app(APP2, job.getId(), L2, "A-SEL-2", "EXT-SEL-2", "APPLIED");

        Map<String, Object> preview = imports.previewSelections(job.getId(), List.of(
                Map.of("companyId", "EXT-SEL-1", "roleOption", "SDE"),
                Map.of("roll", "ROLL-B", "roleOption", "QA")
        ));

        assertEquals(2, rows(preview, "matched").size());
        assertTrue(rows(preview, "unmatched").isEmpty());
    }
}
