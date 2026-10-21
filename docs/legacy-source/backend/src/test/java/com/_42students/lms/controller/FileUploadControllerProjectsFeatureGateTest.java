package com._42students.lms.controller;

import com._42students.lms.dto.request.PresignUploadRequestDTO;
import com._42students.lms.model.ProjectMember;
import com._42students.lms.model.ProjectWorkspace;
import com._42students.lms.repository.ProjectMemberRepository;
import com._42students.lms.repository.ProjectWorkspaceRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.FeatureFlagService;
import com._42students.lms.util.SecurityContextUtil;
import com._42students.lms.utils.R2StorageUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import javax.servlet.http.HttpServletRequest;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.ArgumentMatchers.same;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/** Projects upload gate: preserve core Course assignment uploads in their shared folder. */
class FileUploadControllerProjectsFeatureGateTest {
    private FileUploadController controller;
    private FeatureFlagService flags;
    private R2StorageUtils storage;
    private UserPrincipal learner;

    @BeforeEach
    void setUp() {
        controller = new FileUploadController();
        flags = mock(FeatureFlagService.class);
        storage = mock(R2StorageUtils.class);
        SecurityContextUtil security = mock(SecurityContextUtil.class);
        ProjectWorkspaceRepository projects = mock(ProjectWorkspaceRepository.class);
        ProjectMemberRepository members = mock(ProjectMemberRepository.class);
        learner = new UserPrincipal(42, "LEARNER", null, 1, 6, 0);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(learner);
        when(storage.generatePresignedPutUrl(anyString(), anyString(), anyInt()))
                .thenReturn("https://example.com/upload");
        when(storage.getPublicUrl(anyString())).thenReturn("https://example.com/file.pdf");

        ProjectWorkspace project = new ProjectWorkspace();
        project.setId(12);
        project.setCollegeId(6);
        ProjectMember member = new ProjectMember();
        member.setIsDeleted(false);
        member.setMemberStatus("ACTIVE");
        when(projects.findActiveById(12)).thenReturn(Optional.of(project));
        when(members.findByProjectAndUserAndType(12, 42, "LEARNER"))
                .thenReturn(Optional.of(member));
        ReflectionTestUtils.setField(controller, "securityContextUtil", security);
        ReflectionTestUtils.setField(controller, "r2Storage", storage);
        ReflectionTestUtils.setField(controller, "featureFlagService", flags);
        ReflectionTestUtils.setField(controller, "projectWorkspaceRepository", projects);
        ReflectionTestUtils.setField(controller, "projectMemberRepository", members);
        ReflectionTestUtils.setField(controller, "maxGenericSizeBytes", 10L * 1024 * 1024);
    }

    private PresignUploadRequestDTO request(String projectId) {
        PresignUploadRequestDTO body = new PresignUploadRequestDTO();
        body.setFileName("file.pdf");
        body.setContentType("application/pdf");
        body.setContentLength(1024L);
        body.setFolder("assignments");
        body.setType("generic");
        body.setProjectId(projectId);
        return body;
    }

    @Test
    void disabledTargetCollegeDoesNotMintProjectUploadUrl() {
        doThrow(new AccessDeniedException("FEATURE_DISABLED"))
                .when(flags).requireEnabledForCollege("module.projects.enabled", 6);
        assertThrows(AccessDeniedException.class,
                () -> controller.presign(mock(HttpServletRequest.class), request("12")));
        verify(storage, never()).generatePresignedPutUrl(anyString(), anyString(), anyInt());
    }

    @Test
    void disabledLearnerOverrideDoesNotMintProjectUploadUrl() {
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "FEATURE_DISABLED"))
                .when(flags).requireEnabled(eq("module.projects.enabled"), same(learner), isNull());
        assertThrows(ResponseStatusException.class,
                () -> controller.presign(mock(HttpServletRequest.class), request("12")));
        verify(flags).requireEnabledForCollege("module.projects.enabled", 6);
        verify(storage, never()).generatePresignedPutUrl(anyString(), anyString(), anyInt());
    }

    @Test
    void enabledProjectKeepsExistingMembershipBasedUploadFlow() {
        ResponseEntity<?> result = controller.presign(mock(HttpServletRequest.class), request("12"));
        assertEquals(200, result.getStatusCodeValue());
        verify(flags).requireEnabledForCollege("module.projects.enabled", 6);
        verify(flags).requireEnabled("module.projects.enabled", learner, null);
        verify(storage).generatePresignedPutUrl(anyString(), eq("application/pdf"), anyInt());
    }

    @Test
    void coreCourseAssignmentFolderWithoutProjectIdNeverConsultsProjectsFlag() {
        ResponseEntity<?> result = controller.presign(mock(HttpServletRequest.class), request(null));
        assertEquals(200, result.getStatusCodeValue());
        verifyNoInteractions(flags);
        verify(storage).generatePresignedPutUrl(anyString(), eq("application/pdf"), anyInt());
    }
}
