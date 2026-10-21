package com._42students.lms.security;

import com._42students.lms.access.ScopeContextFilter;
import com._42students.lms.config.JwtConfig;
import com._42students.lms.configuration.WebSecurityConfig;
import com._42students.lms.controller.RecruiterSelfController;
import com._42students.lms.controller.ModuleAccessController;
import com._42students.lms.model.Recruiter;
import com._42students.lms.model.Learner;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.RecruiterRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.RefreshTokenBlocklistRepository;
import com._42students.lms.service.ModuleAccessService;
import com._42students.lms.service.recruiter.RecruiterAccessService;
import com._42students.lms.service.recruiter.RecruiterAuthService;
import com._42students.lms.service.recruiter.RecruiterDashboardService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Genuinely signed access JWTs (isolated TEST key) through the real WebSecurityConfig,
 * JwtAuthenticationFilter and RecruiterFenceFilter. No real users, sessions or database.
 */
@WebMvcTest(controllers = {RecruiterSelfController.class, ModuleAccessController.class}, excludeFilters = {
        @ComponentScan.Filter(type = FilterType.REGEX,
                pattern = "com\\._42students\\.lms\\.security\\..*"),
        @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {com._42students.lms.controller.ResourceUploadReceiptAdvice.class,
                           com._42students.lms.controller.FacultyResourceUploadReceiptAdvice.class,
                           com._42students.lms.controller.ResourceLessonCourseRequestGuard.class})
})
@Import({WebSecurityConfig.class, JwtAuthenticationFilter.class,
        ScopeContextFilter.class, RecruiterSignedJwtAuthorizationTest.TestJwtConfiguration.class})
@AutoConfigureMockMvc(addFilters = true)
class RecruiterSignedJwtAuthorizationTest {

    @TestConfiguration
    static class TestJwtConfiguration {
        @Bean
        JwtService jwtService() {
            JwtConfig config = new JwtConfig();
            config.setSecret("test-only-hr-fence-signing-key-0123456789abcdef0123456789abcdef");
            config.setIssuer("42lms");
            return new JwtService(config);
        }
    }

    private static final int RECRUITER_ID = 5;
    private static final int NSRIT = 6;

    @Autowired private MockMvc mvc;
    @Autowired private JwtService jwtService;
    @MockBean private FacultyRepository facultyRepository;
    @MockBean private LearnerRepository learnerRepository;
    @MockBean private RefreshTokenBlocklistRepository blocklistRepository;
    @MockBean private ModuleAccessService moduleAccessService;
    @MockBean private SecurityContextUtil securityContextUtil;
    @MockBean private RecruiterAccessService recruiterAccessService;
    @MockBean private RecruiterAuthService recruiterAuthService;
    @MockBean private RecruiterRepository recruiterRepository;
    @MockBean private CollegeRepository collegeRepository;
    @MockBean private RecruiterDashboardService dashboardService;
    @MockBean private com._42students.lms.service.recruiter.RecruiterNotificationService notificationService;
    @MockBean private com._42students.lms.service.recruiter.RecruiterTodayService todayService;
    @MockBean private com._42students.lms.service.recruiter.RecruiterWorkspaceService workspaceService;
    @MockBean private org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate jdbc;

    private Recruiter recruiter;

    @BeforeEach
    void usableRecruiter() {
        recruiter = new Recruiter();
        recruiter.setId(RECRUITER_ID);
        recruiter.setFirstName("Asha");
        recruiter.setContactMobile("9100060092");
        recruiter.setTokenVersion(0);
        recruiter.setIsDeleted(false);
        when(recruiterAccessService.findUsableRecruiter(RECRUITER_ID)).thenReturn(Optional.of(recruiter));
        when(recruiterAccessService.activeGrants(RECRUITER_ID)).thenReturn(List.of());
        Map<String, Object> user = new HashMap<>();
        user.put("id", RECRUITER_ID);
        user.put("userType", "RECRUITER");
        when(recruiterAuthService.authUser(any(), any())).thenReturn(user);
    }

    private String token(UserPrincipal principal) {
        return jwtService.generateTokens(principal).getAccessToken();
    }

    private String recruiterGlobalToken() {
        return token(new UserPrincipal(RECRUITER_ID, "RECRUITER", null, null, null, 0));
    }

    private void principalIs(UserPrincipal principal) {
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
    }

