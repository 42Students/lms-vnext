package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.response.JobImportantDateEventDTO;
import com._42students.lms.exceptions.GlobalExceptionHandler;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.JobService;
import com._42students.lms.util.SecurityContextUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for JobController calendar endpoints:
 * GET /api/v1/jobs/calendar-dates (admin) and GET /api/v1/jobs/calendar-dates/learner/{learnerId}.
 * Uses standalone MockMvc so requests are handled by JobController.
 */
@ExtendWith(MockitoExtension.class)
class JobControllerCalendarIntegrationTest {

    private static final String START = "2025-01-01T00:00:00";
    private static final String END = "2025-12-31T23:59:59";

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

    @Nested
    @DisplayName("GET /api/v1/jobs/calendar-dates (admin)")
    class AdminCalendarDates {

        @Test
        @DisplayName("returns 200 and events when authenticated college admin has collegeId")
        void calendarDates_withCollegeId_returns200AndEvents() throws Exception {
            when(securityContextUtil.getAuthenticatedUserPrincipal())
                    .thenReturn(new UserPrincipal(16, "FACULTY", "ADMIN", 1, 1, 0));
            when(securityContextUtil.getAuthenticatedCollegeId(any(HttpServletRequest.class))).thenReturn(1);
            when(securityContextUtil.getAuthenticatedOrganizationId(any(HttpServletRequest.class))).thenReturn(null);

            List<JobImportantDateEventDTO> events = Collections.singletonList(
                    new JobImportantDateEventDTO(1, "Software Engineer", "Acme Corp", "Screening round",
                            LocalDateTime.of(2025, 3, 10, 10, 0), "JOB_IMPORTANT_DATE", null));
            when(jobService.getImportantDateEventsForAdmin(eq(1), eq(null), any(LocalDateTime.class), any(LocalDateTime.class)))
                    .thenReturn(events);

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/jobs/calendar-dates")
                            .param("start", START)
                            .param("end", END)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("success"))
                    .andExpect(jsonPath("$.data.length()").value(1))
                    .andExpect(jsonPath("$.data[0].jobId").value(1))
                    .andExpect(jsonPath("$.data[0].jobTitle").value("Software Engineer"))
                    .andExpect(jsonPath("$.data[0].label").value("Screening round"))
                    .andExpect(jsonPath("$.data[0].eventType").value("JOB_IMPORTANT_DATE"));
        }

