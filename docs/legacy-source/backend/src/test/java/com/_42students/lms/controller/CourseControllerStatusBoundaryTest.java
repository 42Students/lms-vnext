package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.request.CourseDTO;
import com._42students.lms.model.Course;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.CourseService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

/** A service's intentional HTTP status must survive the course controller. */
class CourseControllerStatusBoundaryTest {
    private CourseController controller;
    private CourseService courses;
    private UserPrincipal admin;
    private CourseDTO request;

    @BeforeEach
    void setUp() {
        controller = new CourseController();
        courses = mock(CourseService.class);
        AccessControlService access = mock(AccessControlService.class);
        SecurityContextUtil security = mock(SecurityContextUtil.class);
        admin = new UserPrincipal(7, "FACULTY", "ADMIN", 1, 6, 0);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(admin);
        controller.courseService = courses;
        controller.accessControlService = access;
        controller.securityContextUtil = security;
        Course existing = new Course();
        existing.setId(17);
        existing.setDeptId(4);
        existing.setCourseName("Existing course");
        when(courses.fetchCourse(17)).thenReturn(existing);
        request = new CourseDTO();
        request.setDeptId(4);
        request.setCourseName("Updated course");
        request.setShortTitle("Updated");
    }

    @Test
    void deletionWithLessonContentKeeps409Conflict() {
        doThrow(new ResponseStatusException(HttpStatus.CONFLICT, "Course has lesson content"))
                .when(courses).deleteCourse(17);
        assertEquals(HttpStatus.CONFLICT, controller.deleteCourse(17, new MockHttpServletRequest()).getStatusCode());
        verify(courses).deleteCourse(17);
    }

    @Test
    void deletionWithLessonsKeeps409Conflict() {
        doThrow(new ResponseStatusException(HttpStatus.CONFLICT, "Course has lessons"))
                .when(courses).deleteCourse(17);
        assertEquals(HttpStatus.CONFLICT, controller.deleteCourse(17, new MockHttpServletRequest()).getStatusCode());
    }

    @Test
    void updateDuplicateNameKeeps409Conflict() {
        when(courses.updateCourse(17, request)).thenThrow(
                new ResponseStatusException(HttpStatus.CONFLICT, "Duplicate course title"));
        assertEquals(HttpStatus.CONFLICT,
                controller.updateCourse(17, request, new MockHttpServletRequest()).getStatusCode());
    }

    @Test
    void updateServiceNotFoundKeeps404() {
        when(courses.updateCourse(17, request)).thenThrow(
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        assertEquals(HttpStatus.NOT_FOUND,
                controller.updateCourse(17, request, new MockHttpServletRequest()).getStatusCode());
    }
}