    @Test
    void recruiterReachesItsOwnApi() throws Exception {
        principalIs(new UserPrincipal(RECRUITER_ID, "RECRUITER", null, null, null, 0));
        mvc.perform(get("/api/v1/recruiter/me").header("Authorization", "Bearer " + recruiterGlobalToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scope").value("GLOBAL"));
    }

    @Test
    void recruiterIsFencedOffEverythingElseBeforeAnyControllerRuns() throws Exception {
        String token = recruiterGlobalToken();
        for (String path : List.of("/api/v1/admin/module-access/tree", "/api/v1/courses/1",
                "/api/v1/learner/getAll", "/api/v1/superadmin/recruiters", "/api/v1/auth/revoke-sessions",
                "/users/login", "/api/v2/courses/search")) {
            mvc.perform(get(path).header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.error").value("RECRUITER_ACCESS_DENIED"));
        }
        verifyNoInteractions(moduleAccessService);
    }

    @Test
    void theFenceIsWhatBlocksUnmappedPathsNotAMissingRoute() throws Exception {
        Learner learner = new Learner();
        learner.setId(33);
        learner.setTokenVersion(0);
        learner.setIsDeleted(false);
        when(learnerRepository.findById(33)).thenReturn(Optional.of(learner));
        String learnerToken = token(new UserPrincipal(33, "LEARNER", null, 7, NSRIT, 0));
        // Same unmapped path: a learner gets 404 (no such route), a recruiter gets 403 (fence).
        mvc.perform(get("/api/v1/courses/1").header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/courses/1").header("Authorization", "Bearer " + recruiterGlobalToken()))
                .andExpect(status().isForbidden());
    }

    @Test
    void nonRecruiterAccountsCannotCallTheRecruiterApi() throws Exception {
        Learner learner = new Learner();
        learner.setId(RECRUITER_ID);
        learner.setTokenVersion(0);
        learner.setIsDeleted(false);
        when(learnerRepository.findById(RECRUITER_ID)).thenReturn(Optional.of(learner));
        String learnerToken = token(new UserPrincipal(RECRUITER_ID, "LEARNER", null, 7, NSRIT, 0));
        mvc.perform(get("/api/v1/recruiter/me").header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void suspendedOrDeletedRecruiterIsRejected() throws Exception {
        when(recruiterAccessService.findUsableRecruiter(RECRUITER_ID)).thenReturn(Optional.empty());
        mvc.perform(get("/api/v1/recruiter/me").header("Authorization", "Bearer " + recruiterGlobalToken()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void recruiterTokenIsNeverValidatedAgainstLearnerOrFacultyRowsWithTheSameId() throws Exception {
        // recruiter id 5 does not exist; learner id 5 and faculty id 5 do. The recruiter token must still fail.
        when(recruiterAccessService.findUsableRecruiter(RECRUITER_ID)).thenReturn(Optional.empty());
        Learner learner = new Learner();
        learner.setId(RECRUITER_ID);
        learner.setTokenVersion(0);
        learner.setIsDeleted(false);
        when(learnerRepository.findById(RECRUITER_ID)).thenReturn(Optional.of(learner));
        mvc.perform(get("/api/v1/recruiter/me").header("Authorization", "Bearer " + recruiterGlobalToken()))
                .andExpect(status().isUnauthorized());
        verify(facultyRepository, never()).findById(anyInt());
    }

    @Test
    void revokedCollegeGrantInvalidatesACollegeScopedToken() throws Exception {
        when(recruiterAccessService.hasActiveGrant(RECRUITER_ID, NSRIT)).thenReturn(false);
        String collegeToken = token(new UserPrincipal(RECRUITER_ID, "RECRUITER", null, 7, NSRIT, 0));
        mvc.perform(get("/api/v1/recruiter/me").header("Authorization", "Bearer " + collegeToken))
                .andExpect(status().isUnauthorized());

        when(recruiterAccessService.hasActiveGrant(RECRUITER_ID, NSRIT)).thenReturn(true);
        principalIs(new UserPrincipal(RECRUITER_ID, "RECRUITER", null, 7, NSRIT, 0));
        mvc.perform(get("/api/v1/recruiter/me").header("Authorization", "Bearer " + collegeToken))
                .andExpect(status().isOk());
    }

    @Test
    void unknownUserTypeIsRejectedInsteadOfBecomingALearner() throws Exception {
        Learner learner = new Learner();
        learner.setId(33);
        learner.setTokenVersion(0);
        learner.setIsDeleted(false);
        when(learnerRepository.findById(33)).thenReturn(Optional.of(learner));
        String robot = token(new UserPrincipal(33, "ROBOT", null, 7, NSRIT, 0));
        mvc.perform(get("/api/v1/admin/module-access/tree").header("Authorization", "Bearer " + robot))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/recruiter/me").header("Authorization", "Bearer " + robot))
                .andExpect(status().isUnauthorized());
    }
}
