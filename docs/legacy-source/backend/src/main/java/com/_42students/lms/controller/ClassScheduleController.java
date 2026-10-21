package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.request.AttendanceDetailsRequestDTO;
import com._42students.lms.dto.request.ClassScheduleDTO;
import com._42students.lms.dto.response.AttendanceDetailsResponseDTO;
import com._42students.lms.dto.response.ClassIdAndDateRangeResponse;
import com._42students.lms.dto.response.ClassScheduleResponse;
import com._42students.lms.dto.response.DashboardResponseDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.ClassSchedule;
import com._42students.lms.model.Learner;
import com._42students.lms.service.ClassScheduleService;
import com._42students.lms.service.LearnerService;
import com._42students.lms.util.CourseSlugResolver;
import com._42students.lms.util.SecurityContextUtil;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.utils.DateUtils;
import io.swagger.annotations.ApiOperation;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import com._42students.lms.dto.response.FilteredClassScheduleResponse;

import java.sql.Date;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/scheduleClass")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true")
@Slf4j
@Validated
public class ClassScheduleController extends BaseController {

    @Autowired
    ClassScheduleService classScheduleService;

    @Autowired
    LearnerService studentService;

    @Autowired
    DateUtils dateUtils;

    @Autowired
    CourseSlugResolver courseSlugResolver;

    @Autowired
    AccessControlService accessControlService;

    @Autowired
    SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    com._42students.lms.service.AppSettingsService appSettingsService;

    @Autowired(required = false)
    com._42students.lms.repository.FacultyTeachingAssignmentRepository facultyTeachingAssignmentRepository;

