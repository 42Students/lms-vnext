package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.exceptions.GlobalExceptionHandler;
import com._42students.lms.model.Job;
import com._42students.lms.model.JobApplication;
import com._42students.lms.model.Learner;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.JobService;
import com._42students.lms.service.LearnerSavedJobService;
import com._42students.lms.util.SecurityContextUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Set;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class JobControllerPlacementBoundaryTest {
    @Mock private JobService jobService;
    @Mock private AccessControlService accessControlService;
    @Mock private SecurityContextUtil securityContextUtil;
    @Mock private LearnerSavedJobService learnerSavedJobService;
    private MockMvc mockMvc;

    @BeforeEach
    void setup() {
        JobController controller = new JobController();
        ReflectionTestUtils.setField(controller, "jobService", jobService);
        ReflectionTestUtils.setField(controller, "accessControlService", accessControlService);
        ReflectionTestUtils.setField(controller, "securityContextUtil", securityContextUtil);
        ReflectionTestUtils.setField(controller, "learnerSavedJobService", learnerSavedJobService);
        ReflectionTestUtils.setField(controller, "objectMapper", new ObjectMapper());
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void deniedHistoryReturns403InsteadOf500() throws Exception {
        UserPrincipal principal = new UserPrincipal(42, "LEARNER", null, 1, 1, 0);
        Learner owner = mock(Learner.class);
        when(owner.getId()).thenReturn(99);
        JobApplication application = new JobApplication();
        application.setLearner(owner);
        when(jobService.getApplicationById(77)).thenReturn(application);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
        doThrow(new AccessDeniedException("Access denied"))
                .when(accessControlService).requireAccessLearner(principal, 99);

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/jobs/applications/77/history"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value("error"));
        verifyNoMoreInteractions(jobService);
    }

    @Test
    void orphanedApplicationHistoryFailsClosed() throws Exception {
        when(jobService.getApplicationById(77)).thenReturn(new JobApplication());
        when(securityContextUtil.getAuthenticatedUserPrincipal())
                .thenReturn(new UserPrincipal(42, "LEARNER", null, 1, 1, 0));
        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/jobs/applications/77/history"))
                .andExpect(status().isForbidden());
        verifyNoInteractions(accessControlService);
    }


    @Test
    void preferredWithdrawalEndpointTargetsApplicationIdNotJobId() throws Exception {
        UserPrincipal principal = new UserPrincipal(42, "LEARNER", null, 1, 1, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);

        JobApplication application = new JobApplication();
        application.setId(77);
        when(jobService.withdrawApplicationById(42, 77)).thenReturn(application);

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/jobs/applications/77/withdraw/42"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.id").value(77));

        verify(accessControlService).requireAccessLearner(principal, 42);
        verify(jobService).withdrawApplicationById(42, 77);
        verify(jobService, never()).withdrawApplication(eq(42), anyInt());
    }

    @Test
    void extremeJobFeedPageDoesNotOverflowTo500() throws Exception {
        UserPrincipal principal = new UserPrincipal(42, "LEARNER", null, 1, 1, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
        when(jobService.getAllActiveJobsForLearnerOrganization(42)).thenReturn(List.of(new Job()));
        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/jobs/active/42")
                        .param("page", String.valueOf(Integer.MAX_VALUE))
                        .param("size", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void savedIdsExcludeBookmarksThatAreNoLongerVisible() throws Exception {
        UserPrincipal principal = new UserPrincipal(42, "LEARNER", null, 1, 1, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
        when(learnerSavedJobService.getSavedJobIds(42)).thenReturn(Set.of(101, 202));
        when(jobService.checkJobVisibility(42, 101))
                .thenReturn(new JobService.VisibilityResult(true, "visible"));
        when(jobService.checkJobVisibility(42, 202))
                .thenReturn(new JobService.VisibilityResult(false, "hidden"));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/jobs/saved-ids/42"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0]").value(101));

        verify(accessControlService).requireAccessLearner(principal, 42);
        verify(jobService).checkJobVisibility(42, 101);
        verify(jobService).checkJobVisibility(42, 202);
    }

    @Test
    void savedJobObjectsUseTheSameVisibilityGateAsSavedIds() throws Exception {
        UserPrincipal principal = new UserPrincipal(42, "LEARNER", null, 1, 1, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
        Job visible = new Job();
        visible.setId(101);
        Job hidden = new Job();
        hidden.setId(202);
        when(learnerSavedJobService.getSavedJobs(42)).thenReturn(List.of(visible, hidden));
        when(jobService.checkJobVisibility(42, 101))
                .thenReturn(new JobService.VisibilityResult(true, "visible"));
        when(jobService.checkJobVisibility(42, 202))
                .thenReturn(new JobService.VisibilityResult(false, "hidden"));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/jobs/saved/42"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value(101));
    }

}
