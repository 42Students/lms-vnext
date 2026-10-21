package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.ContentDataDTO;
import com._42students.lms.dto.request.FileDTO;
import com._42students.lms.dto.request.ResourceMaterialDTO;
import com._42students.lms.model.Lesson;
import com._42students.lms.model.LessonContents;
import com._42students.lms.repository.LessonContentsRepository;
import com._42students.lms.repository.LessonRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import com._42students.lms.utils.ContentUrlValidator;
import com._42students.lms.utils.R2StorageUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ResourceFileControllerTest {
    private ResourceFileController controller;
    private LessonContentsRepository contents;
    private LessonRepository lessons;
    private AccessControlService access;
    private ScopeResolutionService scope;
    private R2StorageUtils storage;
    private UserPrincipal principal;
    private LessonContents resource;

    @BeforeEach
    void setup() {
        controller = new ResourceFileController();
        contents = mock(LessonContentsRepository.class);
        lessons = mock(LessonRepository.class);
        access = mock(AccessControlService.class);
        scope = mock(ScopeResolutionService.class);
        storage = mock(R2StorageUtils.class);
        SecurityContextUtil security = mock(SecurityContextUtil.class);
        ContentUrlValidator validator = mock(ContentUrlValidator.class);
        principal = new UserPrincipal(12, "LEARNER", null, 2, 3, 0);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(principal);
        when(scope.resolveCourseToCollegeId(7)).thenReturn(3);
        when(scope.resolveCollegeToOrganizationId(3)).thenReturn(2);
        when(scope.resolveClassToCollegeId(9)).thenReturn(3);
        resource = new LessonContents();
        resource.setId(45);
        resource.setLessonId(6);
        resource.setCourseId(7);
        resource.setClassId(9);
        resource.setActive(true);
        resource.setEnabled(true);
        resource.setContentType("resource");
        Lesson lesson = new Lesson();
        lesson.setCourseId(7);
        when(contents.findById(45)).thenReturn(Optional.of(resource));
        when(lessons.fetchCourseId(6)).thenReturn(lesson);
        FileDTO file = new FileDTO();
        file.setCloudStorageObject("org-2/college-3/lesson-content/course-7/user-12/a.pdf");
        ResourceMaterialDTO material = new ResourceMaterialDTO();
        material.setKind("FILE");
        material.setFileDTO(file);
        ContentDataDTO data = new ContentDataDTO();
        data.setResourceMaterials(List.of(material));
        resource.setContentDataDTO(data);
        when(validator.resolveStorageKeyFromValue(file.getCloudStorageObject())).thenReturn(file.getCloudStorageObject());
        when(storage.generatePresignedGetUrl(file.getCloudStorageObject(), 15))
                .thenReturn("https://r2.example.invalid/signed?expires=15");
        ReflectionTestUtils.setField(controller, "lessonContentsRepository", contents);
        ReflectionTestUtils.setField(controller, "lessonRepository", lessons);
        ReflectionTestUtils.setField(controller, "accessControlService", access);
        ReflectionTestUtils.setField(controller, "scopeResolutionService", scope);
        ReflectionTestUtils.setField(controller, "securityContextUtil", security);
        ReflectionTestUtils.setField(controller, "contentUrlValidator", validator);
        ReflectionTestUtils.setField(controller, "r2StorageUtils", storage);
    }

    @Test
    void signsExactMaterialAfterCheckingCourseAndClass() {
        assertEquals("https://r2.example.invalid/signed?expires=15",
                controller.getMaterialUrl(45, 0).getBody().getData().get("url"));
        verify(access).requireAccessCourse(principal, 7);
        verify(access).requireAccessClass(principal, 9);
        verify(storage).generatePresignedGetUrl("org-2/college-3/lesson-content/course-7/user-12/a.pdf", 15);
    }

    @Test
    void refusesMaterialFromDifferentTenantEvenIfCourseIsAccessible() {
        FileDTO foreign = new FileDTO();
        foreign.setCloudStorageObject("org-2/college-4/lesson-content/foreign.pdf");
        resource.getContentDataDTO().getResourceMaterials().get(0).setFileDTO(foreign);
        ContentUrlValidator validator = (ContentUrlValidator) ReflectionTestUtils.getField(controller, "contentUrlValidator");
        when(validator.resolveStorageKeyFromValue(foreign.getCloudStorageObject())).thenReturn(foreign.getCloudStorageObject());
        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> controller.getMaterialUrl(45, 0));
        assertEquals(HttpStatus.FORBIDDEN, error.getStatus());
        verifyNoInteractions(storage);
    }

    @Test
    void refusesAFileFromAnUnrelatedClass() {
        when(scope.resolveClassToCollegeId(9)).thenReturn(8);
        assertEquals(HttpStatus.FORBIDDEN,
                assertThrows(ResponseStatusException.class, () -> controller.getMaterialUrl(45, 0)).getStatus());
        verifyNoInteractions(storage);
    }

    @Test
    void refusesLinkIndexOrDeletedContent() {
        ResourceMaterialDTO link = new ResourceMaterialDTO();
        link.setKind("LINK");
        link.setUrl("https://example.org");
        resource.getContentDataDTO().setResourceMaterials(List.of(link));
        assertEquals(HttpStatus.NOT_FOUND,
                assertThrows(ResponseStatusException.class, () -> controller.getMaterialUrl(45, 0)).getStatus());
        resource.setIsDeleted(true);
        assertEquals(HttpStatus.NOT_FOUND,
                assertThrows(ResponseStatusException.class, () -> controller.getMaterialUrl(45, 0)).getStatus());
        verifyNoInteractions(storage);
    }
}
