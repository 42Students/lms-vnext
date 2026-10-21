package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.exceptions.GlobalExceptionHandler;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.LessonService;
import com._42students.lms.util.CourseSlugResolver;
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

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for lesson scope: cross-college access is denied.
 */
@WebMvcTest(controllers = LessonController.class,
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
        // though their own assignableTypes scoping means they'd never fire for LessonController.
        // Both need AssignmentUploadReceiptRepository, which this JPA-free slice never provides.
        @org.springframework.context.annotation.ComponentScan.Filter(
            type = org.springframework.context.annotation.FilterType.ASSIGNABLE_TYPE,
            classes = {com._42students.lms.controller.ResourceUploadReceiptAdvice.class,
                       com._42students.lms.controller.FacultyResourceUploadReceiptAdvice.class,
                       com._42students.lms.controller.ResourceLessonCourseRequestGuard.class})})
@Import({AccessControlService.class, ScopeResolutionService.class, GlobalExceptionHandler.class, com._42students.lms.configuration.TestSecurityConfig.class})
@org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc(addFilters = false)
@org.springframework.test.context.ActiveProfiles("controllerAccessTest")
class LessonControllerScopeIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    // AccessControlService (imported for real above) constructor-injects this repository.
    @MockBean
    private com._42students.lms.repository.StudentAssignmentRepository studentAssignmentRepository;

    @MockBean
    private com._42students.lms.repository.FacultyTeachingAssignmentRepository facultyTeachingAssignmentRepository;

    @MockBean
    private com._42students.lms.security.JwtAuthenticationFilter jwtAuthenticationFilter;
    @MockBean
    private com._42students.lms.access.ScopeContextFilter scopeContextFilter;
    @MockBean
    private LessonService lessonService;
    @MockBean
    private SecurityContextUtil securityContextUtil;
    @MockBean
    private CourseSlugResolver courseSlugResolver;
    @MockBean
    private ScopeResolutionService scopeResolutionService;

    @Test
    @DisplayName("GET /api/v1/lesson/fetch with courseId=2 when principal has collegeId=1 returns 403 (cross-college denied)")
    void getLessons_wrongCollege_returns403() throws Exception {
        UserPrincipal principal = new UserPrincipal(10, "FACULTY", "ADMIN", null, 1, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
        when(courseSlugResolver.resolve(null, 2)).thenReturn(2);
        when(scopeResolutionService.resolveCourseToCollegeId(2)).thenReturn(2);
        when(lessonService.getLessons(2)).thenReturn(List.of());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/lesson/fetch")
                        .param("courseId", "2")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied to this course"));
    }
}
