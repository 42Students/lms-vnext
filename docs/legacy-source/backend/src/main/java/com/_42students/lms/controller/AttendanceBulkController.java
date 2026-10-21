package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.request.AttendanceDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.ClassSchedule;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.ClassScheduleService;
import com._42students.lms.service.LearnerService;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Audit 5.1 (attendance & scheduling): "attendance marking is N+1 — one HTTP request per student".
 *
 * <p>Taking attendance for a class fired one request per learner from the browser, all in flight
 * at once. For a sixty-student roster that is sixty round trips, sixty authentication passes and —
 * because both the mark and unmark endpoints re-read the schedule and re-check the faculty
 * teaching assignment — sixty repetitions of the same three lookups to answer the same question.
 *
 * <p>This takes the whole roster in one request. The expensive part happens once: the schedule is
 * read once, access to the class is checked once, and the faculty-teaching-assignment check runs
 * once rather than per learner.
 *
 * <p>Per-learner failures are reported per learner rather than failing the batch, so one bad id
 * cannot cost a teacher the other fifty-nine. Deliberately no transaction spanning the loop: each
 * learner's own write commits independently, which is the same rule the other bulk paths in this
 * codebase follow and the reason a partial result can be reported honestly.
 */
@RestController
@RequestMapping("/api/v1/attendance")
@Slf4j
@Api(tags = "Attendance (bulk)")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class AttendanceBulkController extends BaseController {

    /** A class roster; well above any real class size, but bounded so one request can't be abused. */
    private static final int MAX_ROSTER = 500;

    @Autowired
    private LearnerService learnerService;

    @Autowired
    private ClassScheduleService classScheduleService;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired
    private com._42students.lms.repository.FacultyTeachingAssignmentRepository facultyTeachingAssignmentRepository;

    @Autowired(required = false)
    private com._42students.lms.service.AdminAuditLogService auditLogService;

    @Data
    public static class BulkAttendanceRequest {
        private Integer classScheduleId;
        /** Learners to record as absent. */
        private List<String> absentStudentIds;
        /** Learners to record as present — clears any absence already recorded for them. */
        private List<String> presentStudentIds;
        private String reason;
    }

    @PostMapping("/bulk")
    @ApiOperation(value = "Record attendance for a whole class in one request",
            notes = "Replaces one request per learner. Access is checked once for the schedule; per-learner "
                    + "failures are reported individually rather than failing the batch.")
    public ResponseEntity<Response<Map<String, Object>>> markBulk(
            @RequestBody BulkAttendanceRequest body,
            HttpServletRequest httpRequest) {
        if (body == null || body.getClassScheduleId() == null || body.getClassScheduleId() <= 0) {
            return bad("classScheduleId is required");
        }
        List<String> absent = body.getAbsentStudentIds() != null ? body.getAbsentStudentIds() : List.of();
        List<String> present = body.getPresentStudentIds() != null ? body.getPresentStudentIds() : List.of();
        if (absent.isEmpty() && present.isEmpty()) {
            // "Nobody is absent" is not the same as "nothing to save": a teacher who marks someone
            // absent and then corrects it produces an empty absent list and a non-empty present
            // one. Only both being empty is genuinely nothing to do.
            return bad("Nothing to record — provide at least one absent or present learner");
        }
        if (absent.size() + present.size() > MAX_ROSTER) {
            return bad("Maximum " + MAX_ROSTER + " learners per request");
        }

        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity<>(new Response<>(HttpStatus.UNAUTHORIZED.name(),
                    "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        if (principal.isLearner()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only faculty or admin can mark attendance");
        }

        ClassSchedule schedule = classScheduleService.getClassScheduleDetail(body.getClassScheduleId());
        if (schedule == null) {
            return new ResponseEntity<>(new Response<>(HttpStatus.NOT_FOUND.name(),
                    "Class schedule not found", null), HttpStatus.NOT_FOUND);
        }
        accessControlService.requireAccessClass(principal, schedule.getClassId());
        // AT-01, once for the batch rather than once per learner: requireAccessClass alone only
        // proves "this class is in my college", not "I teach it".
        requireTeachesThisClass(principal, schedule);

        int marked = 0;
        int cleared = 0;
        List<Map<String, Object>> failed = new ArrayList<>();

        for (String studentId : absent) {
            try {
                AttendanceDTO dto = new AttendanceDTO();
                dto.setStudentId(studentId);
                dto.setClassScheduleId(body.getClassScheduleId());
                dto.setDropClassReason(body.getReason() != null ? body.getReason() : "Mark Absent");
                learnerService.attend(dto);
                marked++;
            } catch (Exception e) {
                failed.add(failure(studentId, "absent", e));
            }
        }
        for (String studentId : present) {
            try {
                learnerService.removeAbsence(studentId, body.getClassScheduleId());
                cleared++;
            } catch (Exception e) {
                failed.add(failure(studentId, "present", e));
            }
        }

        // Faculty audit F-024/F-025: the session counts as "attendance taken" only once every learner row was written.
        // It used to be flagged before the writes, so a partly or wholly failed save still read as complete. "Everyone
        // present" writes no rows at all and still completes, so the flag is decided by failures, not by row counts.
        boolean complete = failed.isEmpty();
        if (complete) {
            classScheduleService.markAttendanceTaken(body.getClassScheduleId());
        }

        // One audit row for the session rather than one per learner: the meaningful event is "this
        // person took attendance for this class", and N rows per class would swamp the log the
        // admin actually reads.
        log.info("AT-20 AUDIT: userId={} userType={} recorded attendance for classScheduleId={} absent={} present={} failed={}",
                principal.getId(), principal.getUserType(), body.getClassScheduleId(), marked, cleared, failed.size());
        if (auditLogService != null) {
            auditLogService.log(httpRequest, "ATTENDANCE_MARK_BULK", "class_schedule",
                    String.valueOf(body.getClassScheduleId()), null, null,
                    Map.of("markedAbsent", String.valueOf(marked),
                            "markedPresent", String.valueOf(cleared),
                            "failed", String.valueOf(failed.size())));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("markedAbsent", marked);
        result.put("markedPresent", cleared);
        result.put("failed", failed);
        result.put("attendanceComplete", complete);
        return new ResponseEntity<>(new Response<>(HttpStatus.OK.name(), complete
                ? "Attendance recorded for " + (marked + cleared) + " learner(s)"
                : "Attendance partly saved: " + failed.size() + " learner(s) failed; the session is not marked complete",
                result), HttpStatus.OK);
    }

    private void requireTeachesThisClass(UserPrincipal principal, ClassSchedule schedule) {
        if (!"FACULTY".equalsIgnoreCase(principal.getUserType()) || schedule.getCourseId() <= 0) {
            return;
        }
        // A college admin's userType is also "FACULTY" (ADMIN is a facultyType, not a separate
        // userType), so without this exemption this check wrongly scoped admins down to only the
        // classes they personally teach, even though the frontend already shows them the "Mark
        // attendance" control for any course in their college (AttendanceReport.js's
        // canManageAttendance). Same isAdmin pattern already used for the equivalent scheduling
        // check in FacultyClassScheduleController.create().
        boolean isAdmin = accessControlService.isSuperAdmin(principal)
                || "ADMIN".equalsIgnoreCase(principal.getFacultyType());
        if (isAdmin) {
            return;
        }
        int scheduleCourseId = schedule.getCourseId();
        Integer scheduleClassId = schedule.getClassId();
        boolean assigned = facultyTeachingAssignmentRepository
                .findByFacultyIdAndIsActive(principal.getId(), true)
                .stream()
                .anyMatch(a -> a.getCourseId() != null && a.getCourseId() == scheduleCourseId
                        && (scheduleClassId == null || (a.getClassId() != null && a.getClassId().equals(scheduleClassId))));
        if (!assigned) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not assigned to teach this class");
        }
    }

    private Map<String, Object> failure(String studentId, String intent, Exception e) {
        log.warn("Bulk attendance: {} failed for student {}: {}", intent, studentId, e.getMessage());
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("studentId", studentId);
        row.put("intent", intent);
        row.put("reason", e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
        return row;
    }

    private ResponseEntity<Response<Map<String, Object>>> bad(String message) {
        return new ResponseEntity<>(new Response<>("error", message, null), HttpStatus.BAD_REQUEST);
    }
}