    /**
     * A learner's own attendance detail may only be read by that learner, an admin/super-admin, or
     * a faculty member actually assigned to teach their class.
     *
     * <p>requireAccessLearner alone is not enough: for a FACULTY principal it reduces to a plain
     * college match (see AccessControlService.canAccessLearner), so any teacher in the college
     * could pull any student's full session-by-session attendance record — including students they
     * have never taught. The sibling percentage endpoints in LearnerController already apply this
     * teaching-assignment rule (AT-16); these two detail endpoints were the ones that didn't.
     */
    private void requireFacultyTeachesLearnerClass(UserPrincipal principal, int learnerId) {
        if (principal == null) return;
        if (!"FACULTY".equalsIgnoreCase(principal.getUserType())) return;
        if (accessControlService.isSuperAdmin(principal)) return;
        // College admins manage the whole college; the teaching-assignment rule is for teachers.
        if ("ADMIN".equalsIgnoreCase(principal.getFacultyType())) return;
        if (facultyTeachingAssignmentRepository == null || principal.getId() == null) return;
        com._42students.lms.model.Learner learner = studentService.getLearnerDetails(String.valueOf(learnerId));
        if (learner == null || learner.getClassId() == null) return;
        boolean teachesLearnerClass = facultyTeachingAssignmentRepository
                .findByFacultyIdAndIsActive(principal.getId(), true)
                .stream()
                .anyMatch(a -> learner.getClassId().equals(a.getClassId()));
        if (!teachesLearnerClass) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You are not assigned to teach any course in this learner's class");
        }
    }

    /** Section 6 #12: parses to the START of the given day (00:00:00) — use for a range's lower bound. */
    private java.util.Date requireValidDate(String date, String paramName) {
        return dateUtils.parseDateSafe(date).orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date '" + paramName + "': " + date));
    }

    /** Section 6 #12: parses to the END of the given day (23:59:59) — use for a range's upper bound, so a
     *  same-day range (startDate == endDate) still covers the whole day rather than being empty. */
    private java.util.Date requireValidEndDate(String date, String paramName) {
        return dateUtils.parseEndDateSafe(date).orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date '" + paramName + "': " + date));
    }

    private void requireValidDateRange(String startDate, String endDate) {
        java.util.Date start = requireValidDate(startDate, "startDate");
        java.util.Date end = requireValidEndDate(endDate, "endDate");
        if (start.getTime() > end.getTime()) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "startDate must be before or equal to endDate");
        }
    }

    private int parseIntParam(String value, String paramName) {
        if (value == null || value.trim().isEmpty()) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, paramName + " is required");
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid " + paramName + ": " + value);
        }
    }

    /** Resolve courseSlug or courseId (string) to numeric course id string. Accepts slug in courseId param when it starts with "crs-". */
    private String resolveCourseIdParam(String courseSlug, String courseId) {
        if (courseSlug != null && !courseSlug.trim().isEmpty()) {
            int resolvedId = courseSlugResolver.resolve(courseSlug.trim(), null);
            return String.valueOf(resolvedId);
        }
        if (courseId != null && !courseId.trim().isEmpty()) {
            String trimmed = courseId.trim();
            if (trimmed.startsWith("crs-")) {
                int resolvedId = courseSlugResolver.resolve(trimmed, null);
                return String.valueOf(resolvedId);
            }
            return trimmed;
        }
        throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Either courseSlug or courseId required");
    }

    @RequestMapping(value = "/create", method = RequestMethod.POST, produces = "application/json")
    @ApiOperation(value = "Create a class schedule", notes = "")
    public ResponseEntity createClassSchedule(@RequestBody @javax.validation.Valid ClassScheduleDTO classScheduleDTO)
            throws Exception {
        accessControlService.requireAccessClass(securityContextUtil.getAuthenticatedUserPrincipal(), classScheduleDTO.getClassId());
        ClassSchedule classSchedule = classScheduleService.create(classScheduleDTO);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),classSchedule), HttpStatus.OK);
    }

    @RequestMapping(value = "/update/{id}", method = RequestMethod.PUT, produces = "application/json")
    @ApiOperation(value = "Update a class schedule",
            notes = "Requires access to both the existing class and, if the class is being changed, the destination class.")
    public ResponseEntity updateClassSchedule(@PathVariable("id") int id,
                                              @RequestBody @javax.validation.Valid ClassScheduleDTO classScheduleDTO) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        ClassSchedule existing = classScheduleService.getClassScheduleDetail(id);
        if (existing == null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND, "Class schedule not found");
        }
        accessControlService.requireAccessClass(principal, existing.getClassId());
        // Moving a session to a different class requires access to the destination too, so this
        // can't be used to push a session into a class the caller cannot administer.
        if (classScheduleDTO.getClassId() > 0 && classScheduleDTO.getClassId() != existing.getClassId()) {
            accessControlService.requireAccessClass(principal, classScheduleDTO.getClassId());
        }
        ClassSchedule updated = classScheduleService.update(id, classScheduleDTO);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), updated), HttpStatus.OK);
    }

    @RequestMapping(value = "/delete/{id}", method = RequestMethod.DELETE, produces = "application/json")
    @ApiOperation(value = "Delete (cancel) a class schedule",
            notes = "Soft-deletes the session. Attendance history is preserved, but the session stops "
                    + "counting toward attendance denominators.")
    public ResponseEntity deleteClassSchedule(@PathVariable("id") int id) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        ClassSchedule existing = classScheduleService.getClassScheduleDetail(id);
        if (existing == null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND, "Class schedule not found");
        }
        accessControlService.requireAccessClass(principal, existing.getClassId());
        classScheduleService.delete(id);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), "Class schedule deleted successfully", null), HttpStatus.OK);
    }

    // W1 in the super-admin audit: "A faculty member leaves mid-semester -- their timetable can
    // never be reassigned." update()/delete() above already existed with no bulk UI behind them;
    // this is the actual fix -- one action that moves everything at once instead of an admin
    // hand-editing every remaining session.
    @RequestMapping(value = "/bulk-reassign-faculty", method = RequestMethod.POST, produces = "application/json")
    @ApiOperation(value = "Reassign a faculty member's upcoming class schedules to another faculty member",
            notes = "Only sessions that haven't started yet are moved. Each session is reassigned independently, "
                    + "so one scheduling conflict doesn't block the rest -- see the report for per-session failures.")
    public ResponseEntity bulkReassignFaculty(@RequestParam int oldFacultyId, @RequestParam int newFacultyId) {
        if (oldFacultyId == newFacultyId) {
            return new ResponseEntity(new Response("error", "oldFacultyId and newFacultyId must be different", null), HttpStatus.BAD_REQUEST);
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireAccessFacultySchedule(principal, oldFacultyId);
        accessControlService.requireAccessFacultySchedule(principal, newFacultyId);
        var report = classScheduleService.bulkReassignFaculty(oldFacultyId, newFacultyId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(),
                "Reassigned " + report.getReassigned() + " of " + report.getScanned() + " upcoming session(s)", report), HttpStatus.OK);
    }

    @RequestMapping(value = "/getClassSchedule", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch class schedule for instructor by date", notes = "")
    public ResponseEntity getClassSchedule(String instructorId, String date)
            throws Exception {
        int facultyId = parseIntParam(instructorId, "instructorId");
        accessControlService.requireAccessFacultySchedule(securityContextUtil.getAuthenticatedUserPrincipal(), facultyId);
        List<ClassScheduleResponse> classScheduleResponse = classScheduleService.getClassSchedule(instructorId, requireValidDate(date, "date"),
                requireValidEndDate(date, "date"));
        classScheduleResponse = withoutRostersForLearners(classScheduleResponse);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),classScheduleResponse), HttpStatus.OK);
    }

    @RequestMapping(value = "/getClassScheduleByDateRange", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch class schedule for instructor by date", notes = "")
    public ResponseEntity getClassSchedule(String instructorId, String startDate, String endDate)
            throws Exception {
        int facultyId = parseIntParam(instructorId, "instructorId");
        accessControlService.requireAccessFacultySchedule(securityContextUtil.getAuthenticatedUserPrincipal(), facultyId);
        List<ClassScheduleResponse> classScheduleResponse = classScheduleService.getClassSchedule(instructorId, requireValidDate(startDate, "startDate"),
                requireValidEndDate(endDate, "endDate"));
        classScheduleResponse = withoutRostersForLearners(classScheduleResponse);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),classScheduleResponse), HttpStatus.OK);
    }

    @RequestMapping(value = "/getClassScheduleByClassId", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch class schedule for class Id by date", notes = "")
    public ResponseEntity getClassScheduleByClassId(String classId, String date)
            throws Exception {
        accessControlService.requireAccessClass(securityContextUtil.getAuthenticatedUserPrincipal(), parseIntParam(classId, "classId"));
        List<ClassScheduleResponse> classScheduleResponse = classScheduleService.getClassScheduleByClassId(classId, requireValidDate(date, "date"),
                requireValidEndDate(date, "date"));
        classScheduleResponse = withoutRostersForLearners(classScheduleResponse);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),classScheduleResponse), HttpStatus.OK);
    }

    @RequestMapping(value = "/getClassScheduleByClassIdByDateRange", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch class schedule for class Id by date", notes = "Optionally filter by courseSlug or courseId")
    public ResponseEntity getClassScheduleByClassId(
            @RequestParam String classId,
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(required = false) String courseSlug,
            @RequestParam(required = false) Integer courseId)
            throws Exception {
        if (classId == null || classId.trim().isEmpty()) {
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), "classId is required", null), HttpStatus.BAD_REQUEST);
        }
        accessControlService.requireAccessClass(securityContextUtil.getAuthenticatedUserPrincipal(), parseIntParam(classId, "classId"));
        List<ClassScheduleResponse> classScheduleResponse = classScheduleService.getClassScheduleByClassId(classId,
                requireValidDate(startDate, "startDate"),
                requireValidEndDate(endDate, "endDate"));
        if (courseSlug != null || courseId != null) {
            int resolvedCourseId = courseSlugResolver.resolve(courseSlug, courseId);
            if (resolvedCourseId > 0) {
                classScheduleResponse = classScheduleResponse.stream()
                        .filter(s -> s.getCourseId() == resolvedCourseId)
                        .collect(java.util.stream.Collectors.toList());
            }
        }
        classScheduleResponse = withoutRostersForLearners(classScheduleResponse);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),classScheduleResponse), HttpStatus.OK);
    }

    @RequestMapping(value = "/getClassScheduleByStudentId", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch class schedule for student Id by date", notes = "")
    public ResponseEntity getClassScheduleByStudentId(String studentId, String date)
            throws Exception {
        // 3.4: access was only checked once the student was known to exist, so a non-existent
        // studentId returned 200 + empty list while an existing-but-inaccessible one returned 403
        // -- an enumeration oracle for valid learner ids. requireAccessLearner resolves the
        // learner's college itself (returning "denied" for an id that resolves to nothing), so
        // running it first closes the oracle without needing the row to exist yet; a genuinely
        // missing learner then 404s instead of silently returning an empty schedule.
        int learnerId = parseIntParam(studentId, "studentId");
        accessControlService.requireAccessLearner(securityContextUtil.getAuthenticatedUserPrincipal(), learnerId);
        Learner student = studentService.getLearnerDetails(studentId);
        if (student == null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found");
        }
        List<ClassScheduleResponse> classScheduleResponse = classScheduleService.
                getClassScheduleByClassId(String.valueOf(student.getClassId()), requireValidDate(date, "date"),
                        requireValidEndDate(date, "date"));
        classScheduleResponse = withoutRostersForLearners(classScheduleResponse);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),classScheduleResponse), HttpStatus.OK);
    }

    @RequestMapping(value = "/getClassScheduleByStudentIdByDateRange", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch class schedule for student Id by date", notes = "")
    public ResponseEntity getClassScheduleByStudentId(String studentId, String startDate, String endDate)
            throws Exception {
        // 3.4: same fix as getClassScheduleByStudentId above -- access checked before existence.
        int learnerId = parseIntParam(studentId, "studentId");
        accessControlService.requireAccessLearner(securityContextUtil.getAuthenticatedUserPrincipal(), learnerId);
        Learner student = studentService.getLearnerDetails(studentId);
        if (student == null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found");
        }
        List<ClassScheduleResponse> classScheduleResponse = classScheduleService.
                getClassScheduleByClassId(String.valueOf(student.getClassId()), requireValidDate(startDate, "startDate"),
                        requireValidEndDate(endDate, "endDate"));
        classScheduleResponse = withoutRostersForLearners(classScheduleResponse);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),classScheduleResponse), HttpStatus.OK);
    }

    @RequestMapping(value = "/getClassScheduleByFacultyId", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch class schedule for faculty Id by date", notes = "")
    public ResponseEntity getClassScheduleByFacultyId(String facultyId, String date)
            throws Exception {
        int fId = parseIntParam(facultyId, "facultyId");
        accessControlService.requireAccessFacultySchedule(securityContextUtil.getAuthenticatedUserPrincipal(), fId);
        List<ClassScheduleResponse> classScheduleResponse = classScheduleService.
                getClassScheduleByFacultyId(facultyId, requireValidDate(date, "date"),
                        requireValidEndDate(date, "date"));
        classScheduleResponse = withoutRostersForLearners(classScheduleResponse);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),classScheduleResponse), HttpStatus.OK);
    }

    @RequestMapping(value = "/getClassScheduleByFacultyIdByDateRange", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch class schedule for faculty Id by date", notes = "")
    public ResponseEntity getClassScheduleByFacultyId(String facultyId, String startDate, String endDate)
            throws Exception {
        int fId = parseIntParam(facultyId, "facultyId");
        accessControlService.requireAccessFacultySchedule(securityContextUtil.getAuthenticatedUserPrincipal(), fId);
        requireValidDateRange(startDate, endDate);
        List<ClassScheduleResponse> classScheduleResponse = classScheduleService.
                getClassScheduleByFacultyId(facultyId, requireValidDate(startDate, "startDate"),
                        requireValidEndDate(endDate, "endDate"));
        classScheduleResponse = withoutRostersForLearners(classScheduleResponse);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),classScheduleResponse), HttpStatus.OK);
    }
 
    @RequestMapping(value = "/getClassAttendance", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch class schedule attendance for instructor", notes = "")
    public ResponseEntity getClassScheduleAttendance(String classScheduleId)
            throws Exception {
        int scheduleId = parseIntParam(classScheduleId, "classScheduleId");
        ClassSchedule schedule = classScheduleService.getClassScheduleDetail(scheduleId);
        if (schedule == null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND, "Class schedule not found");
        }
        accessControlService.requireAccessClass(securityContextUtil.getAuthenticatedUserPrincipal(), schedule.getClassId());
        DashboardResponseDTO dashboardResponseDTO = classScheduleService.getClassScheduleAttendance(classScheduleId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),dashboardResponseDTO), HttpStatus.OK);
    }

    @RequestMapping(value = "/getStudentIdsByClassScheduleId", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get student ids by class schedule id", notes = "")
    public ResponseEntity getStudentIdsByClassScheduleId(@RequestParam int classScheduleId)
            throws Exception {
        if (classScheduleId <= 0) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "classScheduleId must be a positive integer");
        }
        ClassSchedule schedule = classScheduleService.getClassScheduleDetail(classScheduleId);
        if (schedule == null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND, "Class schedule not found");
        }
        accessControlService.requireAccessClass(securityContextUtil.getAuthenticatedUserPrincipal(), schedule.getClassId());
        List list = classScheduleService.getStudentIdsByClassScheduleId(classScheduleId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),list), HttpStatus.OK);
    }

    @RequestMapping(value = "/getStudentsByClassScheduleId", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get Student details by class schedule id", notes = "")
    public ResponseEntity getStudentsByClassScheduleId(@RequestParam int classScheduleId)
            throws Exception {
        if (classScheduleId <= 0) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "classScheduleId must be a positive integer");
        }
        ClassSchedule schedule = classScheduleService.getClassScheduleDetail(classScheduleId);
        if (schedule == null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND, "Class schedule not found");
        }
        com._42students.lms.security.UserPrincipal rosterCaller = securityContextUtil.getAuthenticatedUserPrincipal();
        // BE-0025: a class roster (names, rolls, phones, emails) is for staff; a learner could open it for their own class.
        if (rosterCaller == null || rosterCaller.isLearner() || rosterCaller.isRecruiter()) {
            throw new org.springframework.security.access.AccessDeniedException("The class roster is for staff only");
        }
        accessControlService.requireAccessClass(rosterCaller, schedule.getClassId());
        List list = classScheduleService.getStudentsByClassScheduleId(classScheduleId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), list), HttpStatus.OK);
    }
    @RequestMapping(value = "/getAttendanceDetailsByDateRange", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Attendance details of class schedule by DateRange", notes = "Use courseSlug or courseId; courseSlug takes precedence")
    public ResponseEntity getAttendanceDetailsByDateRange(
            @RequestParam int classId,
            @RequestParam(required = false) String courseSlug,
            @RequestParam(required = false) Integer courseId,
            @RequestParam int facultyId,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireAccessClass(principal, classId);
        // AT-15: also restrict non-super-admin principals (including ADMIN type) to their own facultyId.
        //
        // ID-space collision fix: Learner.id and Faculty.id are independent auto-increment
        // sequences, so a learner whose numeric id happens to equal some facultyId previously
        // passed "principal.getId().equals(facultyId)" (type-blind equality) and then SKIPPED
        // requireAccessFacultySchedule entirely, because that call was gated on userType ==
        // FACULTY. A learner never has legitimate access to this endpoint at all -- it returns
        // whole-class attendance rosters, a faculty/admin-only view -- so reject them outright
        // rather than trying to make the id comparison type-aware.
        if (principal != null && !accessControlService.isSuperAdmin(principal)) {
            if (!"FACULTY".equalsIgnoreCase(principal.getUserType())) {
                throw new org.springframework.security.access.AccessDeniedException("Only faculty or admin may access class attendance data");
            }
            if (principal.getId() != null && !principal.getId().equals(facultyId)) {
                throw new org.springframework.security.access.AccessDeniedException("You can only access attendance data for your own faculty ID");
            }
            accessControlService.requireAccessFacultySchedule(principal, facultyId);
        }
        requireValidDateRange(startDate, endDate);
        java.util.Date start = requireValidDate(startDate, "startDate");
        java.util.Date end = requireValidEndDate(endDate, "endDate");
        int resolvedCourseId = courseSlugResolver.resolve(courseSlug, courseId);
        AttendanceDetailsRequestDTO attendanceDetailsDTO = new AttendanceDetailsRequestDTO();
        attendanceDetailsDTO.setClassId(classId);
        attendanceDetailsDTO.setCourseId(resolvedCourseId);
        attendanceDetailsDTO.setFacultyId(facultyId);
        attendanceDetailsDTO.setStartDate(new Date(start.getTime()));
        attendanceDetailsDTO.setEndDate(new Date(end.getTime()));
        List<AttendanceDetailsResponseDTO> attendanceDetailsList = classScheduleService.getAttendanceDetailsByDateRange(attendanceDetailsDTO);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), attendanceDetailsList ), HttpStatus.OK);
    }

    @GetMapping("/getFilteredClassSchedulesAndAbsentees")
    @ApiOperation(value = "Fetch filtered class schedules", notes = "Use courseSlug or courseId; courseSlug takes precedence")
    public ResponseEntity<FilteredClassScheduleResponse> getFilteredClassSchedules(
            @RequestParam int classId,
            @RequestParam(required = false) String courseSlug,
            @RequestParam(required = false) Integer courseId,
            @RequestParam int facultyId,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireAccessClass(principal, classId);
        // AT-15: also restrict non-super-admin principals (including ADMIN type) to their own facultyId.
        //
        // ID-space collision fix: Learner.id and Faculty.id are independent auto-increment
        // sequences, so a learner whose numeric id happens to equal some facultyId previously
        // passed "principal.getId().equals(facultyId)" (type-blind equality) and then SKIPPED
        // requireAccessFacultySchedule entirely, because that call was gated on userType ==
        // FACULTY. A learner never has legitimate access to this endpoint at all -- it returns
        // whole-class attendance rosters, a faculty/admin-only view -- so reject them outright
        // rather than trying to make the id comparison type-aware.
        if (principal != null && !accessControlService.isSuperAdmin(principal)) {
            if (!"FACULTY".equalsIgnoreCase(principal.getUserType())) {
                throw new org.springframework.security.access.AccessDeniedException("Only faculty or admin may access class attendance data");
            }
            if (principal.getId() != null && !principal.getId().equals(facultyId)) {
                throw new org.springframework.security.access.AccessDeniedException("You can only access attendance data for your own faculty ID");
            }
            accessControlService.requireAccessFacultySchedule(principal, facultyId);
        }
        requireValidDateRange(startDate, endDate);
        int resolvedCourseId = courseSlugResolver.resolve(courseSlug, courseId);
        FilteredClassScheduleResponse response = classScheduleService.getFilteredClassSchedules(classId, resolvedCourseId, facultyId, startDate, endDate);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
     
    @GetMapping("/learnerClassSchedulesAndAbsentClassScheduleIds")
    public ResponseEntity<Map<String, Object>> getLearnerClassSchedule(
            @RequestParam String learnerId,
            @RequestParam String startDate,
            @RequestParam String endDate) throws Exception {
        accessControlService.requireAccessLearner(securityContextUtil.getAuthenticatedUserPrincipal(), parseIntParam(learnerId, "learnerId"));
        requireFacultyTeachesLearnerClass(securityContextUtil.getAuthenticatedUserPrincipal(), parseIntParam(learnerId, "learnerId"));
        requireValidDateRange(startDate, endDate);
        java.util.Date startDateFormat = requireValidDate(startDate, "startDate");
        java.util.Date endDateFormat = requireValidEndDate(endDate, "endDate");

        Map<String, Object> response = classScheduleService.getClassScheduleAndAbsentInfo(learnerId, startDateFormat, endDateFormat);
        return ResponseEntity.ok(response);
    }


    @GetMapping("/learnerClassSchedulesAndAbsentClassScheduleIdsWithCourse")
    public ResponseEntity<Map<String, Object>> getLearnerClassScheduleWithCourse(
            @RequestParam String learnerId,
            @RequestParam(required = false) String courseSlug,
            @RequestParam(required = false) String courseId,
            @RequestParam String startDate,
            @RequestParam String endDate) throws Exception {
        accessControlService.requireAccessLearner(securityContextUtil.getAuthenticatedUserPrincipal(), parseIntParam(learnerId, "learnerId"));
        requireFacultyTeachesLearnerClass(securityContextUtil.getAuthenticatedUserPrincipal(), parseIntParam(learnerId, "learnerId"));
        requireValidDateRange(startDate, endDate);
        java.util.Date startDateFormat = requireValidDate(startDate, "startDate");
        java.util.Date endDateFormat = requireValidEndDate(endDate, "endDate");
        String courseIdParam = resolveCourseIdParam(courseSlug, courseId);
        Map<String, Object> response = classScheduleService.getClassScheduleAndAbsentInfoByCourse(learnerId, courseIdParam, startDateFormat, endDateFormat);
        // Attendance policy: exam-eligibility threshold -- was a bare 75 hardcoded in the
        // frontend with no backend knowledge of it at all. This is the one attendance-facing
        // response a learner's own dashboard already calls, so the configured value rides along
        // here rather than requiring a new endpoint the learner's browser could call directly
        // (every other admin-settings read in this app is superadmin-gated).
        if (appSettingsService != null) {
            try {
                Learner learner = studentService.getLearnerDetails(learnerId);
                Integer collegeId = learner != null ? learner.getCollegeId() : null;
                int threshold = appSettingsService.getInt("COLLEGE", collegeId, "attendance.eligibilityThresholdPercent", 75);
                response = new java.util.HashMap<>(response);
                response.put("attendanceThresholdPercent", threshold);
            } catch (Exception ignored) {
                // Never let a settings lookup fail the whole attendance response.
            }
        }
        return ResponseEntity.ok(response);
    }


  @RequestMapping(value = "/getClassSchedulesByClassIdAndDateRange", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch class schedule for class Id by date", notes = "")
    public ResponseEntity getClassScheduleByClassIdAndDateRange(String classId, String startDate, String endDate)
            throws Exception {
        accessControlService.requireAccessClass(securityContextUtil.getAuthenticatedUserPrincipal(), parseIntParam(classId, "classId"));
        requireValidDateRange(startDate, endDate);
        List<ClassIdAndDateRangeResponse> classScheduleResponse = classScheduleService.getClassScheduleByClassIdAndDateRange(classId,
                requireValidDate(startDate, "startDate"),
                requireValidEndDate(endDate, "endDate"));
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),classScheduleResponse), HttpStatus.OK);
    }
     

    @RequestMapping(value = "/getClassSchedulesByClassIdAndDateRangeAndCourseId", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch class schedule for class Id by date and course Id", notes = "Use courseSlug or courseId; courseSlug takes precedence")
    public ResponseEntity getClassScheduleByClassIdAndDateRangeAndCourseId(
            @RequestParam String classId,
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(required = false) String courseSlug,
            @RequestParam(required = false) String courseId) throws Exception {
        accessControlService.requireAccessClass(securityContextUtil.getAuthenticatedUserPrincipal(), parseIntParam(classId, "classId"));
        String courseIdParam = resolveCourseIdParam(courseSlug, courseId);
        List<ClassIdAndDateRangeResponse> classScheduleResponse = classScheduleService.getClassScheduleByClassIdAndDateRangeAndCourseId(
                classId,
                requireValidDate(startDate, "startDate"),
                requireValidEndDate(endDate, "endDate"),
                courseIdParam);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), classScheduleResponse), HttpStatus.OK);
    }


    @RequestMapping(value = "/getClassScheduleCount", method = RequestMethod.GET, produces = "application/json")
