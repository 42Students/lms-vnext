package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.Interview;
import com._42students.lms.model.Job;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AdminJobService;
import com._42students.lms.service.InterviewService;
import com._42students.lms.service.JobService;
import com._42students.lms.service.LearnerSavedJobService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PlacementSecurityBoundaryControllerTest {

    private static UserPrincipal learner(int id, int collegeId) {
        return new UserPrincipal(id, "LEARNER", null, 1, collegeId, 0);
    }

    private static UserPrincipal facultyTeacherWithOrg(int id, int orgId) {
        return new UserPrincipal(id, "FACULTY", "TEACHER", orgId, null, 0);
    }

    @Test
    void savedJobIdsAreFilteredAgainstCurrentVisibility() {
        JobController controller = new JobController();
        JobService jobService = mock(JobService.class);
        LearnerSavedJobService saved = mock(LearnerSavedJobService.class);
        SecurityContextUtil security = mock(SecurityContextUtil.class);
        AccessControlService access = mock(AccessControlService.class);

        ReflectionTestUtils.setField(controller, "jobService", jobService);
        ReflectionTestUtils.setField(controller, "learnerSavedJobService", saved);
        ReflectionTestUtils.setField(controller, "securityContextUtil", security);
        ReflectionTestUtils.setField(controller, "accessControlService", access);

        UserPrincipal principal = learner(42, 7);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(principal);
        when(saved.getSavedJobIds(42)).thenReturn(Set.of(10, 11));
        when(jobService.checkJobVisibility(42, 10)).thenReturn(new JobService.VisibilityResult(true, "visible"));
        when(jobService.checkJobVisibility(42, 11)).thenReturn(new JobService.VisibilityResult(false, "targeting changed"));

        ResponseEntity<Response<Set<Integer>>> response = controller.getSavedJobIds(42);

        assertEquals(200, response.getStatusCodeValue());
        assertEquals(Set.of(10), response.getBody().getData());
        verify(access).requireAccessLearner(principal, 42);
    }

    @Test
    void savedJobsAreFilteredWhenAFormerlyVisibleBookmarkBecomesHidden() {
        JobController controller = new JobController();
        JobService jobService = mock(JobService.class);
        LearnerSavedJobService saved = mock(LearnerSavedJobService.class);
        SecurityContextUtil security = mock(SecurityContextUtil.class);
        AccessControlService access = mock(AccessControlService.class);

        ReflectionTestUtils.setField(controller, "jobService", jobService);
        ReflectionTestUtils.setField(controller, "learnerSavedJobService", saved);
        ReflectionTestUtils.setField(controller, "securityContextUtil", security);
        ReflectionTestUtils.setField(controller, "accessControlService", access);

        UserPrincipal principal = learner(42, 7);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(principal);

        Job visible = new Job();
        visible.setId(10);
        Job hidden = new Job();
        hidden.setId(11);
        when(saved.getSavedJobs(42)).thenReturn(List.of(visible, hidden));
        when(jobService.checkJobVisibility(42, 10)).thenReturn(new JobService.VisibilityResult(true, "visible"));
        when(jobService.checkJobVisibility(42, 11)).thenReturn(new JobService.VisibilityResult(false, "no longer visible"));

        ResponseEntity<Response<List<Job>>> response = controller.getSavedJobs(42);

        assertEquals(200, response.getStatusCodeValue());
        assertEquals(List.of(visible), response.getBody().getData());
    }

    @Test
    void collegeAdminApplicationsEndpointRejectsAdminWithoutCollegeScopeBeforeServiceCall() {
        AdminJobController controller = new AdminJobController();
        SecurityContextUtil security = mock(SecurityContextUtil.class);
        AccessControlService access = mock(AccessControlService.class);
        AdminJobService service = mock(AdminJobService.class);

        ReflectionTestUtils.setField(controller, "securityContextUtil", security);
        ReflectionTestUtils.setField(controller, "accessControlService", access);
        ReflectionTestUtils.setField(controller, "adminJobService", service);

        UserPrincipal unassigned = new UserPrincipal(77, "FACULTY", "ADMIN", null, null, 0);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(unassigned);
        doThrow(new AccessDeniedException("Access denied"))
                .when(access).requirePerformAdminActionForCollege(unassigned, 9);

        assertThrows(AccessDeniedException.class, () ->
                controller.getApplications(501, 9, 0, 20, null, null, null,
                        null, null, null, null, null, null, null));

        verifyNoInteractions(service);
    }

    @Test
    void interviewFeedbackRequiresRealAdminOrganizationAuthority() {
        InterviewController controller = new InterviewController();
        SecurityContextUtil security = mock(SecurityContextUtil.class);
        AccessControlService access = mock(AccessControlService.class);
        InterviewService service = mock(InterviewService.class);
        HttpServletRequest request = mock(HttpServletRequest.class);

        ReflectionTestUtils.setField(controller, "securityContextUtil", security);
        ReflectionTestUtils.setField(controller, "accessControlService", access);
        ReflectionTestUtils.setField(controller, "interviewService", service);

        UserPrincipal teacher = facultyTeacherWithOrg(88, 1);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(teacher);
        when(security.getAuthenticatedOrganizationId(request)).thenReturn(1);
        when(security.getAuthenticatedUserId(request)).thenReturn(88);
        doThrow(new AccessDeniedException("Admin role required"))
                .when(access).requireAccessOrganization(teacher, 1);

        assertThrows(AccessDeniedException.class, () ->
                controller.submitInterviewFeedback(44, java.util.Map.of("rating", 4), request));

        verify(service, never()).submitFeedback(anyInt(), anyInt(), any(), any(), any(), anyInt());
    }

    @Test
    void interviewSchedulingRequiresRealAdminOrganizationAuthority() {
        InterviewController controller = new InterviewController();
        SecurityContextUtil security = mock(SecurityContextUtil.class);
        AccessControlService access = mock(AccessControlService.class);
        InterviewService service = mock(InterviewService.class);
        HttpServletRequest request = mock(HttpServletRequest.class);

        ReflectionTestUtils.setField(controller, "securityContextUtil", security);
        ReflectionTestUtils.setField(controller, "accessControlService", access);
        ReflectionTestUtils.setField(controller, "interviewService", service);

        UserPrincipal teacher = facultyTeacherWithOrg(88, 1);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(teacher);
        when(security.getAuthenticatedOrganizationId(request)).thenReturn(1);
        when(security.getAuthenticatedUserId(request)).thenReturn(88);
        doThrow(new AccessDeniedException("Admin role required"))
                .when(access).requireAccessOrganization(teacher, 1);

        assertThrows(AccessDeniedException.class, () ->
                controller.scheduleInterview(new Interview(), request));

        verify(service, never()).scheduleInterview(any(), anyInt(), anyInt());
    }
    @Test
    void collegeAdminWithBothOrgAndCollegeStillCannotScheduleForSiblingCollege() {
        InterviewController controller = new InterviewController();
        SecurityContextUtil security = mock(SecurityContextUtil.class);
        AccessControlService access = mock(AccessControlService.class);
        InterviewService service = mock(InterviewService.class);
        com._42students.lms.repository.JobRepository jobs = mock(com._42students.lms.repository.JobRepository.class);
        HttpServletRequest request = mock(HttpServletRequest.class);

        ReflectionTestUtils.setField(controller, "securityContextUtil", security);
        ReflectionTestUtils.setField(controller, "accessControlService", access);
        ReflectionTestUtils.setField(controller, "interviewService", service);
        ReflectionTestUtils.setField(controller, "jobRepository", jobs);

        UserPrincipal collegeAdmin = new UserPrincipal(89, "FACULTY", "ADMIN", 3, 7, 0);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(collegeAdmin);
        when(security.getAuthenticatedOrganizationId(request)).thenReturn(3);
        when(security.getAuthenticatedUserId(request)).thenReturn(89);

        Job siblingCollegeJob = new Job();
        siblingCollegeJob.setId(901);
        siblingCollegeJob.setOrganizationId(3);
        siblingCollegeJob.setCollegeId(8);
        when(jobs.findById(901)).thenReturn(java.util.Optional.of(siblingCollegeJob));

        Interview payload = new Interview();
        payload.setJob(siblingCollegeJob);

        assertThrows(AccessDeniedException.class, () ->
                controller.scheduleInterview(payload, request));

        verify(access).requireAccessOrganization(collegeAdmin, 3);
        verify(service, never()).scheduleInterview(any(), anyInt(), anyInt());
    }

    @Test
    void collegeAdminWithBothOrgAndCollegeStillCannotSubmitFeedbackForSiblingCollege() {
        InterviewController controller = new InterviewController();
        SecurityContextUtil security = mock(SecurityContextUtil.class);
        AccessControlService access = mock(AccessControlService.class);
        InterviewService service = mock(InterviewService.class);
        com._42students.lms.repository.JobRepository jobs = mock(com._42students.lms.repository.JobRepository.class);
        com._42students.lms.repository.InterviewRepository interviews = mock(com._42students.lms.repository.InterviewRepository.class);
        HttpServletRequest request = mock(HttpServletRequest.class);

        ReflectionTestUtils.setField(controller, "securityContextUtil", security);
        ReflectionTestUtils.setField(controller, "accessControlService", access);
        ReflectionTestUtils.setField(controller, "interviewService", service);
        ReflectionTestUtils.setField(controller, "jobRepository", jobs);
        ReflectionTestUtils.setField(controller, "interviewRepository", interviews);

        UserPrincipal collegeAdmin = new UserPrincipal(89, "FACULTY", "ADMIN", 3, 7, 0);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(collegeAdmin);
        when(security.getAuthenticatedOrganizationId(request)).thenReturn(3);
        when(security.getAuthenticatedUserId(request)).thenReturn(89);

        Job siblingCollegeJob = new Job();
        siblingCollegeJob.setId(901);
        siblingCollegeJob.setOrganizationId(3);
        siblingCollegeJob.setCollegeId(8);

        Interview existing = new Interview();
        existing.setId(44);
        existing.setJob(siblingCollegeJob);
        when(interviews.findById(44)).thenReturn(java.util.Optional.of(existing));
        when(jobs.findById(901)).thenReturn(java.util.Optional.of(siblingCollegeJob));

        assertThrows(AccessDeniedException.class, () ->
                controller.submitInterviewFeedback(44, java.util.Map.of("rating", 4), request));

        verify(access).requireAccessOrganization(collegeAdmin, 3);
        verify(service, never()).submitFeedback(anyInt(), anyInt(), any(), any(), any(), anyInt());
    }

}
