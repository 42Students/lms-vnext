package com._42students.lms.service.impl;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.ContentDataDTO;
import com._42students.lms.dto.request.LessonContentsDTO;
import com._42students.lms.model.Lesson;
import com._42students.lms.repository.LessonRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CanonicalResourceScopeTest {
    @Test
    void notesOnlyResourceRejectsSpoofedCourseWithoutAnUploadedFile() {
        CanonicalResourceLessonContentsServiceImpl service = new CanonicalResourceLessonContentsServiceImpl();
        SecurityContextUtil security = mock(SecurityContextUtil.class);
        LessonRepository lessons = mock(LessonRepository.class);
        AccessControlService access = mock(AccessControlService.class);
        ScopeResolutionService scopes = mock(ScopeResolutionService.class);
        UserPrincipal principal = new UserPrincipal(45, "FACULTY", "TEACHER", 1, 2, 0);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(principal);
        Lesson lesson = mock(Lesson.class);
        when(lesson.getCourseId()).thenReturn(21);
        when(lessons.findById(101)).thenReturn(Optional.of(lesson));
        when(scopes.resolveCourseToCollegeId(21)).thenReturn(2);
        when(scopes.resolveCollegeToOrganizationId(2)).thenReturn(1);
        when(access.canAccessCollege(principal, 2)).thenReturn(true);
        ReflectionTestUtils.setField(service, "securityContextUtil", security);
        ReflectionTestUtils.setField(service, "lessonRepository", lessons);
        ReflectionTestUtils.setField(service, "accessControlService", access);
        ReflectionTestUtils.setField(service, "scopeResolutionService", scopes);

        ContentDataDTO notes = new ContentDataDTO();
        notes.setResourceMaterials(List.of());
        notes.setText("A notes-only Resource must still be scoped");
        LessonContentsDTO dto = new LessonContentsDTO();
        dto.setLessonId(101);
        dto.setCourseId(22); // Actual lesson course is 21, not 22.
        ResponseStatusException mismatch = assertThrows(ResponseStatusException.class,
                () -> ReflectionTestUtils.invokeMethod(service, "validateResource", notes, dto, null));
        assertEquals(HttpStatus.BAD_REQUEST, mismatch.getStatus());

        dto.setCourseId(21);
        assertDoesNotThrow(() -> ReflectionTestUtils.invokeMethod(service, "validateResource", notes, dto, null));
        dto.setCourseId(null); // Server can derive actual course from lesson.
        assertDoesNotThrow(() -> ReflectionTestUtils.invokeMethod(service, "validateResource", notes, dto, null));
    }
}
