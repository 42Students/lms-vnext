package com._42students.lms.controller;

import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.LessonContentsDTO;
import com._42students.lms.model.Lesson;
import com._42students.lms.repository.LessonRepository;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ResourceLessonCourseRequestGuardTest {
    @Test
    void bindsNotesOnlyResourcesToTheActualLessonCourse() {
        ResourceLessonCourseRequestGuard guard = new ResourceLessonCourseRequestGuard();
        LessonRepository lessons = mock(LessonRepository.class);
        ScopeResolutionService scopes = mock(ScopeResolutionService.class);
        Lesson lesson = mock(Lesson.class);
        when(lesson.getCourseId()).thenReturn(21);
        when(lessons.findById(100)).thenReturn(Optional.of(lesson));
        when(scopes.resolveClassToCollegeId(9)).thenReturn(2);
        when(scopes.resolveCourseToCollegeId(21)).thenReturn(2);
        ReflectionTestUtils.setField(guard, "lessonRepository", lessons);
        ReflectionTestUtils.setField(guard, "scopeResolutionService", scopes);

        LessonContentsDTO dto = new LessonContentsDTO();
        dto.setLessonId(100);
        dto.setClassId(9);
        dto.setCourseId(22);
        ResponseStatusException wrongCourse = assertThrows(ResponseStatusException.class, () -> guard.validateCreate(dto));
        assertEquals(HttpStatus.BAD_REQUEST, wrongCourse.getStatus());
        dto.setCourseId(null);
        assertDoesNotThrow(() -> guard.validateCreate(dto));
        assertEquals(21, dto.getCourseId());
        when(scopes.resolveClassToCollegeId(9)).thenReturn(3);
        assertEquals(HttpStatus.BAD_REQUEST,
                assertThrows(ResponseStatusException.class, () -> guard.validateCreate(dto)).getStatus());
    }

    @Test
    void doesNotCreateResourcesForUnknownLessons() {
        ResourceLessonCourseRequestGuard guard = new ResourceLessonCourseRequestGuard();
        LessonRepository lessons = mock(LessonRepository.class);
        when(lessons.findById(100)).thenReturn(Optional.empty());
        ReflectionTestUtils.setField(guard, "lessonRepository", lessons);
        LessonContentsDTO dto = new LessonContentsDTO();
        dto.setLessonId(100);
        assertEquals(HttpStatus.NOT_FOUND,
                assertThrows(ResponseStatusException.class, () -> guard.validateCreate(dto)).getStatus());
    }
}
