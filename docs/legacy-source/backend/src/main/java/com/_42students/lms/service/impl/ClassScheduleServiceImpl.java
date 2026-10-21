package com._42students.lms.service.impl;

import java.text.SimpleDateFormat;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;
import java.text.ParseException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com._42students.lms.dto.request.AttendanceDetailsRequestDTO;
import com._42students.lms.dto.request.ClassScheduleDTO;
import com._42students.lms.dto.response.AttendanceDetailsResponseDTO;
import com._42students.lms.dto.response.ClassScheduleResponse;
import com._42students.lms.dto.response.DashboardResponseDTO;
import com._42students.lms.dto.response.FilteredClassScheduleResponse;
import com._42students.lms.dto.response.LearnerResponseDTO;
import com._42students.lms.dto.response.SimplifiedClassScheduleResponse;

import com._42students.lms.model.Attend;
import com._42students.lms.model.ClassSchedule;
import com._42students.lms.model.Course;
import com._42students.lms.model.Learner;
import com._42students.lms.model._Class;
import com._42students.lms.repository.AttendanceRepository;
import com._42students.lms.repository.ClassScheduleRepository;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.LectureHallRepository;
import com._42students.lms.repository._ClassRepository;
import com._42students.lms.service.ClassScheduleService;
import com._42students.lms.service.ClassService;
import com._42students.lms.service.CourseService;
import com._42students.lms.service.LearnerService;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.dto.response.ClassIdAndDateRangeResponse;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class ClassScheduleServiceImpl implements ClassScheduleService {

    /** ADM 3.6: grace on the past-booking check, for clock skew between the client and server. */
    private static final int PAST_BOOKING_GRACE_MINUTES_DEFAULT = 5;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.service.AppSettingsService appSettingsService;

    /**
     * A learner's timetable spans their own section and the group-backed classes of their
     * electives. Without the resolver (unit tests) this is exactly the old single-class read.
     */
    private List<ClassSchedule> learnerSchedules(Learner learner, Date startDate, Date endDate) {
        List<Integer> classIds = scopeResolutionService == null
                ? java.util.Collections.emptyList()
                : scopeResolutionService.resolveLearnerToClassIds(learner.getId());
        if (classIds.isEmpty()) {
            if (learner.getClassId() == null) return new ArrayList<>();
            return classScheduleRepository.getClassScheduleByClassId(String.valueOf(learner.getClassId()), startDate, endDate);
        }
        return classScheduleRepository.getClassScheduleByClassIds(classIds, startDate, endDate);
    }

    private int pastBookingGraceMinutes() {
        return appSettingsService != null
                ? appSettingsService.getInt("GLOBAL", null, "schedule.pastBookingGraceMinutes",
                        PAST_BOOKING_GRACE_MINUTES_DEFAULT)
                : PAST_BOOKING_GRACE_MINUTES_DEFAULT;
    }

    @Autowired
    ClassScheduleRepository classScheduleRepository;

    // Self-injected proxy, used only so bulkReassignFaculty's per-row call to reassignOneSchedule
    // goes through Spring's transactional proxy (REQUIRES_NEW) instead of a bare self-invocation,
    // which bypasses AOP and would run every row in the caller's one transaction -- exactly the B2
    // anti-pattern this codebase has already fixed in bulk learner/faculty registration.
    @Autowired
    @org.springframework.context.annotation.Lazy
    private ClassScheduleService self;

    // Class scheduling wrote no admin audit trail. Combined with the fact that a schedule row
    // blocks its faculty/class/hall slot for conflict detection, an unexplained scheduling
    // change had no record of who made it. required=false keeps these optional for unit tests.
    @Autowired(required = false)
    com._42students.lms.service.AdminAuditLogService auditLogService;

    @Autowired(required = false)
    javax.servlet.http.HttpServletRequest httpRequest;

    private void auditSchedule(String actionKey, Object scheduleId, java.util.Map<String, Object> payload) {
        if (auditLogService == null) return;
        auditLogService.log(httpRequest, actionKey, "class_schedule", String.valueOf(scheduleId),
                null, null, payload != null ? payload : java.util.Map.of());
    }

    @Autowired
    LearnerService studentService;

    @Autowired
    ClassService classService;

    @Autowired
    AttendanceRepository attendanceRepository;

    @Autowired
    CourseService courseService;

    @Autowired
    LearnerRepository learnerRepository;

    @Autowired(required = false)
    FacultyRepository facultyRepository;

    @Autowired(required = false)
    LectureHallRepository lectureHallRepository;

    @Autowired(required = false)
    com._42students.lms.access.ScopeResolutionService scopeResolutionService;

    @Autowired(required = false)
    _ClassRepository classRepositoryForLocking;

    @Autowired(required = false)
    com._42students.lms.service.NotificationService notificationService;

    private static final DateTimeFormatter SCHEDULE_TIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    // 3.7: start < end was enforced but nothing bounded how far apart they could be. A single
    // absurdly long "session" (a typo'd end date, a bad copy-paste) blocks its faculty member and
    // lecture hall for the entire span via conflict detection -- aggravating 1.2's cross-college
    // DoS shape even for a same-college, non-malicious mistake. 12 hours comfortably covers any
    // real single teaching session (including a full-day workshop) with room to spare.
    private static final long MAX_SESSION_HOURS = 12;

    private void requireReasonableDuration(LocalDateTime start, LocalDateTime end) {
        // Compare the complete Duration: toHours() truncates 12h59m to 12 and
        // incorrectly accepts a session longer than the configured maximum.
        if (java.time.Duration.between(start, end)
                .compareTo(java.time.Duration.ofHours(MAX_SESSION_HOURS)) > 0) {
            throw new IllegalArgumentException("A single class session cannot exceed " + MAX_SESSION_HOURS + " hours");
        }
    }

    @Override
    @Transactional
    public ClassSchedule update(int classScheduleId, ClassScheduleDTO classScheduleDTO) {
        ClassSchedule existing = classScheduleRepository.findById(classScheduleId)
                .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class schedule not found"));

        String startStr = classScheduleDTO.getStartTime() != null ? classScheduleDTO.getStartTime() : existing.getStartTime();
        String endStr = classScheduleDTO.getEndTime() != null ? classScheduleDTO.getEndTime() : existing.getEndTime();

        // AT-08: start must precede end. Deliberately NOT re-applying AT-09 ("no scheduling in
        // the past") here — correcting the details of a session that has already happened is a
        // legitimate and necessary admin action, and was impossible while no update endpoint
        // existed at all.
        if (startStr != null && endStr != null) {
            try {
                LocalDateTime start = LocalDateTime.parse(startStr, SCHEDULE_TIME_FMT);
                LocalDateTime end = LocalDateTime.parse(endStr, SCHEDULE_TIME_FMT);
                if (!start.isBefore(end)) {
                    throw new IllegalArgumentException("Schedule start time must be before end time");
                }
                requireReasonableDuration(start, end);
            } catch (IllegalArgumentException e) {
                throw e;
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid start or end time format. Use yyyy-MM-dd HH:mm:ss");
            }
        }

        int facultyId = classScheduleDTO.getFacultyId() > 0 ? classScheduleDTO.getFacultyId() : existing.getFacultyId();
        int classId = classScheduleDTO.getClassId() > 0 ? classScheduleDTO.getClassId() : existing.getClassId();
        int lectureHallId = classScheduleDTO.getLectureHallId() > 0 ? classScheduleDTO.getLectureHallId() : existing.getLectureHallId();

        // Same cross-college reference check as create() — see its comment. Applies to the
        // effective (possibly-defaulted-from-existing) ids, so an update cannot smuggle in a
        // cross-college faculty/hall any more than a create can.
        requireSameCollegeReferences(classId, facultyId, lectureHallId);

        // AT-07 conflict detection, same DB-level pessimistic locking as create() so two
        // concurrent edits for the same faculty/class/hall serialize rather than both passing.
        if (startStr != null && endStr != null) {
            if (facultyId > 0 && facultyRepository != null) {
                facultyRepository.findByIdForUpdate(facultyId);
            }
            if (classId > 0 && classRepositoryForLocking != null) {
                classRepositoryForLocking.findByIdForUpdate(classId);
            }
            if (lectureHallId > 0 && lectureHallRepository != null) {
                lectureHallRepository.findByIdForUpdate(lectureHallId);
            }
            if (facultyId > 0 && classScheduleRepository.countFacultyConflictsExcluding(facultyId, startStr, endStr, classScheduleId) > 0) {
                throw new IllegalArgumentException("Faculty scheduling conflict: this faculty already has a class during this time slot");
            }
            if (classId > 0 && classScheduleRepository.countClassConflictsExcluding(classId, startStr, endStr, classScheduleId) > 0) {
                throw new IllegalArgumentException("Batch scheduling conflict: this class already has a session during this time slot");
            }
            if (lectureHallId > 0 && classScheduleRepository.countLectureHallConflictsExcluding(lectureHallId, startStr, endStr, classScheduleId) > 0) {
                throw new IllegalArgumentException("Lecture hall conflict: the selected hall is already booked during this time slot");
            }
        }

        existing.setStartTime(startStr);
        existing.setEndTime(endStr);
        existing.setFacultyId(facultyId);
        existing.setClassId(classId);
        existing.setLectureHallId(lectureHallId);
        if (classScheduleDTO.getTitle() != null) {
            existing.setTitle(classScheduleDTO.getTitle());
        }
        int courseId = resolveCourseId(classScheduleDTO.getCourseSlug(), classScheduleDTO.getCourseId());
        // Validate the effective course, including the saved one when the update omits courseId.
        requireSameCollegeCourse(classId, courseId > 0 ? courseId : existing.getCourseId());
        if (courseId > 0) {
            existing.setCourseId(courseId);
        }
        ClassSchedule savedSchedule = classScheduleRepository.save(existing);
        auditSchedule("CLASS_SCHEDULE_UPDATE", classScheduleId, java.util.Map.of(
                "classId", String.valueOf(savedSchedule.getClassId()),
                "facultyId", String.valueOf(savedSchedule.getFacultyId())));
        return savedSchedule;
    }

    @Override
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void reassignOneSchedule(int classScheduleId, int newFacultyId) {
        ClassScheduleDTO dto = new ClassScheduleDTO();
        dto.setFacultyId(newFacultyId);
        // classId/startTime/endTime/lectureHallId/courseId left unset -> update() defaults them
        // to the existing row's values, so only facultyId actually changes.
        update(classScheduleId, dto);
    }

    @Override
    @Transactional(readOnly = true)
    public com._42students.lms.dto.response.BulkReassignFacultyResultDTO bulkReassignFaculty(int oldFacultyId, int newFacultyId) {
        com._42students.lms.dto.response.BulkReassignFacultyResultDTO report = new com._42students.lms.dto.response.BulkReassignFacultyResultDTO();
        LocalDateTime nowDt = LocalDateTime.now();
        Date from = Date.from(nowDt.atZone(java.time.ZoneId.systemDefault()).toInstant());
        Date to = Date.from(nowDt.plusYears(1).atZone(java.time.ZoneId.systemDefault()).toInstant());
        List<ClassSchedule> upcoming = classScheduleRepository.getClassScheduleByFacultyId(
                String.valueOf(oldFacultyId), from, to);
        report.setScanned(upcoming.size());
        for (ClassSchedule s : upcoming) {
            try {
                self.reassignOneSchedule(s.getId(), newFacultyId);
                report.setReassigned(report.getReassigned() + 1);
            } catch (Exception e) {
                report.getFailed().add(new com._42students.lms.dto.response.BulkReassignFacultyResultDTO.FailedItem(
                        s.getId(), e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
            }
        }
        if (report.getReassigned() > 0) {
            auditSchedule("CLASS_SCHEDULE_BULK_REASSIGN", oldFacultyId, java.util.Map.of(
                    "oldFacultyId", String.valueOf(oldFacultyId),
                    "newFacultyId", String.valueOf(newFacultyId),
                    "reassigned", String.valueOf(report.getReassigned()),
                    "failed", String.valueOf(report.getFailed().size())));
        }
        return report;
    }

    @Override
    @Transactional
    public void delete(int classScheduleId) {
        ClassSchedule existing = classScheduleRepository.findById(classScheduleId)
                .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class schedule not found"));
        // Soft delete: attendance rows keep referencing this schedule for history, but the
        // session stops counting toward attendance denominators (both the held-session count and
        // the absence count filter on cs.is_deleted = 0).
        existing.setIsDeleted(true);
        classScheduleRepository.save(existing);
        auditSchedule("CLASS_SCHEDULE_DELETE", classScheduleId, java.util.Map.of());
    }

    @Override
    @Transactional
    public ClassSchedule create(ClassScheduleDTO classScheduleDTO) {
        // AT-08: validate that start time is before end time
        // AT-09: validate that start time is not in the past
        String startStr = classScheduleDTO.getStartTime();
        String endStr = classScheduleDTO.getEndTime();
        if (startStr != null && endStr != null) {
            try {
                LocalDateTime start = LocalDateTime.parse(startStr, SCHEDULE_TIME_FMT);
                LocalDateTime end = LocalDateTime.parse(endStr, SCHEDULE_TIME_FMT);
                if (!start.isBefore(end)) {
                    throw new IllegalArgumentException("Schedule start time must be before end time");
                }
                requireReasonableDuration(start, end);
                // AT-09: block scheduling in the past, allowing a little grace for clock skew.
                // ADM 3.6: the grace was a hardcoded 5 minutes, which is too tight for a tenant
                // whose devices drift and too loose for one that wants the rule enforced strictly.
                if (start.isBefore(LocalDateTime.now().minusMinutes(pastBookingGraceMinutes()))) {
                    throw new IllegalArgumentException("Cannot schedule a class in the past");
                }
            } catch (IllegalArgumentException e) {
                throw e;
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid start or end time format. Use yyyy-MM-dd HH:mm:ss");
            }
        }
        // Cross-college reference check. create() previously persisted facultyId/lectureHallId
        // straight from the DTO with no validation that either belongs to the class's college.
        // Conflict detection below is globally scoped (correct, for cross-college double-booking
        // detection in general), which combined with the missing check meant a caller could
        // reference another college's facultyId/lectureHallId across a wide future time range:
        // that faculty member and hall become permanently "busy" for every legitimate booking at
        // the referenced college, with no delete endpoint (at audit time) to undo it. Validate
        // before the conflict checks run, so a cross-college attempt fails fast rather than taking
        // locks first.
        requireSameCollegeReferences(classScheduleDTO.getClassId(), classScheduleDTO.getFacultyId(), classScheduleDTO.getLectureHallId());
        // Validate course/college before acquiring locks or persisting a schedule.
        int courseId = resolveCourseId(classScheduleDTO.getCourseSlug(), classScheduleDTO.getCourseId());
        requireSameCollegeCourse(classScheduleDTO.getClassId(), courseId);

        // AT-07: detect scheduling conflicts (faculty, batch, lecture hall)
        //
        // TOCTOU fix: the conflict check (SELECT COUNT(*)) and the INSERT below are two separate
        // statements, so two concurrent requests for the same faculty/class/lecture hall + time
        // slot could both pass the check before either commits. A JVM-local `synchronized` block
        // would not be safe here since the app can run multiple backend replicas (see the
        // cross-pod locking precedent in FacultyRepository.findByIdForUpdate and
        // _ClassRepository.findByIdForUpdate). Instead, take a DB-level PESSIMISTIC_WRITE lock on
        // the referenced faculty/class/lecture-hall row(s) up front, inside this @Transactional
        // method, so concurrent create() calls for the same resource serialize on the DB and the
        // second one re-checks conflicts (including the first one's now-committed row) before
        // inserting.
        if (startStr != null && endStr != null) {
            int facultyId = classScheduleDTO.getFacultyId();
            if (facultyId > 0 && facultyRepository != null) {
                facultyRepository.findByIdForUpdate(facultyId);
            }
            int classId = classScheduleDTO.getClassId();
            if (classId > 0 && classRepositoryForLocking != null) {
                classRepositoryForLocking.findByIdForUpdate(classId);
            }
            int lectureHallId = classScheduleDTO.getLectureHallId();
            if (lectureHallId > 0 && lectureHallRepository != null) {
                lectureHallRepository.findByIdForUpdate(lectureHallId);
            }

            if (facultyId > 0 && classScheduleRepository.countFacultyConflicts(facultyId, startStr, endStr) > 0) {
                throw new IllegalArgumentException("Faculty scheduling conflict: this faculty already has a class during this time slot");
            }
            if (classId > 0 && classScheduleRepository.countClassConflicts(classId, startStr, endStr) > 0) {
                throw new IllegalArgumentException("Batch scheduling conflict: this class already has a session during this time slot");
            }
            if (lectureHallId > 0 && classScheduleRepository.countLectureHallConflicts(lectureHallId, startStr, endStr) > 0) {
                throw new IllegalArgumentException("Lecture hall conflict: the selected hall is already booked during this time slot");
            }
        }
        // courseId was resolved and its college validated before conflict locks.
        ClassSchedule classSchedule = new ClassSchedule();
        classSchedule.setClassId(classScheduleDTO.getClassId());
        classSchedule.setStartTime(classScheduleDTO.getStartTime());
        classSchedule.setEndTime(classScheduleDTO.getEndTime());
        classSchedule.setFacultyId(classScheduleDTO.getFacultyId());
        classSchedule.setCourseId(courseId);
        classSchedule.setLectureHallId(classScheduleDTO.getLectureHallId());
        classSchedule.setTitle(classScheduleDTO.getTitle());
        classScheduleRepository.save(classSchedule);
        auditSchedule("CLASS_SCHEDULE_CREATE", classSchedule.getId(), java.util.Map.of(
                "classId", String.valueOf(classSchedule.getClassId()),
                "facultyId", String.valueOf(classSchedule.getFacultyId())));
        notifyClassScheduled(classSchedule);
        return classSchedule;
    }

    /**
     * Suggestion from faculty UX review: let students know a new class was scheduled instead of
     * them discovering it only by opening the attendance/roadmap page. Best-effort -- a
     * notification failure must never fail the scheduling request itself, so any exception here
     * is swallowed after logging.
     */
    private void notifyClassScheduled(ClassSchedule classSchedule) {
        if (notificationService == null || classSchedule.getClassId() <= 0) return;
        try {
            String whenText;
            try {
                LocalDateTime start = LocalDateTime.parse(classSchedule.getStartTime(), SCHEDULE_TIME_FMT);
                whenText = start.format(java.time.format.DateTimeFormatter.ofPattern("EEE, d MMM 'at' h:mm a"));
            } catch (Exception e) {
                whenText = "soon";
            }
            String title = classSchedule.getTitle() != null && !classSchedule.getTitle().isBlank()
                    ? classSchedule.getTitle()
                    : "New class scheduled";
            notificationService.createNotification(
                    title,
                    "A class has been scheduled for " + whenText + ".",
                    classSchedule.getClassId(),
                    classSchedule.getCourseId() > 0 ? classSchedule.getCourseId() : null);
        } catch (Exception e) {
            log.warn("Failed to send class-scheduled notification for classScheduleId={}: {}",
                    classSchedule.getId(), e.getMessage());
        }
    }

    /**
     * Rejects a schedule that references a faculty member or lecture hall outside the class's own
     * college. Missing beans/unresolvable ids are treated as "pass" (matches the fail-open
     * convention already used by the required=false locking beans above) rather than blocking
     * scheduling outright when scope data cannot be resolved, but any id that DOES resolve to a
     * different college than the class is always rejected.
     */
    private void requireSameCollegeReferences(int classId, int facultyId, int lectureHallId) {
        if (scopeResolutionService == null || classId <= 0) return;
        Integer classCollegeId = scopeResolutionService.resolveClassToCollegeId(classId);
        if (classCollegeId == null) return;
        if (facultyId > 0) {
            Integer facultyCollegeId = scopeResolutionService.resolveFacultyToCollegeId(facultyId);
            if (facultyCollegeId != null && !facultyCollegeId.equals(classCollegeId)) {
                throw new IllegalArgumentException("Faculty does not belong to this class's college");
            }
        }
        if (lectureHallId > 0 && lectureHallRepository != null) {
            com._42students.lms.model.LectureHall hall = lectureHallRepository.findById(lectureHallId).orElse(null);
            if (hall != null && hall.getCollegeId() != classCollegeId) {
                throw new IllegalArgumentException("Lecture hall does not belong to this class's college");
            }
        }
    }

    /** Prevent linking a class schedule to a course from another college.
     * Course ID zero represents a course-less legacy session and remains supported.
     * Missing/unresolvable *positive* IDs are rejected when scope resolution is configured.
     */
    private void requireSameCollegeCourse(int classId, int courseId) {
        if (classId <= 0 || courseId <= 0 || scopeResolutionService == null) return;
        Integer classCollegeId = scopeResolutionService.resolveClassToCollegeId(classId);
        Integer courseCollegeId = scopeResolutionService.resolveCourseToCollegeId(courseId);
        if (classCollegeId == null || courseCollegeId == null || !classCollegeId.equals(courseCollegeId)) {
            throw new IllegalArgumentException("Course does not belong to this class's college");
        }
    }

    private int resolveCourseId(String courseSlug, int fallbackCourseId) {
        if (courseSlug != null && !courseSlug.trim().isEmpty()) {
            // This 400 was previously unreachable: fetchCourseBySlug threw rather than returning
            // null, so an unknown slug escaped as a bare RuntimeException and surfaced as a 500.
            return courseService.fetchCourseBySlug(courseSlug.trim())
                    .map(Course::getId)
                    .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.BAD_REQUEST, "Course not found for slug"));
        }
        return fallbackCourseId;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassScheduleResponse> getClassSchedule(String instructorId, Date startTime, Date endTime) {
        List<ClassSchedule> classSchedule = classScheduleRepository.getClassSchedule(instructorId, startTime, endTime);
        List<ClassScheduleResponse> classScheduleResponses = new ArrayList<>();
        List<Integer> uniqueClassIds = classSchedule.stream()
                .map(ClassSchedule::getClassId)
                .distinct()
                .collect(Collectors.toList());
        Map<Integer, List<LearnerResponseDTO>> learnersByClassId = new HashMap<>();
        for (Integer cid : uniqueClassIds) {
            learnersByClassId.put(cid, studentService.getStudentDetailsByClassId(cid));
        }
        for (ClassSchedule schedule : classSchedule) {
            ClassScheduleResponse classScheduleResponse = new ClassScheduleResponse();
            _Class aClass = classService.getClassDetail(String.valueOf(schedule.getClassId()));
            classScheduleResponse.setClassName(aClass != null ? aClass.getName() : null);
            classScheduleResponse.setFacultyId(schedule.getFacultyId());
            classScheduleResponse.setClassScheduleId(schedule.getId());
            classScheduleResponse.setClassId(schedule.getClassId());
            classScheduleResponse.setCourseId(schedule.getCourseId());
            Course course = courseService.fetchCourse(schedule.getCourseId());
            classScheduleResponse.setCourseSlug(course != null ? course.getSlug() : null);
            classScheduleResponse.setStartTime(schedule.getStartTime());
            classScheduleResponse.setEndTime(schedule.getEndTime());
            classScheduleResponse.setLectureHallId(schedule.getLectureHallId());
            classScheduleResponse.setTitle(schedule.getTitle());
            List<LearnerResponseDTO> learners = learnersByClassId.getOrDefault(schedule.getClassId(), new ArrayList<>());
            classScheduleResponse.setLearnerList(learners);
            classScheduleResponse.setLearnerCount(learners.size());
            classScheduleResponses.add(classScheduleResponse);
        }
        return classScheduleResponses;
    }

    @Override
    public ClassSchedule getClassScheduleDetail(int classScheduleId) {
        return classScheduleRepository.getClassScheduleDetail(classScheduleId);
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardResponseDTO getClassScheduleAttendance(String classScheduleId) {
        List<Attend> attends = attendanceRepository.getClassScheduleAttendance(classScheduleId);
        ClassSchedule classSchedule = getClassScheduleDetail(Integer.parseInt(classScheduleId));
        if (classSchedule == null) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Class schedule not found");
        }
        _Class aClass = classService.getClassDetail(String.valueOf(classSchedule.getClassId()));
        List<LearnerResponseDTO> studentDTOList = studentService.getStudentDetailsByClassId(classSchedule.getClassId());
        DashboardResponseDTO dashboardResponseDTO = new DashboardResponseDTO();
        dashboardResponseDTO.setTotalLearners(studentDTOList);
        dashboardResponseDTO.setStudentsAbsent(attends);
        dashboardResponseDTO.setAbsentCount(attends.size());
        dashboardResponseDTO.setTotalCount(studentDTOList.size());
        dashboardResponseDTO.setFacultyId(classSchedule.getFacultyId());
        dashboardResponseDTO.setTotalPresent(dashboardResponseDTO.getTotalCount() - dashboardResponseDTO.getAbsentCount());
        dashboardResponseDTO.setClassName(aClass != null ? aClass.getName() : null);
        dashboardResponseDTO.setAttendanceMarked(classSchedule.getAttendanceMarkedAt() != null);
        return dashboardResponseDTO;
    }

    @Override
    @Transactional
    public void markAttendanceTaken(int classScheduleId) {
        ClassSchedule schedule = classScheduleRepository.getClassScheduleDetail(classScheduleId);
        if (schedule == null) {
            return;
        }
        // Idempotent: keep the first mark time rather than bumping it on every later correction.
        if (schedule.getAttendanceMarkedAt() == null) {
            schedule.setAttendanceMarkedAt(new java.sql.Timestamp(System.currentTimeMillis()));
            classScheduleRepository.save(schedule);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassScheduleResponse> getClassScheduleByClassId(String classId, Date startTime, Date endTime) {
        List<ClassSchedule> classSchedule = classScheduleRepository.getClassScheduleByClassId(classId, startTime, endTime);
        List<ClassScheduleResponse> classScheduleResponses = new ArrayList<>();
        List<Integer> uniqueClassIds = classSchedule.stream()
                .map(ClassSchedule::getClassId)
                .distinct()
                .collect(Collectors.toList());
        Map<Integer, List<LearnerResponseDTO>> learnersByClassId = new HashMap<>();
        for (Integer cid : uniqueClassIds) {
            learnersByClassId.put(cid, studentService.getStudentDetailsByClassId(cid));
        }
        for (ClassSchedule schedule : classSchedule) {
            ClassScheduleResponse classScheduleResponse = new ClassScheduleResponse();
            _Class aClass = classService.getClassDetail(String.valueOf(schedule.getClassId()));
            classScheduleResponse.setClassName(aClass != null ? aClass.getName() : null);
            classScheduleResponse.setFacultyId(schedule.getFacultyId());
            classScheduleResponse.setCourseId(schedule.getCourseId());
            Course courseForSlug = courseService.fetchCourse(schedule.getCourseId());
            classScheduleResponse.setCourseSlug(courseForSlug != null ? courseForSlug.getSlug() : null);
            classScheduleResponse.setLectureHallId(schedule.getLectureHallId());
            classScheduleResponse.setClassScheduleId(schedule.getId());
            classScheduleResponse.setClassId(schedule.getClassId());
            classScheduleResponse.setStartTime(schedule.getStartTime());
            classScheduleResponse.setEndTime(schedule.getEndTime());
            classScheduleResponse.setTitle(schedule.getTitle());
            List<LearnerResponseDTO> learners = learnersByClassId.getOrDefault(schedule.getClassId(), new ArrayList<>());
            classScheduleResponse.setLearnerList(learners);
            classScheduleResponse.setLearnerCount(learners.size());
            classScheduleResponses.add(classScheduleResponse);
        }
        return classScheduleResponses;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Integer> getStudentIdsByClassScheduleId(int classScheduleId) {
        ClassSchedule classSchedule = getClassScheduleDetail(classScheduleId);
        if (classSchedule == null) {
            return new ArrayList<>();
        }
        List<LearnerResponseDTO> learnerResponseDTOS = studentService.getStudentDetailsByClassId(classSchedule.getClassId());
        List<Integer> studentIds = new ArrayList<>();
        for (LearnerResponseDTO learnerResponseDTO : learnerResponseDTOS) {
            studentIds.add(learnerResponseDTO.getLearnerId());
        }
        return studentIds;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassScheduleResponse> getClassScheduleByFacultyId(String facultyId, Date dateFormat, Date endDateFormat) {
        List<ClassSchedule> classSchedule = classScheduleRepository.getClassScheduleByFacultyId(facultyId, dateFormat, endDateFormat);
        List<ClassScheduleResponse> classScheduleResponses = new ArrayList<>();
        List<Integer> uniqueClassIds = classSchedule.stream()
                .map(ClassSchedule::getClassId)
                .distinct()
                .collect(Collectors.toList());
        Map<Integer, List<LearnerResponseDTO>> learnersByClassId = new HashMap<>();
        for (Integer cid : uniqueClassIds) {
            learnersByClassId.put(cid, studentService.getStudentDetailsByClassId(cid));
        }
        for (ClassSchedule schedule : classSchedule) {
            ClassScheduleResponse classScheduleResponse = new ClassScheduleResponse();
            _Class aClass = classService.getClassDetail(String.valueOf(schedule.getClassId()));
            classScheduleResponse.setClassName(aClass != null ? aClass.getName() : null);
            classScheduleResponse.setFacultyId(schedule.getFacultyId());
            classScheduleResponse.setCourseId(schedule.getCourseId());
            Course courseForName = courseService.fetchCourse(schedule.getCourseId());
            classScheduleResponse.setCourseName(courseForName != null ? courseForName.getCourseName() : null);
            classScheduleResponse.setCourseSlug(courseForName != null ? courseForName.getSlug() : null);
            classScheduleResponse.setLectureHallId(schedule.getLectureHallId());
            classScheduleResponse.setClassScheduleId(schedule.getId());
            classScheduleResponse.setClassId(schedule.getClassId());
            classScheduleResponse.setStartTime(schedule.getStartTime());
            classScheduleResponse.setEndTime(schedule.getEndTime());
            classScheduleResponse.setTitle(schedule.getTitle());
            List<LearnerResponseDTO> learners = learnersByClassId.getOrDefault(schedule.getClassId(), new ArrayList<>());
            classScheduleResponse.setLearnerList(learners);
            classScheduleResponse.setLearnerCount(learners.size());
            classScheduleResponses.add(classScheduleResponse);
        }
        return classScheduleResponses;
    }
    
    

    public List<Integer> getCourses(int facultyId) {
       return classScheduleRepository.getCourses(facultyId);
    }

    @Override
    public List<Integer> getDistinctCourseIdsByClassId(int classId) {
        return classScheduleRepository.findDistinctCourseIdsByClassId(classId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LearnerResponseDTO> getStudentsByClassScheduleId(int classScheduleId) {
        ClassSchedule classSchedule = getClassScheduleDetail(classScheduleId);
        if (classSchedule == null) {
            return new ArrayList<>();
        }
        List<LearnerResponseDTO> learnerResponseDTOS = studentService.getStudentDetailsByClassId(classSchedule.getClassId());
        return learnerResponseDTOS;
    }
 
    @Override
    @Transactional(readOnly = true)
    public List<AttendanceDetailsResponseDTO> getAttendanceDetailsByDateRange(AttendanceDetailsRequestDTO attendanceDetailsDTO) {
        List<ClassSchedule> classSchedules = classScheduleRepository.getClassScheduleByClassRange(attendanceDetailsDTO.getFacultyId(),
                                                                                                attendanceDetailsDTO.getClassId(),
                                                                                                attendanceDetailsDTO.getCourseId(),
                                                                                                attendanceDetailsDTO.getStartDate(),
                                                                                                 attendanceDetailsDTO.getEndDate());
        return buildAttendanceDetails(classSchedules, attendanceDetailsDTO.getClassId(), attendanceDetailsDTO.getStartDate(), attendanceDetailsDTO.getEndDate());
    }

    @Override
    @Transactional(readOnly = true)
    // Admin oversight variant — same aggregation, but sourced from every session for this
    // class+course regardless of which faculty taught it (see getClassScheduleByClassRangeAnyFaculty's
    // comment). Lets an admin view/audit attendance without needing to know or impersonate the
    // specific faculty who happened to teach a given session.
    public List<AttendanceDetailsResponseDTO> getAttendanceDetailsByDateRangeForAdmin(int classId, int courseId, java.sql.Date startDate, java.sql.Date endDate) {
        List<ClassSchedule> classSchedules = classScheduleRepository.getClassScheduleByClassRangeAnyFaculty(classId, courseId, startDate, endDate);
        return buildAttendanceDetails(classSchedules, classId, startDate, endDate);
    }

    private List<AttendanceDetailsResponseDTO> buildAttendanceDetails(List<ClassSchedule> classSchedules, int classId, java.sql.Date startDateParam, java.sql.Date endDateParam) {
        List<AttendanceDetailsResponseDTO> response = new ArrayList<>();
        HashMap<Integer, ClassSchedule> classScheduleMap = new HashMap<>();

        if (classSchedules.isEmpty()) {
            return response;
        }

        // Sschedule Ids for fetching time slot details
        List<Integer> classScheduleIds = new ArrayList<>();


 
        // ACADEMIC_ATTENDANCE_DATE_SCOPE_V1: a schedule is a real dated session, not a
        // recurring weekly template. Never create a present-marked slot on an unscheduled day.
        // Also preserve real Sunday sessions; excluding Sunday hid valid attendance history.
        LocalDate from = startDateParam.toLocalDate();
        LocalDate to = endDateParam.toLocalDate();
        HashMap<LocalDate, HashMap<String, HashMap<String, String>>> dateFillTemplate = new HashMap<>();
        for (ClassSchedule schedule : classSchedules) {
            String startTime = schedule.getStartTime();
            if (startTime == null || startTime.length() < 10) {
                continue;
            }
            LocalDate sessionDate;
            try {
                sessionDate = LocalDate.parse(startTime.substring(0, 10));
            } catch (java.time.format.DateTimeParseException invalidDate) {
                continue; // Do not fabricate attendance for malformed historical rows.
            }
            if (sessionDate.isBefore(from) || sessionDate.isAfter(to)) {
                continue;
            }
            classScheduleIds.add(schedule.getId());
            classScheduleMap.put(schedule.getId(), schedule);
            HashMap<String, String> slot = new HashMap<>();
            slot.put("StartTime", startTime);
            slot.put("EndTime", schedule.getEndTime());
            slot.put("Attendance", "P");
            dateFillTemplate.computeIfAbsent(sessionDate, ignored -> new HashMap<>())
                    .put(startTime, slot);
        }
        if (classScheduleIds.isEmpty()) {
            return response;
        }
        List<Attend> attendanceList = attendanceRepository.getAttendanceByClassScheduleIds(classScheduleIds);
        HashMap<String, HashMap<LocalDate, HashMap<String, HashMap<String, String>>>> studentAttendanceMap = new HashMap<>();
        List<LearnerResponseDTO> studentListForClass = studentService.getStudentDetailsByClassId(classId);

        if (studentListForClass.isEmpty()) {
            return response;
        }

        Map<Integer, LearnerResponseDTO> studentById = new HashMap<>();
        for (LearnerResponseDTO s : studentListForClass) {
            studentById.put(s.getLearnerId(), s);
        }

        // Give each student a deep copy of the date template so they don't share references
        for (LearnerResponseDTO student : studentListForClass) {
            HashMap<LocalDate, HashMap<String, HashMap<String, String>>> studentMap = new HashMap<>();
            for (Map.Entry<LocalDate, HashMap<String, HashMap<String, String>>> e : dateFillTemplate.entrySet()) {
                HashMap<String, HashMap<String, String>> dayCopy = new HashMap<>();
                for (Map.Entry<String, HashMap<String, String>> slotEntry : e.getValue().entrySet()) {
                    dayCopy.put(slotEntry.getKey(), new HashMap<>(slotEntry.getValue()));
                }
                studentMap.put(e.getKey(), dayCopy);
            }
            studentAttendanceMap.put(String.valueOf(student.getLearnerId()), studentMap);
        }

        // Mark absent using the schedule's date (not record creation date)
        for (Attend attendance : attendanceList) {
            ClassSchedule schedule = classScheduleMap.get(attendance.getClassScheduleId());
            if (schedule == null) continue;
            String startTimeStr = schedule.getStartTime();
            if (startTimeStr == null || startTimeStr.length() < 10 || !startTimeStr.contains(" ")) continue;
            LocalDate scheduleDate = LocalDate.parse(startTimeStr.substring(0, 10));
            HashMap<LocalDate, HashMap<String, HashMap<String, String>>> studentMap = studentAttendanceMap.get(attendance.getStudentId());
            if (studentMap == null) {
                HashMap<LocalDate, HashMap<String, HashMap<String, String>>> newStudentMap = new HashMap<>();
                for (Map.Entry<LocalDate, HashMap<String, HashMap<String, String>>> e : dateFillTemplate.entrySet()) {
                    HashMap<String, HashMap<String, String>> dayCopy = new HashMap<>();
                    for (Map.Entry<String, HashMap<String, String>> slotEntry : e.getValue().entrySet()) {
                        dayCopy.put(slotEntry.getKey(), new HashMap<>(slotEntry.getValue()));
                    }
                    newStudentMap.put(e.getKey(), dayCopy);
                }
                studentMap = newStudentMap;
                studentAttendanceMap.put(attendance.getStudentId(), studentMap);
            }
            HashMap<String, HashMap<String, String>> dayMap = studentMap.get(scheduleDate);
            if (dayMap != null) {
                HashMap<String, String> slot = dayMap.get(startTimeStr);
                if (slot != null) {
                    slot.put("Attendance", "A");
                    slot.put("attendance", "A");
                }
            }
        }
        for (Map.Entry<String, HashMap<LocalDate, HashMap<String, HashMap<String,String>>>> entry: studentAttendanceMap.entrySet()) {
            AttendanceDetailsResponseDTO temp = new AttendanceDetailsResponseDTO();
            String studentId = entry.getKey();
            LearnerResponseDTO studentDetails = studentById.get(Integer.valueOf(studentId));
            if (studentDetails != null) {
                temp.setName(studentDetails.getFirstName() + " " + studentDetails.getLastName());
            } else {
                temp.setName("Unknown");
            }
            temp.setStudentId(Integer.valueOf(studentId));
          
            List<HashMap<String, HashMap<String, String>>> attendanceResponseList = new ArrayList<>();
            for (Map.Entry<LocalDate, HashMap<String, HashMap<String, String>>> dateEntry: entry.getValue().entrySet()) {
                for (Map.Entry<String, HashMap<String, String>> timeSlotEntry: dateEntry.getValue().entrySet()) {
                    HashMap<String, HashMap<String, String>> tempStudentAttendance = new HashMap<>();
                    tempStudentAttendance.put(dateEntry.getKey().toString(), timeSlotEntry.getValue());
                    attendanceResponseList.add(tempStudentAttendance);
                }
            }
            temp.setAttendanceList(attendanceResponseList);
            response.add(temp);
        }
        
        return response;
    }


    
   @Override
   @Transactional(readOnly = true)
public FilteredClassScheduleResponse getFilteredClassSchedules(int classId, int courseId, int facultyId, String startDate, String endDate) {
    Date[] range = parseDateRange(startDate, endDate);
    List<ClassSchedule> classSchedules = classScheduleRepository.getClassSchedulesInRange(
            classId, courseId, facultyId, range[0], range[1]);
    return buildFilteredClassScheduleResponse(classSchedules, classId);
}

@Override
@Transactional(readOnly = true)
// Admin oversight variant — same as getFilteredClassSchedules but not restricted to a single
// faculty's sessions (see getClassScheduleByClassRangeAnyFaculty's comment).
public FilteredClassScheduleResponse getFilteredClassSchedulesForAdmin(int classId, int courseId, String startDate, String endDate) {
    Date[] range = parseDateRange(startDate, endDate);
    List<ClassSchedule> classSchedules = classScheduleRepository.getClassScheduleByClassRangeAnyFaculty(
            classId, courseId, range[0], range[1]);
    return buildFilteredClassScheduleResponse(classSchedules, classId);
}

private Date[] parseDateRange(String startDate, String endDate) {
    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    try {
        return new Date[] { dateFormat.parse(startDate + " 00:00:00"), dateFormat.parse(endDate + " 23:59:59") };
    } catch (ParseException e) {
        throw new IllegalArgumentException("Invalid date format provided.", e);
    }
}

private FilteredClassScheduleResponse buildFilteredClassScheduleResponse(List<ClassSchedule> classSchedules, int classId) {
    Map<String, List<Map<String, Object>>> classesMap = new TreeMap<>();
    
    for (ClassSchedule schedule : classSchedules) {
        String startTime = schedule.getStartTime();
        if (startTime == null || !startTime.contains(" ")) {
            continue;
        }
        String scheduleDate = startTime.split(" ")[0];
        String dayOfMonth = scheduleDate.length() >= 10 ? scheduleDate.substring(8, 10) : scheduleDate;

        Map<String, Object> scheduleDetails = new HashMap<>();
        scheduleDetails.put("startTime", schedule.getStartTime());
        scheduleDetails.put("Id", schedule.getId());
        scheduleDetails.put("endTime", schedule.getEndTime());
        scheduleDetails.put("title", schedule.getTitle());
        scheduleDetails.put("attendanceMarked", schedule.getAttendanceMarkedAt() != null);

        if (!classesMap.containsKey(dayOfMonth)) {
            classesMap.put(dayOfMonth, new ArrayList<>());
        }

        classesMap.get(dayOfMonth).add(scheduleDetails);
    }

    // Process the class schedules

    // Now let's process the attendance information.
    // Active learners only: getStudentDetailsByClassId has no is_deleted filter, so removed /
    // transferred students kept appearing in the faculty attendance grid and in the absentees
    // payload. Every other roster path (LearnerServiceImpl.getStudentDetailsByClassId, used by
    // buildAttendanceDetails and the take-attendance roster) already uses the active variant.
    List<Learner> learners = learnerRepository.getActiveStudentDetailsByClassId(classId);
    Map<Integer, List<Integer>> absenteesMap = new HashMap<>();

    List<Integer> allScheduleIds = classSchedules.stream()
            .map(ClassSchedule::getId)
            .collect(Collectors.toList());
    List<Attend> allAttendance = allScheduleIds.isEmpty()
            ? new ArrayList<>()
            : attendanceRepository.getAttendanceByClassScheduleIds(allScheduleIds);
    for (Attend attendance : allAttendance) {
        int studentId = Integer.parseInt(attendance.getStudentId());
        absenteesMap.putIfAbsent(studentId, new ArrayList<>());
        absenteesMap.get(studentId).add(attendance.getClassScheduleId());
    }

    List<Map<String, Object>> learnerAttendanceList = new ArrayList<>();

    for (Learner learner : learners) {
        Map<String, Object> learnerAttendance = new HashMap<>();
        learnerAttendance.put("studentId", learner.getId());
        String fullName = learner.getFirstName() != null ? learner.getFirstName() : "";
        if (learner.getLastName() != null && !learner.getLastName().isEmpty()) {
            fullName = fullName + " " + learner.getLastName();
        }
        learnerAttendance.put("studentName", fullName.trim());

        int studentId = learner.getId();
        List<Integer> absentClassScheduleIds = absenteesMap.getOrDefault(studentId, new ArrayList<>());
        learnerAttendance.put("absent", absentClassScheduleIds);

        learnerAttendanceList.add(learnerAttendance);
    }

    FilteredClassScheduleResponse response = new FilteredClassScheduleResponse();
    response.setClasses(classesMap);
    response.setAbsentees(learnerAttendanceList);

    return response;
}



@Override
@Transactional(readOnly = true)
public Map<String, Object> getClassScheduleAndAbsentInfo(String learnerId, Date startDate, Date endDate) {
    Map<String, Object> response = new HashMap<>();
    Learner learner = studentService.getLearnerDetails(learnerId);
    if (learner == null) {
        response.put("classes", new ArrayList<>());
        response.put("absentids", new ArrayList<>());
        return response;
    }

    List<SimplifiedClassScheduleResponse> classScheduleResponses = new ArrayList<>();

    List<ClassSchedule> classSchedules = learnerSchedules(learner, startDate, endDate);

    // This loop previously issued three queries per session in the range: one absence lookup, one
    // course fetch and one class fetch. For a learner's month view that was ~3x the number of
    // sessions in round trips, for data that is either identical on every row (the class — a
    // learner has exactly one) or repeats across rows (the handful of distinct courses).
    List<Integer> scheduleIds = classSchedules.stream()
            .map(ClassSchedule::getId)
            .collect(java.util.stream.Collectors.toList());
    List<Integer> absentClassScheduleIds = getAbsentClassScheduleIds(learnerId, scheduleIds);
    Map<Integer, Course> courseCache = new HashMap<>();
    Map<Integer, _Class> classCache = new HashMap<>();

    for (ClassSchedule schedule : classSchedules) {
        SimplifiedClassScheduleResponse simplifiedResponse = new SimplifiedClassScheduleResponse();
        _Class aClass = classCache.computeIfAbsent(schedule.getClassId(),
                cid -> classService.getClassDetail(String.valueOf(cid)));
        simplifiedResponse.setClassName(aClass != null ? aClass.getName() : null);
        simplifiedResponse.setFacultyId(schedule.getFacultyId());
        simplifiedResponse.setClassScheduleId(schedule.getId());
        simplifiedResponse.setClassId(schedule.getClassId());
        simplifiedResponse.setCourseId(schedule.getCourseId());
        simplifiedResponse.setStartTime(schedule.getStartTime());
        simplifiedResponse.setEndTime(schedule.getEndTime());
        simplifiedResponse.setLectureHallId(schedule.getLectureHallId());
        simplifiedResponse.setTitle(schedule.getTitle());

        Course course = courseCache.computeIfAbsent(schedule.getCourseId(), courseService::fetchCourse);
        if (course != null) {
            simplifiedResponse.setCourseName(course.getCourseName());
            simplifiedResponse.setCourseSlug(course.getSlug());
        }

        classScheduleResponses.add(simplifiedResponse);
    }

    classScheduleResponses.sort(Comparator.comparingInt(SimplifiedClassScheduleResponse::getClassScheduleId).reversed());
    response.put("classes", classScheduleResponses);
    response.put("absentids", absentClassScheduleIds);

    return response;
}





/** Absent-marked schedule ids for one learner across a set of sessions, in a single query. */
private List<Integer> getAbsentClassScheduleIds(String learnerId, List<Integer> classScheduleIds) {
    if (classScheduleIds == null || classScheduleIds.isEmpty()) {
        // An IN () with an empty list is invalid SQL — skip the round trip entirely.
        return new ArrayList<>();
    }
    List<Integer> absent = attendanceRepository.getAbsentScheduleIdsForLearner(learnerId, classScheduleIds);
    return absent != null ? new ArrayList<>(absent) : new ArrayList<>();
}

@Override
@Transactional(readOnly = true)
public Map<String, Object> getClassScheduleAndAbsentInfoByCourse(String learnerId, String courseId, Date startDate, Date endDate) {
    Map<String, Object> response = new LinkedHashMap<>();

    List<SimplifiedClassScheduleResponse> classScheduleResponses = new ArrayList<>();
    List<Integer> absentClassScheduleIds = new ArrayList<>();

    Learner learner = studentService.getLearnerDetails(learnerId);
    if (learner == null) {
        // Handle case where learner is not found
        response.put("classes", classScheduleResponses);
        response.put("absentids", absentClassScheduleIds);
        return response;
    }

    List<ClassSchedule> classSchedules = learnerSchedules(learner, startDate, endDate);

    // Filter class schedules based on the provided courseId
    List<ClassSchedule> filteredSchedules = classSchedules.stream()
            .filter(schedule -> String.valueOf(schedule.getCourseId()).equals(courseId))
            .collect(Collectors.toList());

    // Same batching as getClassScheduleAndAbsentInfo above: one absence query for the whole range
    // instead of one per session, and memoised class/course lookups (every row here shares a
    // single class, and after the course filter above, a single course).
    List<Integer> scheduleIds = filteredSchedules.stream()
            .map(ClassSchedule::getId)
            .collect(Collectors.toList());
    absentClassScheduleIds.addAll(getAbsentClassScheduleIds(learnerId, scheduleIds));
    Map<Integer, Course> courseCache = new HashMap<>();
    Map<Integer, _Class> classCache = new HashMap<>();

    for (ClassSchedule schedule : filteredSchedules) {
        SimplifiedClassScheduleResponse simplifiedResponse = new SimplifiedClassScheduleResponse();
        _Class aClass = classCache.computeIfAbsent(schedule.getClassId(),
                cid -> classService.getClassDetail(String.valueOf(cid)));
        simplifiedResponse.setClassName(aClass != null ? aClass.getName() : null);
        simplifiedResponse.setFacultyId(schedule.getFacultyId());
        simplifiedResponse.setCourseId(schedule.getCourseId());
        simplifiedResponse.setStartTime(schedule.getStartTime());
        simplifiedResponse.setEndTime(schedule.getEndTime());
        simplifiedResponse.setClassScheduleId(schedule.getId());
        simplifiedResponse.setClassId(schedule.getClassId());
        simplifiedResponse.setLectureHallId(schedule.getLectureHallId());
        simplifiedResponse.setTitle(schedule.getTitle());

        Course course = courseCache.computeIfAbsent(schedule.getCourseId(), courseService::fetchCourse);
        if (course != null) {
            simplifiedResponse.setCourseName(course.getCourseName());
            simplifiedResponse.setCourseSlug(course.getSlug());
        }

        classScheduleResponses.add(simplifiedResponse);
    }

    classScheduleResponses.sort(Comparator.comparingInt(SimplifiedClassScheduleResponse::getClassScheduleId).reversed());
    response.put("classes", classScheduleResponses);
    response.put("absentids", absentClassScheduleIds);

    return response;
} 


@Override
@Transactional(readOnly = true)
public List<ClassIdAndDateRangeResponse> getClassScheduleByClassIdAndDateRange(String classId, Date startTime, Date endTime) {
    List<ClassSchedule> classSchedule = classScheduleRepository.getClassScheduleByClassId(classId, startTime, endTime);
    List<ClassIdAndDateRangeResponse> classScheduleResponses = new ArrayList<>();
    classSchedule.sort(Comparator.comparing(ClassSchedule::getStartTime).reversed());

    for (ClassSchedule schedule : classSchedule) {
        ClassIdAndDateRangeResponse classScheduleResponse = new ClassIdAndDateRangeResponse();
        _Class aClass = classService.getClassDetail(String.valueOf(schedule.getClassId()));
        classScheduleResponse.setClassName(aClass != null ? aClass.getName() : null);
        classScheduleResponse.setFacultyId(schedule.getFacultyId());
        classScheduleResponse.setCourseId(schedule.getCourseId());
        classScheduleResponse.setLectureHallId(schedule.getLectureHallId());
        classScheduleResponse.setClassScheduleId(schedule.getId());
        classScheduleResponse.setClassId(schedule.getClassId());
        classScheduleResponse.setStartTime(schedule.getStartTime());
        classScheduleResponse.setEndTime(schedule.getEndTime());
        classScheduleResponse.setTitle(schedule.getTitle());

        // Fetch the Course using CourseService
        Course course = courseService.fetchCourse(schedule.getCourseId());
        if (course != null) {
            classScheduleResponse.setCourseName(course.getCourseName());
            classScheduleResponse.setCourseSlug(course.getSlug());
        }

        classScheduleResponses.add(classScheduleResponse);
    }

    return classScheduleResponses;
}

@Override
@Transactional(readOnly = true)
public List<ClassIdAndDateRangeResponse> getClassScheduleByClassIdAndDateRangeAndCourseId(
    String classId,
    Date startTime,
    Date endTime,
    String courseId
) {
    List<ClassSchedule> classSchedule = classScheduleRepository.getClassScheduleByClassIdAndCourseId(
        classId,
        startTime,
        endTime,
        courseId
    );
    List<ClassIdAndDateRangeResponse> classScheduleResponses = new ArrayList<>();
    classSchedule.sort(Comparator.comparing(ClassSchedule::getStartTime).reversed());

    for (ClassSchedule schedule : classSchedule) {
        ClassIdAndDateRangeResponse classScheduleResponse = new ClassIdAndDateRangeResponse();
        _Class aClass = classService.getClassDetail(String.valueOf(schedule.getClassId()));
        classScheduleResponse.setClassName(aClass != null ? aClass.getName() : null);
        classScheduleResponse.setFacultyId(schedule.getFacultyId());
        classScheduleResponse.setCourseId(schedule.getCourseId());
        classScheduleResponse.setLectureHallId(schedule.getLectureHallId());
        classScheduleResponse.setClassScheduleId(schedule.getId());
        classScheduleResponse.setClassId(schedule.getClassId());
        classScheduleResponse.setStartTime(schedule.getStartTime());
        classScheduleResponse.setEndTime(schedule.getEndTime());
        classScheduleResponse.setTitle(schedule.getTitle());

        // Fetch the Course using CourseService
        Course course = courseService.fetchCourse(schedule.getCourseId());
        if (course != null) {
            classScheduleResponse.setCourseName(course.getCourseName());
            classScheduleResponse.setCourseSlug(course.getSlug());
        }

        classScheduleResponses.add(classScheduleResponse);
    }

    return classScheduleResponses;
}


public int getClassScheduleCountByClassId(int classId) {
    return classScheduleRepository.getClassScheduleCountByClassId(classId);
}

 

        @Override
        public double getTotalHoursByFacultyId(int facultyId) {
            Long totalSeconds = classScheduleRepository.getTotalHoursTaughtByFaculty(facultyId);

            // Convert total seconds to hours
            if (totalSeconds != null) {
                double totalHours = totalSeconds / 3600.0; // 3600 seconds in an hour
                return totalHours;
            } else {
                return 0.0; // Return 0 if no data found
            }
        }



        @Override
    public double getTotalHoursByFacultyAndCourse(int facultyId, int courseId) {
        Long totalSeconds = classScheduleRepository.getTotalHoursTaughtByFacultyAndCourse(facultyId, courseId);

        if (totalSeconds != null) {
            double totalHours = totalSeconds / 3600.0; // 3600 seconds in an hour
            return totalHours;
        } else {
            return 0.0;
        }
    }

    @Override
    public double getTotalHoursByFacultyAndClass(int facultyId, int classId) {
        Long totalSeconds = classScheduleRepository.getTotalHoursTaughtByFacultyAndClass(facultyId, classId);

        if (totalSeconds != null) {
            double totalHours = totalSeconds / 3600.0; // 3600 seconds in an hour
            return totalHours;
        } else {
            return 0.0;
        }
    }

    @Override
    public double getTotalHoursByFacultyAndCourseAndClass(int facultyId, int courseId, int classId) {
        Long totalSeconds = classScheduleRepository.getTotalHoursTaughtByFacultyAndCourseAndClass(facultyId, courseId, classId);

        if (totalSeconds != null) {
            double totalHours = totalSeconds / 3600.0; // 3600 seconds in an hour
            return totalHours;
        } else {
            return 0.0;
        }
    }


    
    @Override
    public ClassSchedule getUpcomingClass(int facultyId) {
        return classScheduleRepository.findUpcomingClass(facultyId);
    }
}

