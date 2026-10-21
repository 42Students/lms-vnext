package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import org.springframework.security.access.AccessDeniedException;
import com._42students.lms.dto.request.StudentAssignmentDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.dto.response.SubmissionStatsDTO;
import com._42students.lms.model.StudentAssignment;
import com._42students.lms.service.AssignmentService;
import com._42students.lms.service.LessonContentsService;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;
import javax.validation.constraints.Min;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/assignment")
@Slf4j
@Validated
public class AssignmentController extends BaseController {

    private static final int MAX_SUBMISSIONS_PAGE_SIZE = 100;

    @Autowired
    AssignmentService assignmentService;

    @Autowired
    LessonContentsService lessonContentsService;

    @Autowired
    AccessControlService accessControlService;

    @Autowired
    SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    com._42students.lms.repository.FacultyTeachingAssignmentRepository facultyTeachingAssignmentRepository;

    private void requireAuthenticated() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
    }

    /** Submission reads (list, stats): browse scope plus an active teaching assignment for ordinary faculty (F-051). */
    private void requireTeachingReadScope(UserPrincipal principal, Integer lessonContentId) {
        requireAccessLessonContent(principal, lessonContentId);
        var lc = lessonContentsService.findById(lessonContentId).orElseThrow();
        if (principal.getId() != null && java.util.Objects.equals(lc.getFacultyId(), principal.getId())) return;
        accessControlService.requireTeachingScope(principal, lc.getCourseId(), lc.getClassId());
    }

    private void requireAccessLessonContent(UserPrincipal principal, Integer lessonContentId) {
        if (lessonContentId == null || lessonContentId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "lessonContentId must be a positive integer");
        }
        var lcOpt = lessonContentsService.findById(lessonContentId);
        if (lcOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson content not found");
        }
        var lc = lcOpt.get();
        // Course AND class are independent authorization boundaries. Checking only the
        // class allowed a mismatched or legacy row to bypass its course/tenant entitlement.
        Integer courseId = lc.getCourseId();
        Integer classId = lc.getClassId();
        if ((courseId == null || courseId <= 0) && (classId == null || classId <= 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lesson content is missing class/course scope");
        }
        // Preserve legitimate legacy class-only rows; generic rows MUST have a course.
        if (courseId != null && courseId > 0) {
            accessControlService.requireAccessCourse(principal, courseId);
        }
        if (classId != null && classId > 0) {
            accessControlService.requireAccessClass(principal, classId);
        }
    }

    /**
     * Grading rights for a submission, on top of {@link #requireAccessLessonContent}.
     * Scope access alone is not grading authorization: plain faculty must own the content,
     * have graded the submission already, or actively teach the course and applicable class.
     * Admins/superadmins are allowed only within their scope (checked above).
     */
    private void requireCanGradeSubmission(UserPrincipal principal, StudentAssignment submission) {
        requireAccessLessonContent(principal, submission != null ? submission.getLessonContentId() : null);
        if (principal == null) {
            throw new AccessDeniedException("Authentication required");
        }
        if (accessControlService.isSuperAdmin(principal) || "ADMIN".equalsIgnoreCase(principal.getFacultyType())) {
            return;
        }
        Integer principalId = principal.getId();
        if (principalId == null) {
            throw new AccessDeniedException("You cannot grade this submission");
        }
        if (Objects.equals(submission.getGradedBy(), principalId)
                || Objects.equals(submission.getFacultyId(), principalId)) {
            return;
        }
        var lc = lessonContentsService.findById(submission.getLessonContentId()).orElse(null);
        if (lc != null) {
            if (Objects.equals(lc.getFacultyId(), principalId)) {
                return;
            }
            Integer courseId = lc.getCourseId();
            if (courseId != null && courseId > 0 && facultyTeachingAssignmentRepository != null) {
                boolean teaches = (lc.getClassId() != null && lc.getClassId() > 0)
                        ? facultyTeachingAssignmentRepository
                            .existsByFacultyIdAndCourseIdAndClassIdAndIsActive(principalId, courseId, lc.getClassId(), true)
                        : facultyTeachingAssignmentRepository
                            .existsByFacultyIdAndCourseIdAndIsActive(principalId, courseId, true);
                if (teaches) {
                    return;
                }
            }
        }
        throw new AccessDeniedException("You can only grade submissions for courses you teach");
    }

    @RequestMapping(value = "/submit", method = RequestMethod.POST, produces = "application/json")
    @ApiOperation(value = "Submit assignment", notes = "Send lesson_content_id, student_id, file_dto or html_content (content type must be 'assignment'). Quizzes are submitted via POST /api/v1/quizzes/{quizId}/submit, not this endpoint.")
    public ResponseEntity submit(@Valid @RequestBody StudentAssignmentDTO studentAssignmentDTO) {
        requireAuthenticated();
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (studentAssignmentDTO.getLessonContentId() <= 0) {
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), "lessonContentId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        if (principal == null) {
            return new ResponseEntity(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        if (!principal.isLearner()) {
            return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Only learners can submit assignments", null), HttpStatus.FORBIDDEN);
        }
        if (principal.getId() == null || principal.getId() <= 0) {
            return new ResponseEntity(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        studentAssignmentDTO.setStudentId(principal.getId());
        requireAccessLessonContent(principal, studentAssignmentDTO.getLessonContentId());
        try {
            StudentAssignment studentAssignment = assignmentService.submit(studentAssignmentDTO);
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), studentAssignment),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @RequestMapping(value = "/fetchSubmissions", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch assignment submissions by lesson content id", notes = "Optional query params: page (0-based), size. When both provided, returns paged result with content, totalElements, totalPages.")
    public ResponseEntity fetchSubmissions(
            @RequestParam @Min(1) int lessonContentId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        requireAuthenticated();
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal.isLearner()) {
            return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Learners cannot view all submissions", null), HttpStatus.FORBIDDEN);
        }
        requireTeachingReadScope(principal, lessonContentId);
        if (page != null && size != null) {
            if (page < 0 || size <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "page must be nonnegative and size must be positive");
            }
            // A caller-supplied size previously bypassed the default cap and permitted
            // unbounded roster/submission reads through this endpoint.
            Pageable pageable = PageRequest.of(page, Math.min(size, MAX_SUBMISSIONS_PAGE_SIZE));
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                    assignmentService.fetchSubmissions(lessonContentId, pageable)), HttpStatus.OK);
        }
        // Legacy callers without both paging parameters receive a capped array.
        org.springframework.data.domain.Page<StudentAssignment> pageResult =
                assignmentService.fetchSubmissions(lessonContentId, PageRequest.of(0, 50));
        List<StudentAssignment> studentAssignmentList = pageResult.getContent();
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), studentAssignmentList),
                HttpStatus.OK);
    }

    @RequestMapping(value = "/fetchSubmissionsByLearnerId", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch assignment submissions by learner id", notes = "")
    public ResponseEntity fetchSubmissionsByLearnerId(@RequestParam int learnerId) {
        if (learnerId <= 0) {
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), "learnerId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal != null && principal.isLearner() && principal.getId() != null && principal.getId() > 0 && !Objects.equals(principal.getId(), learnerId)) {
            return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Learners may only fetch their own submissions", null), HttpStatus.FORBIDDEN);
        }
        accessControlService.requireAccessLearner(principal, learnerId);
        List<StudentAssignment> studentAssignmentList = assignmentService.fetchSubmissionsByLearnerId(learnerId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), studentAssignmentList), HttpStatus.OK);
    }

    @RequestMapping(value = "/submissionStats", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get submission statistics for a lesson content", notes = "")
    public ResponseEntity getSubmissionStats(@RequestParam int lessonContentId) throws Exception {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null || principal.isLearner()) {
            return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Only faculty/admin can view submission stats", null), HttpStatus.FORBIDDEN);
        }
        if (lessonContentId <= 0) {
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), "lessonContentId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        // Stats are private even for shared assignments (class_id NULL/0).
        // Require both available course and class scopes before doing any statistics work.
        requireTeachingReadScope(principal, lessonContentId);
        SubmissionStatsDTO submissionStats = assignmentService.getSubmissionStats(lessonContentId);
        if (submissionStats == null) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "No assignments found for the given lesson content ID.", null), HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), submissionStats), HttpStatus.OK);
    }

    @GetMapping(value = "/submissionStats/bulk", produces = "application/json")
    @ApiOperation(value = "Get submission statistics for multiple lesson contents", notes = "Faculty/admin only. Returns a map of lessonContentId -> SubmissionStatsDTO.")
    public ResponseEntity getSubmissionStatsBulk(@RequestParam(name = "lessonContentIds") List<Integer> lessonContentIds) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null || principal.isLearner()) {
            return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Only faculty/admin can view submission statistics", null), HttpStatus.FORBIDDEN);
        }
        if (lessonContentIds == null || lessonContentIds.isEmpty()) {
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), "lessonContentIds is required", null), HttpStatus.BAD_REQUEST);
        }
        final int MAX_IDS = 100;
        List<Integer> sanitizedIds = lessonContentIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .limit(MAX_IDS)
                .collect(Collectors.toList());
        if (sanitizedIds.isEmpty()) {
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), "No valid lessonContentIds provided", null), HttpStatus.BAD_REQUEST);
        }
        Map<Integer, SubmissionStatsDTO> out = new LinkedHashMap<>();
        for (Integer id : sanitizedIds) {
            try {
                // Use the same course + class access check as single-stat requests.
                requireTeachingReadScope(principal, id);
            } catch (AccessDeniedException | ResponseStatusException denied) {
                // Preserve existing bulk semantics: omit unauthorized/missing IDs.
                continue;
            }
            SubmissionStatsDTO stats = assignmentService.getSubmissionStats(id);
            out.put(id, stats);
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), out), HttpStatus.OK);
    }

    @RequestMapping(value = "/updatePoints", method = RequestMethod.PATCH, produces = "application/json")
    @ApiOperation(value = "Update points obtained for a student assignment", notes = "")
    public ResponseEntity updatePoints(@RequestParam int studentAssignmentId,
                                       @RequestParam @Min(value = 0, message = "Points cannot be negative") long pointsObtained) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null || principal.isLearner()) {
            return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Only faculty/admin can update points", null), HttpStatus.FORBIDDEN);
        }
        if (pointsObtained < 0) {
            return ResponseEntity.badRequest().body("Points cannot be negative");
        }
        // Do not catch authorization or optimistic-lock errors here: Spring must preserve
        // their 403/409 status instead of reporting a misleading 400 to the client.
        try {
            StudentAssignment existing = assignmentService.fetchSubmission(studentAssignmentId);
            if (existing != null) {
                requireCanGradeSubmission(principal, existing);
            }
            StudentAssignment studentAssignment = assignmentService.updatePoints(studentAssignmentId, pointsObtained);
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), studentAssignment), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @RequestMapping(value = "/publishGrade", method = RequestMethod.POST, produces = "application/json")
    @ApiOperation(value = "Publish grade so it becomes visible to the learner (AQ-05)", notes = "Only faculty/admin may publish. Grade must be set before publishing.")
    public ResponseEntity publishGrade(@RequestParam int studentAssignmentId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null || principal.isLearner()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only faculty or admin can publish grades");
        }
        StudentAssignment existing = assignmentService.fetchSubmission(studentAssignmentId);
        if (existing != null) {
            requireCanGradeSubmission(principal, existing);
        }
        try {
            StudentAssignment result = assignmentService.publishGrade(studentAssignmentId, principal.getId() != null ? principal.getId() : 0);
            return new ResponseEntity(new Response(HttpStatus.OK.name(), "Grade published", result), HttpStatus.OK);
        } catch (IllegalStateException e) {
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping(value = "/assignmentAveragePercentageForStudent")
    @ApiOperation(value = "Get the average percentage of points obtained by a student", notes = "")
    public ResponseEntity getAveragePercentage(@RequestParam int studentId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (studentId <= 0) {
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), "studentId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        if (principal != null && principal.isLearner() && principal.getId() != null && principal.getId() > 0 && !Objects.equals(principal.getId(), studentId)) {
            return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Learners may only fetch their own stats", null), HttpStatus.FORBIDDEN);
        }
        accessControlService.requireAccessLearner(principal, studentId);
        try {
            double averagePercentage = assignmentService.calculateAssignmentAveragePercentage(studentId);
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), averagePercentage), HttpStatus.OK);
        } catch (Exception e) {
            log.error("Failed to compute assignment average percentage for studentId={}", studentId, e);
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), "Failed to compute assignment average percentage. Please try again or contact support.", null), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping(value = "/totalAssignmentSubmissionsByStudent")
    @ApiOperation(value = "Get the total assignments submitted by a student", notes = "")
    public ResponseEntity getAssignmentTotalSubmissions(@RequestParam int studentId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (studentId <= 0) {
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), "studentId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        if (principal != null && principal.isLearner() && principal.getId() != null && principal.getId() > 0 && !Objects.equals(principal.getId(), studentId)) {
            return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Learners may only fetch their own stats", null), HttpStatus.FORBIDDEN);
        }
        accessControlService.requireAccessLearner(principal, studentId);
        try {
            int totalAssignments = assignmentService.countAssignmentSubmissionsByLearnerId(studentId);
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), totalAssignments), HttpStatus.OK);
        } catch (Exception e) {
            log.error("Failed to count assignment submissions for studentId={}", studentId, e);
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), "Failed to count assignment submissions. Please try again or contact support.", null), HttpStatus.BAD_REQUEST);
        }
    }

    @PatchMapping(value = "/addDescriptivePoints", produces = "application/json")
    @ApiOperation(value = "Update points obtained for a student assignment", notes = "")
    public ResponseEntity updateAssignmentPoints(@RequestParam("studentAssignmentId") int studentAssignmentId,
                                                 @RequestParam("pointsToAdd") @Min(value = 0, message = "Points cannot be negative") long pointsToAdd) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null || principal.isLearner()) {
            return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Only faculty/admin can grade descriptive questions", null), HttpStatus.FORBIDDEN);
        }
        if (pointsToAdd < 0) {
            return ResponseEntity.badRequest().body("Points cannot be negative");
        }
        StudentAssignment existing = assignmentService.fetchSubmission(studentAssignmentId);
        if (existing != null) {
            requireCanGradeSubmission(principal, existing);
            lessonContentsService.findById(existing.getLessonContentId()).ifPresent(lc -> {
                long alreadyAwarded = existing.getPointsObtained();
                if (alreadyAwarded > lc.getPoints() || pointsToAdd > lc.getPoints() - alreadyAwarded) {
                    throw new IllegalArgumentException("Total points would exceed maximum allowed (" + lc.getPoints() + ")");
                }
            });
        }
        // Preserve security/conflict statuses rather than swallowing them in a generic catch.
        try {
            StudentAssignment studentAssignment = assignmentService.addDescriptivePoints(studentAssignmentId, pointsToAdd);
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), studentAssignment), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }
}
