package com._42students.lms.controller;

import com._42students.lms.dto.response.LessonResponseDTO;
import com._42students.lms.model.Lesson;
import com._42students.lms.security.UserPrincipal;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LessonVisibilityTest {

    private static LessonResponseDTO lesson(int id, boolean active, boolean enabled) {
        Lesson l = new Lesson();
        l.setId(id);
        l.setActive(active);
        l.setEnabled(enabled);
        LessonResponseDTO dto = new LessonResponseDTO();
        dto.setLesson(l);
        return dto;
    }

    private final List<LessonResponseDTO> lessons = List.of(lesson(1, true, true), lesson(2, false, true), lesson(3, true, false));

    @Test
    void studentsDoNotSeeSwitchedOffLessons() {
        UserPrincipal learner = mock(UserPrincipal.class);
        when(learner.isLearner()).thenReturn(true);
        List<LessonResponseDTO> visible = LessonController.visibleTo(learner, lessons);
        assertEquals(1, visible.size());
        assertEquals(1, visible.get(0).getLesson().getId());
    }

    @Test
    void staffStillSeeEveryLessonToEditIt() {
        UserPrincipal faculty = mock(UserPrincipal.class);
        when(faculty.isLearner()).thenReturn(false);
        assertEquals(3, LessonController.visibleTo(faculty, lessons).size());
    }
}
