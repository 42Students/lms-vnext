package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.Attend;
import com._42students.lms.model.ClassSchedule;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.ClassScheduleService;
import com._42students.lms.service.LearnerService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import javax.servlet.http.HttpServletRequest;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * A college admin's userType is "FACULTY" too (ADMIN is a facultyType, not a separate userType),
 * and AttendanceReport.js's canManageAttendance already shows admins the "Mark attendance"
 * control for any course in their college - not just ones they personally teach. Before this fix,
 * requireTeachesThisClass had no admin exemption, so an admin taking attendance for a class
 * without their own FacultyTeachingAssignment row got a wrongful 403.
 */
class AttendanceBulkControllerAdminAccessTest {
    private LearnerService learnerService;
    private ClassScheduleService classScheduleService;
    private AccessControlService accessControlService;
    private SecurityContextUtil securityContextUtil;
    private FacultyTeachingAssignmentRepository teachingAssignments;
    private AttendanceBulkController controller;
    private HttpServletRequest httpRequest;

    private ClassSchedule scheduleFor(int classId, int courseId) {
        ClassSchedule schedule = new ClassSchedule();
        schedule.setId(77);
        schedule.setClassId(classId);
        schedule.setCourseId(courseId);
        return schedule;
    }

    @BeforeEach
    void setUp() {
        learnerService = mock(LearnerService.class);
        classScheduleService = mock(ClassScheduleService.class);
        accessControlService = mock(AccessControlService.class);
        securityContextUtil = mock(SecurityContextUtil.class);
        teachingAssignments = mock(FacultyTeachingAssignmentRepository.class);
        httpRequest = mock(HttpServletRequest.class);

        controller = new AttendanceBulkController();
        ReflectionTestUtils.setField(controller, "learnerService", learnerService);
        ReflectionTestUtils.setField(controller, "classScheduleService", classScheduleService);
        ReflectionTestUtils.setField(controller, "accessControlService", accessControlService);
        ReflectionTestUtils.setField(controller, "securityContextUtil", securityContextUtil);
        ReflectionTestUtils.setField(controller, "facultyTeachingAssignmentRepository", teachingAssignments);
    }

    private AttendanceBulkController.BulkAttendanceRequest request() {
        AttendanceBulkController.BulkAttendanceRequest body = new AttendanceBulkController.BulkAttendanceRequest();
        body.setClassScheduleId(77);
        body.setAbsentStudentIds(List.of("S1"));
        return body;
    }

    @Test
    @DisplayName("A college admin can mark attendance for a class they do not personally teach")
    void adminNotPersonallyAssigned_canStillMarkAttendance() {
        UserPrincipal admin = new UserPrincipal(31, "FACULTY", "ADMIN", 2, 9, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(admin);
        when(classScheduleService.getClassScheduleDetail(77)).thenReturn(scheduleFor(14, 5));
        when(accessControlService.isSuperAdmin(admin)).thenReturn(false);
        when(learnerService.attend(any())).thenReturn(new Attend());

        ResponseEntity<Response<Map<String, Object>>> response =
                controller.markBulk(request(), httpRequest);

        assertEquals(200, response.getStatusCodeValue());
        assertEquals(1, response.getBody().getData().get("markedAbsent"));
        // The admin bypass must never consult teaching assignments at all.
        org.mockito.Mockito.verifyNoInteractions(teachingAssignments);
    }

    @Test
    @DisplayName("Plain faculty without a teaching assignment for this class is still rejected")
    void plainFaculty_notAssigned_isRejected() {
        UserPrincipal faculty = new UserPrincipal(41, "FACULTY", "PRIMARY", 2, 9, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(faculty);
        when(classScheduleService.getClassScheduleDetail(77)).thenReturn(scheduleFor(14, 5));
        when(teachingAssignments.findByFacultyIdAndIsActive(41, true)).thenReturn(Collections.emptyList());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.markBulk(request(), httpRequest));

        assertEquals(403, ex.getStatus().value());
        verify(learnerService, org.mockito.Mockito.never()).attend(any());
    }

    @Test
    @DisplayName("F-024/F-025: a session is marked attendance-taken only after every learner row saved")
    void sessionMarkedCompleteOnlyWhenEveryRowSaved() {
        UserPrincipal admin = new UserPrincipal(31, "FACULTY", "ADMIN", 2, 9, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(admin);
        when(classScheduleService.getClassScheduleDetail(77)).thenReturn(scheduleFor(14, 5));
        when(learnerService.attend(any())).thenReturn(new Attend());

        ResponseEntity<Response<Map<String, Object>>> response = controller.markBulk(request(), httpRequest);

        assertEquals(true, response.getBody().getData().get("attendanceComplete"));
        org.mockito.InOrder order = org.mockito.Mockito.inOrder(learnerService, classScheduleService);
        order.verify(learnerService).attend(any());
        order.verify(classScheduleService).markAttendanceTaken(77);
    }

    @Test
    @DisplayName("F-025: a failed learner write leaves the session not marked complete")
    void failedRowLeavesSessionIncomplete() {
        UserPrincipal admin = new UserPrincipal(31, "FACULTY", "ADMIN", 2, 9, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(admin);
        when(classScheduleService.getClassScheduleDetail(77)).thenReturn(scheduleFor(14, 5));
        when(learnerService.attend(any())).thenThrow(new IllegalArgumentException("Learner not in class"));

        ResponseEntity<Response<Map<String, Object>>> response = controller.markBulk(request(), httpRequest);

        assertEquals(200, response.getStatusCodeValue());
        assertEquals(false, response.getBody().getData().get("attendanceComplete"));
        assertEquals(1, ((List<?>) response.getBody().getData().get("failed")).size());
        verify(classScheduleService, org.mockito.Mockito.never()).markAttendanceTaken(77);
    }

    @Test
    @DisplayName("Everyone present writes no absence rows and still completes the session")
    void everyonePresentCompletesSession() {
        UserPrincipal admin = new UserPrincipal(31, "FACULTY", "ADMIN", 2, 9, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(admin);
        when(classScheduleService.getClassScheduleDetail(77)).thenReturn(scheduleFor(14, 5));
        AttendanceBulkController.BulkAttendanceRequest body = new AttendanceBulkController.BulkAttendanceRequest();
        body.setClassScheduleId(77);
        body.setPresentStudentIds(List.of("S1", "S2"));

        ResponseEntity<Response<Map<String, Object>>> response = controller.markBulk(body, httpRequest);

        assertEquals(true, response.getBody().getData().get("attendanceComplete"));
        verify(classScheduleService).markAttendanceTaken(77);
    }
}
