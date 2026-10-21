package com._42students.lms.controller;

import com._42students.lms.dto.projects.AdminProjectLearnerAssignDTO;
import com._42students.lms.dto.projects.AdminProjectReadinessOverrideDTO;
import com._42students.lms.dto.projects.AdminProjectTeamsCreateDTO;
import com._42students.lms.dto.projects.AdminProjectTemplateAttachDTO;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.access.AccessControlService;
import com._42students.lms.service.AdminAuditLogService;
import com._42students.lms.service.FeatureFlagService;
import com._42students.lms.service.ProjectWorkspaceService;
import com._42students.lms.service.projects.ProjectTeamService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Projects audit R2-01/R2-02: the five admin writes that take their target college from the request body must honour that
 * college's Projects switch even for a global super-admin, whom the class-level (query-string) feature check cannot scope.
 */
class AdminProjectControllerFeatureGateTest {

    private static final int DISABLED_COLLEGE = 7;

    private ProjectWorkspaceService projectWorkspaceService;
    private ProjectTeamService projectTeamService;
    private AdminProjectController controller;

    @BeforeEach
    void setUp() {
        projectWorkspaceService = mock(ProjectWorkspaceService.class);
        projectTeamService = mock(ProjectTeamService.class);
        AccessControlService accessControlService = mock(AccessControlService.class);
        SecurityContextUtil securityContextUtil = mock(SecurityContextUtil.class);
        FeatureFlagService featureFlagService = mock(FeatureFlagService.class);
        UserPrincipal globalSuperAdmin = new UserPrincipal(1, "FACULTY", "SUPER_ADMIN", null, null, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(globalSuperAdmin);
        doThrow(new AccessDeniedException("FEATURE_DISABLED"))
                .when(featureFlagService).requireEnabledForCollege(anyString(), eq(DISABLED_COLLEGE));

        controller = new AdminProjectController(projectWorkspaceService, accessControlService, securityContextUtil,
                mock(AdminAuditLogService.class), mock(LearnerRepository.class), mock(FacultyRepository.class));
        ReflectionTestUtils.setField(controller, "featureFlagService", featureFlagService);
        ReflectionTestUtils.setField(controller, "projectTeamService", projectTeamService);
    }

    @Test
    @DisplayName("team creation for a college with Projects off is refused before the service runs")
    void teamsRespectTargetCollegeSwitch() {
        AdminProjectTeamsCreateDTO payload = new AdminProjectTeamsCreateDTO();
        payload.setCollegeId(DISABLED_COLLEGE);
        assertEquals(HttpStatus.FORBIDDEN, controller.createTeams(payload).getStatusCode());
        verifyNoInteractions(projectTeamService);
    }

    @Test
    @DisplayName("template attach, learner assignment and readiness override are refused for that college")
    void workspaceWritesRespectTargetCollegeSwitch() {
        AdminProjectTemplateAttachDTO attach = new AdminProjectTemplateAttachDTO();
        attach.setCollegeId(DISABLED_COLLEGE);
        assertEquals(HttpStatus.FORBIDDEN, controller.attachTemplate(attach, "11").getStatusCode());

        AdminProjectLearnerAssignDTO learners = new AdminProjectLearnerAssignDTO();
        learners.setCollegeId(DISABLED_COLLEGE);
        assertEquals(HttpStatus.FORBIDDEN, controller.assignLearners(learners, "11").getStatusCode());

        AdminProjectReadinessOverrideDTO override = new AdminProjectReadinessOverrideDTO();
        override.setCollegeId(DISABLED_COLLEGE);
        override.setOverride(true);
        assertEquals(HttpStatus.FORBIDDEN, controller.overrideReadiness("11", override).getStatusCode());

        verifyNoInteractions(projectWorkspaceService);
    }

    @Test
    @DisplayName("an enabled college still reaches the service")
    void enabledCollegeIsUnaffected() {
        AdminProjectReadinessOverrideDTO override = new AdminProjectReadinessOverrideDTO();
        override.setCollegeId(6);
        override.setOverride(true);
        when(projectWorkspaceService.overrideProjectReadiness(any(), eq("11"), eq(6), eq(true), any())).thenReturn(null);
        assertEquals(HttpStatus.OK, controller.overrideReadiness("11", override).getStatusCode());
    }
}
