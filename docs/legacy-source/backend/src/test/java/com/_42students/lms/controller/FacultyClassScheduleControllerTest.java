package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.request.ClassScheduleDTO;
import com._42students.lms.model.ClassSchedule;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.ClassScheduleService;
import com._42students.lms.util.CourseSlugResolver;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class FacultyClassScheduleControllerTest {
    private SecurityContextUtil security;
    private AccessControlService access;
    private FacultyTeachingAssignmentRepository assignments;
    private CourseSlugResolver slugResolver;
    private ClassScheduleService schedules;
    private FacultyClassScheduleController controller;
    private ClassScheduleDTO request;

    @BeforeEach
    void setUp() {
        security = mock(SecurityContextUtil.class);
        access = mock(AccessControlService.class);
        assignments = mock(FacultyTeachingAssignmentRepository.class);
        slugResolver = mock(CourseSlugResolver.class);
        schedules = mock(ClassScheduleService.class);
        controller = new FacultyClassScheduleController(security, access, assignments, slugResolver, schedules);
        when(security.getAuthenticatedUserPrincipal())
                .thenReturn(new UserPrincipal(31, "FACULTY", "TEACHER", 2, 9, 0));
        request = new ClassScheduleDTO();
        request.setClassId(9);
        request.setFacultyId(31);
        request.setCourseId(5);
        request.setStartTime("2026-10-01 10:00:00");
        request.setEndTime("2026-10-01 11:00:00");
        when(slugResolver.resolve(null, 5)).thenReturn(5);
    }

    @Test
    void assignedFacultyCanScheduleOwnClassAndCourse() {
        when(assignments.existsByFacultyIdAndCourseIdAndClassIdAndIsActive(31, 5, 9, true)).thenReturn(true);
        ClassSchedule schedule = mock(ClassSchedule.class);
        when(schedules.create(any(ClassScheduleDTO.class))).thenReturn(schedule);

        ResponseEntity<?> response = controller.create(request);

        assertEquals(200, response.getStatusCodeValue());
        verify(access).requireAccessClass(any(UserPrincipal.class), org.mockito.ArgumentMatchers.eq(9));
        verify(access).requireAccessCourse(any(UserPrincipal.class), org.mockito.ArgumentMatchers.eq(5));
        verify(schedules).create(request);
    }

    @Test
    void cannotScheduleAnotherFacultysSession() {
        request.setFacultyId(99);
        assertThrows(ResponseStatusException.class, () -> controller.create(request));
        verifyNoInteractions(schedules);
    }

    @Test
    void cannotScheduleUnassignedCourseOrClass() {
        assertThrows(ResponseStatusException.class, () -> controller.create(request));
        verifyNoInteractions(schedules);
    }

    @Test
    void learnerCannotCreateScheduleEvenIfClassMatches() {
        when(security.getAuthenticatedUserPrincipal())
                .thenReturn(new UserPrincipal(31, "LEARNER", null, 2, 9, 0));
        assertThrows(ResponseStatusException.class, () -> controller.create(request));
        verifyNoInteractions(assignments, schedules);
    }
}
