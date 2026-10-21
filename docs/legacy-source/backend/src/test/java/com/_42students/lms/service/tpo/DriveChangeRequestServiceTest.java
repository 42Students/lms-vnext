package com._42students.lms.service.tpo;

import com._42students.lms.model.Job;
import com._42students.lms.repository.JobRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Recruiter phase 1, N14: change requests are answered in place and applied to the drive; nothing is "sent back". Every step leaves
 * a line in the drive's company thread. Edge cases: docs/recruiter-global/REQUESTS-DISCUSSION-AUDIT-2026-10-12.md.
 */
class DriveChangeRequestServiceTest {

    private static final String LATER = "2099-10-23T18:00";

    private final NamedParameterJdbcTemplate jdbc = mock(NamedParameterJdbcTemplate.class);
    private final JobRepository jobs = mock(JobRepository.class);
    private final TpoAuditService audit = mock(TpoAuditService.class);
    private final TpoMessagesService messages = mock(TpoMessagesService.class);
    private final LiveDriveChangeService liveDriveChange = mock(LiveDriveChangeService.class);
    private final DriveChangeRequestService svc = new DriveChangeRequestService(jdbc, jobs, audit, messages, liveDriveChange);
    private final DriveChangeRequestService.Actor tpo = new DriveChangeRequestService.Actor("FACULTY", 22, "Anitha");
    private final DriveChangeRequestService.Actor recruiter = new DriveChangeRequestService.Actor("RECRUITER", 501, "Kumar");
    private Job job;

    @BeforeEach
    void setUp() {
        job = new Job();
        job.setId(5);
        job.setCollegeId(9);
        job.setRecruiterId(501L);
        job.setLifecycleStatus("REQUEST");
        job.setJobTitle("Data Analyst Intern");
        job.setLocation("Hyderabad");
        when(jobs.findById(anyInt())).thenReturn(Optional.of(job));
        when(jobs.save(any(Job.class))).thenAnswer(i -> i.getArgument(0));
        when(jdbc.update(anyString(), any(SqlParameterSource.class))).thenReturn(1);
        when(jdbc.queryForObject(contains("LAST_INSERT_ID"), any(SqlParameterSource.class), eq(Long.class))).thenReturn(77L);
        when(jdbc.queryForObject(contains("COUNT(*) FROM drive_change_request"), any(SqlParameterSource.class), eq(Integer.class))).thenReturn(0);
        when(messages.recruiterCanSee(anyInt(), anyLong())).thenReturn(true);
    }

    private void stored(String direction, String field, String kind, String proposed) {
        Map<String, Object> row = new HashMap<>();
        row.put("id", 1L); row.put("job_id", 5); row.put("direction", direction); row.put("field", field);
        row.put("kind", kind); row.put("proposed_value", proposed); row.put("status", "OPEN");
        when(jdbc.queryForList(contains("SELECT * FROM drive_change_request"), any(SqlParameterSource.class))).thenReturn(List.of(row));
    }

    private DriveChangeRequestService.NewRequest ask(String field, String kind, String value) {
        DriveChangeRequestService.NewRequest r = new DriveChangeRequestService.NewRequest();
        r.field = field;
        r.kind = kind;
        r.proposedValue = value;
        return r;
    }

    @Test
    void theCompanyAcceptsAProposedValueAndItIsAppliedAndTheDriveIsMarkedChangesMade() {
        stored("COLLEGE_TO_COMPANY", "MIN_CGPA", "PROPOSE", "7.0");
        svc.accept(1L, recruiter);
        assertEquals(7.0, ((Map<?, ?>) job.getEligibilityJson()).get("minCgpa"));
        assertNotNull(job.getChangesMadeAt(), "last institutional request answered: back to the placement cell's queue");
        assertEquals("REQUEST", job.getLifecycleStatus(), "the drive never goes backwards");
        verify(messages).postEvent(9, 501L, 5, "RECRUITER", 501, "ACCEPTED", 1L, "Accepted the change to Minimum CGPA");
        verify(audit).bell(eq(9), eq("DRIVE_CHANGES_MADE"), contains("answered your change requests"), anyString(), anyString());
    }

    @Test
    void aQuestionIsAnsweredInPlace() {
        stored("COLLEGE_TO_COMPANY", "STIPEND", "ASK", null);
        svc.answer(1L, "25,000", recruiter);
        assertEquals(1, ((List<?>) job.getRoleOptionsJson()).size());
        assertEquals("25000", String.valueOf(((Map<?, ?>) ((List<?>) job.getRoleOptionsJson()).get(0)).get("stipendPerMonth")));
        verify(messages).postEvent(9, 501L, 5, "RECRUITER", 501, "ANSWERED", 1L, "Answered: Monthly stipend");
    }

