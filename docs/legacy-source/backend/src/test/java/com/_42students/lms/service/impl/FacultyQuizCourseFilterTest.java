package com._42students.lms.service.impl;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.response.QuizResponseDTO;
import com._42students.lms.model.Quiz;
import com._42students.lms.repository.CourseRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.LessonRepository;
import com._42students.lms.repository.QuizAnswerRepository;
import com._42students.lms.repository.QuizAttemptRepository;
import com._42students.lms.repository.QuizOptionRepository;
import com._42students.lms.repository.QuizQuestionRepository;
import com._42students.lms.repository.QuizRepository;
import com._42students.lms.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** Non-paginated GET /quizzes must honor courseId just like its paginated sibling. */
class FacultyQuizCourseFilterTest {
    private QuizRepository quizzes;
    private QuizServiceImpl service;
    private UserPrincipal faculty;

    @BeforeEach
    void setUp() {
        quizzes = mock(QuizRepository.class);
        service = new QuizServiceImpl(
                quizzes,
                mock(QuizQuestionRepository.class),
                mock(QuizOptionRepository.class),
                mock(QuizAttemptRepository.class),
                mock(QuizAnswerRepository.class),
                mock(LessonRepository.class),
                mock(CourseRepository.class),
                mock(LearnerRepository.class),
                mock(AccessControlService.class));
        faculty = new UserPrincipal(42, "FACULTY", "FACULTY", 3, 7, 0);
        Quiz first = quiz(11, 101);
        Quiz second = quiz(12, 202);
        when(quizzes.findManageableByFacultyId(42)).thenReturn(List.of(first, second));
    }

    private static Quiz quiz(int id, int courseId) {
        Quiz quiz = mock(Quiz.class);
        when(quiz.getId()).thenReturn(id);
        when(quiz.getCourseId()).thenReturn(courseId);
        return quiz;
    }

    private List<Integer> courseIds(Integer courseId) {
        return service.listQuizzes(courseId, null, null, faculty).stream()
                .map(QuizResponseDTO::getCourseId)
                .collect(Collectors.toList());
    }

    @Test
    void facultyCourseFilterDoesNotReturnQuizzesFromAnotherCourse() {
        assertEquals(List.of(101), courseIds(101));
        assertEquals(List.of(202), courseIds(202));
    }

    @Test
    void facultyUnfilteredListStillReturnsAllManageableQuizzes() {
        assertEquals(List.of(101, 202), courseIds(null));
    }
}
