package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.LessonContentsDTO;
import com._42students.lms.model.Lesson;
import com._42students.lms.model._Class;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.ClassService;
import com._42students.lms.service.CourseService;
import com._42students.lms.service.LessonContentsService;
import com._42students.lms.service.LessonService;
import com._42students.lms.util.CourseSlugResolver;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class LessonContentCurrentAudienceControllerTest {
    private LessonContentController controllerFor(UserPrincipal principal) {
        LessonContentController controller = new LessonContentController();
        controller.lessonContentsService = mock(LessonContentsService.class);
        controller.lessonService = mock(LessonService.class);
        controller.classService = mock(ClassService.class);
        controller.courseSlugResolver = mock(CourseSlugResolver.class);
        controller.courseService = mock(CourseService.class);
        controller.securityContextUtil = mock(SecurityContextUtil.class);
        controller.accessControlService = mock(AccessControlService.class);
        controller.scopeResolutionService = mock(ScopeResolutionService.class);
        when(controller.securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
        when(controller.accessControlService.isSuperAdmin(principal)).thenReturn(false);
        return controller;
    }

    @Test
    void createRejectsSameCollegeClassThatIsNotCurrentCourseAudience() throws Exception {
        UserPrincipal admin = new UserPrincipal(18, "FACULTY", "ADMIN", 2, 9, 0);
        LessonContentController controller = controllerFor(admin);

        Lesson lesson = new Lesson();
        lesson.setCourseId(5);
        when(controller.lessonService.fetchCourseId(7)).thenReturn(lesson);
        when(controller.scopeResolutionService.resolveClassToCollegeId(12)).thenReturn(9);
        when(controller.scopeResolutionService.resolveCourseToCollegeId(5)).thenReturn(9);
        doThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "not current"))
                .when(controller.accessControlService).requireCurrentCourseAudienceClass(12, 5);

        LessonContentsDTO dto = new LessonContentsDTO();
        dto.setLessonId(7);
        dto.setClassId(12);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.createLessonContents(dto));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verify(controller.lessonContentsService, never()).createLessonContents(any());
    }

    @Test
    void selectorReturnsCurrentAudienceAndOnlyExplicitHistoricalExistingScope() {
        UserPrincipal admin = new UserPrincipal(18, "FACULTY", "ADMIN", 2, 9, 0);
        LessonContentController controller = controllerFor(admin);
        when(controller.courseSlugResolver.resolve(null, 5)).thenReturn(5);

        _Class current = new _Class();
        current.setId(12);
        current.setName("CSE-A");
        when(controller.scopeResolutionService.resolveCurrentEligibleClassesForCourse(5))
                .thenReturn(java.util.List.of(current));
        when(controller.lessonContentsService.fetchUniqueClassIdsByCourseId(5))
                .thenReturn(java.util.List.of(12, 13));
        when(controller.scopeResolutionService.resolveCourseToCollegeId(5)).thenReturn(9);
        when(controller.scopeResolutionService.resolveClassToCollegeId(13)).thenReturn(9);
        when(controller.accessControlService.canAccessClass(admin, 13)).thenReturn(true);
        when(controller.classService.getClassNameById("13")).thenReturn("CSE-Old");

        java.util.Map<Integer, String> result =
                controller.fetchClassesForCourseSyllabus(null, 5, 13, false).getBody();

        assertEquals("CSE-A", result.get(12));
        assertEquals("CSE-Old (historical scope)", result.get(13));
        assertEquals(2, result.size());

        java.util.Map<Integer, String> withoutHistorical =
                controller.fetchClassesForCourseSyllabus(null, 5, null, false).getBody();
        assertEquals(1, withoutHistorical.size());
        assertTrue(withoutHistorical.containsKey(12));

        java.util.Map<Integer, String> reviewMap =
                controller.fetchClassesForCourseSyllabus(null, 5, null, true).getBody();
        assertEquals(2, reviewMap.size());
        assertEquals("CSE-Old (historical scope)", reviewMap.get(13));
    }
}
