package com._42students.lms.configuration;

import com._42students.lms.access.ScopeContextFilter;
import com._42students.lms.controller.ModuleAccessController;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.RefreshTokenBlocklistRepository;
import com._42students.lms.security.JwtAuthenticationFilter;
import com._42students.lms.security.JwtService;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.ModuleAccessService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * HTTP authorization with the REAL WebSecurityConfig, JWT filter and scope filter in their
 * production order. Requests deliberately have no bearer token: the real JWT filter passes them
 * through, and Security MockMvc's user() postprocessor supplies test identities. JWT issuance,
 * validation and token revocation are exercised by separate authentication tests.
 */
@WebMvcTest(controllers = ModuleAccessController.class, excludeFilters = {
        @ComponentScan.Filter(type = FilterType.REGEX,
                pattern = "com\\._42students\\.lms\\.security\\..*"),
        // @WebMvcTest instantiates every @ControllerAdvice on the classpath even though their own
        // assignableTypes scoping means they'd never fire for ModuleAccessController. Both need
        // AssignmentUploadReceiptRepository, which this JPA-free slice never provides.
        @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {com._42students.lms.controller.ResourceUploadReceiptAdvice.class,
                           com._42students.lms.controller.FacultyResourceUploadReceiptAdvice.class,
                       com._42students.lms.controller.ResourceLessonCourseRequestGuard.class})
})
@Import({WebSecurityConfig.class, JwtAuthenticationFilter.class, ScopeContextFilter.class})
@AutoConfigureMockMvc(addFilters = true)
class ModuleAccessHttpAuthorizationIntegrationTest {

    @Autowired private MockMvc mvc;
    // These collaborators cannot be used without a bearer token; retain the real filter objects
    // so HttpSecurity can register JwtAuthenticationFilter.class before ScopeContextFilter.
    @MockBean private JwtService jwtService;
    @MockBean private FacultyRepository facultyRepository;
    @MockBean private LearnerRepository learnerRepository;
    @MockBean private RefreshTokenBlocklistRepository blocklistRepository;
    @MockBean private ModuleAccessService moduleAccessService;
    @MockBean private SecurityContextUtil securityContextUtil;

    private List<MockHttpServletRequestBuilder> routes() {
        return List.of(
                get("/api/v1/admin/module-access/tree").param("collegeId", "5"),
                get("/api/v1/admin/module-access").param("scopeType", "COLLEGE").param("scopeId", "5"),
                get("/api/v1/admin/module-access/learner-overrides").param("collegeId", "5"),
                get("/api/v1/admin/module-access/history").param("collegeId", "5"),
                get("/api/v1/admin/module-access/explain").param("learnerId", "77"),
                put("/api/v1/admin/module-access").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"scopeType\":\"LEARNER\",\"scopeId\":77,\"module\":\"projects\",\"enabled\":false}"),
                put("/api/v1/admin/module-access/bulk").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"module\":\"projects\",\"enabled\":false,\"learnerIds\":[77]}")
        );
    }

    @Test
    void unauthenticatedCannotReadOrWriteAnyManagementEndpoint() throws Exception {
        for (MockHttpServletRequestBuilder request : routes()) {
            mvc.perform(request).andExpect(status().isUnauthorized());
        }
        verifyNoInteractions(moduleAccessService);
    }

    @Test
    void adminFacultyLearnerAndMentorRolesCannotReadOrWriteAnyManagementEndpoint() throws Exception {
        for (String role : List.of("ADMIN", "FACULTY", "LEARNER", "MENTOR")) {
            for (MockHttpServletRequestBuilder request : routes()) {
                mvc.perform(request.with(user("non-superadmin").roles(role)))
                        .andExpect(status().isForbidden());
            }
        }
        verifyNoInteractions(moduleAccessService);
    }

    @Test
    void superadminStillCanReachReadAndWriteRoutes() throws Exception {
        UserPrincipal principal = new UserPrincipal(0, "FACULTY", "ADMIN", null, null, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
        when(moduleAccessService.getCollegeTree(eq(principal), eq(5))).thenReturn(Map.of("nodes", List.of()));
        for (MockHttpServletRequestBuilder request : routes()) {
            mvc.perform(request.with(user("superadmin").roles("SUPER_ADMIN")))
                    .andExpect(status().isOk());
        }
        verify(moduleAccessService).getCollegeTree(principal, 5);
    }
}
