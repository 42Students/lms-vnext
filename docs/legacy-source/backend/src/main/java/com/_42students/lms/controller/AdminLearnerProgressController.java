package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.response.Response;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Audit 5.5: starting a learner's next attempt at a course's content.
 *
 * <p>Progress used to be keyed on (learner, content) alone, so a learner repeating a semester kept
 * every completion from the first time round — on day one of the retake every video already showed
 * as watched, and there was no way to express "completed in semester 1, retaking in semester 3".
 *
 * <p>Attempts are advanced by this deliberate action rather than inferred. Nothing in the schema
 * records that a learner is repeating anything: a retake shows up only as a batch's
 * current_semester moving, which is a property of the whole batch, not of one learner. Inferring a
 * retake from that would mean guessing from data that does not describe one — and guessing wrong
 * silently wipes a learner's real progress. An explicit action cannot fire by accident.
 *
 * <p>Nothing is deleted. The previous attempt's rows stay exactly as they are — that is what makes
 * this safe to run and what preserves the history the audit asked for. The new attempt's rows are
 * written immediately rather than waiting for the learner's next save, so the reset is visible the
 * moment the learner opens the course, which is the point of the action.
 */
@RestController
@RequestMapping("/api/v1/admin/learner-progress")
@Slf4j
@Api(tags = "Admin Learner Progress")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class AdminLearnerProgressController extends BaseController {

    @Autowired
    private com._42students.lms.repository.LearnerContentProgressRepository progressRepository;

    @Autowired
    private com._42students.lms.repository.LessonContentsRepository lessonContentsRepository;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    private com._42students.lms.service.AdminAuditLogService audit;

    @Data
    public static class StartAttemptRequest {
        private Integer learnerId;
        /** The course whose content the learner is retaking. */
        private Integer courseId;
    }

    @PostMapping("/start-attempt")
    @ApiOperation(value = "Start a learner's next attempt at a course",
            notes = "The learner's progress for this course's content restarts from zero. Nothing is "
                    + "deleted: the previous attempt is kept as history.")
    public ResponseEntity<Response<Map<String, Object>>> startAttempt(
            @RequestBody StartAttemptRequest body,
            HttpServletRequest httpRequest) {
        if (body == null || body.getLearnerId() == null || body.getLearnerId() <= 0) {
            return bad("learnerId is required");
        }
        if (body.getCourseId() == null || body.getCourseId() <= 0) {
            return bad("courseId is required");
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity<>(new Response<>(HttpStatus.UNAUTHORIZED.name(),
                    "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        // Both the learner and the course are checked: this writes to one learner's record and is
        // scoped to one course's content, so authorising only one of them would leave the other
        // reachable by a crafted id.
        accessControlService.requireAccessLearner(principal, body.getLearnerId());
        accessControlService.requireAccessCourse(principal, body.getCourseId());

        List<Integer> contentIds = lessonContentIdsForCourse(body.getCourseId());
        if (contentIds.isEmpty()) {
            return bad("That course has no content to retake");
        }

        Integer currentMax = progressRepository.findMaxAttempt(body.getLearnerId(), contentIds);
        if (currentMax == null) {
            // Nothing recorded yet, so the learner is already effectively on a fresh attempt.
            // Reported rather than treated as an error: the admin's intent is satisfied either way.
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("attempt", 1);
            out.put("alreadyFresh", true);
            return new ResponseEntity<>(new Response<>(HttpStatus.OK.name(),
                    "This learner has no recorded progress for that course — they are already starting fresh.",
                    out), HttpStatus.OK);
        }

        int nextAttempt = currentMax + 1;
        int carried = progressRepository.startNewAttempt(body.getLearnerId(), contentIds, nextAttempt);
        if (audit != null) {
            audit.log(httpRequest, "LEARNER_PROGRESS_START_ATTEMPT", "learner",
                    String.valueOf(body.getLearnerId()), null, null,
                    Map.of("courseId", String.valueOf(body.getCourseId()),
                            "previousAttempt", String.valueOf(currentMax),
                            "newAttempt", String.valueOf(nextAttempt)));
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("attempt", nextAttempt);
        out.put("previousAttempt", currentMax);
        out.put("contentItemsReset", carried);
        return new ResponseEntity<>(new Response<>(HttpStatus.OK.name(),
                "Attempt " + nextAttempt + " started. The previous attempt is kept as history.", out), HttpStatus.OK);
    }

    /** Every live piece of content in a course. */
    private List<Integer> lessonContentIdsForCourse(Integer courseId) {
        return lessonContentsRepository.findIdsByCourseId(courseId);
    }

    private ResponseEntity<Response<Map<String, Object>>> bad(String message) {
        return new ResponseEntity<>(new Response<>("error", message, null), HttpStatus.BAD_REQUEST);
    }
}
