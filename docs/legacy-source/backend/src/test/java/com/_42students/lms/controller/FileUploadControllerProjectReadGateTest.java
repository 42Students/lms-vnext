package com._42students.lms.controller;

import com._42students.lms.model.ProjectMember;
import com._42students.lms.model.ProjectWorkspace;
import com._42students.lms.repository.ProjectMemberRepository;
import com._42students.lms.repository.ProjectWorkspaceRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.FeatureFlagService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Project file authorization is shared by download, get, stream and delete paths. */
class FileUploadControllerProjectReadGateTest {
    private FileUploadController controller;
    private FeatureFlagService features;
    private UserPrincipal learner;
    private ProjectWorkspaceRepository projects;
    private ProjectMemberRepository members;
    private static final String PROJECT_FILE = "college-6/assignments/project-12/file.pdf";
    private static final String COURSE_FILE = "college-6/assignments/course-file.pdf";

    @BeforeEach
    void setUp() {
        controller = new FileUploadController();
        features = mock(FeatureFlagService.class);
        projects = mock(ProjectWorkspaceRepository.class);
        members = mock(ProjectMemberRepository.class);
        learner = new UserPrincipal(42, "LEARNER", null, 1, 6, 0);
        ProjectWorkspace project = new ProjectWorkspace();
        project.setId(12);
        project.setCollegeId(6);
        when(projects.findActiveById(12)).thenReturn(Optional.of(project));
        ProjectMember member = new ProjectMember();
        member.setIsDeleted(false);
        member.setMemberStatus("ACTIVE");
        when(members.findByProjectAndUserAndType(12, 42, "LEARNER"))
                .thenReturn(Optional.of(member));
        ReflectionTestUtils.setField(controller, "featureFlagService", features);
        ReflectionTestUtils.setField(controller, "projectWorkspaceRepository", projects);
        ReflectionTestUtils.setField(controller, "projectMemberRepository", members);
    }

    private void check(String key) {
        ReflectionTestUtils.invokeMethod(controller, "enforceKeyAccess", learner, "college-6",
                key, null, null, null);
    }

    @Test
    void disabledTargetCollegeBlocksPreviouslyUploadedProjectFile() {
        doThrow(new AccessDeniedException("FEATURE_DISABLED"))
                .when(features).requireEnabledForCollege("module.projects.enabled", 6);
        assertThrows(AccessDeniedException.class, () -> check(PROJECT_FILE));
        verify(features, never()).requireEnabled(eq("module.projects.enabled"), any(), any());
    }

    @Test
    void disabledLearnerOverrideBlocksProjectFileDespiteActiveMembership() {
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "FEATURE_DISABLED"))
                .when(features).requireEnabled(eq("module.projects.enabled"), same(learner), isNull());
        assertThrows(ResponseStatusException.class, () -> check(PROJECT_FILE));
        verify(features).requireEnabledForCollege("module.projects.enabled", 6);
    }

    @Test
    void enabledProjectPreservesMemberFileAccess() {
        assertDoesNotThrow(() -> check(PROJECT_FILE));
        verify(features).requireEnabledForCollege("module.projects.enabled", 6);
        verify(features).requireEnabled("module.projects.enabled", learner, null);
    }

    @Test
    void ordinaryCourseAssignmentFileDoesNotConsultProjects() {
        assertDoesNotThrow(() -> check(COURSE_FILE));
        verifyNoInteractions(features);
    }
}
