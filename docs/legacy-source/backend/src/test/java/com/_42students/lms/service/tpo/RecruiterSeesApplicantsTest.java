package com._42students.lms.service.tpo;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** Recruiter phase 1, step 7 (N6): a college can let recruiters see applicants as they apply, without contact details. */
class RecruiterSeesApplicantsTest {

    private final NamedParameterJdbcTemplate jdbc = mock(NamedParameterJdbcTemplate.class);
    private final TpoShareService share = mock(TpoShareService.class);
    private final TpoSettingsHubService settings = mock(TpoSettingsHubService.class);
    private final RecruiterDriveWorkService svc = new RecruiterDriveWorkService(jdbc, share, mock(TpoResultsService.class), mock(TpoOfferService.class),
            mock(TpoScheduleService.class), mock(TpoAuditService.class), mock(TpoWorkspaceService.class), mock(TpoDriveExtrasService.class));

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(svc, "settingsHub", settings);
        when(jdbc.queryForObject(contains("FROM job WHERE id = :j AND college_id"), any(MapSqlParameterSource.class), eq(Long.class))).thenReturn(1L);
        when(jdbc.queryForList(contains("FROM tpo_share_link"), any(SqlParameterSource.class))).thenReturn(List.of());
        when(jdbc.queryForList(contains("SELECT college_id FROM job"), any(SqlParameterSource.class), eq(Integer.class))).thenReturn(List.of(6));
        when(share.rowsFor(eq(5), eq(6), eq(RecruiterDriveWorkService.DIRECT_COLUMNS), isNull())).thenReturn(List.of(Map.of("applicantId", "A1")));
    }

    @Test
    void afterReviewNothingIsShownUntilThePlacementCellShares() {
        when(settings.recruiterSeesApplicantsDirectly(6)).thenReturn(false);
        Map<String, Object> out = svc.applicants(77, 6, 5);
        assertEquals(false, out.get("shared"));
        assertTrue(((List<?>) out.get("applicants")).isEmpty());
    }

    @Test
    void directShowsApplicantsWithoutContactDetails() {
        when(settings.recruiterSeesApplicantsDirectly(6)).thenReturn(true);
        Map<String, Object> out = svc.applicants(77, 6, 5);
        assertEquals(true, out.get("direct"));
        assertEquals(1, ((List<?>) out.get("applicants")).size());
        assertFalse(RecruiterDriveWorkService.DIRECT_COLUMNS.contains("email"));
        assertFalse(RecruiterDriveWorkService.DIRECT_COLUMNS.contains("phone"));
    }

    @Test
    void directAndAShareTogetherShowEveryoneWithContactsOnlyOnTheSharedRows() {
        // Audit 13 Oct 2026, A1: a share "up to shortlisted, with email" used to replace the direct view and hide everyone else.
        when(settings.recruiterSeesApplicantsDirectly(6)).thenReturn(true);
        when(jdbc.queryForList(contains("FROM tpo_share_link"), any(SqlParameterSource.class)))
                .thenReturn(List.of(Map.of("columns_json", "[\"name\",\"email\"]", "max_stage", "SHORTLISTED")));
        when(share.rowsFor(eq(5), eq(6), eq(List.of("name", "email", "stage")), eq("SHORTLISTED")))
                .thenReturn(List.of(Map.of("applicantId", "A2", "name", "Ravi", "email", "ravi@x.in")));
        when(share.rowsFor(eq(5), eq(6), eq(RecruiterDriveWorkService.DIRECT_COLUMNS), isNull()))
                .thenReturn(List.of(Map.of("applicantId", "A1", "name", "Anu"), Map.of("applicantId", "A2", "name", "Ravi")));
        Map<String, Object> out = svc.applicants(77, 6, 5);
        @SuppressWarnings("unchecked") List<Map<String, Object>> rows = (List<Map<String, Object>>) out.get("applicants");
        assertEquals(2, rows.size(), "everyone, not just the shared rows");
        assertFalse(rows.get(0).containsKey("email"), "no email on a row the share does not cover");
        assertEquals("ravi@x.in", rows.get(1).get("email"));
        assertTrue(((List<?>) out.get("columns")).contains("email"));
        assertTrue(((List<?>) out.get("columns")).contains("stage"));
    }

    @Test
    void afterReviewAShareIsExactlyWhatWasShared() {
        when(settings.recruiterSeesApplicantsDirectly(6)).thenReturn(false);
        when(jdbc.queryForList(contains("FROM tpo_share_link"), any(SqlParameterSource.class)))
                .thenReturn(List.of(Map.of("columns_json", "[\"name\"]", "max_stage", "SHORTLISTED")));
        when(share.rowsFor(eq(5), eq(6), eq(List.of("name", "stage")), eq("SHORTLISTED"))).thenReturn(List.of(Map.of("applicantId", "A2", "name", "Ravi")));
        Map<String, Object> out = svc.applicants(77, 6, 5);
        assertEquals(1, ((List<?>) out.get("applicants")).size());
        assertEquals(List.of("name", "stage"), out.get("columns"), "the share's columns, plus where each applicant stands");
    }
}
