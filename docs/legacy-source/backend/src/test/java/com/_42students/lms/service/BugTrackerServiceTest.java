package com._42students.lms.service;

import com._42students.lms.dto.bugtracker.BugReportCreateRequest;
import com._42students.lms.dto.bugtracker.BugReportResponse;
import com._42students.lms.model.BugReport;
import com._42students.lms.model.BugTrackerAccess;
import com._42students.lms.repository.BugReportRepository;
import com._42students.lms.repository.BugTrackerAccessRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class BugTrackerServiceTest {
    private BugReportRepository reportRepository;
    private BugTrackerAccessRepository accessRepository;
    private BugTrackerService service;

    @BeforeEach
    void setUp() {
        reportRepository = mock(BugReportRepository.class);
        accessRepository = mock(BugTrackerAccessRepository.class);
        service = new BugTrackerService(reportRepository, accessRepository);
    }

    @Test
    void createAssignsStablePublicIdAndSelectedReporter() {
        BugTrackerAccess reporter = reporter(7L, "Akhila");
        when(accessRepository.findByDisplayNameIgnoreCaseAndActiveTrue("Akhila"))
                .thenReturn(Optional.of(reporter));
        when(reportRepository.saveAndFlush(any(BugReport.class))).thenAnswer(invocation -> {
            BugReport report = invocation.getArgument(0);
            report.setId(42L);
            return report;
        });
        when(reportRepository.save(any(BugReport.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BugReportCreateRequest request = validRequest();
        request.setReporterName("Akhila");
        request.setEnvironment("development");
        request.setSeverity("major");

        BugReportResponse response = service.create(request);

        assertEquals("LMS-0042", response.getPublicId());
        assertEquals("Akhila", response.getReporterName());
        assertEquals("DEVELOPMENT", response.getEnvironment());
        assertEquals("MAJOR", response.getSeverity());
    }

    @Test
    void rejectsReporterThatIsNotInTheConfiguredTeamList() {
        when(accessRepository.findByDisplayNameIgnoreCaseAndActiveTrue("Unknown Person"))
                .thenReturn(Optional.empty());

        BugReportCreateRequest request = validRequest();
        request.setReporterName("Unknown Person");

        ResponseStatusException error =
                assertThrows(ResponseStatusException.class, () -> service.create(request));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
        verifyNoInteractions(reportRepository);
    }

    @Test
    void statusCanBeUpdatedWithoutTrackerLogin() {
        BugReport report = new BugReport();
        report.setPublicId("LMS-0001");
        report.setStatus("NEW");
        when(reportRepository.findByPublicIdIgnoreCase("LMS-0001")).thenReturn(Optional.of(report));
        when(reportRepository.save(any(BugReport.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BugReportResponse response = service.updateStatus("LMS-0001", "FIXING");

        assertEquals("FIXING", response.getStatus());
    }

    @Test
    void rejectsUnknownEnvironmentInsteadOfSilentlyReclassifyingIt() {
        BugTrackerAccess reporter = reporter(3L, "Mounika");
        when(accessRepository.findByDisplayNameIgnoreCaseAndActiveTrue("Mounika"))
                .thenReturn(Optional.of(reporter));

        BugReportCreateRequest request = validRequest();
        request.setReporterName("Mounika");
        request.setEnvironment("AUTO_DETECTED");

        ResponseStatusException error =
                assertThrows(ResponseStatusException.class, () -> service.create(request));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
    }

    @Test
    void rejectsUnsafeEvidenceSchemes() {
        BugTrackerAccess reporter = reporter(4L, "Akhila");
        when(accessRepository.findByDisplayNameIgnoreCaseAndActiveTrue("Akhila"))
                .thenReturn(Optional.of(reporter));

        BugReportCreateRequest request = validRequest();
        request.setReporterName("Akhila");
        request.setEvidenceLink("javascript:alert(1)");

        ResponseStatusException error =
                assertThrows(ResponseStatusException.class, () -> service.create(request));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
    }

    @Test
    void getIncludesWorkflowAndRetestMetadata() {
        BugReport report = new BugReport();
        report.setPublicId("LMS-0099");
        report.setReporterName("Akhila");
        report.setAccountRole("LEARNER");
        report.setEnvironment("PRODUCTION");
        report.setPage("Courses");
        report.setIssueType("Wrong Data");
        report.setDescription("Progress is incorrect.");
        report.setSeverity("MAJOR");
        report.setStatus("READY_FOR_RETEST");
        report.setAffectedLayer("BOTH");
        report.setRootCause("API response shape changed.");
        report.setFixNotes("Normalized the response.");
        report.setFrontendCommitSha("abc123");
        report.setBackendCommitSha("def456");
        report.setRegressionTestStatus("ADDED");
        report.setProductionVerified(true);
        report.setRetestStatus("NOT_RETESTED");
        when(reportRepository.findByPublicIdIgnoreCase("LMS-0099")).thenReturn(Optional.of(report));

        BugReportResponse response = service.get("LMS-0099");

        assertEquals("BOTH", response.getAffectedLayer());
        assertEquals("API response shape changed.", response.getRootCause());
        assertEquals("Normalized the response.", response.getFixNotes());
        assertEquals("abc123", response.getFrontendCommitSha());
        assertEquals("def456", response.getBackendCommitSha());
        assertEquals("ADDED", response.getRegressionTestStatus());
        assertTrue(response.getProductionVerified());
        assertEquals("NOT_RETESTED", response.getRetestStatus());
    }


    @Test
    void storesOptionalQuickReportSourceContextWithoutChangingEnvironmentSelection() {
        BugTrackerAccess reporter = reporter(5L, "Sadwik");
        when(accessRepository.findByDisplayNameIgnoreCaseAndActiveTrue("Sadwik"))
                .thenReturn(Optional.of(reporter));
        when(reportRepository.saveAndFlush(any(BugReport.class))).thenAnswer(invocation -> {
            BugReport report = invocation.getArgument(0);
            report.setId(77L);
            return report;
        });
        when(reportRepository.save(any(BugReport.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BugReportCreateRequest request = validRequest();
        request.setReporterName("Sadwik");
        request.setEnvironment("LOCAL");
        request.setSourceUrl("http://localhost:3000/learn/courses/42/learning-path");
        request.setSourcePath("/learn/courses/[courseId]/[...courseTab]");
        request.setBrowser("Mozilla/5.0 Test");
        request.setViewport("1440x900@1");

        BugReportResponse response = service.create(request);

        assertEquals("LOCAL", response.getEnvironment());
        assertEquals("http://localhost:3000/learn/courses/42/learning-path", response.getSourceUrl());
        assertEquals("/learn/courses/[courseId]/[...courseTab]", response.getSourcePath());
        assertEquals("Mozilla/5.0 Test", response.getBrowser());
        assertEquals("1440x900@1", response.getViewport());
    }

    @Test
    void searchDefaultsToNewestFirst() {
        when(reportRepository.search(any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        service.search(null, null, null, null, 0, 20);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(reportRepository).search(any(), any(), any(), any(), pageableCaptor.capture());
        Sort.Order order = pageableCaptor.getValue().getSort().getOrderFor("createdAt");
        assertEquals(Sort.Direction.DESC, order.getDirection());
    }

    @Test
    void searchAcceptsAscendingSortDirection() {
        when(reportRepository.search(any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        service.search(null, null, null, null, 0, 20, "ASC");

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(reportRepository).search(any(), any(), any(), any(), pageableCaptor.capture());
        Sort.Order order = pageableCaptor.getValue().getSort().getOrderFor("createdAt");
        assertEquals(Sort.Direction.ASC, order.getDirection());
    }

    @Test
    void searchTreatsAnUnrecognizedSortValueAsDescending() {
        when(reportRepository.search(any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        service.search(null, null, null, null, 0, 20, "garbage");

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(reportRepository).search(any(), any(), any(), any(), pageableCaptor.capture());
        Sort.Order order = pageableCaptor.getValue().getSort().getOrderFor("createdAt");
        assertEquals(Sort.Direction.DESC, order.getDirection());
    }

    @Test
    void rejectsUnsafeSourceUrlSchemes() {
        BugTrackerAccess reporter = reporter(6L, "Himaja");
        when(accessRepository.findByDisplayNameIgnoreCaseAndActiveTrue("Himaja"))
                .thenReturn(Optional.of(reporter));

        BugReportCreateRequest request = validRequest();
        request.setReporterName("Himaja");
        request.setSourceUrl("javascript:alert(1)");

        ResponseStatusException error =
                assertThrows(ResponseStatusException.class, () -> service.create(request));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
    }

    private BugReportCreateRequest validRequest() {
        BugReportCreateRequest request = new BugReportCreateRequest();
        request.setReporterName("Akhila");
        request.setAccountRole("LEARNER");
        request.setEnvironment("DEVELOPMENT");
        request.setPage("Courses");
        request.setScreen("Learning Path");
        request.setSection("Lesson Content");
        request.setIssueType("Page Not Loading");
        request.setDescription("Lesson content keeps loading.");
        request.setSeverity("MINOR");
        return request;
    }

    private BugTrackerAccess reporter(Long id, String name) {
        BugTrackerAccess access = new BugTrackerAccess();
        access.setId(id);
        access.setDisplayName(name);
        access.setAccessRole("REPORTER");
        access.setActive(true);
        return access;
    }
}
