package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.request.QuizSubmitRequestDTO;
import com._42students.lms.dto.request.QuizUpsertRequestDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.Course;
import com._42students.lms.repository.CourseRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.QuizService;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/v1/quizzes")
@Validated
public class QuizController extends BaseController {
    private final QuizService quizService;
    private final SecurityContextUtil securityContextUtil;
    private final CourseRepository courseRepository;
    private final AccessControlService accessControlService;

    public QuizController(QuizService quizService, SecurityContextUtil securityContextUtil, CourseRepository courseRepository, AccessControlService accessControlService) {
        this.quizService = quizService;
        this.securityContextUtil = securityContextUtil;
        this.courseRepository = courseRepository;
        this.accessControlService = accessControlService;
    }

    /** courseSlug (public identifier, used by course-filter dropdowns) takes precedence over a raw courseId if both are supplied. */
    private Integer resolveCourseId(String courseSlug, Integer courseId) {
        if (courseSlug == null || courseSlug.isBlank()) return courseId;
        Course course = courseRepository.findBySlug(courseSlug.trim());
        if (course == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found");
        }
        return course.getId();
    }

    @PostMapping(produces = "application/json")
    public ResponseEntity<Response> createQuiz(@Valid @RequestBody QuizUpsertRequestDTO request) {
        return ok(quizService.createQuiz(request, principal()));
    }

    @PutMapping(value = "/{quizId}", produces = "application/json")
    public ResponseEntity<Response> updateQuiz(@PathVariable int quizId,
                                               @Valid @RequestBody QuizUpsertRequestDTO request) {
        return ok(quizService.updateQuiz(quizId, request, principal()));
    }

    @PatchMapping(value = "/{quizId}/publish", produces = "application/json")
    public ResponseEntity<Response> publishQuiz(@PathVariable int quizId) {
        return ok(quizService.publishQuiz(quizId, principal()));
    }

    // Section 4 #3: previously publishQuiz was the only status mutator -- a mistakenly published
    // quiz couldn't be pulled back at all.
    @PatchMapping(value = "/{quizId}/unpublish", produces = "application/json")
    public ResponseEntity<Response> unpublishQuiz(@PathVariable int quizId) {
        return ok(quizService.unpublishQuiz(quizId, principal()));
    }

    @DeleteMapping(value = "/{quizId}", produces = "application/json")
    public ResponseEntity<Response> deleteQuiz(@PathVariable int quizId) {
        quizService.deleteQuiz(quizId, principal());
        return ok(null);
    }

    // Distinct from /publish above: that toggles the quiz's own status (DRAFT/PUBLISHED --
    // whether the quiz is available at all). This toggles whether LEARNERS can see their
    // score/correct-answers on a quiz they've already taken -- faculty/admin always see them.
    // Previously there was no such control anywhere: scores were visible the instant submitQuiz
    // returned, with no way to hold results for review or correct a bad answer key first.
    @PatchMapping(value = "/{quizId}/publish-grades", produces = "application/json")
    public ResponseEntity<Response> publishGrades(@PathVariable int quizId) {
        return ok(quizService.setGradePublished(quizId, true, principal()));
    }

    @PatchMapping(value = "/{quizId}/unpublish-grades", produces = "application/json")
    public ResponseEntity<Response> unpublishGrades(@PathVariable int quizId) {
        return ok(quizService.setGradePublished(quizId, false, principal()));
    }

    @GetMapping(value = "/{quizId}", produces = "application/json")
    public ResponseEntity<Response> getQuiz(@PathVariable int quizId,
                                            @RequestParam(defaultValue = "false") boolean includeCorrectAnswers) {
        return ok(quizService.getQuiz(quizId, principal(), includeCorrectAnswers));
    }

    @GetMapping(produces = "application/json")
    public ResponseEntity<Response> listQuizzes(@RequestParam(required = false) Integer courseId,
                                                @RequestParam(required = false) String courseSlug,
                                                @RequestParam(required = false) Integer lessonId,
                                                @RequestParam(required = false) Integer classId,
                                                @RequestParam(required = false) Integer page,
                                                @RequestParam(required = false) Integer size) {
        // page/size present (and no lessonId — that path is for a single lesson's few quizzes,
        // never the "hundreds of quizzes" list page) = paginated response; otherwise unchanged,
        // so every existing unpaginated caller (course roadmap, lesson content merge, etc.) keeps
        // getting a plain array back.
        Integer resolvedCourseId = resolveCourseId(courseSlug, courseId);
        if (lessonId == null && (page != null || size != null)) {
            return ok(quizService.listQuizzesPaged(resolvedCourseId, classId, page == null ? 0 : page, size == null ? 20 : size, principal()));
        }
        return ok(quizService.listQuizzes(resolvedCourseId, lessonId, classId, principal()));
    }

    @GetMapping(value = "/{quizId}/attempt", produces = "application/json")
    public ResponseEntity<Response> getQuizForAttempt(@PathVariable int quizId) {
        return ok(quizService.getQuizForAttempt(quizId, principal()));
    }

    @PostMapping(value = "/{quizId}/submit", produces = "application/json")
    public ResponseEntity<Response> submitQuiz(@PathVariable int quizId,
                                               @Valid @RequestBody QuizSubmitRequestDTO request) {
        try {
            return ok(quizService.submitQuiz(quizId, request, principal()));
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // submitQuiz reads the attempt count and then inserts, so two concurrent submissions
            // can both compute the same attempt_number. The DB catches that via
            // uk_quiz_attempt_learner_number (quiz_id, learner_id, attempt_number) and rolls the
            // losing transaction back — correct, but it surfaced as an opaque 500. Caught here,
            // OUTSIDE the @Transactional service method (catching it inside would leave the
            // transaction rollback-only), and translated into a 409 the client can act on.
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This attempt was already recorded. Refresh to see your submission.");
        }
    }

    @GetMapping(value = "/{quizId}/submissions", produces = "application/json")
    public ResponseEntity<Response> getSubmissions(@PathVariable int quizId) {
        return ok(quizService.getSubmissions(quizId, principal()));
    }

    @GetMapping(value = "/my-submissions", produces = "application/json")
    public ResponseEntity<Response> getMySubmissions(@RequestParam(required = false) Integer quizId) {
        return ok(quizService.getMySubmissions(quizId, principal()));
    }

    private UserPrincipal principal() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return principal;
    }

    private ResponseEntity<Response> ok(Object data) {
        return new ResponseEntity<>(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), data), HttpStatus.OK);
    }
}
