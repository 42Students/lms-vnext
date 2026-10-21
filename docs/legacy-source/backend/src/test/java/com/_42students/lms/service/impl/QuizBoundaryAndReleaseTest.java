package com._42students.lms.service.impl;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.request.QuizSubmitRequestDTO;
import com._42students.lms.dto.request.QuizUpsertRequestDTO;
import com._42students.lms.dto.response.QuizAttemptResponseDTO;
import com._42students.lms.dto.response.QuizResponseDTO;
import com._42students.lms.model.Lesson;
import com._42students.lms.model.Quiz;
import com._42students.lms.model.QuizAnswer;
import com._42students.lms.model.QuizAttempt;
import com._42students.lms.model.QuizOption;
import com._42students.lms.model.QuizQuestion;
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
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

/** Direct-ID access and result-release boundaries, distinct from list SQL tests. */
class QuizBoundaryAndReleaseTest {
    private QuizServiceImpl service;
    private QuizRepository quizzes;
    private QuizAttemptRepository attempts;
    private QuizQuestionRepository questions;
    private QuizOptionRepository options;
    private QuizAnswerRepository answers;
    private LearnerRepository learners;
    private AccessControlService access;
    private LessonRepository lessonRepository;
    private UserPrincipal learner;

    @BeforeEach
    void setup() {
        quizzes = mock(QuizRepository.class);
        attempts = mock(QuizAttemptRepository.class);
        questions = mock(QuizQuestionRepository.class);
        options = mock(QuizOptionRepository.class);
        answers = mock(QuizAnswerRepository.class);
        learners = mock(LearnerRepository.class);
        access = mock(AccessControlService.class);
        lessonRepository = mock(LessonRepository.class);
        service = new QuizServiceImpl(quizzes, questions, options, attempts, answers,
                lessonRepository, mock(CourseRepository.class), learners, access);
        learner = new UserPrincipal(42, "LEARNER", null, 1, 6, 0);
        when(questions.findByQuizIdAndIsDeletedFalseOrderBySequenceAscIdAsc(anyInt()))
                .thenReturn(List.of());
    }

    private Quiz quiz(Integer classId, int maxAttempts, boolean published) {
        Quiz quiz = new Quiz();
        quiz.setId(9);
        quiz.setCourseId(801);
        quiz.setClassId(classId);
        quiz.setStatus(published ? "PUBLISHED" : "DRAFT");
        quiz.setActive(true);
        quiz.setEnabled(true);
        quiz.setMaxAttempts(maxAttempts);
        quiz.setGradePublished(false);
        when(quizzes.findById(9)).thenReturn(Optional.of(quiz));
        when(quizzes.lockById(9)).thenReturn(Optional.of(quiz));
        return quiz;
    }

