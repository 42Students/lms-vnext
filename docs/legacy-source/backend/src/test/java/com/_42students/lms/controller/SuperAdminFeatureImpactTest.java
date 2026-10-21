package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.College;
import com._42students.lms.repository.InterviewRepository;
import com._42students.lms.repository.JobApplicationRepository;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.repository.ProjectMemberRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AdminAuditLogService;
import com._42students.lms.service.AppSettingsService;
import com._42students.lms.service.CollegeService;
import com._42students.lms.service.ModuleAccessResolver;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SuperAdminFeatureImpactTest {
    private final AccessControlService access = mock(AccessControlService.class);
    private final CollegeService colleges = mock(CollegeService.class);
    private final ScopeResolutionService scopes = mock(ScopeResolutionService.class);
    private final SecurityContextUtil security = mock(SecurityContextUtil.class);
    private final JobRepository jobs = mock(JobRepository.class);
    private final JobApplicationRepository applications = mock(JobApplicationRepository.class);
    private final InterviewRepository interviews = mock(InterviewRepository.class);
    private final UserPrincipal globalAdmin = new UserPrincipal(1, "FACULTY", "ADMIN", null, null, 0);
    private SuperAdminFeatureController controller;

    private College college(Integer org) {
        College college = new College();
        college.setId(7);
        college.setOrgId(org);
        return college;
    }

    @BeforeEach
    void setUp() {
        controller = new SuperAdminFeatureController(mock(AppSettingsService.class), access,
                colleges, mock(AdminAuditLogService.class), security, scopes,
                mock(ProjectMemberRepository.class), mock(ModuleAccessResolver.class));
        ReflectionTestUtils.setField(controller, "jobRepository", jobs);
        ReflectionTestUtils.setField(controller, "jobApplicationRepository", applications);
        ReflectionTestUtils.setField(controller, "interviewRepository", interviews);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(globalAdmin);
    }

    @Test
    void previewCountsCollegeAndSharedJobsAndRealLearnerImpact() {
        when(colleges.findById(7)).thenReturn(Optional.of(college(3)));
        when(jobs.countActivePublishedForCollegeOrOrg(7, 3)).thenReturn(8L);
        when(applications.countInProgressForLearnerCollege(7, 3)).thenReturn(12L);
        when(applications.countPendingOffersForLearnerCollege(7, 3)).thenReturn(2L);
        when(interviews.countUpcomingForLearnerCollege(eq(7), eq(3), any(LocalDateTime.class)))
                .thenReturn(4L);
        org.springframework.http.ResponseEntity<?> response = controller.placementsImpact(7);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<?, ?> result = (Map<?, ?>) ((Response<?>) response.getBody()).getData();
        assertEquals(8L, result.get("activeJobs"));
        assertEquals(12L, result.get("inProgressApplications"));
        assertEquals(2L, result.get("pendingOffers"));
        assertEquals(4L, result.get("upcomingInterviews"));
        verify(access).requireSuperAdmin(globalAdmin);
    }

    @Test
    void scopedSuperAdminCannotReadAnotherOrganizationsPreview() {
        UserPrincipal orgAdmin = new UserPrincipal(1, "FACULTY", "ADMIN", 99, null, 0);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(orgAdmin);
        when(scopes.resolveCollegeToOrganizationId(7)).thenReturn(3);
        assertThrows(AccessDeniedException.class, () -> controller.placementsImpact(7));
        verifyNoInteractions(jobs, applications, interviews);
    }

    @Test
    void nonexistentCollegeNeverReturnsFakeZeroCounts() {
        when(colleges.findById(7)).thenReturn(Optional.empty());
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> controller.placementsImpact(7));
        assertEquals(HttpStatus.NOT_FOUND, error.getStatus());
        verifyNoInteractions(jobs, applications, interviews);
    }

    @Test
    void missingCollegeOrganizationFailsInsteadOfReportingSafe() {
        when(colleges.findById(7)).thenReturn(Optional.of(college(null)));
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> controller.placementsImpact(7));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, error.getStatus());
        verifyNoInteractions(jobs, applications, interviews);
    }
}
