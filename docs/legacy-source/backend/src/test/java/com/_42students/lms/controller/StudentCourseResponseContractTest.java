package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.response.StudentCoursesResponseDTO;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.StudentCourseService;
import com._42students.lms.util.SecurityContextUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class StudentCourseResponseContractTest {
    @Test
    void learnerListingRedactsHtmlAndEmailAndFlagsSemesterFallback() throws Exception {
        StudentCourseService service = mock(StudentCourseService.class);
        StudentCourseController controller = new StudentCourseController(service);
        SecurityContextUtil context = mock(SecurityContextUtil.class);
        AccessControlService access = mock(AccessControlService.class);
        ReflectionTestUtils.setField(controller, "securityContextUtil", context);
        ReflectionTestUtils.setField(controller, "accessControlService", access);
        when(context.getAuthenticatedUserPrincipal()).thenReturn(mock(UserPrincipal.class));

        StudentCoursesResponseDTO dto = new StudentCoursesResponseDTO();
        dto.setSemesterId(12);
        StudentCoursesResponseDTO.CourseWithFacultyDTO card = new StudentCoursesResponseDTO.CourseWithFacultyDTO();
        card.setId(7);
        card.setHtmlContent("<p>Private intro</p>");
        card.setIntroductionContent("Full course body");
        StudentCoursesResponseDTO.FacultyInfoDTO faculty = new StudentCoursesResponseDTO.FacultyInfoDTO();
        faculty.setEmail("faculty@example.org");
        card.setFaculty(faculty);
        dto.setCourses(List.of(card));
        when(service.getStudentCourses(5, 99)).thenReturn(dto);

        Map<String, Object> response = controller.getStudentCourses(5, 99).getBody();
        assertNotNull(response);
        StudentCoursesResponseDTO learner = (StudentCoursesResponseDTO) response.get("data");
        assertEquals(99, learner.getRequestedSemesterId());
        assertEquals(Boolean.TRUE, learner.getSemesterFallbackApplied());
        String json = new ObjectMapper().writeValueAsString(learner);
        assertFalse(json.contains("faculty@example.org"));
        assertFalse(json.contains("Private intro"));
        assertFalse(json.contains("Full course body"));
        assertTrue(json.contains("semester_fallback_applied"));
        verify(access).requireAccessLearner(any(), eq(5));
    }
}