@ApiOperation(value = "Get the count of class schedules for a class", notes = "")
public ResponseEntity getClassScheduleCount(@RequestParam int classId)
        throws Exception {
    accessControlService.requireAccessClass(securityContextUtil.getAuthenticatedUserPrincipal(), classId);
    int scheduleCount = classScheduleService.getClassScheduleCountByClassId(classId);
    return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), scheduleCount), HttpStatus.OK);
}



    @GetMapping("/facultyTeachedHours")
    public double getTotalHoursByFacultyId(@RequestParam int facultyId) {
    accessControlService.requireAccessFacultySchedule(securityContextUtil.getAuthenticatedUserPrincipal(), facultyId);
    return classScheduleService.getTotalHoursByFacultyId(facultyId);
}   

@GetMapping("/facultyTeachedHoursByCourse")
    public double getTotalHoursByFacultyAndCourse(
            @RequestParam int facultyId,
            @RequestParam(required = false) String courseSlug,
            @RequestParam(required = false) Integer courseId) {
        accessControlService.requireAccessFacultySchedule(securityContextUtil.getAuthenticatedUserPrincipal(), facultyId);
        int resolvedCourseId = courseSlugResolver.resolve(courseSlug, courseId);
        return classScheduleService.getTotalHoursByFacultyAndCourse(facultyId, resolvedCourseId);
    }


