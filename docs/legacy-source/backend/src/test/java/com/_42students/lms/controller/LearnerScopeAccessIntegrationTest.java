package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.exceptions.GlobalExceptionHandler;
import com._42students.lms.model.StudentAssignment;
import com._42students.lms.security.JwtService;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AssignmentService;
import com._42students.lms.service.LessonContentsService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.util.Collections;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for learner-scoped access (Pass 3): learner can only see self; 403 when learner A requests learner B's data; 200 when self or faculty with canAccessLearner.
 */
@WebMvcTest(controllers = AssignmentController.class,
    // TestSecurityConfig below is meant to replace the real security config, but @WebMvcTest
    // auto-includes every WebSecurityConfigurerAdapter it scans, so WebSecurityConfig would
    // still load and drag in JwtService/JwtAuthenticationFilter. Exclude it explicitly.
    excludeFilters = {
        @org.springframework.context.annotation.ComponentScan.Filter(
            type = org.springframework.context.annotation.FilterType.ASSIGNABLE_TYPE,
            classes = com._42students.lms.configuration.WebSecurityConfig.class),
        // These slices run with addFilters = false, so no servlet filter is ever applied — but
        // @WebMvcTest still *instantiates* every Filter bean it scans, dragging in JwtService,
        // AppSettingsService and friends. Nothing here needs them.
        @org.springframework.context.annotation.ComponentScan.Filter(
            type = org.springframework.context.annotation.FilterType.REGEX,
            pattern = "com\\._42students\\.lms\\.security\\..*"),
        // Same reasoning: @WebMvcTest instantiates every @ControllerAdvice on the classpath even
        // though their own assignableTypes scoping means they'd never fire for AssignmentController.
        // Both need AssignmentUploadReceiptRepository, which this JPA-free slice never provides.
        @org.springframework.context.annotation.ComponentScan.Filter(
            type = org.springframework.context.annotation.FilterType.ASSIGNABLE_TYPE,
            classes = {com._42students.lms.controller.ResourceUploadReceiptAdvice.class,
                       com._42students.lms.controller.FacultyResourceUploadReceiptAdvice.class,
                       com._42students.lms.controller.ResourceLessonCourseRequestGuard.class})})
@Import({AccessControlService.class, GlobalExceptionHandler.class, com._42students.lms.configuration.TestSecurityConfig.class})
@org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc(addFilters = false)
@org.springframework.test.context.ActiveProfiles("controllerAccessTest")
class LearnerScopeAccessIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    // AccessControlService (imported for real above) constructor-injects this repository.
    @MockBean
    private com._42students.lms.repository.FacultyTeachingAssignmentRepository facultyTeachingAssignmentRepository;

    @MockBean
    private AssignmentService assignmentService;

    @MockBean
    private LessonContentsService lessonContentsService;

    @MockBean
    private SecurityContextUtil securityContextUtil;

    @MockBean
    private com._42students.lms.access.ScopeResolutionService scopeResolutionService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private com._42students.lms.security.JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private com._42students.lms.access.ScopeContextFilter scopeContextFilter;

    @Test
    @DisplayName("GET .../fetchSubmissionsByLearnerId?learnerId=99 with learner principal id=42 returns 403")
    void fetchSubmissionsByLearnerId_learnerAccessingOther_returns403() throws Exception {
        UserPrincipal learner = new UserPrincipal(42, "LEARNER", null, 1, 1, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(learner);

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/assignment/fetchSubmissionsByLearnerId")
                        .param("learnerId", "99")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value("FORBIDDEN"))
                .andExpect(jsonPath("$.message").value("Learners may only fetch their own submissions"));
    }

    @Test
    @DisplayName("GET .../fetchSubmissionsByLearnerId?learnerId=42 with learner principal id=42 returns 200")
    void fetchSubmissionsByLearnerId_learnerSelf_returns200() throws Exception {
        UserPrincipal learner = new UserPrincipal(42, "LEARNER", null, 1, 1, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(learner);
        when(assignmentService.fetchSubmissionsByLearnerId(42)).thenReturn(Collections.<StudentAssignment>emptyList());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/assignment/fetchSubmissionsByLearnerId")
                        .param("learnerId", "42")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET .../fetchSubmissionsByLearnerId?learnerId=99 with faculty who can access learner's college returns 200")
    void fetchSubmissionsByLearnerId_facultySameCollege_returns200() throws Exception {
        UserPrincipal faculty = new UserPrincipal(30, "FACULTY", "TEACHER", null, 5, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(faculty);
        when(scopeResolutionService.resolveLearnerToCollegeId(99)).thenReturn(5);
        when(assignmentService.fetchSubmissionsByLearnerId(99)).thenReturn(Collections.<StudentAssignment>emptyList());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/assignment/fetchSubmissionsByLearnerId")
                        .param("learnerId", "99")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET .../fetchSubmissionsByLearnerId?learnerId=99 with faculty different college returns 403")
    void fetchSubmissionsByLearnerId_facultyDifferentCollege_returns403() throws Exception {
        UserPrincipal faculty = new UserPrincipal(30, "FACULTY", "TEACHER", null, 5, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(faculty);
        when(scopeResolutionService.resolveLearnerToCollegeId(99)).thenReturn(6);

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/assignment/fetchSubmissionsByLearnerId")
                        .param("learnerId", "99")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied to this learner"));
    }
}
