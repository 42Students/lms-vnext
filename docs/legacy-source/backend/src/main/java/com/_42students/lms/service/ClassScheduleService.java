package com._42students.lms.service;

import com._42students.lms.dto.request.AttendanceDetailsRequestDTO;
import com._42students.lms.dto.request.ClassScheduleDTO;
import com._42students.lms.dto.response.AttendanceDetailsResponseDTO;
import com._42students.lms.dto.response.ClassScheduleResponse;
import com._42students.lms.dto.response.DashboardResponseDTO;
import com._42students.lms.dto.response.FilteredClassScheduleResponse;
import com._42students.lms.dto.response.LearnerResponseDTO;
import com._42students.lms.model.ClassSchedule;
import com._42students.lms.dto.response.ClassIdAndDateRangeResponse;
import java.util.Map;
import java.time.LocalTime;
import java.util.Date;
import java.util.List;

public interface ClassScheduleService { 
    ClassSchedule create(ClassScheduleDTO classScheduleDTO);

    /**
     * Update an existing schedule (time, faculty, course, lecture hall, title).
     *
     * Until this existed the controller offered only /create plus read endpoints, so a wrong
     * time, wrong faculty or duplicate session was permanent — and permanently distorted every
     * attendance denominator that counted it. It also made a departed faculty member's remaining
     * timetable impossible to reassign, which in turn blocked their replacement from being
     * scheduled into the same slots (conflict detection matches on faculty_id).
     */
    ClassSchedule update(int classScheduleId, ClassScheduleDTO classScheduleDTO);

    /**
     * W1: reassigns every one of oldFacultyId's upcoming (not-yet-started) class schedules to
     * newFacultyId, one at a time so one conflicting slot doesn't block the rest -- the same
     * REQUIRES_NEW-per-row pattern used by bulk learner import. Past sessions are left alone
     * (already happened; their attendance history stays attributed to who actually taught them).
     */
    com._42students.lms.dto.response.BulkReassignFacultyResultDTO bulkReassignFaculty(int oldFacultyId, int newFacultyId);

    /** Single-row half of bulkReassignFaculty, exposed so callers go through the transactional proxy and get their own REQUIRES_NEW transaction. */
    void reassignOneSchedule(int classScheduleId, int newFacultyId);

    /**
     * Soft-delete a schedule. Attendance rows referencing it are preserved; the session simply
     * stops counting toward attendance denominators.
     */
    void delete(int classScheduleId);

    List<ClassScheduleResponse> getClassSchedule(String instructorId, Date startTime, Date endTime);

    ClassSchedule getClassScheduleDetail(int classScheduleId);

    DashboardResponseDTO getClassScheduleAttendance(String classScheduleId);

    /** Records that a faculty has submitted an attendance mark for this session (idempotent). */
    void markAttendanceTaken(int classScheduleId);

    List<ClassScheduleResponse> getClassScheduleByClassId(String classId, Date startTime, Date endTime);

    List<Integer> getStudentIdsByClassScheduleId(int classScheduleId);

    List<ClassScheduleResponse> getClassScheduleByFacultyId(String facultyId, Date dateFormat, Date endDateFormat);

    List getCourses(int facultyId);

    /** Distinct course IDs that have at least one class_schedule for the given class. Used for learner attendance dropdown fallback. */
    List<Integer> getDistinctCourseIdsByClassId(int classId);

    List<LearnerResponseDTO> getStudentsByClassScheduleId(int classScheduleId);

    List<AttendanceDetailsResponseDTO> getAttendanceDetailsByDateRange(AttendanceDetailsRequestDTO attendanceDetailsDTO);

    // Admin oversight variant — same shape, but not scoped to a single faculty. See
    // ClassScheduleRepository.getClassScheduleByClassRangeAnyFaculty for why this exists.
    List<AttendanceDetailsResponseDTO> getAttendanceDetailsByDateRangeForAdmin(int classId, int courseId, java.sql.Date startDate, java.sql.Date endDate);

   FilteredClassScheduleResponse getFilteredClassSchedules(int classId, int courseId, int facultyId, String startDate, String endDate);

   // Admin oversight variant — no facultyId filter. See ClassScheduleRepository.getClassScheduleByClassRangeAnyFaculty.
   FilteredClassScheduleResponse getFilteredClassSchedulesForAdmin(int classId, int courseId, String startDate, String endDate);

   Map<String, Object> getClassScheduleAndAbsentInfo(String learnerId, Date startDate, Date endDate);

   Map<String, Object> getClassScheduleAndAbsentInfoByCourse(String learnerId, String courseId, Date startDate, Date endDate);


    List<ClassIdAndDateRangeResponse> getClassScheduleByClassIdAndDateRange(String classId, Date startTime, Date endTime);

    List<ClassIdAndDateRangeResponse> getClassScheduleByClassIdAndDateRangeAndCourseId(String classId,Date startTime,Date endTime,String courseId);

    int getClassScheduleCountByClassId(int classId);

    double getTotalHoursByFacultyId(int facultyId);

    double getTotalHoursByFacultyAndCourse(int facultyId, int courseId);

    double getTotalHoursByFacultyAndClass(int facultyId, int classId);

    double getTotalHoursByFacultyAndCourseAndClass(int facultyId, int courseId, int classId);

    ClassSchedule getUpcomingClass(int facultyId);    
} 
    
  
