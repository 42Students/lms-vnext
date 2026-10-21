package com._42students.lms.service.impl;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.request.QuizAnswerRequestDTO;
import com._42students.lms.dto.request.QuizUpsertRequestDTO;
import com._42students.lms.dto.request.QuizSubmitRequestDTO;
import com._42students.lms.dto.response.QuizAttemptResponseDTO;
import com._42students.lms.dto.response.QuizResponseDTO;
import com._42students.lms.model.Quiz;
import com._42students.lms.model.QuizAttempt;
import com._42students.lms.model.QuizOption;
import com._42students.lms.model.QuizQuestion;
import com._42students.lms.model.FacultyTeachingAssignment;
import com._42students.lms.model._Class;
import com._42students.lms.repository.CourseRepository;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.LessonRepository;
import com._42students.lms.repository.QuizAnswerRepository;
import com._42students.lms.repository.QuizAttemptRepository;
import com._42students.lms.repository.QuizOptionRepository;
import com._42students.lms.repository.QuizQuestionRepository;
import com._42students.lms.repository.QuizRepository;
import com._42students.lms.repository.SemesterCourseRepository;
import com._42students.lms.repository._ClassRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.LearnerContentProgressService;
import org.springframework.test.util.ReflectionTestUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class QuizServiceImplSubmitLifecycleTest {
    private QuizServiceImpl service;
    private QuizRepository quizzes;
    private QuizAttemptRepository attempts;
    private QuizQuestionRepository questions;
    private QuizOptionRepository options;
    private AccessControlService accessControlService;
    private FacultyTeachingAssignmentRepository teachingAssignments;
    private _ClassRepository classes;
    private SemesterCourseRepository semesterCourses;
    private UserPrincipal learner;
    private LearnerContentProgressService learnerContentProgressService;

    @BeforeEach
    void setUp() {
        quizzes = mock(QuizRepository.class);
        attempts = mock(QuizAttemptRepository.class);
        questions = mock(QuizQuestionRepository.class);
        options = mock(QuizOptionRepository.class);
        accessControlService = mock(AccessControlService.class);
        teachingAssignments = mock(FacultyTeachingAssignmentRepository.class);
        classes = mock(_ClassRepository.class);
        semesterCourses = mock(SemesterCourseRepository.class);
        learnerContentProgressService = mock(LearnerContentProgressService.class);
        service = new QuizServiceImpl(
                quizzes,
                questions,
                options,
                attempts,
                mock(QuizAnswerRepository.class),
                mock(LessonRepository.class),
                mock(CourseRepository.class),
                mock(LearnerRepository.class),
                accessControlService);
        ReflectionTestUtils.setField(service, "facultyTeachingAssignmentRepository", teachingAssignments);
        ReflectionTestUtils.setField(service, "classRepository", classes);
        ReflectionTestUtils.setField(service, "semesterCourseRepository", semesterCourses);
        ReflectionTestUtils.setField(service, "learnerContentProgressService", learnerContentProgressService);
        learner = new UserPrincipal(42, "LEARNER", null, 1, 6, 0);
        when(questions.findByQuizIdAndIsDeletedFalseOrderBySequenceAscIdAsc(org.mockito.ArgumentMatchers.anyInt()))
                .thenReturn(List.of());
        when(attempts.save(org.mockito.ArgumentMatchers.any(QuizAttempt.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void newQuizDefaultsToWithheldResults() {
        assertFalse(new Quiz().isGradePublished());
    }

    @Test
    void submitQuizDoesNotWriteQuizIdIntoLessonContentProgress() {
        Quiz quiz = openQuiz();
        QuizQuestion question = question(101);
        when(quizzes.lockById(9)).thenReturn(Optional.of(quiz));
        when(attempts.countByQuizIdAndLearnerIdAndIsDeletedFalse(9, 42)).thenReturn(0);
        when(questions.findByQuizIdAndIsDeletedFalseOrderBySequenceAscIdAsc(9)).thenReturn(List.of(question));
        when(options.findByQuestionIdInAndIsDeletedFalseOrderBySequenceAscIdAsc(List.of(101)))
                .thenReturn(List.of(option(201, true), option(202, false)));

        service.submitQuiz(9, request(), learner);

        verifyNoInteractions(learnerContentProgressService);
    }

    @Test
    void submitRejectsInactiveOrDisabledPublishedQuiz() {
        assertUnavailable(inactiveQuiz());
        assertUnavailable(disabledQuiz());
    }

    @Test
    void learnerCourseListUsesEntitlementScopedClassAvailabilityBeforeCourseFilter() {
        Quiz allowed = openQuiz();
        allowed.setId(1);
        allowed.setCourseId(10);
        Quiz otherCourse = openQuiz();
        otherCourse.setId(2);
        otherCourse.setCourseId(20);
        when(quizzes.findAvailableByClasses(List.of(7))).thenReturn(List.of(allowed, otherCourse));

        List<QuizResponseDTO> result = service.listQuizzes(10, null, 7, learner);

        assertEquals(1, result.size());
        assertEquals(1, result.get(0).getId());
        verify(accessControlService).requireAccessClass(learner, 7);
        verify(quizzes).findAvailableByClasses(List.of(7));
        verify(quizzes, never()).findAvailableByCourseAndClass(10, 7);
    }

    @Test
    void learnerLessonListUsesEntitlementScopedClassAvailabilityBeforeLessonFilter() {
        Quiz allowed = openQuiz();
        allowed.setId(1);
        allowed.setLessonId(101);
        Quiz otherLesson = openQuiz();
        otherLesson.setId(2);
        otherLesson.setLessonId(202);
        when(quizzes.findAvailableByClasses(List.of(7))).thenReturn(List.of(allowed, otherLesson));

        List<QuizResponseDTO> result = service.listQuizzes(null, 101, 7, learner);

        assertEquals(1, result.size());
        assertEquals(1, result.get(0).getId());
        verify(accessControlService).requireAccessClass(learner, 7);
        verify(quizzes).findAvailableByClasses(List.of(7));
        verify(quizzes, never()).findAvailableByLessonAndClass(101, 7);
    }

    @Test
    void learnerDetailDoesNotRevealCorrectAnswersBeforeGradesArePublishedEvenAfterFinalAttempt() {
        Quiz quiz = openQuiz();
        quiz.setGradePublished(false);
        QuizQuestion question = question(101);
        QuizOption correctOption = option(201, true);
        QuizOption incorrectOption = option(202, false);
        when(quizzes.findById(9)).thenReturn(Optional.of(quiz));
        when(attempts.countByQuizIdAndLearnerIdAndIsDeletedFalse(9, 42)).thenReturn(1);
        when(questions.findByQuizIdAndIsDeletedFalseOrderBySequenceAscIdAsc(9)).thenReturn(List.of(question));
        when(options.findByQuestionIdInAndIsDeletedFalseOrderBySequenceAscIdAsc(List.of(101)))
                .thenReturn(List.of(correctOption, incorrectOption));

        QuizResponseDTO result = service.getQuiz(9, learner, true);

        assertFalse(result.isGradePublished());
        assertFalse(result.getQuestions().get(0).getOptions().get(0).isCorrect());
        assertFalse(result.getQuestions().get(0).getOptions().get(1).isCorrect());
        verify(accessControlService, atLeastOnce()).requireAccessCourse(learner, 4);
    }

    @Test
    void learnerWhoMissedThePastDueQuizCanReviewTheAnswerKeyOncePublished() {
        Quiz quiz = openQuiz();
        quiz.setGradePublished(true);
        quiz.setDueAt(LocalDateTime.now(ZoneId.of("Asia/Kolkata")).minusHours(1));
        QuizQuestion question = question(101);
        when(quizzes.findById(9)).thenReturn(Optional.of(quiz));
        when(attempts.countByQuizIdAndLearnerIdAndIsDeletedFalse(9, 42)).thenReturn(0);
        when(questions.findByQuizIdAndIsDeletedFalseOrderBySequenceAscIdAsc(9)).thenReturn(List.of(question));
        when(options.findByQuestionIdInAndIsDeletedFalseOrderBySequenceAscIdAsc(List.of(101)))
                .thenReturn(List.of(option(201, true), option(202, false)));

        QuizResponseDTO result = service.getQuiz(9, learner, true);

        assertEquals(true, result.getQuestions().get(0).getOptions().stream()
                .anyMatch(o -> o.getId() == 201 && o.isCorrect()));
    }

    @Test
    void learnerCannotSeeAnswerKeyOfAnOpenQuizTheyHaveNotAttempted() {
        Quiz quiz = openQuiz();
        quiz.setGradePublished(true);
        quiz.setDueAt(LocalDateTime.now(ZoneId.of("Asia/Kolkata")).plusHours(1));
        QuizQuestion question = question(101);
        when(quizzes.findById(9)).thenReturn(Optional.of(quiz));
        when(attempts.countByQuizIdAndLearnerIdAndIsDeletedFalse(9, 42)).thenReturn(0);
        when(questions.findByQuizIdAndIsDeletedFalseOrderBySequenceAscIdAsc(9)).thenReturn(List.of(question));
        when(options.findByQuestionIdInAndIsDeletedFalseOrderBySequenceAscIdAsc(List.of(101)))
                .thenReturn(List.of(option(201, true), option(202, false)));

        QuizResponseDTO result = service.getQuiz(9, learner, true);

        assertFalse(result.getQuestions().get(0).getOptions().stream().anyMatch(o -> o.isCorrect()));
    }

    @Test
    void updateRejectsScopeReassignmentThroughNormalEdit() {
        UserPrincipal faculty = new UserPrincipal(7, "FACULTY", "LECTURER", 1, 6, 0);
        Quiz quiz = openQuiz();
        quiz.setFacultyId(7);
        quiz.setLessonId(101);
        quiz.setCourseId(4);
        quiz.setClassId(9);
        QuizUpsertRequestDTO request = new QuizUpsertRequestDTO();
        request.setLessonId(202);
        request.setCourseId(4);
        request.setClassId(9);
        request.setTitle("Updated title");
        request.setMaxAttempts(1);
        when(quizzes.findById(9)).thenReturn(Optional.of(quiz));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.updateQuiz(9, request, faculty));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Quiz lesson, course and class scope cannot be changed after creation", ex.getReason());
        verify(accessControlService).requireAccessClass(faculty, 9);
        verify(quizzes, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void updateRejectsAttemptLimitChangeAfterLearnerSubmissions() {
        UserPrincipal faculty = new UserPrincipal(7, "FACULTY", "LECTURER", 1, 6, 0);
        Quiz quiz = openQuiz();
        quiz.setFacultyId(7);
        quiz.setLessonId(101);
        quiz.setMaxAttempts(2);
        quiz.setDueAt(LocalDateTime.now(ZoneId.of("Asia/Kolkata")).plusHours(2));
        QuizUpsertRequestDTO request = upsertRequest();
        request.setMaxAttempts(3);
        when(quizzes.findById(9)).thenReturn(Optional.of(quiz));
        when(serviceLessonRepository().findById(101)).thenReturn(Optional.of(lessonForCourse(4)));
        when(teachingAssignments.existsByFacultyIdAndCourseIdAndIsActive(7, 4, true)).thenReturn(true);
        when(attempts.countByQuizIdAndIsDeletedFalse(9)).thenReturn(1L);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.updateQuiz(9, request, faculty));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus(), ex.getReason());
        assertEquals("Attempt limit cannot be changed after learner submissions exist", ex.getReason());
        verify(quizzes, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void updateRejectsReopeningAClosedQuizByMovingItsDeadlineForward() {
        UserPrincipal faculty = new UserPrincipal(7, "FACULTY", "LECTURER", 1, 6, 0);
        Quiz quiz = openQuiz();
        quiz.setFacultyId(7);
        quiz.setLessonId(101);
        quiz.setDueAt(LocalDateTime.now(ZoneId.of("Asia/Kolkata")).minusMinutes(5));
        QuizUpsertRequestDTO request = upsertRequest();
        request.setMaxAttempts(quiz.getMaxAttempts());
        request.setDueAt(LocalDateTime.now(ZoneId.of("Asia/Kolkata")).plusHours(2));
        when(quizzes.findById(9)).thenReturn(Optional.of(quiz));
        when(serviceLessonRepository().findById(101)).thenReturn(Optional.of(lessonForCourse(4)));
        when(teachingAssignments.existsByFacultyIdAndCourseIdAndIsActive(7, 4, true)).thenReturn(true);
        when(attempts.countByQuizIdAndIsDeletedFalse(9)).thenReturn(0L);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.updateQuiz(9, request, faculty));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus(), ex.getReason());
        assertEquals("Quiz deadline cannot be changed after a published quiz has closed", ex.getReason());
        verify(quizzes, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void submitRejectsLearnerWhenMaxAttemptsAlreadyUsed() {
        Quiz quiz = openQuiz();
        quiz.setMaxAttempts(2);
        when(quizzes.lockById(9)).thenReturn(Optional.of(quiz));
        when(attempts.countByQuizIdAndLearnerIdAndIsDeletedFalse(9, 42)).thenReturn(2);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.submitQuiz(9, request(), learner));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Maximum quiz attempts reached", ex.getReason());
        verify(quizzes, atLeastOnce()).lockById(9);
        verify(attempts, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void submitRejectsQuizPastItsIndiaDeadlineEvenWhenUtcClockIsEarlier() {
        // dueAt is stored as India wall-clock time. Five minutes ago in India is still hours in
        // the future on a UTC clock, which is exactly the window learners could slip through.
        Quiz quiz = openQuiz();
        quiz.setDueAt(LocalDateTime.now(ZoneId.of("Asia/Kolkata")).minusMinutes(5));
        when(quizzes.lockById(9)).thenReturn(Optional.of(quiz));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.submitQuiz(9, request(), learner));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Quiz deadline has passed", ex.getReason());
        verify(attempts, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void attemptEndpointRefusesLearnerAfterDeadline() {
        Quiz quiz = openQuiz();
        quiz.setDueAt(LocalDateTime.now(ZoneId.of("Asia/Kolkata")).minusMinutes(5));
        when(quizzes.findById(9)).thenReturn(Optional.of(quiz));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.getQuizForAttempt(9, learner));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Quiz deadline has passed", ex.getReason());
    }

    @Test
    void attemptEndpointRefusesLearnerAfterMaximumAttemptsAreUsed() {
        Quiz quiz = openQuiz();
        quiz.setMaxAttempts(2);
        quiz.setDueAt(LocalDateTime.now(ZoneId.of("Asia/Kolkata")).plusHours(1));
        when(quizzes.findById(9)).thenReturn(Optional.of(quiz));
        when(attempts.countByQuizIdAndLearnerIdAndIsDeletedFalse(9, 42)).thenReturn(2);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.getQuizForAttempt(9, learner));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Maximum quiz attempts reached", ex.getReason());
    }

    @Test
    void submitRejectsPayloadThatDoesNotAnswerEveryQuizQuestion() {
        Quiz quiz = openQuiz();
        when(quizzes.lockById(9)).thenReturn(Optional.of(quiz));
        when(attempts.countByQuizIdAndLearnerIdAndIsDeletedFalse(9, 42)).thenReturn(0);
        when(questions.findByQuizIdAndIsDeletedFalseOrderBySequenceAscIdAsc(9))
                .thenReturn(List.of(question(101), question(102)));
        when(options.findByQuestionIdInAndIsDeletedFalseOrderBySequenceAscIdAsc(List.of(101, 102)))
                .thenReturn(List.of(option(201, true), option(202, false)));

        QuizAnswerRequestDTO onlyFirst = new QuizAnswerRequestDTO();
        onlyFirst.setQuestionId(101);
        onlyFirst.setSelectedOptionIds(List.of(201));
        QuizSubmitRequestDTO incomplete = new QuizSubmitRequestDTO();
        incomplete.setAnswers(List.of(onlyFirst));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.submitQuiz(9, incomplete, learner));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus(), ex.getReason());
        assertEquals("Submit exactly one answer for every quiz question", ex.getReason());
        verify(attempts, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void submitRejectsMultipleSelectionsForSingleChoiceQuestion() {
        Quiz quiz = openQuiz();
        QuizQuestion question = question(101);
        when(quizzes.lockById(9)).thenReturn(Optional.of(quiz));
        when(attempts.countByQuizIdAndLearnerIdAndIsDeletedFalse(9, 42)).thenReturn(0);
        when(questions.findByQuizIdAndIsDeletedFalseOrderBySequenceAscIdAsc(9))
                .thenReturn(List.of(question));
        when(options.findByQuestionIdInAndIsDeletedFalseOrderBySequenceAscIdAsc(List.of(101)))
                .thenReturn(List.of(option(201, true), option(202, false)));

        QuizAnswerRequestDTO answer = new QuizAnswerRequestDTO();
        answer.setQuestionId(101);
        answer.setSelectedOptionIds(List.of(201, 202));
        QuizSubmitRequestDTO invalid = new QuizSubmitRequestDTO();
        invalid.setAnswers(List.of(answer));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.submitQuiz(9, invalid, learner));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Single choice questions require exactly one selected option", ex.getReason());
        verify(attempts, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void attemptEndpointStillServesLearnerBeforeDeadline() {
        Quiz quiz = openQuiz();
        quiz.setDueAt(LocalDateTime.now(ZoneId.of("Asia/Kolkata")).plusHours(1));
        when(quizzes.findById(9)).thenReturn(Optional.of(quiz));

        QuizResponseDTO result = service.getQuizForAttempt(9, learner);

        assertEquals(9, result.getId());
    }

    @Test
    void publishRejectsPastDueQuiz() {
        UserPrincipal faculty = new UserPrincipal(7, "FACULTY", "LECTURER", 1, 6, 0);
        Quiz quiz = openQuiz();
        quiz.setFacultyId(7);
        quiz.setDueAt(LocalDateTime.now().minusMinutes(1));
        when(quizzes.findById(9)).thenReturn(Optional.of(quiz));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.publishQuiz(9, faculty));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Cannot publish a quiz after its due date", ex.getReason());
        verify(quizzes, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void createRejectsClassWhoseProgramDoesNotContainCourse() {
        UserPrincipal admin = new UserPrincipal(7, "FACULTY", "ADMIN", 1, 6, 0);
        QuizUpsertRequestDTO request = upsertRequest();
        request.setClassId(12);
        com._42students.lms.model.Lesson lesson = new com._42students.lms.model.Lesson();
        lesson.setCourseId(4);
        when(serviceLessonRepository().findById(101)).thenReturn(Optional.of(lesson));
        doThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Selected class is not currently eligible for this course"))
                .when(accessControlService).requireCurrentCourseAudienceClass(12, 4);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.createQuiz(request, admin));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Selected class is not currently eligible for this course", ex.getReason());
        verify(quizzes, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void adminMetadataEditPreservesOriginalOwnerAndPublishedStatus() {
        UserPrincipal admin = new UserPrincipal(31, "FACULTY", "ADMIN", 1, 6, 0);
        Quiz quiz = openQuiz();
        quiz.setFacultyId(7);
        quiz.setLessonId(101);
        quiz.setCourseId(4);
        quiz.setClassId(null);
        quiz.setStatus("PUBLISHED");
        QuizUpsertRequestDTO request = upsertRequest();
        request.setPublish(false);
        when(quizzes.findById(9)).thenReturn(Optional.of(quiz));
        when(serviceLessonRepository().findById(101))
                .thenReturn(Optional.of(lessonForCourse(4)));
        when(quizzes.save(org.mockito.ArgumentMatchers.any(Quiz.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.updateQuiz(9, request, admin);

        assertEquals(7, quiz.getFacultyId());
        assertEquals("PUBLISHED", quiz.getStatus());
        verify(quizzes, atLeastOnce()).save(quiz);
    }

    @Test
    void metadataEditDoesNotReactivateDisabledQuiz() {
        UserPrincipal admin = new UserPrincipal(31, "FACULTY", "ADMIN", 1, 6, 0);
        Quiz quiz = openQuiz();
        quiz.setFacultyId(7);
        quiz.setLessonId(101);
        quiz.setActive(false);
        quiz.setEnabled(false);
        QuizUpsertRequestDTO request = upsertRequest();
        request.setMaxAttempts(quiz.getMaxAttempts());
        request.setDueAt(quiz.getDueAt());
        when(quizzes.findById(9)).thenReturn(Optional.of(quiz));
        when(serviceLessonRepository().findById(101)).thenReturn(Optional.of(lessonForCourse(4)));
        when(quizzes.save(org.mockito.ArgumentMatchers.any(Quiz.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.updateQuiz(9, request, admin);

        assertFalse(quiz.isActive());
        assertFalse(quiz.isEnabled());
    }

    @Test
    void assignedCoTeacherCanUpdateQuizMetadata() {
        UserPrincipal coTeacher = new UserPrincipal(8, "FACULTY", "LECTURER", 1, 6, 0);
        Quiz quiz = openQuiz();
        quiz.setFacultyId(7);
        quiz.setLessonId(101);
        quiz.setCourseId(4);
        quiz.setClassId(12);
        FacultyTeachingAssignment assignment = new FacultyTeachingAssignment();
        assignment.setFacultyId(8);
        assignment.setCourseId(4);
        assignment.setClassId(12);
        when(quizzes.findById(9)).thenReturn(Optional.of(quiz));
        when(teachingAssignments.findByFacultyIdAndIsActive(8, true)).thenReturn(List.of(assignment));
        when(teachingAssignments.existsByFacultyIdAndCourseIdAndClassIdAndIsActive(8, 4, 12, true)).thenReturn(true);
        when(teachingAssignments.findFirstByCourseIdAndClassIdAndIsActive(4, 12, true)).thenReturn(Optional.of(assignment));
        when(serviceLessonRepository().findById(101)).thenReturn(Optional.of(lessonForCourse(4)));
        when(quizzes.save(org.mockito.ArgumentMatchers.any(Quiz.class))).thenAnswer(invocation -> invocation.getArgument(0));

        QuizUpsertRequestDTO request = upsertRequest();
        request.setClassId(12);

        service.updateQuiz(9, request, coTeacher);

        verify(quizzes, atLeastOnce()).save(quiz);
    }

    @Test
    void learnerCannotSeePublishedResultsBeforeDeadlineEvenAfterFinalAttempt() {
        Quiz quiz = openQuiz();
        quiz.setGradePublished(true);
        quiz.setMaxAttempts(1);
        quiz.setDueAt(LocalDateTime.now(ZoneId.of("Asia/Kolkata")).plusHours(1));
        QuizAttempt attempt = new QuizAttempt();
        attempt.setId(76);
        attempt.setQuizId(9);
        attempt.setLearnerId(42);
        attempt.setAttemptNumber(1);
        attempt.setScore(1);
        attempt.setMaxScore(1);
        when(quizzes.findById(9)).thenReturn(Optional.of(quiz));
        when(attempts.findByQuizIdAndLearnerIdAndIsDeletedFalseOrderByAttemptNumberDesc(9, 42))
                .thenReturn(List.of(attempt));

        List<QuizAttemptResponseDTO> result = service.getMySubmissions(9, learner);

        assertFalse(result.get(0).isResultsVisible());
        assertNull(result.get(0).getScore());
    }

    @Test
    void releaseResultsBeforeDeadlineIsRejected() {
        UserPrincipal faculty = new UserPrincipal(7, "FACULTY", "LECTURER", 1, 6, 0);
        Quiz quiz = openQuiz();
        quiz.setFacultyId(7);
        quiz.setDueAt(LocalDateTime.now(ZoneId.of("Asia/Kolkata")).plusHours(1));
        when(quizzes.findById(9)).thenReturn(Optional.of(quiz));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.setGradePublished(9, true, faculty));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("Quiz results can only be released after the deadline has passed", ex.getReason());
        verify(quizzes, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void updateRejectsDeadlineChangeAfterLearnerSubmissions() {
        UserPrincipal faculty = new UserPrincipal(7, "FACULTY", "LECTURER", 1, 6, 0);
        Quiz quiz = openQuiz();
        quiz.setFacultyId(7);
        quiz.setLessonId(101);
        quiz.setDueAt(LocalDateTime.now(ZoneId.of("Asia/Kolkata")).plusHours(2));
        QuizUpsertRequestDTO request = upsertRequest();
        request.setDueAt(quiz.getDueAt().plusHours(1));
        request.setMaxAttempts(quiz.getMaxAttempts());
        when(quizzes.findById(9)).thenReturn(Optional.of(quiz));
        when(serviceLessonRepository().findById(101)).thenReturn(Optional.of(lessonForCourse(4)));
        when(teachingAssignments.existsByFacultyIdAndCourseIdAndIsActive(7, 4, true)).thenReturn(true);
        when(attempts.countByQuizIdAndIsDeletedFalse(9)).thenReturn(1L);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.updateQuiz(9, request, faculty));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus(), ex.getReason());
        assertEquals("Quiz deadline cannot be changed after learner submissions exist", ex.getReason());
    }

    @Test
    void unpublishAndDeleteAreRejectedAfterLearnerSubmissions() {
        UserPrincipal faculty = new UserPrincipal(7, "FACULTY", "LECTURER", 1, 6, 0);
        Quiz quiz = openQuiz();
        quiz.setFacultyId(7);
        when(quizzes.findById(9)).thenReturn(Optional.of(quiz));
        when(attempts.countByQuizIdAndIsDeletedFalse(9)).thenReturn(1L);

        ResponseStatusException unpublish = assertThrows(ResponseStatusException.class,
                () -> service.unpublishQuiz(9, faculty));
        ResponseStatusException delete = assertThrows(ResponseStatusException.class,
                () -> service.deleteQuiz(9, faculty));

        assertEquals(HttpStatus.CONFLICT, unpublish.getStatus());
        assertEquals(HttpStatus.CONFLICT, delete.getStatus());
        verify(quizzes, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void learnerCanSeePublishedAttemptResultsAfterDeadlineEvenWithUnusedAttempts() {
        Quiz quiz = openQuiz();
        quiz.setGradePublished(true);
        quiz.setMaxAttempts(3);
        quiz.setDueAt(LocalDateTime.now(ZoneId.of("Asia/Kolkata")).minusMinutes(5));
        QuizAttempt attempt = new QuizAttempt();
        attempt.setId(77);
        attempt.setQuizId(9);
        attempt.setLearnerId(42);
        attempt.setAttemptNumber(1);
        attempt.setScore(1);
        attempt.setMaxScore(1);
        when(quizzes.findById(9)).thenReturn(Optional.of(quiz));
        when(attempts.findByQuizIdAndLearnerIdAndIsDeletedFalseOrderByAttemptNumberDesc(9, 42))
                .thenReturn(List.of(attempt));

        List<QuizAttemptResponseDTO> result = service.getMySubmissions(9, learner);

        assertEquals(1, result.size());
        assertEquals(true, result.get(0).isResultsVisible());
        assertEquals(1L, result.get(0).getScore());
    }

    @Test
    void learnerCanReviewOwnSubmissionAfterQuizSoftDeleteWithoutUnreleasedScoreLeak() {
        Quiz quiz = openQuiz();
        quiz.setIsDeleted(true);
        quiz.setGradePublished(false);
        QuizAttempt attempt = new QuizAttempt();
        attempt.setId(77);
        attempt.setQuizId(9);
        attempt.setLearnerId(42);
        attempt.setAttemptNumber(1);
        attempt.setScore(1);
        attempt.setMaxScore(1);
        when(quizzes.findById(9)).thenReturn(Optional.of(quiz));
        when(attempts.findByQuizIdAndLearnerIdAndIsDeletedFalseOrderByAttemptNumberDesc(9, 42))
                .thenReturn(List.of(attempt));

        List<QuizAttemptResponseDTO> result = service.getMySubmissions(9, learner);

        assertEquals(1, result.size());
        assertEquals(77, result.get(0).getId());
        assertFalse(result.get(0).isResultsVisible());
        assertNull(result.get(0).getScore());
        assertNull(result.get(0).getMaxScore());
        verify(accessControlService, atLeastOnce()).requireAccessCourse(learner, 4);
    }

    private void assertUnavailable(Quiz quiz) {
        when(quizzes.lockById(9)).thenReturn(Optional.of(quiz));
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.submitQuiz(9, request(), learner));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Quiz is not available", ex.getReason());
        verify(quizzes, atLeastOnce()).lockById(9);
        verify(attempts, never()).save(org.mockito.ArgumentMatchers.any());
    }

    private QuizSubmitRequestDTO request() {
        QuizAnswerRequestDTO answer = new QuizAnswerRequestDTO();
        answer.setQuestionId(101);
        answer.setSelectedOptionIds(List.of(201));
        QuizSubmitRequestDTO request = new QuizSubmitRequestDTO();
        request.setAnswers(List.of(answer));
        return request;
    }

    private Quiz openQuiz() {
        Quiz quiz = new Quiz();
        quiz.setId(9);
        quiz.setCourseId(4);
        quiz.setStatus("PUBLISHED");
        quiz.setActive(true);
        quiz.setEnabled(true);
        quiz.setMaxAttempts(1);
        quiz.setDueAt(LocalDateTime.now(ZoneId.of("Asia/Kolkata")).plusHours(2));
        return quiz;
    }

    private Quiz inactiveQuiz() {
        Quiz quiz = openQuiz();
        quiz.setActive(false);
        return quiz;
    }

    private Quiz disabledQuiz() {
        Quiz quiz = openQuiz();
        quiz.setEnabled(false);
        return quiz;
    }

    private QuizUpsertRequestDTO upsertRequest() {
        QuizUpsertRequestDTO request = new QuizUpsertRequestDTO();
        request.setLessonId(101);
        request.setCourseId(4);
        request.setTitle("Midterm quiz");
        request.setDueAt(LocalDateTime.now().plusDays(1));
        request.setMaxAttempts(2);
        return request;
    }

    private com._42students.lms.model.Lesson lessonForCourse(int courseId) {
        com._42students.lms.model.Lesson lesson = new com._42students.lms.model.Lesson();
        lesson.setCourseId(courseId);
        return lesson;
    }

    private LessonRepository serviceLessonRepository() {
        return (LessonRepository) ReflectionTestUtils.getField(service, "lessonRepository");
    }

    private QuizQuestion question(int id) {
        QuizQuestion question = new QuizQuestion();
        question.setId(id);
        question.setQuizId(9);
        question.setQuestionType("SINGLE_CHOICE");
        question.setPrompt("Pick one");
        question.setPoints(1);
        question.setSequence(1);
        return question;
    }

    private QuizOption option(int id, boolean correct) {
        QuizOption option = new QuizOption();
        option.setId(id);
        option.setQuestionId(101);
        option.setOptionText(correct ? "Correct" : "Incorrect");
        option.setCorrect(correct);
        option.setSequence(correct ? 1 : 2);
        return option;
    }
}
