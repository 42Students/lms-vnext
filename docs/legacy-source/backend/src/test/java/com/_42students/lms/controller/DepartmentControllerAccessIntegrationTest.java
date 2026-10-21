package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.exceptions.GlobalExceptionHandler;
import com._42students.lms.model.Department;
import com._42students.lms.security.JwtService;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.DepartmentService;
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
 * Integration tests for college-scoped access: 403 when principal's college does not match requested college; 200 when it matches or super-admin.
 */
@WebMvcTest(controllers = DepartmentController.class,
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
        // though their own assignableTypes scoping means they'd never fire for DepartmentController.
        // Both need AssignmentUploadReceiptRepository, which this JPA-free slice never provides.
        @org.springframework.context.annotation.ComponentScan.Filter(
            type = org.springframework.context.annotation.FilterType.ASSIGNABLE_TYPE,
            classes = {com._42students.lms.controller.ResourceUploadReceiptAdvice.class,
                       com._42students.lms.controller.FacultyResourceUploadReceiptAdvice.class,
                       com._42students.lms.controller.ResourceLessonCourseRequestGuard.class})})
@Import({AccessControlService.class, GlobalExceptionHandler.class, com._42students.lms.configuration.TestSecurityConfig.class})
@org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc(addFilters = false)
@org.springframework.test.context.ActiveProfiles("controllerAccessTest")
class DepartmentControllerAccessIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    // AccessControlService (imported for real above) constructor-injects this repository.
    @MockBean
    private com._42students.lms.repository.FacultyTeachingAssignmentRepository facultyTeachingAssignmentRepository;

    @MockBean
    private com._42students.lms.security.JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private com._42students.lms.access.ScopeContextFilter scopeContextFilter;

    @MockBean
    private DepartmentService departmentService;

    @MockBean
    private SecurityContextUtil securityContextUtil;

    @MockBean
    private com._42students.lms.access.ScopeResolutionService scopeResolutionService;

    @MockBean
    private JwtService jwtService;

    @Test
    @DisplayName("GET /api/v1/department/fetch?collegeId=1 with null principal returns 403")
    void fetchDepartments_nullPrincipal_returns403() throws Exception {
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(null);

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/department/fetch")
                        .param("collegeId", "1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied to this college"));
    }

    @Test
    @DisplayName("GET /api/v1/department/fetch?collegeId=2 with principal collegeId=1 returns 403")
    void fetchDepartments_wrongCollege_returns403() throws Exception {
        UserPrincipal principal = new UserPrincipal(10, "FACULTY", "ADMIN", null, 1, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/department/fetch")
                        .param("collegeId", "2")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value("FORBIDDEN"))
                .andExpect(jsonPath("$.message").value("Access denied to this college"));
    }

    @Test
    @DisplayName("GET /api/v1/department/fetch?collegeId=1 with principal collegeId=1 returns 200")
    void fetchDepartments_sameCollege_returns200() throws Exception {
        UserPrincipal principal = new UserPrincipal(10, "FACULTY", "ADMIN", null, 1, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
        when(departmentService.fetchAllDepartments(1)).thenReturn(List.of(new Department()));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/department/fetch")
                        .param("collegeId", "1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/v1/department/fetch?collegeId=1 with super-admin returns 200")
    void fetchDepartments_superAdmin_returns200() throws Exception {
        UserPrincipal superAdmin = UserPrincipal.forSuperAdmin();
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(superAdmin);
        when(departmentService.fetchAllDepartments(1)).thenReturn(List.of(new Department()));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/department/fetch")
                        .param("collegeId", "1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }
}
