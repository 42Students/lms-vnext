package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.response.AttendanceDetailsResponseDTO;
import com._42students.lms.dto.response.FilteredClassScheduleResponse;
import com._42students.lms.dto.response.Response;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.ClassScheduleService;
import com._42students.lms.util.SecurityContextUtil;
import com._42students.lms.utils.DateUtils;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import javax.servlet.http.HttpServletRequest;

import java.util.List;
import java.util.Objects;

/**
 * College-scoped attendance oversight for admin/superadmin. Unlike the faculty-facing endpoints
 * on ClassScheduleController (which require a facultyId and restrict non-superadmin callers to
 * their own facultyId — see ClassScheduleController's AT-15 checks), this controller lets an
 * admin view attendance for any class/course in their own college regardless of which faculty
 * taught it, via ClassScheduleService's admin-only aggregation method.
 */
@RestController
@RequestMapping("/api/v1/admin/attendance")
@Slf4j
@Api(tags = "Admin Attendance Oversight APIs (College-Scoped)")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class AdminAttendanceController extends BaseController {

    @Autowired
    private ClassScheduleService classScheduleService;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired
    private DateUtils dateUtils;

    @Autowired(required = false)
    private ScopeResolutionService scopeResolutionService;

    @Autowired(required = false)
    private com._42students.lms.service.LearnerService learnerService;

    @Autowired(required = false)
    private com._42students.lms.service.AdminAuditLogService audit;

    private static boolean isInvalidCollegeId(Integer collegeId) {
        return collegeId == null || collegeId <= 0;
    }

    // Same shape as AdminJobController's helper of the same name — kept private/duplicated rather
    // than extracted to a shared base class, matching how AdminJobController/AdminProjectController
    // each already carry their own copy.
    private void requireScopedSuperadminCollegeWithinScope(UserPrincipal principal, Integer collegeId) {
        if (principal == null || collegeId == null) return;
        if (!accessControlService.isSuperAdmin(principal)) return;
        if (principal.getCollegeId() == null && principal.getOrganizationId() == null) return; // GLOBAL mode
        if (scopeResolutionService == null) return;

        if (principal.getCollegeId() != null) {
            if (!Objects.equals(principal.getCollegeId(), collegeId)) {
                throw new AccessDeniedException("Superadmin is college-scoped and cannot access other colleges");
            }
            return;
        }

        Integer resolvedOrgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
        if (resolvedOrgId != null && principal.getOrganizationId() != null && !Objects.equals(principal.getOrganizationId(), resolvedOrgId)) {
            throw new AccessDeniedException("Superadmin is org-scoped and cannot access other organizations");
        }
    }

    @GetMapping
    @ApiOperation(value = "Attendance for a class+course, any faculty", notes = "College-wide admin view — not restricted to a single faculty's sessions like the faculty-facing endpoint.")
    public ResponseEntity<Response<List<AttendanceDetailsResponseDTO>>> getAttendance(
            @RequestParam Integer collegeId,
            @RequestParam int classId,
            @RequestParam int courseId,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(new Response<>("error", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        // Belt-and-suspenders: also confirm the class itself actually belongs to this college,
        // so a caller can't pass an arbitrary classId from a different (even same-org) college.
        accessControlService.requireAccessClass(principal, classId);
        try {
            java.util.Date start = dateUtils.parseDateSafe(startDate)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid startDate: " + startDate));
            java.util.Date end = dateUtils.parseEndDateSafe(endDate)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid endDate: " + endDate));
            if (start.getTime() > end.getTime()) {
                return new ResponseEntity<>(new Response<>("error", "startDate must be before or equal to endDate", null), HttpStatus.BAD_REQUEST);
            }
            List<AttendanceDetailsResponseDTO> details = classScheduleService.getAttendanceDetailsByDateRangeForAdmin(
                    classId, courseId, new java.sql.Date(start.getTime()), new java.sql.Date(end.getTime()));
            return new ResponseEntity<>(new Response<>("success", "Attendance fetched successfully", details), HttpStatus.OK);
        } catch (ResponseStatusException e) {
            return new ResponseEntity<>(new Response<>("error", e.getReason(), null), e.getStatus());
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Error fetching admin attendance for class {} course {}: ", classId, courseId, e);
            return new ResponseEntity<>(new Response<>("error", "Failed to fetch attendance", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Same {classes, absentees} shape TeacherAttendanceView.jsx already consumes (via the faculty-
    // facing getFilteredClassSchedulesAndAbsentees) — this is the endpoint the admin monthly grid
    // page actually renders from; getAttendance() above is a flatter per-student list kept for
    // completeness/other consumers, not used by the grid.
    @GetMapping("/monthly")
    @ApiOperation(value = "Monthly grid data for a class+course, any faculty", notes = "Same shape as the faculty-facing getFilteredClassSchedulesAndAbsentees, without the single-faculty restriction.")
    public ResponseEntity<FilteredClassScheduleResponse> getMonthlyGrid(
            @RequestParam Integer collegeId,
            @RequestParam int classId,
            @RequestParam int courseId,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        if (isInvalidCollegeId(collegeId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "collegeId must be a positive integer");
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        accessControlService.requireAccessClass(principal, classId);
        FilteredClassScheduleResponse response = classScheduleService.getFilteredClassSchedulesForAdmin(classId, courseId, startDate, endDate);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    // Resolves classId from classScheduleId and reuses the existing requireAccessClass check --
    // mirrors what getAttendance()/getMonthlyGrid() do with a directly-supplied classId, since
    // these two write endpoints only take classScheduleId. Without this, a college/org-scoped
    // admin could pass a classScheduleId belonging to a different college.
    private void requireClassScheduleInScope(UserPrincipal principal, Integer classScheduleId) {
        if (classScheduleId == null) return;
        var schedule = classScheduleService.getClassScheduleDetail(classScheduleId);
        if (schedule == null) {
            throw new IllegalArgumentException("Class schedule not found");
        }
        accessControlService.requireAccessClass(principal, schedule.getClassId());
    }

    // M5 in the audit: "the only module with no write capability whatsoever in the console" --
    // admins could view attendance but never correct it. These two reuse the exact same
    // service methods the faculty-facing flow uses (LearnerServiceImpl.attend/removeAbsence),
    // with the retroactive-marking window bypassed for the admin path specifically -- the whole
    // point of an admin correction tool is fixing attendance after that window has closed.
    /** W2: the recognised non-plain absence reasons. Null/absent means a plain unexplained absence. */
    private static final java.util.Set<String> ATTENDANCE_STATUSES = java.util.Set.of("EXCUSED", "MEDICAL", "LATE");

    @Autowired(required = false)
    private com._42students.lms.repository.AttendanceRepository attendanceRepository;

    /**
     * Stamps who made the change and (optionally) why, on the row the shared marking service just
     * wrote. Done as a follow-up save rather than by threading two more parameters through
     * LearnerService, whose attend() is shared with the faculty marking path.
     *
     * <p>Best-effort: a failure here must not undo a correction the admin already made and was
     * told succeeded, so it logs and returns the row unchanged.
     */
    private com._42students.lms.model.Attend stampMarker(com._42students.lms.model.Attend row,
                                                         UserPrincipal principal,
                                                         String status) {
        if (row == null || attendanceRepository == null) return row;
        try {
            row.setMarkedBy(principal != null ? principal.getId() : null);
            row.setAttendanceStatus(status);
            return attendanceRepository.save(row);
        } catch (Exception e) {
            log.warn("Could not stamp attendance marker for attend id {}: {}", row.getId(), e.getMessage());
            return row;
        }
    }

    // W2's first dead end: "a student disputes an attendance record -> read-only grid -> can't see
    // who marked it". The monthly grid only ever carried present/absent, so this returns the
    // marker and reason for one cell, resolved to a name. Deliberately a separate lookup rather
    // than widening the grid payload: the grid renders a whole month for a whole class, and
    // nobody needs the marker for all of it at once.
    @GetMapping("/record")
    @ApiOperation(value = "Who marked this attendance record, and why",
            notes = "Returns the marker, the reason (EXCUSED/MEDICAL/LATE, or absent when unset) and whether the absence is still active.")
    public ResponseEntity<Response<java.util.Map<String, Object>>> getAttendanceRecord(
            @RequestParam Integer collegeId,
            @RequestParam String studentId,
            @RequestParam int classScheduleId) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(new Response<>("error", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        try {
            requireClassScheduleInScope(principal, classScheduleId);
            // SA-ATT-014: `attendanceRepository` being unavailable (a wiring/infra fault) and "no
            // absence row exists" were both falling through to the same `row == null` branch,
            // which reported the student as present either way -- silently turning an
            // infrastructure failure into a real-looking attendance record. Fail loudly instead.
            if (attendanceRepository == null) {
                return new ResponseEntity<>(new Response<>("error", "Attendance data is temporarily unavailable", null), HttpStatus.SERVICE_UNAVAILABLE);
            }
            java.util.Map<String, Object> out = new java.util.LinkedHashMap<>();
            com._42students.lms.model.Attend row = attendanceRepository.getAttendance(String.valueOf(classScheduleId), studentId);
            if (row == null) {
                // No absence row could mean "present" OR "nobody has taken attendance for this
                // session at all yet" -- indistinguishable from row count alone (see
                // ClassSchedule.attendanceMarkedAt / the same ambiguity fixed on the faculty
                // mark-attendance view). Surface which one this actually is instead of assuming.
                var schedule = classScheduleService.getClassScheduleDetail(classScheduleId);
                boolean attendanceMarked = schedule != null && schedule.getAttendanceMarkedAt() != null;
                out.put("present", attendanceMarked);
                out.put("attendanceMarked", attendanceMarked);
                return new ResponseEntity<>(new Response<>("success",
                        attendanceMarked ? "No absence recorded" : "Attendance not yet taken for this session", out), HttpStatus.OK);
            }
            out.put("present", false);
            out.put("attendanceStatus", row.getAttendanceStatus() != null ? row.getAttendanceStatus() : "ABSENT");
            out.put("markedBy", row.getMarkedBy());
            out.put("markedByName", resolveMarkerName(row.getMarkedBy()));
            // A corrected-then-re-marked absence revives the same row (unique student+session), so
            // createdAt kept showing the first marking; updatedAt is when the current state was set.
            out.put("markedAt", row.getUpdatedAt() != null ? row.getUpdatedAt() : row.getCreatedAt());
            return new ResponseEntity<>(new Response<>("success", "Attendance record", out), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (AccessDeniedException e) {
            // A schedule from another college is a 403, not "Failed to ..." 500 (rethrown to the global handler).
            throw e;
        } catch (Exception e) {
            log.error("Error fetching attendance record for student {} schedule {}: ", studentId, classScheduleId, e);
            return new ResponseEntity<>(new Response<>("error", "Failed to fetch attendance record", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /** Rows predating V128 have no marker; say so rather than rendering a blank. */
    private String resolveMarkerName(Integer markedBy) {
        if (markedBy == null) return "Not recorded";
        if (facultyRepository == null) return "#" + markedBy;
        return facultyRepository.findById(markedBy)
                .map(f -> {
                    String name = ((f.getFirstName() != null ? f.getFirstName() : "") + " "
                            + (f.getLastName() != null ? f.getLastName() : "")).trim();
                    return name.isEmpty() ? ("#" + markedBy) : name;
                })
                .orElse("#" + markedBy);
    }

    @Autowired(required = false)
    private com._42students.lms.repository.FacultyRepository facultyRepository;

    @PostMapping("/mark-absent")
    @ApiOperation(value = "Admin correction: mark a student absent",
            notes = "Bypasses the retroactive-marking window (COLLEGE attendance.correctionWindowHours). "
                    + "Optional status marks it EXCUSED/MEDICAL/LATE instead of a plain absence. "
                    + "Records who made the change.")
    public ResponseEntity<Response<?>> markAbsent(
            @RequestParam Integer collegeId,
            @RequestParam(required = false) String status,
            @RequestBody com._42students.lms.dto.request.AttendanceDTO body,
            HttpServletRequest httpRequest) {
        if (isInvalidCollegeId(collegeId) || learnerService == null) {
            return new ResponseEntity<>(new Response<>("error", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        String normalizedStatus = status != null && !status.isBlank() ? status.trim().toUpperCase() : null;
        if (normalizedStatus != null && !ATTENDANCE_STATUSES.contains(normalizedStatus)) {
            return new ResponseEntity<>(new Response<>("error",
                    "status must be one of EXCUSED, MEDICAL, LATE (or omitted for a plain absence)", null), HttpStatus.BAD_REQUEST);
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        try {
            requireClassScheduleInScope(principal, body.getClassScheduleId());
            var result = learnerService.attend(body, true);
            // W2 ("can't see who marked it" / "can't mark it excused"): stamped here, after the
            // shared marking service returns, rather than by threading two more parameters through
            // LearnerService -- that path is shared with faculty marking and is being changed
            // concurrently for an unrelated unique-key fix.
            result = stampMarker(result, principal, normalizedStatus);
            if (audit != null) {
                audit.log(httpRequest, "ADMIN_ATTENDANCE_MARK_ABSENT", "attend", String.valueOf(body.getClassScheduleId()), null, collegeId,
                        java.util.Map.of("studentId", String.valueOf(body.getStudentId()),
                                "status", normalizedStatus != null ? normalizedStatus : "ABSENT"));
            }
            return new ResponseEntity<>(new Response<>("success", "Marked absent", result), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (AccessDeniedException e) {
            // A schedule from another college is a 403, not "Failed to ..." 500 (rethrown to the global handler).
            throw e;
        } catch (Exception e) {
            log.error("Error in admin mark-absent for student {} schedule {}: ", body.getStudentId(), body.getClassScheduleId(), e);
            return new ResponseEntity<>(new Response<>("error", "Failed to mark absent", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/mark-present")
    @ApiOperation(value = "Admin correction: mark a student present", notes = "Removes an existing absence record for this student/class-schedule, if any.")
    public ResponseEntity<Response<?>> markPresent(
            @RequestParam Integer collegeId,
            @RequestParam String studentId,
            @RequestParam int classScheduleId,
            HttpServletRequest httpRequest) {
        if (isInvalidCollegeId(collegeId) || learnerService == null) {
            return new ResponseEntity<>(new Response<>("error", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        try {
            requireClassScheduleInScope(principal, classScheduleId);
            learnerService.removeAbsence(studentId, classScheduleId);
            if (audit != null) {
                audit.log(httpRequest, "ADMIN_ATTENDANCE_MARK_PRESENT", "attend", String.valueOf(classScheduleId), null, collegeId,
                        java.util.Map.of("studentId", studentId));
            }
            return new ResponseEntity<>(new Response<>("success", "Marked present", null), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (AccessDeniedException e) {
            // A schedule from another college is a 403, not "Failed to ..." 500 (rethrown to the global handler).
            throw e;
        } catch (Exception e) {
            log.error("Error in admin mark-present for student {} schedule {}: ", studentId, classScheduleId, e);
            return new ResponseEntity<>(new Response<>("error", "Failed to mark present", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