        @Test
        @DisplayName("returns 200 and empty list when authenticated college admin has no events")
        void calendarDates_noEvents_returns200EmptyList() throws Exception {
            when(securityContextUtil.getAuthenticatedUserPrincipal())
                    .thenReturn(new UserPrincipal(16, "FACULTY", "ADMIN", 1, 1, 0));
            when(securityContextUtil.getAuthenticatedCollegeId(any(HttpServletRequest.class))).thenReturn(1);
            when(securityContextUtil.getAuthenticatedOrganizationId(any(HttpServletRequest.class))).thenReturn(null);
            when(jobService.getImportantDateEventsForAdmin(eq(1), eq(null), any(LocalDateTime.class), any(LocalDateTime.class)))
                    .thenReturn(Collections.emptyList());

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/jobs/calendar-dates")
                            .param("start", START)
                            .param("end", END)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("success"))
                    .andExpect(jsonPath("$.data.length()").value(0));
        }

        @Test
        @DisplayName("returns 500 when authenticated admin calendar service throws")
        void calendarDates_serviceThrows_returns500() throws Exception {
            when(securityContextUtil.getAuthenticatedUserPrincipal())
                    .thenReturn(new UserPrincipal(16, "FACULTY", "ADMIN", 1, 1, 0));
            when(securityContextUtil.getAuthenticatedCollegeId(any(HttpServletRequest.class))).thenReturn(1);
            when(securityContextUtil.getAuthenticatedOrganizationId(any(HttpServletRequest.class))).thenReturn(null);
            when(jobService.getImportantDateEventsForAdmin(eq(1), eq(null), any(LocalDateTime.class), any(LocalDateTime.class)))
                    .thenThrow(new RuntimeException("DB error"));

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/jobs/calendar-dates")
                            .param("start", START)
                            .param("end", END)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isInternalServerError())
                    .andExpect(jsonPath("$.status").value("error"))
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Failed to fetch calendar dates")));
        }

        @Test
        @DisplayName("learner cannot query the faculty/admin calendar or reach the service")
        void calendarDates_learnerDeniedBeforeService() throws Exception {
            when(securityContextUtil.getAuthenticatedUserPrincipal())
                    .thenReturn(new UserPrincipal(42, "LEARNER", null, 1, 1, 0));
            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/jobs/calendar-dates")
                            .param("start", START)
                            .param("end", END))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value("error"));
            verifyNoInteractions(jobService);
        }
    }

    @Nested
    @DisplayName("GET /api/v1/jobs/calendar-dates/learner/{learnerId}")
    class LearnerCalendarDates {

        @Test
        @DisplayName("returns 403 before repository lookup when learner accesses another learner's calendar")
        void learnerCalendar_otherLearner_returns403() throws Exception {
            UserPrincipal learner = new UserPrincipal(42, "LEARNER", null, 1, 1, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(learner);

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/jobs/calendar-dates/learner/99")
                            .param("start", START)
                            .param("end", END)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value("error"))
                    .andExpect(jsonPath("$.message").value("Learners may only access their own career calendar"));
            verifyNoInteractions(jobService);
        }

        @Test
        @DisplayName("faculty access to another learner's calendar requires service-level learner scope")
        void learnerCalendar_facultyDeniedByScope() throws Exception {
            UserPrincipal faculty = new UserPrincipal(16, "FACULTY", "TEACHER", 1, 1, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(faculty);
            doThrow(new AccessDeniedException("Access denied"))
                    .when(accessControlService).requireAccessLearner(faculty, 99);

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/jobs/calendar-dates/learner/99")
                            .param("start", START)
                            .param("end", END))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value("FORBIDDEN"));
            verifyNoInteractions(jobService);
        }

        @Test
        @DisplayName("returns 200 and events when learner accesses own calendar")
        void learnerCalendar_self_returns200AndEvents() throws Exception {
            UserPrincipal learner = new UserPrincipal(42, "LEARNER", null, 1, 1, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(learner);

            List<JobImportantDateEventDTO> events = Collections.singletonList(
                    new JobImportantDateEventDTO(2, "Data Analyst", "DataCo", "Application deadline",
                            LocalDateTime.of(2025, 4, 1, 23, 59), "JOB_IMPORTANT_DATE", null));
            when(jobService.getImportantDateEventsForLearner(eq(42), any(LocalDateTime.class), any(LocalDateTime.class)))
                    .thenReturn(events);

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/jobs/calendar-dates/learner/42")
                            .param("start", START)
                            .param("end", END)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("success"))
                    .andExpect(jsonPath("$.data.length()").value(1))
                    .andExpect(jsonPath("$.data[0].jobId").value(2))
                    .andExpect(jsonPath("$.data[0].label").value("Application deadline"));
        }

        @Test
        @DisplayName("returns 200 and empty list when learner has no events")
        void learnerCalendar_noEvents_returns200EmptyList() throws Exception {
            UserPrincipal learner = new UserPrincipal(42, "LEARNER", null, 1, 1, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(learner);
            when(jobService.getImportantDateEventsForLearner(eq(42), any(LocalDateTime.class), any(LocalDateTime.class)))
                    .thenReturn(Collections.emptyList());

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/jobs/calendar-dates/learner/42")
                            .param("start", START)
                            .param("end", END)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("success"))
                    .andExpect(jsonPath("$.data.length()").value(0));
        }
    }
}
