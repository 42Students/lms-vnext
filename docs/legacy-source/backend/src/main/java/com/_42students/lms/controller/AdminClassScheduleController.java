package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.request.ClassScheduleDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.ClassSchedule;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.ClassScheduleService;
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
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Part B in the super-admin audit: "Class scheduling: Edit, delete, cancel, or reassign a
 * schedule ... create a recurring series."
 *
 * <p>Edit/delete/reassign now exist (ClassScheduleController plus the bulk faculty reassignment).
 * This is the last piece: scheduling a weekly pattern in one action instead of creating the same
 * session by hand twelve times, which is how a semester timetable is actually shaped.
 *
 * <p>Deliberately its own controller rather than another method on ClassScheduleController: this
 * is an admin-scoped bulk tool, while that controller is the faculty-facing single-session API,
 * and keeping them apart means this one can require admin rights outright.
 *
 * <p>Every occurrence goes through the ordinary {@code classScheduleService.create}, so it
 * inherits all of that method's validation unchanged -- cross-college reference checks, the
 * faculty/class/lecture-hall conflict detection, and the maximum session length. Occurrences are
 * created one at a time and failures are reported per date rather than aborting the batch, so one
 * clash in week 7 doesn't cost you the other eleven weeks.
 */
@RestController
@RequestMapping("/api/v1/admin/class-schedule")
@Slf4j
@Api(tags = "Admin Class Scheduling (recurring series)")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class AdminClassScheduleController extends BaseController {

    /** Guards against a typo'd date range generating thousands of sessions. */
    private static final int MAX_OCCURRENCES = 200;

    private static final DateTimeFormatter SCHEDULE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Autowired
    private ClassScheduleService classScheduleService;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    private com._42students.lms.service.AdminAuditLogService audit;

    @Autowired(required = false)
    private com._42students.lms.access.ScopeResolutionService scopeResolutionService;

    @Data
    public static class RecurringScheduleRequest {
        private Integer classId;
        private Integer courseId;
        private Integer facultyId;
        private Integer lectureHallId;
        private String title;
        /** Inclusive, yyyy-MM-dd. */
        private String startDate;
        /** Inclusive, yyyy-MM-dd. */
        private String endDate;
        /** HH:mm (24h) — applied to every generated date. */
        private String startTime;
        private String endTime;
        /** MONDAY..SUNDAY. Empty means "every day in the range". */
        private List<String> daysOfWeek;
    }

    @PostMapping("/recurring")
    @ApiOperation(value = "Create a recurring class-schedule series",
            notes = "Generates one session per matching weekday between startDate and endDate. Each is created "
                    + "through the normal single-session path, so conflicts are detected per occurrence and "
                    + "reported rather than aborting the whole series.")
    public ResponseEntity<Response<Map<String, Object>>> createRecurring(
            @RequestParam Integer collegeId,
            @RequestBody RecurringScheduleRequest body,
            HttpServletRequest httpRequest) {
        if (collegeId == null || collegeId <= 0) {
            return bad("collegeId must be a positive integer");
        }
        if (body == null || body.getClassId() == null || body.getClassId() <= 0) {
            return bad("classId is required");
        }
        if (body.getStartDate() == null || body.getEndDate() == null
                || body.getStartTime() == null || body.getEndTime() == null) {
            return bad("startDate, endDate, startTime and endTime are all required");
        }

        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        // The class must belong to the college the caller was authorised for.
        accessControlService.requireAccessClass(principal, body.getClassId());
        // BE-0079: and to the collegeId sent with it (a super admin can reach both colleges, so access alone doesn't bind them;
        // the series and its audit entry must be about the same college).
        Integer classCollege = scopeResolutionService != null ? scopeResolutionService.resolveClassToCollegeId(body.getClassId()) : null;
        if (classCollege == null || !classCollege.equals(collegeId)) {
            return bad("This class is not in the selected college. Refresh the page and try again.");
        }

        final LocalDate from;
        final LocalDate to;
        try {
            from = LocalDate.parse(body.getStartDate().trim());
            to = LocalDate.parse(body.getEndDate().trim());
        } catch (Exception e) {
            return bad("startDate and endDate must be yyyy-MM-dd");
        }
        if (to.isBefore(from)) {
            return bad("endDate must be on or after startDate");
        }

        java.util.Set<DayOfWeek> days = new java.util.HashSet<>();
        if (body.getDaysOfWeek() != null) {
            for (String d : body.getDaysOfWeek()) {
                if (d == null || d.isBlank()) continue;
                try {
                    days.add(DayOfWeek.valueOf(d.trim().toUpperCase(Locale.ROOT)));
                } catch (IllegalArgumentException e) {
                    return bad("Unrecognised day of week: " + d);
                }
            }
        }

        List<LocalDate> occurrences = new ArrayList<>();
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            if (days.isEmpty() || days.contains(d.getDayOfWeek())) {
                occurrences.add(d);
            }
            if (occurrences.size() > MAX_OCCURRENCES) {
                return bad("That range would create more than " + MAX_OCCURRENCES
                        + " sessions. Narrow the dates or the weekdays.");
            }
        }
        if (occurrences.isEmpty()) {
            return bad("No dates in that range match the selected weekdays");
        }

        List<Map<String, Object>> created = new ArrayList<>();
        List<Map<String, Object>> failed = new ArrayList<>();
        for (LocalDate date : occurrences) {
            ClassScheduleDTO dto = new ClassScheduleDTO();
            dto.setClassId(body.getClassId());
            if (body.getCourseId() != null) dto.setCourseId(body.getCourseId());
            if (body.getFacultyId() != null) dto.setFacultyId(body.getFacultyId());
            if (body.getLectureHallId() != null) dto.setLectureHallId(body.getLectureHallId());
            dto.setTitle(body.getTitle());
            dto.setStartTime(date + " " + normalizeTime(body.getStartTime()));
            dto.setEndTime(date + " " + normalizeTime(body.getEndTime()));
            try {
                ClassSchedule saved = classScheduleService.create(dto);
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("date", date.toString());
                row.put("classScheduleId", saved != null ? saved.getId() : null);
                created.add(row);
            } catch (Exception e) {
                // Most commonly a conflict on one specific date (the faculty, class or hall is
                // already booked). Reported per date so the admin can fix just that one.
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("date", date.toString());
                row.put("reason", e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
                failed.add(row);
            }
        }

        if (audit != null && !created.isEmpty()) {
            audit.log(httpRequest, "CLASS_SCHEDULE_RECURRING_CREATE", "class_schedule",
                    String.valueOf(body.getClassId()), null, collegeId,
                    Map.of("created", String.valueOf(created.size()),
                            "failed", String.valueOf(failed.size()),
                            "from", from.toString(), "to", to.toString()));
        }

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("requested", occurrences.size());
        report.put("createdCount", created.size());
        report.put("created", created);
        report.put("failed", failed);
        return new ResponseEntity<>(new Response<>(HttpStatus.OK.name(),
                "Created " + created.size() + " of " + occurrences.size() + " session(s)", report), HttpStatus.OK);
    }

    /** Accepts HH:mm or HH:mm:ss and always yields HH:mm:ss, which is what create() parses. */
    private String normalizeTime(String raw) {
        String t = raw.trim();
        return t.length() == 5 ? t + ":00" : t;
    }

    private ResponseEntity<Response<Map<String, Object>>> bad(String message) {
        return new ResponseEntity<>(new Response<>("error", message, null), HttpStatus.BAD_REQUEST);
    }
}