@GetMapping("/facultyTeachedHoursByClass")
public double getTotalHoursByFacultyAndClass(@RequestParam int facultyId, @RequestParam int classId) {
    accessControlService.requireAccessFacultySchedule(securityContextUtil.getAuthenticatedUserPrincipal(), facultyId);
    accessControlService.requireAccessClass(securityContextUtil.getAuthenticatedUserPrincipal(), classId);
    return classScheduleService.getTotalHoursByFacultyAndClass(facultyId, classId);
}


@GetMapping("/facultyTeachedHoursByCourseAndClass")
    public double getTotalHoursByFacultyAndCourseAndClass(
            @RequestParam int facultyId,
            @RequestParam(required = false) String courseSlug,
            @RequestParam(required = false) Integer courseId,
            @RequestParam int classId) {
        accessControlService.requireAccessFacultySchedule(securityContextUtil.getAuthenticatedUserPrincipal(), facultyId);
        accessControlService.requireAccessClass(securityContextUtil.getAuthenticatedUserPrincipal(), classId);
        int resolvedCourseId = courseSlugResolver.resolve(courseSlug, courseId);
        return classScheduleService.getTotalHoursByFacultyAndCourseAndClass(facultyId, resolvedCourseId, classId);
    }

@GetMapping("/facultyUpcomingClass")
@ApiOperation(
        value = "Get the upcoming class for a faculty",
        notes = "Returns details about the next upcoming class for a faculty based on the current date and time."
    )
