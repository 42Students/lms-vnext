package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.response.StudentCoursesResponseDTO;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.StudentCourseService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class StudentCourseByClassPrivacyRegressionTest {
    @Test
    void learnerOwnClassReadRedactsDetailFieldsAndEmailButFacultyReadRetainsThem() {
        StudentCourseService service = mock(StudentCourseService.class);
        StudentCourseController controller = new StudentCourseController(service);
        SecurityContextUtil context = mock(SecurityContextUtil.class);
        AccessControlService access = mock(AccessControlService.class);
        ReflectionTestUtils.setField(controller, "securityContextUtil", context);
        ReflectionTestUtils.setField(controller, "accessControlService", access);
        UserPrincipal principal = mock(UserPrincipal.class);
        when(context.getAuthenticatedUserPrincipal()).thenReturn(principal);
        when(service.getCoursesByClass(7)).thenAnswer(invocation -> {
            StudentCoursesResponseDTO response = new StudentCoursesResponseDTO();
            StudentCoursesResponseDTO.CourseWithFacultyDTO course = new StudentCoursesResponseDTO.CourseWithFacultyDTO();
            course.setId(23);
            course.setHtmlContent("private html");
            course.setIntroductionContent("private introduction");
            StudentCoursesResponseDTO.FacultyInfoDTO instructor = new StudentCoursesResponseDTO.FacultyInfoDTO();
            instructor.setId(11);
            instructor.setName("Instructor");
            instructor.setEmail("private@example.org");
            course.setFaculty(instructor);
            course.setInstructors(List.of(instructor));
            response.setCourses(List.of(course));
            return response;
        });

        when(principal.isLearner()).thenReturn(true);
        StudentCoursesResponseDTO learner = (StudentCoursesResponseDTO) controller.getCoursesByClass(7).getBody().get("data");
        assertNull(learner.getCourses().get(0).getHtmlContent());
        assertNull(learner.getCourses().get(0).getIntroductionContent());
        assertNull(learner.getCourses().get(0).getFaculty().getEmail());
        assertNull(learner.getCourses().get(0).getInstructors().get(0).getEmail());

        when(principal.isLearner()).thenReturn(false);
        StudentCoursesResponseDTO faculty = (StudentCoursesResponseDTO) controller.getCoursesByClass(7).getBody().get("data");
        assertEquals("private html", faculty.getCourses().get(0).getHtmlContent());
        assertEquals("private@example.org", faculty.getCourses().get(0).getFaculty().getEmail());
        verify(access, times(2)).requireAccessClass(principal, 7);
    }
}