    @Test
    void onlyTheSideTheRequestWasSentToAnswersAndOnlyTheAskerWithdraws() {
        stored("COLLEGE_TO_COMPANY", "LOCATION", "PROPOSE", "Bengaluru");
        assertThrows(IllegalArgumentException.class, () -> svc.accept(1L, tpo));
        assertThrows(IllegalArgumentException.class, () -> svc.withdraw(1L, recruiter));
        svc.withdraw(1L, tpo);
        verify(messages).postEvent(9, 501L, 5, "TPO", 22, "WITHDRAWN", 1L, "Withdrew the request on Location");
    }

    @Test
    void thePlacementCellWithdrawingItsOwnLastRequestIsNotTheCompanyMakingChanges() {
        stored("COLLEGE_TO_COMPANY", "LOCATION", "PROPOSE", "Bengaluru");
        svc.withdraw(1L, tpo);
        assertNull(job.getChangesMadeAt());
        verify(audit, never()).bell(anyInt(), eq("DRIVE_CHANGES_MADE"), anyString(), anyString(), anyString());
    }

    @Test
    void aCompanyRequestIsAnsweredByThePlacementCell() {
        stored("COMPANY_TO_COLLEGE", "DEADLINE", "PROPOSE", LATER);
        svc.accept(1L, tpo);
        assertEquals(LATER, job.getApplicationDeadline().toString());
        assertNull(job.getChangesMadeAt(), "company requests do not move the review queue");
    }

    @Test
    void anAcceptedChangeOnALiveDriveTellsItsApplicantsAndARulesChangeRechecksThem() {
        job.setLifecycleStatus("PUBLISHED");
        stored("COMPANY_TO_COLLEGE", "MIN_CGPA", "PROPOSE", "7.5");
        svc.accept(1L, tpo);
        verify(liveDriveChange).tellApplicants(job, "Minimum CGPA");
        verify(liveDriveChange).recheckEligibility(job);
    }

    @Test
    void aDeadlineChangeOnALiveDriveTellsApplicantsButRechecksNobody() {
        job.setLifecycleStatus("PUBLISHED");
        stored("COMPANY_TO_COLLEGE", "DEADLINE", "PROPOSE", LATER);
        svc.accept(1L, tpo);
        verify(liveDriveChange).tellApplicants(job, "Application deadline");
        verify(liveDriveChange, never()).recheckEligibility(any());
    }

    @Test
    void aNewTitleOrADriveNotLiveYetTellsNobody() {
        job.setLifecycleStatus("PUBLISHED");
        stored("COMPANY_TO_COLLEGE", "ROLE_TITLE", "PROPOSE", "Data Analyst");
        svc.accept(1L, tpo);
        stored("COLLEGE_TO_COMPANY", "MIN_CGPA", "PROPOSE", "7.0");
        job.setLifecycleStatus("REQUEST");
        svc.accept(1L, recruiter);
        verify(liveDriveChange, never()).tellApplicants(any(), any());
        verify(liveDriveChange, never()).recheckEligibility(any());
    }

    @Test
    void aValueThatHasGoneStaleIsCheckedAgainAtAccept() {
        stored("COMPANY_TO_COLLEGE", "DEADLINE", "PROPOSE", "2020-01-01T10:00");
        assertThrows(IllegalArgumentException.class, () -> svc.accept(1L, tpo));
    }

    @Test
    void settlingTwiceAtOnceLeavesOneLine() {
        stored("COLLEGE_TO_COMPANY", "LOCATION", "PROPOSE", "Bengaluru");
        when(jdbc.update(contains("UPDATE drive_change_request"), any(SqlParameterSource.class))).thenReturn(0);
        assertThrows(IllegalStateException.class, () -> svc.accept(1L, recruiter));
        verify(messages, never()).postEvent(anyInt(), anyLong(), anyInt(), anyString(), anyInt(), anyString(), anyLong(), anyString());
    }

    @Test
    void declineNeedsAReasonAndLeavesALine() {
        stored("COLLEGE_TO_COMPANY", "LOCATION", "PROPOSE", "Bengaluru");
        assertThrows(IllegalArgumentException.class, () -> svc.reply(1L, "  ", recruiter));
        svc.reply(1L, "The role is in Hyderabad only", recruiter);
        verify(messages).postEvent(9, 501L, 5, "RECRUITER", 501, "DECLINED", 1L, "Declined the change to Location");
    }

