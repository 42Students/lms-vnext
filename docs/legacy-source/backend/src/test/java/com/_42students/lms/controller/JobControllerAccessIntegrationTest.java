package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.exceptions.GlobalExceptionHandler;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.JobService;
import com._42students.lms.util.SecurityContextUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for job/application scoping: learner cannot access another learner's data (IDOR prevention).
 * Uses standalone MockMvc so requests are handled by JobController.
 */
@ExtendWith(MockitoExtension.class)
class JobControllerAccessIntegrationTest {

    private MockMvc mockMvc;

    @Mock
    private JobService jobService;

    @Mock
    private AccessControlService accessControlService;

    @Mock
    private SecurityContextUtil securityContextUtil;

    @BeforeEach
    void setUp() {
        JobController controller = new JobController();
        ReflectionTestUtils.setField(controller, "jobService", jobService);
        ReflectionTestUtils.setField(controller, "accessControlService", accessControlService);
        ReflectionTestUtils.setField(controller, "securityContextUtil", securityContextUtil);
        ReflectionTestUtils.setField(controller, "objectMapper", new ObjectMapper());
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/jobs/applications/99 with learner principal id=42 returns 403")
    void getLearnerApplications_learnerAccessingOther_returns403() throws Exception {
        UserPrincipal learner = new UserPrincipal(42, "LEARNER", null, 1, 1, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(learner);
        doThrow(new AccessDeniedException("Access denied")).when(accessControlService).requireAccessLearner(learner, 99);

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/jobs/applications/99")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value("FORBIDDEN"))
                .andExpect(jsonPath("$.message").value("Access denied"));
    }

    @Test
    @DisplayName("GET /api/v1/jobs/visible/99 with learner principal id=42 returns 403")
    void getVisibleJobs_learnerAccessingOther_returns403() throws Exception {
        UserPrincipal learner = new UserPrincipal(42, "LEARNER", null, 1, 1, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(learner);
        doThrow(new AccessDeniedException("Access denied")).when(accessControlService).requireAccessLearner(learner, 99);

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/jobs/visible/99")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value("FORBIDDEN"))
                .andExpect(jsonPath("$.message").value("Access denied"));
    }
}
