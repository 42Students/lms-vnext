package com._42students.lms.service.impl;

import com._42students.lms.dto.request.LessonDTO;
import com._42students.lms.model.Course;
import com._42students.lms.model.Lesson;
import com._42students.lms.repository.LessonContentsRepository;
import com._42students.lms.repository.LessonRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.CourseService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** BE-0148 (a reorder names every live lesson once) and BE-0149 (a moved lesson's name is checked in the destination). */
class LessonOrderAndMoveRulesTest {

    private LessonServiceImpl service;
    private LessonRepository lessons;

    private static Lesson lesson(int id, int course, String name) {
        Lesson l = new Lesson();
        l.setId(id);
        l.setCourseId(course);
        l.setLessonName(name);
        return l;
    }

    @BeforeEach
    void setup() {
        service = new LessonServiceImpl();
        lessons = mock(LessonRepository.class);
        SecurityContextUtil security = mock(SecurityContextUtil.class);
        service.lessonRepository = lessons;
        service.lessonContentsRepository = mock(LessonContentsRepository.class);
        service.securityContextUtil = security;
        CourseService courseService = mock(CourseService.class);
        when(courseService.fetchCourse(anyInt())).thenReturn(new Course());
        service.courseService = courseService;
        when(security.getAuthenticatedUserPrincipal()).thenReturn(new UserPrincipal(77, "FACULTY", "ADMIN", 3, 9, 0));
    }

    @Test
    void aPartialReorderIsRefused() {
        when(lessons.findAllById(List.of(2, 1))).thenReturn(List.of(lesson(2, 5, "B"), lesson(1, 5, "A")));
        when(lessons.getLessons(5)).thenReturn(List.of(lesson(1, 5, "A"), lesson(2, 5, "B"), lesson(3, 5, "C")));
        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> service.reorderLessons(5, List.of(2, 1)));
        assertEquals(HttpStatus.CONFLICT, e.getStatus());
        verify(lessons, never()).saveAll(any());
    }

    @Test
    void aCompleteReorderIsSaved() {
        when(lessons.findAllById(List.of(2, 1))).thenReturn(List.of(lesson(2, 5, "B"), lesson(1, 5, "A")));
        when(lessons.getLessons(5)).thenReturn(List.of(lesson(1, 5, "A"), lesson(2, 5, "B")));
        assertEquals(2, service.reorderLessons(5, List.of(2, 1)));
    }

    @Test
    void movingChecksTheNameInTheDestinationCourse() {
        when(lessons.findById(10)).thenReturn(Optional.of(lesson(10, 5, "Intro")));
        when(lessons.existsByCourseIdAndLessonName(6, "Intro")).thenReturn(1); // the other course has one
        LessonDTO dto = new LessonDTO();
        dto.setCourseId(6);
        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> service.updateLesson(10, dto));
        assertEquals(HttpStatus.CONFLICT, e.getStatus());
        verify(lessons, never()).existsByCourseIdAndLessonName(eq(5), anyString());
    }
}