public ResponseEntity getUpcomingClass(@RequestParam("facultyId") int facultyId) {
    accessControlService.requireAccessFacultySchedule(securityContextUtil.getAuthenticatedUserPrincipal(), facultyId);
    // Retrieve the upcoming class based on the current date and time
    ClassSchedule upcomingClass = classScheduleService.getUpcomingClass(facultyId);

    // Section 6 #7: was a bare 404 (no body) on the "nothing upcoming" path and a raw ClassSchedule
    // (no envelope) on success -- the only endpoint in the module not using the shared Response<>
    // envelope. Confirmed unused by both the web frontend and the mobile app before changing the
    // shape, so this is a safe consistency fix rather than a breaking change for a live consumer.
    if (upcomingClass != null) {
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), upcomingClass), HttpStatus.OK);
    }
    return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "No upcoming class found", null), HttpStatus.NOT_FOUND);
}



    /**
     * BE-0025: a schedule shown to a learner carries no classmates. Each class in a schedule embeds its roster (name, roll,
     * mobile, email), and the schedule endpoints are open to learners of the college, so any learner could read other
     * students' contact details through a calendar call.
     */
    private List<ClassScheduleResponse> withoutRostersForLearners(List<ClassScheduleResponse> schedules) {
        com._42students.lms.security.UserPrincipal caller = securityContextUtil.getAuthenticatedUserPrincipal();
        boolean staff = caller != null && !caller.isLearner() && !caller.isRecruiter();
        if (staff || schedules == null) return schedules;
        for (ClassScheduleResponse r : schedules) if (r != null) r.setLearnerList(java.util.Collections.emptyList());
        return schedules;
    }
}
