package com._42students.lms.service;

import com._42students.lms.dto.bugtracker.BugReportRetestRequest;
import com._42students.lms.dto.bugtracker.BugReportWorkflowRequest;
import com._42students.lms.model.BugReport;
import com._42students.lms.model.BugReportActivity;
import com._42students.lms.repository.BugReportActivityRepository;
import com._42students.lms.repository.BugReportRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class BugTrackerWorkflowServiceTest {
    private BugReportRepository reportRepository;
    private BugReportActivityRepository activityRepository;
    private BugTrackerWorkflowService service;
    private BugReport report;

    @BeforeEach
    void setUp() {
        reportRepository = mock(BugReportRepository.class);
        activityRepository = mock(BugReportActivityRepository.class);
        service = new BugTrackerWorkflowService(reportRepository, activityRepository);

        report = new BugReport();
        report.setId(42L);
        report.setPublicId("LMS-0042");
        report.setReporterName("Akhila");
        report.setStatus("FIXING");
        report.setResolution(null);
        report.setRetestStatus("NOT_RETESTED");
        report.setRegressionTestStatus("NOT_REVIEWED");
        report.setProductionVerified(false);

        when(reportRepository.findByPublicIdIgnoreCase("LMS-0042"))
                .thenReturn(Optional.of(report));
        when(reportRepository.save(any(BugReport.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(activityRepository.save(any(BugReportActivity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void readyForRetestClearsResolutionAndResetsRetestState() {
        report.setResolution("FIXED");
        report.setRetestStatus("FAIL");

        BugReportWorkflowRequest request = new BugReportWorkflowRequest();
        request.setStatus("READY_FOR_RETEST");

        service.updateWorkflow("LMS-0042", request);

        assertEquals("READY_FOR_RETEST", report.getStatus());
        assertNull(report.getResolution());
        assertEquals("NOT_RETESTED", report.getRetestStatus());
        assertNull(report.getRetestedAt());
        verify(activityRepository, atLeastOnce()).save(any(BugReportActivity.class));
    }

    @Test
    void terminalResolutionClosesIssue() {
        BugReportWorkflowRequest request = new BugReportWorkflowRequest();
        request.setResolution("DUPLICATE");

        service.updateWorkflow("LMS-0042", request);

        assertEquals("CLOSED", report.getStatus());
        assertEquals("DUPLICATE", report.getResolution());
    }

    @Test
    void passingRetestClosesIssueAsFixed() {
        report.setStatus("READY_FOR_RETEST");
        BugReportRetestRequest request = new BugReportRetestRequest();
        request.setResult("PASS");
        request.setNote("Looks good now");

        service.retest("LMS-0042", request);

        assertEquals("CLOSED", report.getStatus());
        assertEquals("FIXED", report.getResolution());
        assertEquals("PASS", report.getRetestStatus());
        assertNotNull(report.getRetestedAt());
        verify(activityRepository).save(argThat(activity ->
                "RETEST".equals(activity.getActivityType())
                        && "Akhila".equals(activity.getActorName())
                        && "Looks good now".equals(activity.getNote())));
    }

    @Test
    void retestIsRejectedUntilIssueIsReadyForRetest() {
        report.setStatus("FIXING");
        BugReportRetestRequest request = new BugReportRetestRequest();
        request.setResult("PASS");

        org.springframework.web.server.ResponseStatusException error =
                assertThrows(org.springframework.web.server.ResponseStatusException.class,
                        () -> service.retest("LMS-0042", request));

        assertEquals(org.springframework.http.HttpStatus.CONFLICT, error.getStatus());
        assertEquals("FIXING", report.getStatus());
        verify(reportRepository, never()).save(any(BugReport.class));
    }

    @Test
    void failedRetestReturnsIssueToFixingAndClearsProductionVerification() {
        report.setStatus("READY_FOR_RETEST");
        report.setProductionVerified(true);
        BugReportRetestRequest request = new BugReportRetestRequest();
        request.setResult("FAIL");

        service.retest("LMS-0042", request);

        assertEquals("FIXING", report.getStatus());
        assertNull(report.getResolution());
        assertEquals("FAIL", report.getRetestStatus());
        assertFalse(report.getProductionVerified());
    }
}