    @Test
    void aDriveThatIsOverTakesNoRequestsAndNoAnswersButCanBeTidied() {
        job.setLifecycleStatus("CLOSED");
        assertThrows(IllegalStateException.class, () -> svc.create(5, ask("LOCATION", "PROPOSE", "Pune"), tpo));
        stored("COLLEGE_TO_COMPANY", "LOCATION", "PROPOSE", "Pune");
        assertThrows(IllegalStateException.class, () -> svc.accept(1L, recruiter));
        svc.withdraw(1L, tpo);
    }

    @Test
    void creatingLeavesALineAndNamesWhoAsked() {
        Map<String, Object> out = svc.create(5, ask("LOCATION", "PROPOSE", "Pune"), tpo);
        assertEquals(77L, out.get("id"));
        verify(messages).postEvent(9, 501L, 5, "TPO", 22, "CREATED", 77L, "Asked to change Location");
    }

    @Test
    void somethingElseIsAlwaysAQuestion() {
        DriveChangeRequestService.NewRequest r = ask("OTHER", "PROPOSE", null);
        r.note = "Can the interview be online?";
        svc.create(5, r, recruiter);
        verify(jdbc).update(contains("INSERT INTO drive_change_request"), org.mockito.ArgumentMatchers.<SqlParameterSource>argThat(p -> "ASK".equals(p.getValue("k"))));
    }

    @Test
    void theSameValueOrASecondOpenRequestOnAFieldIsRefused() {
        assertThrows(IllegalArgumentException.class, () -> svc.create(5, ask("LOCATION", "PROPOSE", "hyderabad"), tpo));
        when(jdbc.queryForObject(contains("COUNT(*) FROM drive_change_request WHERE job_id = :j AND field"), any(SqlParameterSource.class), eq(Integer.class))).thenReturn(1);
        assertThrows(IllegalStateException.class, () -> svc.create(5, ask("LOCATION", "PROPOSE", "Pune"), tpo));
    }

    @Test
    void aRecruiterWhoCannotSeeTheCollegeIsNotAsked() {
        when(messages.recruiterCanSee(anyInt(), anyLong())).thenReturn(false);
        assertThrows(IllegalStateException.class, () -> svc.create(5, ask("LOCATION", "PROPOSE", "Pune"), tpo));
    }

    @Test
    void payOnADriveWithSeveralRolesOrBelowFixedPlusVariableIsRefused() {
        job.setRoleOptionsJson(List.of(Map.of("name", "SDE", "ctcLpa", 10), Map.of("name", "QA", "ctcLpa", 6)));
        assertThrows(IllegalArgumentException.class, () -> svc.create(5, ask("CTC_LPA", "PROPOSE", "12"), tpo));
        job.setRoleOptionsJson(List.of(Map.of("name", "SDE", "ctcLpa", 10, "fixedLpa", 7, "variableLpa", 2)));
        assertThrows(IllegalArgumentException.class, () -> svc.create(5, ask("CTC_LPA", "PROPOSE", "8"), tpo));
        svc.create(5, ask("CTC_LPA", "PROPOSE", "9"), tpo);
    }

    @Test
    void valuesAreCheckedBeforeTheyAreAsked() {
        assertThrows(IllegalArgumentException.class, () -> DriveChangeRequestService.validate("MIN_CGPA", "11"));
        assertThrows(IllegalArgumentException.class, () -> DriveChangeRequestService.validate("CTC_LPA", "a lot"));
        assertThrows(IllegalArgumentException.class, () -> DriveChangeRequestService.validate("MODE", "SOMEWHERE"));
        assertThrows(IllegalArgumentException.class, () -> DriveChangeRequestService.validate("DEADLINE", "next week"));
        assertThrows(IllegalArgumentException.class, () -> DriveChangeRequestService.validate("DEADLINE", "2020-01-01T10:00"));
        assertThrows(IllegalArgumentException.class, () -> DriveChangeRequestService.validate("LOCATION", "x".repeat(256)));
        assertThrows(IllegalArgumentException.class, () -> DriveChangeRequestService.normalize("JOB_TYPE", "Gig"));
        assertEquals("Internship", DriveChangeRequestService.normalize("JOB_TYPE", "internship"));
        assertEquals("CSE, ECE", DriveChangeRequestService.normalize("BRANCHES", " CSE,,ECE , CSE"));
        DriveChangeRequestService.validate("CTC_LPA", "6.5");
    }

    @Test
    void aPlainTextDescriptionBecomesEscapedParagraphs() {
        assertEquals("<p>Build &lt;APIs&gt;<br>in Java</p><p>Remote ok</p>", DriveChangeRequestService.paragraphs("Build <APIs>\nin Java\n\nRemote ok"));
        assertTrue(DriveChangeRequestService.paragraphs("one").startsWith("<p>"));
    }
}