    @Test
    void classScopedQuizCreateRequiresCurrentCourseAudienceBeforePersistence() {
        Lesson lesson = new Lesson();
        lesson.setCourseId(801);
        when(lessonRepository.findById(4)).thenReturn(Optional.of(lesson));

        QuizUpsertRequestDTO request = new QuizUpsertRequestDTO();
        request.setLessonId(4);
        request.setCourseId(801);
        request.setClassId(41);
        request.setTitle("Current audience only");

        UserPrincipal admin = new UserPrincipal(10, "FACULTY", "ADMIN", 1, 6, 0);
        doThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "not current"))
                .when(access).requireCurrentCourseAudienceClass(41, 801);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.createQuiz(request, admin));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verify(quizzes, never()).save(any());
    }

    @Test
    void classScopedQuizRequiresItsCourseBeforeAnyQuestionIsLoaded() {
        quiz(41, 1, true);
        doThrow(new AccessDeniedException("course is not entitled"))
                .when(access).requireAccessCourse(learner, 801);
        assertThrows(AccessDeniedException.class, () -> service.getQuiz(9, learner, false));
        verify(access, never()).requireAccessClass(any(), anyInt());
        verifyNoInteractions(options);
    }

    @Test
    void classScopedQuizRequiresBothBoundariesAndCanBeReadWhenAuthorized() {
        quiz(41, 1, true);
        QuizResponseDTO result = service.getQuiz(9, learner, false);
        assertEquals(9, result.getId());
        verify(access).requireAccessCourse(learner, 801);
        verify(access).requireAccessClass(learner, 41);
    }

    @Test
    void classDenialBlocksDirectQuizDetailAfterCourseAccess() {
        quiz(41, 1, true);
        doThrow(new AccessDeniedException("class is not entitled"))
                .when(access).requireAccessClass(learner, 41);
        assertThrows(AccessDeniedException.class, () -> service.getQuiz(9, learner, false));
        verify(access).requireAccessCourse(learner, 801);
        verifyNoInteractions(options);
    }

    @Test
    void sharedQuizStillRequiresCourse() {
        quiz(null, 1, true);
        service.getQuiz(9, learner, false);
        verify(access).requireAccessCourse(learner, 801);
        verify(access, never()).requireAccessClass(any(), anyInt());
    }

    @Test
    void unpublishedQuizDetailIsNotDiscoverableByLearner() {
        quiz(null, 1, false);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.getQuiz(9, learner, true));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        verify(options, never()).findByQuestionIdInAndIsDeletedFalseOrderBySequenceAscIdAsc(anyList());
    }

    @Test
    void unpublishedQuizAttemptRouteIsNotDiscoverableByLearner() {
        quiz(41, 1, false);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.getQuiz(9, learner, false));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
    }

    @Test
    void unpublishedQuizCannotBeSubmittedEvenWithAuthorizedScopes() {
        quiz(null, 1, false);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.submitQuiz(9, new QuizSubmitRequestDTO(), learner));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verify(attempts, never()).save(any());
    }

    @Test
    void crossCourseDenialBlocksSubmittingClassScopedQuiz() {
        quiz(41, 1, true);
        doThrow(new AccessDeniedException("course is not entitled"))
                .when(access).requireAccessCourse(learner, 801);
        assertThrows(AccessDeniedException.class,
                () -> service.submitQuiz(9, new QuizSubmitRequestDTO(), learner));
        verify(attempts, never()).save(any());
    }

    private QuizAttempt submittedAttempt(int number) {
        QuizAttempt attempt = new QuizAttempt();
        attempt.setId(501);
        attempt.setQuizId(9);
        attempt.setLearnerId(42);
        attempt.setAttemptNumber(number);
        attempt.setStatus("SUBMITTED");
        attempt.setScore(8);
        attempt.setMaxScore(10);
        QuizAnswer answer = new QuizAnswer();
        answer.setAttemptId(501);
        answer.setQuestionId(601);
        answer.setSelectedOptionIds("701");
        answer.setCorrect(true);
        answer.setPointsAwarded(8);
        when(attempts.findByQuizIdAndLearnerIdAndIsDeletedFalseOrderByAttemptNumberDesc(9, 42))
                .thenReturn(List.of(attempt));
        when(answers.findByAttemptIdInAndIsDeletedFalse(List.of(501)))
                .thenReturn(List.of(answer));
        return attempt;
    }

    @Test
    void withheldGradesHideScoreAndCorrectnessEvenAfterAttemptExhaustion() {
        quiz(null, 1, true).setGradePublished(false);
        submittedAttempt(1);
        QuizAttemptResponseDTO result = service.getMySubmissions(9, learner).get(0);
        assertFalse(result.isResultsVisible());
        assertNull(result.getScore());
        assertNull(result.getMaxScore());
        assertNull(result.getAnswers().get(0).getCorrect());
        assertNull(result.getAnswers().get(0).getPointsAwarded());
        assertEquals(List.of(701), result.getAnswers().get(0).getSelectedOptionIds());
    }

    @Test
    void publishedGradesRemainHiddenUntilAttemptLimitReached() {
        quiz(null, 2, true).setGradePublished(true);
        submittedAttempt(1);
        QuizAttemptResponseDTO result = service.getMySubmissions(9, learner).get(0);
        assertFalse(result.isResultsVisible());
        assertNull(result.getScore());
        assertNull(result.getAnswers().get(0).getCorrect());
    }

    @Test
    void publishedResultsShowAfterTheDeadlineWithoutExposingOtherLearners() {
        // Results are released only once the quiz has closed and faculty published them (not on the final attempt).
        Quiz closed = quiz(null, 2, true);
        closed.setGradePublished(true);
        closed.setDueAt(java.time.LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")).minusHours(1));
        submittedAttempt(2);
        QuizAttemptResponseDTO result = service.getMySubmissions(9, learner).get(0);
        assertTrue(result.isResultsVisible());
        assertEquals(Long.valueOf(8), result.getScore());
        assertEquals(Long.valueOf(10), result.getMaxScore());
        assertEquals(Boolean.TRUE, result.getAnswers().get(0).getCorrect());
        assertEquals(Long.valueOf(8), result.getAnswers().get(0).getPointsAwarded());
        verify(attempts).findByQuizIdAndLearnerIdAndIsDeletedFalseOrderByAttemptNumberDesc(9, 42);
    }

    @Test
    void deletedQuizStillAllowsOwnHistoricalAttemptWithoutExposingResults() {
        quiz(null, 1, true).setIsDeleted(true);
        submittedAttempt(1);
        QuizAttemptResponseDTO result = service.getMySubmissions(9, learner).get(0);
        assertEquals(501, result.getId());
        assertNull(result.getScore());
        verify(access, atLeastOnce()).requireAccessCourse(learner, 801);
    }

    @Test
    void historicalAttemptDeniesClassCourseMismatch() {
        quiz(41, 1, true);
        submittedAttempt(1);
        doThrow(new AccessDeniedException("course is not entitled"))
                .when(access).requireAccessCourse(learner, 801);
        assertThrows(AccessDeniedException.class, () -> service.getMySubmissions(9, learner));
    }
}
