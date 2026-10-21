package com._42students.lms.service.tpo;

import com._42students.lms.model.Job;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** 19 Oct 2026, owner: when a live drive's terms change, applicants still in it are told and the new rules flag (never remove). */
class LiveDriveChangeServiceTest {

    private final NamedParameterJdbcTemplate jdbc = mock(NamedParameterJdbcTemplate.class);
    private final NotificationOutboxService outbox = mock(NotificationOutboxService.class);
    private final EligibilityService eligibility = mock(EligibilityService.class);
    private final TpoAuditService audit = mock(TpoAuditService.class);
    private final LiveDriveChangeService svc = new LiveDriveChangeService(jdbc, outbox, eligibility, audit);
    private Job job;

    @BeforeEach
    void setUp() {
        job = new Job();
        job.setId(5);
        job.setCollegeId(9);
        job.setJobTitle("Developer");
        job.setLifecycleStatus("PUBLISHED");
    }

    @Test
    void everyApplicantStillInTheDriveIsToldWhatChanged() {
        when(jdbc.queryForList(contains("application_status NOT IN ('REJECTED','WITHDRAWN')"), any(MapSqlParameterSource.class), eq(Integer.class)))
                .thenReturn(List.of(159, 160));
        assertEquals(2, svc.tellApplicants(job, "CTC (LPA)"));
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> payload = ArgumentCaptor.forClass(Map.class);
        verify(outbox).enqueue(eq("DRIVE_UPDATED"), eq("LEARNER"), eq(159), eq("APP"), payload.capture(), isNull(), eq(false));
        verify(outbox).enqueue(eq("DRIVE_UPDATED"), eq("LEARNER"), eq(160), eq("APP"), any(), isNull(), eq(false));
        assertEquals(5, payload.getValue().get("jobId"));
        assertEquals("What changed: CTC (LPA).", payload.getValue().get("changed"));
    }

    @Test
    void aDriveThatIsNotLiveTellsNobody() {
        job.setLifecycleStatus("DRAFT");
        assertEquals(0, svc.tellApplicants(job, "CTC (LPA)"));
        assertEquals(0, svc.recheckEligibility(job));
        verifyNoInteractions(jdbc, outbox);
    }

    private static Map<String, Object> app(int appId, int learnerId, LocalDateTime flagged) {
        Map<String, Object> a = new HashMap<>();
        a.put("applicationId", appId); a.put("learnerId", learnerId); a.put("flagged", flagged); a.put("branch", "CSE");
        return a;
    }

    private static EligibilityService.EligibilityResult result(boolean eligible) {
        return new EligibilityService.EligibilityResult(eligible, List.of(), false);
    }

    @Test
    void newRulesFlagWhoTheyLeaveOutAndUnflagWhoQualifiesAgain() {
        when(jdbc.queryForList(contains("FROM job_application a JOIN learner l"), any(MapSqlParameterSource.class)))
                .thenReturn(List.of(app(1, 159, null), app(2, 160, LocalDateTime.now()), app(3, 161, null)));
        when(eligibility.evaluate(eq(job), eq(159), any())).thenReturn(result(false));
        when(eligibility.evaluate(eq(job), eq(160), any())).thenReturn(result(true));
        when(eligibility.evaluate(eq(job), eq(161), any())).thenReturn(result(true));

        assertEquals(1, svc.recheckEligibility(job));
        verify(jdbc).update(contains("SET ineligible_flag_at = NOW()"), argThat((MapSqlParameterSource p) -> Integer.valueOf(1).equals(p.getValue("id"))));
        verify(jdbc).update(contains("SET ineligible_flag_at = NULL"), argThat((MapSqlParameterSource p) -> Integer.valueOf(2).equals(p.getValue("id"))));
        verify(audit).bell(eq(9), eq("INELIGIBLE_FLAGGED"), contains("1 applicant(s)"), anyString(), eq("/tpo/drives/5"));
        verify(outbox, never()).enqueue(eq("NOW_INELIGIBLE"), any(), any(), any(), any(), any(), anyBoolean());
    }
}
