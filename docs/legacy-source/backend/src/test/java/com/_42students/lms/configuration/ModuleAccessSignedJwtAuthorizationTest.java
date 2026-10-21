package com._42students.lms.configuration;

import com._42students.lms.access.ScopeContextFilter;
import com._42students.lms.config.JwtConfig;
import com._42students.lms.controller.ModuleAccessController;
import com._42students.lms.enums.FacultyType;
import com._42students.lms.model.Faculty;
import com._42students.lms.model.Learner;
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
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Unlike SecurityMockMvcRequestPostProcessors.user(), these requests carry genuinely signed
 * access JWTs generated with an isolated TEST key and validated by the real JwtService and
 * JwtAuthenticationFilter. No real user credentials, live sessions, or production DB are used.
 * This tests entry-point authorization; scoped service persistence needs separate DB tests.
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
@Import({WebSecurityConfig.class, JwtAuthenticationFilter.class,
        ScopeContextFilter.class, ModuleAccessSignedJwtAuthorizationTest.TestJwtConfiguration.class})
@AutoConfigureMockMvc(addFilters = true)
class ModuleAccessSignedJwtAuthorizationTest {

    @TestConfiguration
    static class TestJwtConfiguration {
        @Bean
        JwtService jwtService() {
            JwtConfig config = new JwtConfig();
            config.setSecret("test-only-module-access-signing-key-0123456789abcdef0123456789abcdef");
            config.setIssuer("42lms");
            return new JwtService(config);
        }
    }

    @Autowired private MockMvc mvc;
    @Autowired private JwtService jwtService;
    @MockBean private FacultyRepository facultyRepository;
    @MockBean private LearnerRepository learnerRepository;
    @MockBean private RefreshTokenBlocklistRepository blocklistRepository;
    @MockBean private ModuleAccessService moduleAccessService;
    @MockBean private SecurityContextUtil securityContextUtil;

    private List<MockHttpServletRequestBuilder> managementRoutes() {
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

    private String accessToken(UserPrincipal principal) {
        return jwtService.generateTokens(principal).getAccessToken();
    }

    private Faculty activeFaculty(FacultyType facultyType) {
        Faculty faculty = new Faculty();
        faculty.setId(17);
        faculty.setUserType("FACULTY");
        faculty.setFacultyType(facultyType);
        faculty.setTokenVersion(0);
        faculty.setIsDeleted(false);
        when(facultyRepository.findById(17)).thenReturn(Optional.of(faculty));
        return faculty;
    }

    @Test
    void validSignedCollegeAdminFacultyAndMentorTokensCannotAccessAnyManagementRoute() throws Exception {
        for (String facultyType : List.of("ADMIN", "LECTURER", "MENTOR")) {
            activeFaculty(FacultyType.valueOf(facultyType));
            String token = accessToken(new UserPrincipal(17, "FACULTY", facultyType, 7, 5, 0));
            for (MockHttpServletRequestBuilder route : managementRoutes()) {
                mvc.perform(route.header("Authorization", "Bearer " + token))
                        .andExpect(status().isForbidden());
            }
        }
        verifyNoInteractions(moduleAccessService);
    }

    @Test
    void validSignedLearnerTokenCannotAccessAnyManagementRoute() throws Exception {
        Learner learner = new Learner();
        learner.setId(33);
        learner.setTokenVersion(0);
        learner.setIsDeleted(false);
        when(learnerRepository.findById(33)).thenReturn(Optional.of(learner));
        String token = accessToken(new UserPrincipal(33, "LEARNER", null, 7, 5, 0));
        for (MockHttpServletRequestBuilder route : managementRoutes()) {
            mvc.perform(route.header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());
        }
        verifyNoInteractions(moduleAccessService);
    }

    @Test
    void revokedTokenIsRejectedBeforeControllerRuns() throws Exception {
        activeFaculty(FacultyType.ADMIN);
        String token = accessToken(new UserPrincipal(17, "FACULTY", "ADMIN", 7, 5, 0));
        when(blocklistRepository.existsByJti(anyString())).thenReturn(true);
        mvc.perform(get("/api/v1/admin/module-access/tree").param("collegeId", "5")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(moduleAccessService);
    }

    @Test
    void suspendedFacultyAndVersionInvalidatedTokensAreRejectedBeforeControllerRuns() throws Exception {
        Faculty faculty = activeFaculty(FacultyType.ADMIN);
        String token = accessToken(new UserPrincipal(17, "FACULTY", "ADMIN", 7, 5, 0));
        faculty.setIsDeleted(true);
        mvc.perform(get("/api/v1/admin/module-access/tree").param("collegeId", "5")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
        faculty.setIsDeleted(false);
        faculty.setTokenVersion(1);
        mvc.perform(get("/api/v1/admin/module-access/tree").param("collegeId", "5")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(moduleAccessService);
    }
}
