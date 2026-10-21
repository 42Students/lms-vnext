package com._42students.lms.service.impl;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.request.QuizAnswerRequestDTO;
import com._42students.lms.dto.request.QuizOptionRequestDTO;
import com._42students.lms.dto.request.QuizQuestionRequestDTO;
import com._42students.lms.dto.request.QuizSubmitRequestDTO;
import com._42students.lms.dto.request.QuizUpsertRequestDTO;
import com._42students.lms.dto.response.PageResponseDTO;
import com._42students.lms.dto.response.QuizAttemptResponseDTO;
import com._42students.lms.dto.response.QuizOptionResponseDTO;
import com._42students.lms.dto.response.QuizQuestionResponseDTO;
import com._42students.lms.dto.response.QuizResponseDTO;
import com._42students.lms.dto.response.QuizSubmittedAnswerResponseDTO;
import com._42students.lms.model.Lesson;
import com._42students.lms.model.Course;
import com._42students.lms.model.Learner;
import com._42students.lms.model.Quiz;
import com._42students.lms.model.QuizAnswer;
import com._42students.lms.model.QuizAttempt;
import com._42students.lms.model.QuizOption;
import com._42students.lms.model.QuizQuestion;
import com._42students.lms.repository.LessonRepository;
import com._42students.lms.repository.CourseRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.QuizAnswerRepository;
import com._42students.lms.repository.QuizAttemptRepository;
import com._42students.lms.repository.QuizOptionRepository;
import com._42students.lms.repository.QuizQuestionRepository;
import com._42students.lms.repository.QuizRepository;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.QuizService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class QuizServiceImpl implements QuizService {

    /** Only used to resolve the viewing learner for audit 2.7's per-learner ordering. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.util.SecurityContextUtil securityContextUtil;
    private static final String SINGLE_CHOICE = "SINGLE_CHOICE";
    private static final String MULTIPLE_CHOICE = "MULTIPLE_CHOICE";

    // Quiz create/update/delete wrote no admin audit trail, despite a quiz edit being able to
    // change the questions behind already-taken attempts. required=false keeps these optional
    // for the unit tests, which construct the service directly.
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    com._42students.lms.service.AdminAuditLogService auditLogService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    javax.servlet.http.HttpServletRequest httpRequest;

    private void auditQuiz(String actionKey, Object quizId, Integer collegeId,
                           java.util.Map<String, Object> payload) {
        if (auditLogService == null) return;
        auditLogService.log(httpRequest, actionKey, "quiz", String.valueOf(quizId),
                null, collegeId, payload != null ? payload : java.util.Map.of());
    }

    // Section 4 #5: getSubmissions (and every other method behind requireQuizManagementAccess)
    // required exact ownership (quiz.facultyId == principal.getId()) or ADMIN -- a co-teacher or
    // TA legitimately assigned to the same course/class as the quiz's author could not see
    // submissions for a colleague's quiz. required=false keeps this optional for the unit tests,
    // which construct the service directly without a full Spring context.
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    FacultyTeachingAssignmentRepository facultyTeachingAssignmentRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.repository.SemesterCourseRepository semesterCourseRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.repository._ClassRepository classRepository;

    // Roadmap progress reads quiz completion under the quiz's own id (see normalizeQuizForRoadmap
    // on the frontend, which has no real lesson_content row for a quiz to key off of). Submitting
    // a quiz previously never touched this table at all, so the roadmap's done/total count and
    // "Continue here" marker never advanced past a completed quiz. required=false keeps this
    // optional for the unit tests, which construct the service directly without a full Spring context.
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.service.LearnerContentProgressService learnerContentProgressService;

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizOptionRepository quizOptionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizAnswerRepository quizAnswerRepository;
    private final LessonRepository lessonRepository;
    private final CourseRepository courseRepository;
    private final LearnerRepository learnerRepository;
    private final AccessControlService accessControlService;

    public QuizServiceImpl(QuizRepository quizRepository,
                           QuizQuestionRepository quizQuestionRepository,
                           QuizOptionRepository quizOptionRepository,
                           QuizAttemptRepository quizAttemptRepository,
                           QuizAnswerRepository quizAnswerRepository,
                           LessonRepository lessonRepository,
                           CourseRepository courseRepository,
                           LearnerRepository learnerRepository,
                           AccessControlService accessControlService) {
        this.quizRepository = quizRepository;
        this.quizQuestionRepository = quizQuestionRepository;
        this.quizOptionRepository = quizOptionRepository;
        this.quizAttemptRepository = quizAttemptRepository;
        this.quizAnswerRepository = quizAnswerRepository;
        this.lessonRepository = lessonRepository;
        this.courseRepository = courseRepository;
        this.learnerRepository = learnerRepository;
        this.accessControlService = accessControlService;
    }

    @Override
    @Transactional
    public QuizResponseDTO createQuiz(QuizUpsertRequestDTO request, UserPrincipal principal) {
        requireFaculty(principal);
        validateScope(request, principal, true);
        validateQuestions(request.getQuestions());
        if (request.isPublish() && isPastDue(request.getDueAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot publish a quiz after its due date");
        }

        Quiz quiz = new Quiz();
        applyQuizFields(quiz, request, principal);
        quiz = quizRepository.save(quiz);
        saveQuestions(quiz, request.getQuestions());
        refreshTotalPoints(quiz.getId());
        auditQuiz("QUIZ_CREATE", quiz.getId(), principal != null ? principal.getCollegeId() : null,
                java.util.Map.of("questionCount",
                        String.valueOf(request.getQuestions() != null ? request.getQuestions().size() : 0)));
        return getQuiz(quiz.getId(), principal, true);
    }

    @Override
    @Transactional
    public QuizResponseDTO updateQuiz(int quizId, QuizUpsertRequestDTO request, UserPrincipal principal) {
        requireFaculty(principal);
        Quiz quiz = findQuiz(quizId);
        requireQuizManagementAccess(quiz, principal);
        requireScopeUnchanged(quiz, request);
        validateScope(request, principal, false);
        boolean changesQuestions = request.getQuestions() != null && !request.getQuestions().isEmpty();
        if (changesQuestions) {
            validateQuestions(request.getQuestions());
        }

        // Once learners have submitted, the question set is frozen.
        //
        // The rewrite below HARD-deletes every question and option and recreates them, while
        // QuizAnswer rows store the option ids that were selected and toQuizResponse re-derives
        // correctness from the live QuizOption.isCorrect on every read. Editing a quiz that
        // already has attempts therefore silently rewrites history: submitted answers end up
        // pointing at option ids that no longer exist, and what counted as "correct" changes
        // retroactively for work that was already graded. Metadata (title, description, due date,
        // attempt limit) stays editable — only the questions are locked.
        long existingAttempts = quizAttemptRepository.countByQuizIdAndIsDeletedFalse(quizId);
        boolean closedPublishedAssessment = "PUBLISHED".equalsIgnoreCase(quiz.getStatus())
                && isPastDue(quiz.getDueAt());
        if (existingAttempts > 0 || closedPublishedAssessment) {
            String lockReason = existingAttempts > 0
                    ? "after learner submissions exist"
                    : "after a published quiz has closed";
            if (changesQuestions) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Quiz questions cannot be changed " + lockReason);
            }
            if (request.getMaxAttempts() != quiz.getMaxAttempts()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Attempt limit cannot be changed " + lockReason);
            }
            if (!Objects.equals(request.getDueAt(), quiz.getDueAt())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Quiz deadline cannot be changed " + lockReason);
            }
            if (request.isShuffleQuestions() != quiz.isShuffleQuestions()
                    || request.isShuffleOptions() != quiz.isShuffleOptions()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Quiz randomization settings cannot be changed " + lockReason);
            }
        }

        applyQuizFields(quiz, request, principal);
        quizRepository.save(quiz);
        if (changesQuestions) {
            List<QuizQuestion> existingQuestions = quizQuestionRepository.findByQuizIdAndIsDeletedFalseOrderBySequenceAscIdAsc(quizId);
            if (!existingQuestions.isEmpty()) {
                quizOptionRepository.deleteByQuestionIdIn(existingQuestions.stream().map(QuizQuestion::getId).collect(Collectors.toList()));
            }
            quizQuestionRepository.deleteByQuizId(quizId);
            saveQuestions(quiz, request.getQuestions());
        }
        refreshTotalPoints(quizId);
        auditQuiz("QUIZ_UPDATE", quizId, principal != null ? principal.getCollegeId() : null,
                java.util.Map.of());
        return getQuiz(quizId, principal, true);
    }

    @Override
    @Transactional
    public QuizResponseDTO publishQuiz(int quizId, UserPrincipal principal) {
        requireFaculty(principal);
        Quiz quiz = findQuiz(quizId);
        requireQuizManagementAccess(quiz, principal);
        if (quiz.getDueAt() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Due date is required before publishing");
        }
        if (isPastDue(quiz.getDueAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot publish a quiz after its due date");
        }
        if (quiz.getTotalPoints() <= 0 || quizQuestionRepository.findByQuizIdAndIsDeletedFalseOrderBySequenceAscIdAsc(quizId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Add at least one valid question before publishing");
        }
        quiz.setStatus("PUBLISHED");
        quizRepository.save(quiz);
        return getQuiz(quizId, principal, true);
    }

    @Override
    @Transactional
    public QuizResponseDTO unpublishQuiz(int quizId, UserPrincipal principal) {
        requireFaculty(principal);
        Quiz quiz = findQuiz(quizId);
        requireQuizManagementAccess(quiz, principal);
        long attempts = quizAttemptRepository.countByQuizIdAndIsDeletedFalse(quizId);
        if (attempts > 0 || isPastDue(quiz.getDueAt())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A quiz cannot be unpublished after submissions exist or after its deadline has passed");
        }
        quiz.setStatus("DRAFT");
        quizRepository.save(quiz);
        auditQuiz("QUIZ_UNPUBLISH", quizId, principal != null ? principal.getCollegeId() : null,
                java.util.Map.of());
        return getQuiz(quizId, principal, true);
    }

    @Override
    @Transactional
    public void deleteQuiz(int quizId, UserPrincipal principal) {
        Quiz quiz = findQuiz(quizId);
        requireQuizManagementAccess(quiz, principal);
        if (quizAttemptRepository.countByQuizIdAndIsDeletedFalse(quizId) > 0
                || ("PUBLISHED".equalsIgnoreCase(quiz.getStatus()) && isPastDue(quiz.getDueAt()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A submitted or closed published quiz cannot be deleted; keep it for assessment history");
        }
        // Soft-delete: preserve the quiz + its questions/attempts for grading history, same
        // convention as course/lesson-content deletion elsewhere in this codebase.
        quiz.setIsDeleted(true);
        quizRepository.save(quiz);
        auditQuiz("QUIZ_DELETE", quizId, principal != null ? principal.getCollegeId() : null,
                java.util.Map.of());
    }

    @Override
    @Transactional
    public QuizResponseDTO setGradePublished(int quizId, boolean published, UserPrincipal principal) {
        Quiz quiz = findQuiz(quizId);
        requireQuizManagementAccess(quiz, principal);
        if (published && !"PUBLISHED".equalsIgnoreCase(quiz.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Only a published quiz can release learner results");
        }
        if (published && quiz.getDueAt() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Quiz deadline is not configured");
        }
        if (published && !isPastDue(quiz.getDueAt())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Quiz results can only be released after the deadline has passed");
        }
        quiz.setGradePublished(published);
        quiz = quizRepository.save(quiz);
        auditQuiz(published ? "QUIZ_GRADES_PUBLISHED" : "QUIZ_GRADES_UNPUBLISHED", quizId,
                principal != null ? principal.getCollegeId() : null, java.util.Map.of());
        return toQuizResponse(quiz, true, true);
    }

    // The quiz builder saves dueAt as the author's local wall-clock time with no offset
    // ("2026-10-04T10:00:00"), and every college is in India. The JVM runs in UTC, so comparing
    // against LocalDateTime.now() let learners open and submit for 5h30m after the real deadline.
    static final ZoneId QUIZ_DEADLINE_ZONE = ZoneId.of("Asia/Kolkata");

    static boolean isPastDue(LocalDateTime dueAt) {
        return dueAt != null && LocalDateTime.now(QUIZ_DEADLINE_ZONE).isAfter(dueAt);
    }

    @Override
    @Transactional(readOnly = true)
    public QuizResponseDTO getQuizForAttempt(int quizId, UserPrincipal principal) {
        QuizResponseDTO quiz = getQuiz(quizId, principal, false);
        // Starting a new attempt is closed once the deadline passes. Previously only submitQuiz
        // checked, so a learner could open the quiz and answer every question before finding out.
        if (principal != null && principal.isLearner()) {
            if (quiz.getDueAt() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz deadline is not configured");
            }
            if (isPastDue(quiz.getDueAt())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz deadline has passed");
            }
            int attemptsUsed = quizAttemptRepository
                    .countByQuizIdAndLearnerIdAndIsDeletedFalse(quizId, principal.getId());
            if (attemptsUsed >= Math.max(1, quiz.getMaxAttempts())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Maximum quiz attempts reached");
            }
        }
        return quiz;
    }

    @Override
    @Transactional(readOnly = true)
    public QuizResponseDTO getQuiz(int quizId, UserPrincipal principal, boolean includeCorrectAnswers) {
        Quiz quiz = findQuiz(quizId);
        requireQuizAccess(quiz, principal);
        if (principal != null && principal.isLearner()) {
            requireLearnerVisibleQuiz(quiz);
        }
        // Answer-key exposure to learners is gated on having EXHAUSTED their attempts, not merely
        // on having submitted once.
        //
        // The previous check was "has at least one attempt", using the very same counter that
        // submitQuiz uses to enforce maxAttempts. On any quiz configured with maxAttempts > 1 that
        // let a learner submit one throwaway attempt, call
        // GET /api/v1/quizzes/{id}?includeCorrectAnswers=true to read the full key, and then score
        // 100% on the remaining attempts. The DTO builder still applies the grade-published gate,
        // so exhausted attempts alone never reveal scores or keys while results are unpublished.
        int learnerAttempts = principal != null && principal.isLearner() && principal.getId() != null
                ? quizAttemptRepository.countByQuizIdAndLearnerIdAndIsDeletedFalse(quizId, principal.getId())
                : 0;
        // Never expose the key while the assessment is still open, even to a learner who has
        // exhausted their own attempts: classmates may still be taking the same quiz.
        boolean learnerPastDeadline = principal != null && principal.isLearner() && isPastDue(quiz.getDueAt());
        // BE-0023: the answer key is for faculty who manage this quiz (owner, assigned co-teacher/TA, admin). Any same-college
        // faculty member used to get it by adding includeCorrectAnswers=true to another course's quiz.
        boolean facultyManages = principal != null && principal.isFaculty() && managesQuiz(quiz, principal);
        boolean canSeeCorrect = includeCorrectAnswers
                && principal != null
                && (facultyManages || learnerPastDeadline);
        boolean isPrivileged = facultyManages;
        return toQuizResponse(quiz, canSeeCorrect, isPrivileged);
    }

    private List<Integer> learnerAudienceClassIds(UserPrincipal principal, Integer requestedClassId) {
        List<Integer> resolved = accessControlService.resolveLearnerAudienceClassIds(principal);
        if (resolved == null || resolved.isEmpty()) {
            return requestedClassId != null && requestedClassId > 0 ? List.of(requestedClassId) : List.of();
        }
        return resolved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizResponseDTO> listQuizzes(Integer courseId, Integer lessonId, Integer classId, UserPrincipal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        List<Quiz> quizzes;
        if (lessonId != null && lessonId > 0) {
            if (principal.isLearner() && (classId == null || classId <= 0)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "classId is required");
            }
            if (principal.isLearner()) {
                accessControlService.requireAccessClass(principal, classId);
                List<Integer> audienceClassIds = learnerAudienceClassIds(principal, classId);
                quizzes = quizRepository.findAvailableByClasses(audienceClassIds).stream()
                        .filter(quiz -> Objects.equals(quiz.getLessonId(), lessonId))
                        .collect(Collectors.toList());
            } else if (classId != null && classId > 0) {
                quizzes = quizRepository.findAvailableByLessonAndClass(lessonId, classId);
            } else {
                quizzes = quizRepository.findAvailableByLessonAndClass(lessonId, 0);
            }
        } else if (courseId != null && courseId > 0) {
            if (principal.isLearner() && (classId == null || classId <= 0)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "classId is required");
            }
            if (principal.isLearner()) {
                accessControlService.requireAccessClass(principal, classId);
                List<Integer> audienceClassIds = learnerAudienceClassIds(principal, classId);
                quizzes = quizRepository.findAvailableByClasses(audienceClassIds).stream()
                        .filter(quiz -> Objects.equals(quiz.getCourseId(), courseId))
                        .collect(Collectors.toList());
            } else if (classId != null && classId > 0) {
                quizzes = quizRepository.findAvailableByCourseAndClass(courseId, classId);
            } else if (principal.isFaculty() && principal.getId() != null) {
                quizzes = quizRepository.findManageableByFacultyId(principal.getId()).stream()
                        .filter(quiz -> Objects.equals(quiz.getCourseId(), courseId))
                        .collect(Collectors.toList());
            } else {
                quizzes = quizRepository.findAvailableByCourseAndClass(courseId, 0);
            }
        } else if (principal.isLearner() && classId != null && classId > 0) {
            accessControlService.requireAccessClass(principal, classId);
            quizzes = quizRepository.findAvailableByClasses(learnerAudienceClassIds(principal, classId));
        } else if (principal.isFaculty() && principal.getId() != null) {
            quizzes = quizRepository.findManageableByFacultyId(principal.getId());
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "courseId or lessonId is required");
        }
        Map<Integer, QuizAttempt> learnerLatestAttempts = latestAttemptsByQuiz(quizzes, principal);
        Map<Integer, Long> learnerAttemptCounts = attemptCountsByQuiz(quizzes, principal);
        return quizzes.stream()
                .filter(quiz -> {
                    try {
                        requireQuizAccess(quiz, principal);
                        if (principal.isLearner()) {
                            requireLearnerVisibleQuiz(quiz);
                        }
                        return true;
                    } catch (RuntimeException ignored) {
                        return false;
                    }
                })
                .map(quiz -> toQuizResponse(quiz, principal.isFaculty(), principal.isFaculty(), learnerLatestAttempts.get(quiz.getId()), learnerAttemptCounts.get(quiz.getId())))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponseDTO<QuizResponseDTO> listQuizzesPaged(Integer courseId, Integer classId, int page, int size, UserPrincipal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 20 : Math.min(size, 100);
        Pageable pageable = PageRequest.of(safePage, safeSize);

        Page<Quiz> quizPage;
        java.util.Map<String, Long> summary = null;
        if (principal.isLearner()) {
            if (classId == null || classId <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "classId is required");
            }
            // classId is a client-supplied query param — without this check a learner could pass
            // an arbitrary classId and page through another class's quizzes (findAvailableByClass,
            // used by the non-paginated listQuizzes sibling, has never trusted classId directly
            // either; every caller there resolves it via requireQuizAccess per-quiz instead, but
            // this path queries by classId up front so it needs its own explicit check).
            accessControlService.requireAccessClass(principal, classId);
            quizPage = quizRepository.findAvailableByClassesPaged(
                    learnerAudienceClassIds(principal, classId), courseId, pageable);
            // LRN-Q-04: "Submitted" counted only the current page; count it over the whole filtered list.
            List<Integer> allIds = quizRepository.findAvailableByClassesPaged(
                            learnerAudienceClassIds(principal, classId), courseId, PageRequest.of(0, 5000))
                    .getContent().stream().map(Quiz::getId).collect(Collectors.toList());
            long submitted = allIds.isEmpty() ? 0 : quizAttemptRepository.countSubmittedQuizzes(principal.getId(), allIds);
            summary = java.util.Map.of("submitted", submitted);
        } else if (principal.isFaculty() && principal.getId() != null) {
            quizPage = quizRepository.findManageableByFacultyIdPaged(principal.getId(), courseId, pageable);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unable to resolve quiz scope for this account");
        }

        List<Quiz> quizzes = quizPage.getContent();
        Map<Integer, QuizAttempt> learnerLatestAttempts = latestAttemptsByQuiz(quizzes, principal);
        Map<Integer, Long> learnerAttemptCounts = attemptCountsByQuiz(quizzes, principal);
        List<QuizResponseDTO> content = quizzes.stream()
                .map(quiz -> toQuizResponse(quiz, principal.isFaculty(), principal.isFaculty(), learnerLatestAttempts.get(quiz.getId()), learnerAttemptCounts.get(quiz.getId())))
                .collect(Collectors.toList());

        return PageResponseDTO.<QuizResponseDTO>builder()
                .content(content)
                .totalElements(quizPage.getTotalElements())
                .totalPages(quizPage.getTotalPages())
                .size(quizPage.getSize())
                .number(quizPage.getNumber())
                .first(quizPage.isFirst())
                .last(quizPage.isLast())
                .summary(summary)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponseDTO<QuizResponseDTO> listQuizzesForAdmin(Integer collegeId, Integer courseId, int page, int size, UserPrincipal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        if (collegeId == null || collegeId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "collegeId is required");
        }
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 20 : Math.min(size, 100);
        Pageable pageable = PageRequest.of(safePage, safeSize);
        Page<Quiz> quizPage = quizRepository.findByCollegeIdPaged(collegeId, courseId, pageable);

        List<Quiz> quizzes = quizPage.getContent();
        Map<Integer, QuizAttempt> learnerLatestAttempts = latestAttemptsByQuiz(quizzes, principal);
        Map<Integer, Long> learnerAttemptCounts = attemptCountsByQuiz(quizzes, principal);
        // Admin never "attempts" a quiz, so canSeeCorrect=true here is really "can moderate", not
        // the learner-attempt-based logic getQuiz uses elsewhere — matches the same true/false
        // meaning listQuizzesPaged already passes for principal.isFaculty() above.
        List<QuizResponseDTO> content = quizzes.stream()
                .map(quiz -> toQuizResponse(quiz, true, true, learnerLatestAttempts.get(quiz.getId()), learnerAttemptCounts.get(quiz.getId())))
                .collect(Collectors.toList());

        return PageResponseDTO.<QuizResponseDTO>builder()
                .content(content)
                .totalElements(quizPage.getTotalElements())
                .totalPages(quizPage.getTotalPages())
                .size(quizPage.getSize())
                .number(quizPage.getNumber())
                .first(quizPage.isFirst())
                .last(quizPage.isLast())
                .build();
    }

    @Override
    @Transactional
    public QuizAttemptResponseDTO submitQuiz(int quizId, QuizSubmitRequestDTO request, UserPrincipal principal) {
        if (principal == null || !principal.isLearner() || principal.getId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only learners can submit quizzes");
        }
        Quiz quiz = findQuizForSubmission(quizId);
        requireQuizAccess(quiz, principal);
        if (!quiz.isActive() || !quiz.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz is not available");
        }
        if (!"PUBLISHED".equalsIgnoreCase(quiz.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz is not published");
        }
        if (quiz.getDueAt() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz deadline is not configured");
        }
        if (isPastDue(quiz.getDueAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz deadline has passed");
        }
        int existingAttempts = quizAttemptRepository.countByQuizIdAndLearnerIdAndIsDeletedFalse(quizId, principal.getId());
        if (existingAttempts >= quiz.getMaxAttempts()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Maximum quiz attempts reached");
        }

        List<QuizQuestion> questions = quizQuestionRepository.findByQuizIdAndIsDeletedFalseOrderBySequenceAscIdAsc(quizId);
        Map<Integer, List<QuizOption>> optionsByQuestion = optionsByQuestion(questions);
        if (request == null || request.getAnswers() == null || request.getAnswers().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz submission must include answers");
        }
        for (QuizAnswerRequestDTO answer : request.getAnswers()) {
            if (answer == null || answer.getQuestionId() <= 0
                    || answer.getSelectedOptionIds() == null || answer.getSelectedOptionIds().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Each quiz question requires at least one selected option");
            }
        }
        requireUnchangedQuestionSet(questions, optionsByQuestion, request);
        // Section 4 #12: a duplicate questionId in the submitted answers used to be silently
        // dropped (merge function kept the first, discarded the second) rather than rejected --
        // a malformed or crafted payload with two answers for the same question looked identical
        // to one with a single answer, with no signal to the caller that half their submission
        // was ignored.
        Map<Integer, QuizAnswerRequestDTO> answersByQuestion = request.getAnswers().stream()
                .collect(Collectors.toMap(QuizAnswerRequestDTO::getQuestionId, answer -> answer, (first, second) -> {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Duplicate answer submitted for questionId " + first.getQuestionId());
                }, LinkedHashMap::new));
        Set<Integer> validQuestionIds = questions.stream().map(QuizQuestion::getId).collect(Collectors.toSet());
        if (!answersByQuestion.keySet().equals(validQuestionIds)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Submit exactly one answer for every quiz question");
        }
        for (QuizQuestion question : questions) {
            List<Integer> selected = answersByQuestion.get(question.getId()).getSelectedOptionIds();
            if (new HashSet<>(selected).size() != selected.size()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Duplicate selected option submitted for questionId " + question.getId());
            }
            if (SINGLE_CHOICE.equals(question.getQuestionType()) && selected.size() != 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Single choice questions require exactly one selected option");
            }
        }

        long score = 0;
        List<QuizAnswer> savedAnswers = new ArrayList<>();
        QuizAttempt attempt = new QuizAttempt();
        attempt.setQuizId(quizId);
        attempt.setLearnerId(principal.getId());
        attempt.setAttemptNumber(existingAttempts + 1);
        attempt.setStatus("SUBMITTED");
        attempt.setMaxScore(quiz.getTotalPoints());
        attempt.setSubmittedAt(LocalDateTime.now());
        attempt = quizAttemptRepository.save(attempt);

        for (QuizQuestion question : questions) {
            QuizAnswerRequestDTO submitted = answersByQuestion.get(question.getId());
            Set<Integer> selectedIds = submitted == null ? new HashSet<>() : new HashSet<>(submitted.getSelectedOptionIds());
            Set<Integer> validOptionIds = optionsByQuestion.getOrDefault(question.getId(), List.of()).stream().map(QuizOption::getId).collect(Collectors.toSet());
            if (!validOptionIds.containsAll(selectedIds)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected option does not belong to this question");
            }
            Set<Integer> correctIds = canonicalCorrectOptionIds(
                    question,
                    optionsByQuestion.getOrDefault(question.getId(), List.of())
            );
            boolean correct = !selectedIds.isEmpty() && selectedIds.equals(correctIds);
            long pointsAwarded = correct ? question.getPoints() : 0;
            score += pointsAwarded;

            QuizAnswer answer = new QuizAnswer();
            answer.setAttemptId(attempt.getId());
            answer.setQuestionId(question.getId());
            answer.setSelectedOptionIds(selectedIds.stream().sorted().map(String::valueOf).collect(Collectors.joining(",")));
            answer.setCorrect(correct);
            answer.setPointsAwarded(pointsAwarded);
            savedAnswers.add(answer);
        }
        attempt.setScore(score);
        quizAttemptRepository.save(attempt);
        quizAnswerRepository.saveAll(savedAnswers);
        // No learner_content_progress write here (LRN-P0-02): that table is keyed by lesson-content id, a
        // quiz id is a different namespace, so writing quizId there marked an unrelated video/resource
        // complete. A quiz's completion is the attempt itself; the Learning Path reads the quiz list's
        // per-learner `submitted` flag and admin progress counts attempts.
        return toAttemptResponse(attempt, savedAnswers, null, learnerCanSeeAttemptResults(quiz, existingAttempts + 1));
    }

    /**
     * LRN-Q-01: nothing pins the question set when a learner opens a quiz, so a teacher can edit it
     * while they answer. Before anything is saved, refuse a submission that no longer matches the
     * current questions (answers to removed questions or options, or a shown set that differs from
     * today's) with a 409 the learner can act on, instead of scoring it against different questions
     * (answers to removed questions used to be dropped silently, new questions scored as unanswered).
     */
    static void requireUnchangedQuestionSet(List<QuizQuestion> questions, Map<Integer, List<QuizOption>> optionsByQuestion,
                                            QuizSubmitRequestDTO request) {
        Set<Integer> currentIds = questions.stream().map(QuizQuestion::getId).collect(Collectors.toSet());
        boolean changed = request.getShownQuestionIds() != null
                && !new HashSet<>(request.getShownQuestionIds()).equals(currentIds);
        for (QuizAnswerRequestDTO answer : request.getAnswers()) {
            if (changed) break;
            if (!currentIds.contains(answer.getQuestionId())) { changed = true; break; }
            Set<Integer> valid = optionsByQuestion.getOrDefault(answer.getQuestionId(), List.of()).stream()
                    .map(QuizOption::getId).collect(Collectors.toSet());
            if (answer.getSelectedOptionIds() != null && !valid.containsAll(answer.getSelectedOptionIds())) changed = true;
        }
        if (changed) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Your teacher changed this quiz while you were answering. Reload the quiz to see the current questions; this attempt was not counted.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizAttemptResponseDTO> getSubmissions(int quizId, UserPrincipal principal) {
        Quiz quiz = findQuiz(quizId);
        requireQuizManagementAccess(quiz, principal);
        List<QuizAttempt> attempts = quizAttemptRepository.findByQuizIdAndIsDeletedFalseOrderBySubmittedAtDesc(quizId);
        Map<Integer, List<QuizAnswer>> answersByAttempt = attempts.isEmpty()
                ? Map.of()
                : quizAnswerRepository
                    .findByAttemptIdInAndIsDeletedFalse(attempts.stream().map(QuizAttempt::getId).collect(Collectors.toList()))
                    .stream()
                    .collect(Collectors.groupingBy(QuizAnswer::getAttemptId));
        Map<Integer, Learner> learnersById = learnersById(attempts);
        return attempts.stream()
                .map(attempt -> toAttemptResponse(
                        attempt,
                        answersByAttempt.getOrDefault(attempt.getId(), List.of()),
                        learnersById.get(attempt.getLearnerId()),
                        true
                ))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizAttemptResponseDTO> getMySubmissions(Integer quizId, UserPrincipal principal) {
        if (principal == null || !principal.isLearner() || principal.getId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only learners can view their quiz submissions");
        }
        List<QuizAttempt> attempts = quizId != null && quizId > 0
                ? quizAttemptRepository.findByQuizIdAndLearnerIdAndIsDeletedFalseOrderByAttemptNumberDesc(quizId, principal.getId())
                : quizAttemptRepository.findByLearnerIdAndIsDeletedFalseOrderBySubmittedAtDesc(principal.getId());
        if (quizId != null && quizId > 0) {
            requireQuizAccess(findQuizIncludingDeleted(quizId), principal);
        }
        Map<Integer, List<QuizAnswer>> answersByAttempt = attempts.isEmpty()
                ? Map.of()
                : quizAnswerRepository
                    .findByAttemptIdInAndIsDeletedFalse(attempts.stream().map(QuizAttempt::getId).collect(Collectors.toList()))
                    .stream()
                    .collect(Collectors.groupingBy(QuizAnswer::getAttemptId));
        Map<Integer, Learner> learnersById = learnersById(attempts);
        return attempts.stream()
                .filter(attempt -> {
                    try {
                        requireQuizAccess(findQuizIncludingDeleted(attempt.getQuizId()), principal);
                        return true;
                    } catch (RuntimeException ignored) {
                        return false;
                    }
                })
                .map(attempt -> {
                    Quiz quiz = findQuizIncludingDeleted(attempt.getQuizId());
                    boolean revealResults = learnerCanSeeAttemptResults(quiz, attempt.getAttemptNumber());
                    return toAttemptResponse(
                            attempt,
                            answersByAttempt.getOrDefault(attempt.getId(), List.of()),
                            learnersById.get(attempt.getLearnerId()),
                            revealResults
                    );
                })
                .collect(Collectors.toList());
    }

    private void applyQuizFields(Quiz quiz, QuizUpsertRequestDTO request, UserPrincipal principal) {
        // Enforced server-side, not just in the create-quiz form — the /allQuizzes list page has
        // no way to render a due date that was never set, and a missing due date also breaks the
        // exam-eligibility/at-risk logic that assumes every quiz has a real deadline.
        if (request.getDueAt() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Due date is required");
        }
        if (request.getMaxAttempts() < 1 || request.getMaxAttempts() > 20) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attempts must be between 1 and 20");
        }
        quiz.setLessonId(request.getLessonId());
        quiz.setCourseId(request.getCourseId());
        quiz.setClassId(request.getClassId());
        if (quiz.getId() <= 0 || quiz.getFacultyId() == null) {
            quiz.setFacultyId(principal.getId());
        }
        quiz.setTitle(request.getTitle().trim());
        quiz.setDescription(request.getDescription());
        quiz.setDueAt(request.getDueAt());
        quiz.setMaxAttempts(Math.max(1, request.getMaxAttempts()));
        quiz.setShuffleQuestions(request.isShuffleQuestions());
        quiz.setShuffleOptions(request.isShuffleOptions());
        if (quiz.getId() <= 0) {
            quiz.setStatus(request.isPublish() ? "PUBLISHED" : "DRAFT");
            quiz.setActive(true);
            quiz.setEnabled(true);
        }
    }

    private void requireScopeUnchanged(Quiz quiz, QuizUpsertRequestDTO request) {
        Integer existingClassId = quiz.getClassId() != null && quiz.getClassId() > 0 ? quiz.getClassId() : null;
        Integer requestedClassId = request.getClassId() != null && request.getClassId() > 0 ? request.getClassId() : null;
        if (!Objects.equals(quiz.getLessonId(), request.getLessonId())
                || !Objects.equals(quiz.getCourseId(), request.getCourseId())
                || !Objects.equals(existingClassId, requestedClassId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Quiz lesson, course and class scope cannot be changed after creation");
        }
    }

    private void saveQuestions(Quiz quiz, List<QuizQuestionRequestDTO> requestQuestions) {
        for (QuizQuestionRequestDTO requestQuestion : requestQuestions) {
            String normalizedType = normalizeType(requestQuestion.getType());
            if (!SINGLE_CHOICE.equals(normalizedType) && !MULTIPLE_CHOICE.equals(normalizedType)) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST,
                        "Invalid question type: " + requestQuestion.getType() + " (expected single/multiple choice)");
            }
        }
        int sequence = 0;
        for (QuizQuestionRequestDTO requestQuestion : requestQuestions) {
            QuizQuestion question = new QuizQuestion();
            question.setQuizId(quiz.getId());
            question.setQuestionType(normalizeType(requestQuestion.getType()));
            question.setPrompt(requestQuestion.getPrompt().trim());
            question.setPoints(requestQuestion.getPoints());
            question.setSequence(sequence++);
            question = quizQuestionRepository.save(question);

            int optionSequence = 0;
            Integer canonicalSingleChoiceIndex = null;
            if (SINGLE_CHOICE.equals(question.getQuestionType())) {
                for (int idx = 0; idx < requestQuestion.getOptions().size(); idx++) {
                    if (requestQuestion.getOptions().get(idx).isCorrect()) {
                        canonicalSingleChoiceIndex = idx;
                        break;
                    }
                }
            }
            for (QuizOptionRequestDTO requestOption : requestQuestion.getOptions()) {
                QuizOption option = new QuizOption();
                option.setQuestionId(question.getId());
                option.setOptionText(requestOption.getText().trim());
                option.setCorrect(SINGLE_CHOICE.equals(question.getQuestionType())
                        ? Objects.equals(canonicalSingleChoiceIndex, optionSequence)
                        : requestOption.isCorrect());
                option.setSequence(optionSequence++);
                quizOptionRepository.save(option);
            }
        }
    }

    private void validateScope(QuizUpsertRequestDTO request, UserPrincipal principal,
                               boolean requireCurrentTarget) {
        Lesson lesson = lessonRepository.findById(request.getLessonId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));
        if (lesson.getCourseId() != request.getCourseId()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lesson does not belong to the selected course");
        }
        accessControlService.requireAccessCourse(principal, request.getCourseId());
        if (request.getClassId() != null && request.getClassId() > 0) {
            accessControlService.requireAccessClass(principal, request.getClassId());
            if (requireCurrentTarget) {
                accessControlService.requireCurrentCourseAudienceClass(
                        request.getClassId(), request.getCourseId());
            }
        }
        if (principal != null && principal.isFaculty()
                && !"ADMIN".equalsIgnoreCase(principal.getFacultyType())
                && !accessControlService.isSuperAdmin(principal)) {
            boolean assigned = request.getClassId() != null && request.getClassId() > 0
                    ? facultyTeachingAssignmentRepository != null
                        && facultyTeachingAssignmentRepository.existsByFacultyIdAndCourseIdAndClassIdAndIsActive(
                                principal.getId(), request.getCourseId(), request.getClassId(), true)
                    : facultyTeachingAssignmentRepository != null
                        && facultyTeachingAssignmentRepository.existsByFacultyIdAndCourseIdAndIsActive(
                                principal.getId(), request.getCourseId(), true);
            if (!assigned) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You may create quizzes only for courses and classes you actively teach");
            }
        }
    }

    private static final int MAX_QUIZ_QUESTIONS = 200;
    private static final int MAX_OPTIONS_PER_QUESTION = 20;
    private static final long MAX_POINTS_PER_QUESTION = 100;

    private void validateQuestions(List<QuizQuestionRequestDTO> questions) {
        if (questions == null || questions.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz needs at least one question");
        }
        if (questions.size() > MAX_QUIZ_QUESTIONS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Quiz cannot contain more than " + MAX_QUIZ_QUESTIONS + " questions");
        }
        for (QuizQuestionRequestDTO question : questions) {
            if (question == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz questions cannot be null");
            }
            String type = normalizeType(question.getType());
            if (!SINGLE_CHOICE.equals(type) && !MULTIPLE_CHOICE.equals(type)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only single choice and multiple choice questions are supported");
            }
            if (question.getPrompt() == null || question.getPrompt().trim().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each question needs a prompt");
            }
            if (question.getPoints() < 1 || question.getPoints() > MAX_POINTS_PER_QUESTION) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Question points must be between 1 and " + MAX_POINTS_PER_QUESTION);
            }
            if (question.getOptions() == null || question.getOptions().size() < 2) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each question needs at least two options");
            }
            if (question.getOptions().size() > MAX_OPTIONS_PER_QUESTION) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "A question cannot contain more than " + MAX_OPTIONS_PER_QUESTION + " options");
            }
            for (QuizOptionRequestDTO option : question.getOptions()) {
                if (option == null || option.getText() == null || option.getText().trim().isEmpty()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz options cannot be empty");
                }
            }
            long correctCount = question.getOptions().stream().filter(QuizOptionRequestDTO::isCorrect).count();
            if (SINGLE_CHOICE.equals(type) && correctCount != 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Single choice questions need exactly one correct option");
            }
            if (MULTIPLE_CHOICE.equals(type) && correctCount < 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Multiple choice questions need at least one correct option");
            }
        }
    }

    private void refreshTotalPoints(int quizId) {
        Quiz quiz = findQuiz(quizId);
        long total = quizQuestionRepository.findByQuizIdAndIsDeletedFalseOrderBySequenceAscIdAsc(quizId)
                .stream()
                .mapToLong(QuizQuestion::getPoints)
                .sum();
        quiz.setTotalPoints(total);
        quizRepository.save(quiz);
    }

    private QuizResponseDTO toQuizResponse(Quiz quiz, boolean includeCorrectAnswers) {
        return toQuizResponse(quiz, includeCorrectAnswers, true, null, null);
    }

    private QuizResponseDTO toQuizResponse(Quiz quiz, boolean includeCorrectAnswers, boolean isPrivileged) {
        return toQuizResponse(quiz, includeCorrectAnswers, isPrivileged, null, null);
    }

    private QuizResponseDTO toQuizResponse(Quiz quiz, boolean includeCorrectAnswers, boolean isPrivileged, QuizAttempt latestAttempt, Long attemptCount) {
        // Grade-publish gate: a learner sees no score/correct-answers until the quiz is
        // published, mirroring StudentAssignment.isGradePublished. Faculty/admin always see
        // scores regardless -- they need to review before publishing.
        boolean scoreVisible = isPrivileged
                || (latestAttempt != null && learnerCanSeeAttemptResults(quiz, latestAttempt.getAttemptNumber()));
        boolean effectiveIncludeCorrectAnswers = includeCorrectAnswers
                && (isPrivileged || (quiz.isGradePublished() && isPastDue(quiz.getDueAt())));
        List<QuizQuestion> loadedQuestions = quizQuestionRepository.findByQuizIdAndIsDeletedFalseOrderBySequenceAscIdAsc(quiz.getId());
        Map<Integer, List<QuizOption>> loadedOptions = optionsByQuestion(loadedQuestions);
        // Audit 2.7: randomise per learner, never for faculty/admin -- whoever is reviewing or
        // editing a quiz needs to see it in its authored order.
        if (!isPrivileged) {
            Integer viewerId = null;
            if (latestAttempt != null) {
                viewerId = latestAttempt.getLearnerId();
            } else {
                viewerId = currentLearnerId();
            }
            if (viewerId != null) {
                if (quiz.isShuffleQuestions()) {
                    loadedQuestions = shuffledCopy(loadedQuestions, seedFor(quiz.getId(), viewerId, 0));
                }
                if (quiz.isShuffleOptions()) {
                    Map<Integer, List<QuizOption>> shuffledOptions = new LinkedHashMap<>();
                    for (QuizQuestion q : loadedQuestions) {
                        shuffledOptions.put(q.getId(), shuffledCopy(
                                loadedOptions.getOrDefault(q.getId(), List.of()),
                                seedFor(quiz.getId(), viewerId, q.getId())));
                    }
                    loadedOptions = shuffledOptions;
                }
            }
        }
        final List<QuizQuestion> questions = loadedQuestions;
        final Map<Integer, List<QuizOption>> optionsByQuestion = loadedOptions;
        Lesson lesson = quiz.getLessonId() > 0 ? lessonRepository.fetchCourseId(quiz.getLessonId()) : null;
        Course course = quiz.getCourseId() > 0 ? courseRepository.fetchCourse(quiz.getCourseId()) : null;
        return QuizResponseDTO.builder()
                .id(quiz.getId())
                .lessonId(quiz.getLessonId())
                .lessonName(lesson == null ? null : lesson.getLessonName())
                .courseId(quiz.getCourseId())
                .courseName(course == null ? null : course.getCourseName())
                .classId(quiz.getClassId())
                .facultyId(quiz.getFacultyId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .status(quiz.getStatus())
                .dueAt(quiz.getDueAt())
                .maxAttempts(quiz.getMaxAttempts())
                .shuffleQuestions(quiz.isShuffleQuestions())
                .shuffleOptions(quiz.isShuffleOptions())
                .totalPoints(quiz.getTotalPoints())
                .attemptCount(attemptCount == null ? null : attemptCount.intValue())
                .submitted(latestAttempt != null)
                .gradePublished(quiz.isGradePublished())
                .latestScore(latestAttempt == null || !scoreVisible ? null : latestAttempt.getScore())
                .latestMaxScore(latestAttempt == null || !scoreVisible ? null : latestAttempt.getMaxScore())
                .questions(questions.stream()
                        .map(question -> {
                            Set<Integer> correctOptionIds = canonicalCorrectOptionIds(
                                    question,
                                    optionsByQuestion.getOrDefault(question.getId(), List.of())
                            );
                            return QuizQuestionResponseDTO.builder()
                                .id(question.getId())
                                .type(question.getQuestionType())
                                .prompt(question.getPrompt())
                                .points(question.getPoints())
                                .sequence(question.getSequence())
                                .options(optionsByQuestion.getOrDefault(question.getId(), List.of()).stream()
                                        .map(option -> QuizOptionResponseDTO.builder()
                                                .id(option.getId())
                                                .text(option.getOptionText())
                                                .correct(effectiveIncludeCorrectAnswers && correctOptionIds.contains(option.getId()))
                                                .sequence(option.getSequence())
                                                .build())
                                        .collect(Collectors.toList()))
                                .build();
                        })
                        .collect(Collectors.toList()))
                .build();
    }

    private Set<Integer> canonicalCorrectOptionIds(QuizQuestion question, List<QuizOption> options) {
        if (options == null || options.isEmpty()) {
            return Set.of();
        }
        if (SINGLE_CHOICE.equals(question.getQuestionType())) {
            Integer correctId = options.stream()
                    .filter(QuizOption::isCorrect)
                    .sorted(Comparator.comparingInt(QuizOption::getSequence).thenComparingInt(QuizOption::getId))
                    .map(QuizOption::getId)
                    .findFirst()
                    .orElse(null);
            return correctId == null ? Set.of() : Set.of(correctId);
        }
        return options.stream()
                .filter(QuizOption::isCorrect)
                .map(QuizOption::getId)
                .collect(Collectors.toSet());
    }

    private Map<Integer, QuizAttempt> latestAttemptsByQuiz(List<Quiz> quizzes, UserPrincipal principal) {
        if (principal == null || !principal.isLearner() || principal.getId() == null || quizzes == null || quizzes.isEmpty()) {
            return Map.of();
        }
        return quizzes.stream()
                .map(quiz -> quizAttemptRepository.findTopByQuizIdAndLearnerIdAndIsDeletedFalseOrderByAttemptNumberDesc(quiz.getId(), principal.getId()).orElse(null))
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(QuizAttempt::getQuizId, attempt -> attempt, (first, second) -> first));
    }

    private Map<Integer, Long> attemptCountsByQuiz(List<Quiz> quizzes, UserPrincipal principal) {
        if (principal == null || !principal.isLearner() || principal.getId() == null || quizzes == null || quizzes.isEmpty()) {
            return Map.of();
        }
        return quizzes.stream()
                .collect(Collectors.toMap(
                        Quiz::getId,
                        quiz -> (long) quizAttemptRepository.countByQuizIdAndLearnerIdAndIsDeletedFalse(quiz.getId(), principal.getId())
                ));
    }

    private QuizAttemptResponseDTO toAttemptResponse(QuizAttempt attempt, List<QuizAnswer> answers) {
        return toAttemptResponse(attempt, answers, null, true);
    }

    private QuizAttemptResponseDTO toAttemptResponse(QuizAttempt attempt, List<QuizAnswer> answers, Learner learner) {
        return toAttemptResponse(attempt, answers, learner, true);
    }

    private QuizAttemptResponseDTO toAttemptResponse(QuizAttempt attempt, List<QuizAnswer> answers, Learner learner, boolean revealResults) {
        return QuizAttemptResponseDTO.builder()
                .id(attempt.getId())
                .quizId(attempt.getQuizId())
                .learnerId(attempt.getLearnerId())
                .learnerName(displayName(learner))
                .learnerRollNumber(learner == null ? null : learner.getRollNumber())
                .learnerMobile(learner == null ? null : learner.getContactMobile())
                .attemptNumber(attempt.getAttemptNumber())
                .status(attempt.getStatus())
                .score(revealResults ? attempt.getScore() : null)
                .maxScore(revealResults ? attempt.getMaxScore() : null)
                .resultsVisible(revealResults)
                .submittedAt(attempt.getSubmittedAt())
                .answers(answers.stream()
                        .sorted(Comparator.comparingInt(QuizAnswer::getQuestionId))
                        .map(answer -> QuizSubmittedAnswerResponseDTO.builder()
                                .questionId(answer.getQuestionId())
                                .selectedOptionIds(parseIds(answer.getSelectedOptionIds()))
                                .correct(revealResults ? answer.isCorrect() : null)
                                .pointsAwarded(revealResults ? answer.getPointsAwarded() : null)
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }

    private Map<Integer, Learner> learnersById(List<QuizAttempt> attempts) {
        if (attempts == null || attempts.isEmpty()) {
            return Map.of();
        }
        List<Integer> learnerIds = attempts.stream()
                .map(QuizAttempt::getLearnerId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        if (learnerIds.isEmpty()) {
            return Map.of();
        }
        return learnerRepository.findAllById(learnerIds).stream()
                .filter(learner -> !Boolean.TRUE.equals(learner.getIsDeleted()))
                .collect(Collectors.toMap(Learner::getId, learner -> learner, (first, second) -> first));
    }

    private String displayName(Learner learner) {
        if (learner == null) {
            return null;
        }
        String firstName = learner.getFirstName() == null ? "" : learner.getFirstName().trim();
        String lastName = learner.getLastName() == null ? "" : learner.getLastName().trim();
        String name = (firstName + " " + lastName).trim();
        return name.isBlank() ? null : name;
    }

    /**
     * A seeded order, so a learner sees the same arrangement every time they open the quiz.
     *
     * <p>Re-shuffling on each request would move the questions under a learner who simply
     * refreshed the page, or who came back to finish. Seeding on (quiz, learner, question) gives a
     * stable order per learner that still differs between learners, with no extra state to store.
     */
    private <T> List<T> shuffledCopy(List<T> source, long seed) {
        List<T> copy = new java.util.ArrayList<>(source);
        java.util.Collections.shuffle(copy, new java.util.Random(seed));
        return copy;
    }

    private long seedFor(int quizId, int learnerId, int salt) {
        return (long) quizId * 1_000_003L + (long) learnerId * 31L + salt;
    }

    /** The learner viewing this quiz, when there is no attempt to read the id from. */
    private Integer currentLearnerId() {
        try {
            UserPrincipal principal = securityContextUtil != null
                    ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
            return principal != null && principal.isLearner() ? principal.getId() : null;
        } catch (Exception e) {
            // Order is a presentation concern; failing to resolve a viewer must never break the
            // response. Falling through leaves the authored order, which is the current behaviour.
            return null;
        }
    }

    private Map<Integer, List<QuizOption>> optionsByQuestion(List<QuizQuestion> questions) {
        if (questions == null || questions.isEmpty()) {
            return new HashMap<>();
        }
        List<Integer> questionIds = questions.stream().map(QuizQuestion::getId).collect(Collectors.toList());
        return quizOptionRepository.findByQuestionIdInAndIsDeletedFalseOrderBySequenceAscIdAsc(questionIds)
                .stream()
                .collect(Collectors.groupingBy(QuizOption::getQuestionId, LinkedHashMap::new, Collectors.toList()));
    }

    private List<Integer> parseIds(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        List<Integer> ids = new ArrayList<>();
        for (String part : value.split(",")) {
            if (!part.isBlank()) {
                ids.add(Integer.parseInt(part.trim()));
            }
        }
        return ids;
    }

    private Quiz findQuiz(int quizId) {
        return quizRepository.findById(quizId)
                .filter(quiz -> !Boolean.TRUE.equals(quiz.getIsDeleted()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found"));
    }

    private Quiz findQuizForSubmission(int quizId) {
        return quizRepository.lockById(quizId)
                .filter(quiz -> !Boolean.TRUE.equals(quiz.getIsDeleted()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found"));
    }

    private Quiz findQuizIncludingDeleted(int quizId) {
        return quizRepository.findById(quizId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found"));
    }

    private void requireLearnerVisibleQuiz(Quiz quiz) {
        if (quiz == null || Boolean.TRUE.equals(quiz.getIsDeleted())
                || !quiz.isActive() || !quiz.isEnabled()
                || !"PUBLISHED".equalsIgnoreCase(quiz.getStatus())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found");
        }
    }

    private boolean learnerCanSeeAttemptResults(Quiz quiz, int attemptNumber) {
        return quiz != null && quiz.isGradePublished() && isPastDue(quiz.getDueAt());
    }

    private void requireQuizAccess(Quiz quiz, UserPrincipal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        // Both scopes must hold: a class-scoped quiz is NOT exempt from its course
        // entitlement. This also closes legacy/malformed class-course mismatches.
        accessControlService.requireAccessCourse(principal, quiz.getCourseId());
        if (quiz.getClassId() != null && quiz.getClassId() > 0) {
            accessControlService.requireAccessClass(principal, quiz.getClassId());
        }
    }

    /** True when this faculty member may manage the quiz (the same rule as requireQuizManagementAccess, without throwing). */
    private boolean managesQuiz(Quiz quiz, UserPrincipal principal) {
        try {
            requireQuizManagementAccess(quiz, principal);
            return true;
        } catch (AccessDeniedException | org.springframework.web.server.ResponseStatusException e) {
            return false;
        }
    }

    private void requireQuizManagementAccess(Quiz quiz, UserPrincipal principal) {
        requireFaculty(principal);
        // Ordering matters: requireQuizAccess (above) is what actually enforces the college/class
        // scope boundary for a scoped superadmin or college admin. The ownership/adminness check
        // below has no independent scope check of its own — if this call site is ever refactored
        // to skip requireQuizAccess, the check below alone would NOT re-verify college scope.
        requireQuizAccess(quiz, principal);
        if (!accessControlService.isGlobalSuperAdmin(principal)
                && !Objects.equals(quiz.getFacultyId(), principal.getId())
                && !"ADMIN".equalsIgnoreCase(principal.getFacultyType())
                && !isActiveTeachingAssignmentOnQuiz(quiz, principal)) {
            throw new AccessDeniedException("Only the quiz owner, an assigned co-teacher/TA, or admin can manage this quiz");
        }
    }

    /** Section 4 #5: a co-teacher or TA with an active FacultyTeachingAssignment on this quiz's
     *  course (and class, if the quiz is class-scoped) may manage it alongside the owner/admin. */
    private boolean isActiveTeachingAssignmentOnQuiz(Quiz quiz, UserPrincipal principal) {
        if (facultyTeachingAssignmentRepository == null || principal.getId() == null) {
            return false;
        }
        return facultyTeachingAssignmentRepository.findByFacultyIdAndIsActive(principal.getId(), true).stream()
                .anyMatch(a -> a.getCourseId() != null && a.getCourseId() == quiz.getCourseId()
                        && (quiz.getClassId() == null || quiz.getClassId() <= 0
                                || (a.getClassId() != null && a.getClassId().equals(quiz.getClassId()))));
    }

    private void requireFaculty(UserPrincipal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        if (!principal.isFaculty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only faculty can manage quizzes");
        }
    }

    private String normalizeType(String type) {
        if (type == null) {
            return "";
        }
        String normalized = type.trim().toUpperCase();
        if ("SINGLE".equals(normalized)) return SINGLE_CHOICE;
        if ("MULTIPLE".equals(normalized)) return MULTIPLE_CHOICE;
        return normalized;
    }
}
