package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.ClassContentOrderRequest;
import com._42students.lms.dto.response.FacultyCourseClassMappingDTO;
import com._42students.lms.model.Lesson;
import com._42students.lms.model._Class;
import com._42students.lms.exceptions.GlobalExceptionHandler;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.ClassService;
import com._42students.lms.service.CourseService;
import com._42students.lms.service.FacultyService;
import com._42students.lms.service.LessonContentsService;
import com._42students.lms.service.LessonService;
import com._42students.lms.util.CourseSlugResolver;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for admin class-wise syllabus feature:
 * - fetchClassesForCourseSyllabus (canonical current course audience + explicit historical review)
 * - fetchSpecificCourseContents (generic + class-specific content)
 * - Edge cases: no classes, empty course, access control
 */
@WebMvcTest(controllers = LessonContentController.class,
    // TestSecurityConfig below is meant to replace the real security config, but @WebMvcTest
    // auto-includes every WebSecurityConfigurerAdapter it scans, so WebSecurityConfig would
    // still load and drag in JwtService/JwtAuthenticationFilter. Exclude it explicitly.
    excludeFilters = {
        @org.springframework.context.annotation.ComponentScan.Filter(
            type = org.springframework.context.annotation.FilterType.ASSIGNABLE_TYPE,
            classes = com._42students.lms.configuration.WebSecurityConfig.class),
        // These slices run with addFilters = false, so no servlet filter is ever applied — but
        // @WebMvcTest still *instantiates* every Filter bean it scans, dragging in JwtService,
        // AppSettingsService and friends. Nothing here needs them.
        @org.springframework.context.annotation.ComponentScan.Filter(
            type = org.springframework.context.annotation.FilterType.REGEX,
            pattern = "com\\._42students\\.lms\\.security\\..*"),
        // ResourceUploadReceiptAdvice's own assignableTypes DOES include LessonContentController,
        // but none of the test methods here exercise the upload-receipt path (they cover
        // FetchClassesForCourseSyllabus / UpdateClassContentOrder only) — excluding it just stops
        // @WebMvcTest eagerly instantiating a bean that needs AssignmentUploadReceiptRepository,
        // which this JPA-free slice never provides.
        @org.springframework.context.annotation.ComponentScan.Filter(
            type = org.springframework.context.annotation.FilterType.ASSIGNABLE_TYPE,
            classes = {com._42students.lms.controller.ResourceUploadReceiptAdvice.class,
                       com._42students.lms.controller.FacultyResourceUploadReceiptAdvice.class,
                       com._42students.lms.controller.ResourceLessonCourseRequestGuard.class})})
@Import({
    AccessControlService.class,
    ScopeResolutionService.class,
    GlobalExceptionHandler.class,
    com._42students.lms.configuration.TestSecurityConfig.class
})
@org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc(addFilters = false)
@org.springframework.test.context.ActiveProfiles("controllerAccessTest")
class AdminClassWiseSyllabusIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private com._42students.lms.security.JwtAuthenticationFilter jwtAuthenticationFilter;
    @MockBean
    private com._42students.lms.access.ScopeContextFilter scopeContextFilter;
    @MockBean
    private LessonContentsService lessonContentsService;
    @MockBean
    private LessonService lessonService;
    @MockBean
    private ClassService classService;
    @MockBean
    private CourseSlugResolver courseSlugResolver;
    @MockBean
    private CourseService courseService;
    @MockBean
    private FacultyService facultyService;
    @MockBean
    private SecurityContextUtil securityContextUtil;
    @MockBean
    private ScopeResolutionService scopeResolutionService;
    @MockBean
    private FacultyTeachingAssignmentRepository facultyTeachingAssignmentRepository;

    private UserPrincipal adminPrincipal() {
        return new UserPrincipal(1, "FACULTY", "ADMIN", null, 1, 0);
    }

    private UserPrincipal learnerPrincipal() {
        return new UserPrincipal(10, "LEARNER", null, 1, 1, 0);
    }

    @Nested
    @DisplayName("fetchClassesForCourseSyllabus")
    class FetchClassesForCourseSyllabus {

        @Test
        @DisplayName("returns the canonical current eligible course audience")
        void returns_current_eligible_classes() throws Exception {
            UserPrincipal principal = adminPrincipal();
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
            when(courseSlugResolver.resolve(null, 1)).thenReturn(1);
            when(scopeResolutionService.resolveCourseToCollegeId(1)).thenReturn(1);

            _Class classA = new _Class();
            classA.setId(2);
            classA.setName("Class A");
            _Class classB = new _Class();
            classB.setId(3);
            classB.setName("Class B");
            when(scopeResolutionService.resolveCurrentEligibleClassesForCourse(1))
                    .thenReturn(List.of(classA, classB));
            when(lessonContentsService.fetchUniqueClassIdsByCourseId(1)).thenReturn(List.of(4));

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/lesson/contents/fetchClassesForCourseSyllabus")
                    .param("courseId", "1")
                    .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.2").value("Class A"))
                .andExpect(jsonPath("$.3").value("Class B"))
                .andExpect(jsonPath("$.4").doesNotExist());
        }

        @Test
        @DisplayName("does not offer historical content classes as new current targets")
        void excludes_historical_content_classes_from_current_selector() throws Exception {
            UserPrincipal principal = adminPrincipal();
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
            when(courseSlugResolver.resolve(null, 1)).thenReturn(1);
            when(scopeResolutionService.resolveCourseToCollegeId(1)).thenReturn(1);
            when(scopeResolutionService.resolveCurrentEligibleClassesForCourse(1)).thenReturn(List.of());
            when(lessonContentsService.fetchUniqueClassIdsByCourseId(1)).thenReturn(List.of(2));

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/lesson/contents/fetchClassesForCourseSyllabus")
                    .param("courseId", "1")
                    .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
        }

        @Test
        @DisplayName("returns empty map when no classes have content or assignments")
        void returns_empty_when_no_classes() throws Exception {
            UserPrincipal principal = adminPrincipal();
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
            when(courseSlugResolver.resolve(null, 1)).thenReturn(1);
            when(scopeResolutionService.resolveCourseToCollegeId(1)).thenReturn(1);
            when(lessonContentsService.fetchUniqueClassIdsByCourseId(1)).thenReturn(List.of());
            when(facultyService.getCourseFacultyClassMapping(1)).thenReturn(List.of());

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/lesson/contents/fetchClassesForCourseSyllabus")
                    .param("courseId", "1")
                    .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isMap())
                .andExpect(jsonPath("$").isEmpty());
        }

        @Test
        @DisplayName("uses courseSlug when provided")
        void uses_course_slug_when_provided() throws Exception {
            UserPrincipal principal = adminPrincipal();
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
            when(courseSlugResolver.resolve("crs-abc123", null)).thenReturn(1);
            when(scopeResolutionService.resolveCourseToCollegeId(1)).thenReturn(1);
            when(lessonContentsService.fetchUniqueClassIdsByCourseId(1)).thenReturn(List.of());
            when(facultyService.getCourseFacultyClassMapping(1)).thenReturn(List.of());

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/lesson/contents/fetchClassesForCourseSyllabus")
                    .param("courseSlug", "crs-abc123")
                    .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

            verify(courseSlugResolver).resolve("crs-abc123", null);
        }

        @Test
        @DisplayName("returns 403 when admin from different college tries to access course")
        void returns_403_when_cross_college() throws Exception {
            UserPrincipal principal = adminPrincipal();
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
            when(courseSlugResolver.resolve(null, 2)).thenReturn(2);
            when(scopeResolutionService.resolveCourseToCollegeId(2)).thenReturn(2);

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/lesson/contents/fetchClassesForCourseSyllabus")
                    .param("courseId", "2")
                    .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("can opt one already-used historical class back into an edit selector")
        void includes_explicit_historical_class_for_editing() throws Exception {
            UserPrincipal principal = adminPrincipal();
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
            when(courseSlugResolver.resolve(null, 1)).thenReturn(1);
            when(scopeResolutionService.resolveCourseToCollegeId(1)).thenReturn(1);
            when(scopeResolutionService.resolveCurrentEligibleClassesForCourse(1)).thenReturn(List.of());
            when(lessonContentsService.fetchUniqueClassIdsByCourseId(1)).thenReturn(List.of(2));
            when(scopeResolutionService.resolveClassToCollegeId(2)).thenReturn(1);
            when(classService.getClassNameById("2")).thenReturn("Class A");

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/lesson/contents/fetchClassesForCourseSyllabus")
                    .param("courseId", "1")
                    .param("includeHistoricalClassId", "2")
                    .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.2").value("Class A (historical scope)"));
        }
    }

    @Nested
    @DisplayName("fetchSpecificCourseContents (LessonController)")
    class FetchSpecificCourseContents {
        // Note: fetchSpecificCourseContents lives in LessonController, not LessonContentController.
        // These tests validate the behavior that admin + class selection relies on.
        // For full integration, see LessonControllerScopeIntegrationTest pattern.
    }

    @Nested
    @DisplayName("getSpecificLessonContents (per-lesson content with classId)")
    class GetSpecificLessonContents {
        // Per-lesson content fetch - when admin views a lesson with class selected.
        // Backend getSpecificLessonContents with classId>0 uses fetchCombinedLessonContents.
    }

    @Nested
    @DisplayName("updateClassContentOrder")
    class UpdateClassContentOrder {

        private final ObjectMapper objectMapper = new ObjectMapper();

        @Test
        @DisplayName("updates order when admin has class and course access")
        void updates_order_when_admin_has_access() throws Exception {
            UserPrincipal principal = adminPrincipal();
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
            when(scopeResolutionService.resolveClassToCollegeId(2)).thenReturn(1);
            when(scopeResolutionService.resolveCourseToCollegeId(1)).thenReturn(1);
            Lesson lesson = new Lesson();
            lesson.setId(10);
            lesson.setCourseId(1);
            when(lessonService.fetchCourseId(10)).thenReturn(lesson);

            ClassContentOrderRequest request = new ClassContentOrderRequest();
            request.setLessonId(10);
            request.setClassId(2);
            request.setOrderedContentIds(List.of(101, 102, 103));

            mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/lesson/contents/class-content-order")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value("Order updated"));

            verify(lessonContentsService).updateClassContentOrder(10, 2, List.of(101, 102, 103));
        }

        @Test
        @DisplayName("returns 403 when learner tries to reorder")
        void returns_403_when_learner() throws Exception {
            UserPrincipal principal = learnerPrincipal();
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);

            ClassContentOrderRequest request = new ClassContentOrderRequest();
            request.setLessonId(10);
            request.setClassId(2);
            request.setOrderedContentIds(List.of(101, 102));

            mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/lesson/contents/class-content-order")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("returns 403 when admin from different college tries to access class")
        void returns_403_when_cross_college_class() throws Exception {
            UserPrincipal principal = adminPrincipal();
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
            when(scopeResolutionService.resolveClassToCollegeId(2)).thenReturn(2);

            ClassContentOrderRequest request = new ClassContentOrderRequest();
            request.setLessonId(10);
            request.setClassId(2);
            request.setOrderedContentIds(List.of(101, 102));

            mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/lesson/contents/class-content-order")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("returns 404 when lesson not found")
        void returns_404_when_lesson_not_found() throws Exception {
            UserPrincipal principal = adminPrincipal();
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
            when(scopeResolutionService.resolveClassToCollegeId(2)).thenReturn(1);
            when(lessonService.fetchCourseId(999)).thenReturn(null);

            ClassContentOrderRequest request = new ClassContentOrderRequest();
            request.setLessonId(999);
            request.setClassId(2);
            request.setOrderedContentIds(List.of(101, 102));

            mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/lesson/contents/class-content-order")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("returns 400 when lessonId is null")
        void returns_400_when_lesson_id_null() throws Exception {
            UserPrincipal principal = adminPrincipal();
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);

            String body = "{\"classId\":2,\"orderedContentIds\":[101,102]}";

            mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/lesson/contents/class-content-order")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
                .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("returns 400 when classId is null")
        void returns_400_when_class_id_null() throws Exception {
            UserPrincipal principal = adminPrincipal();
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);

            String body = "{\"lessonId\":10,\"orderedContentIds\":[101,102]}";

            mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/lesson/contents/class-content-order")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
                .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("returns 400 when orderedContentIds is empty")
        void returns_400_when_ordered_content_ids_empty() throws Exception {
            UserPrincipal principal = adminPrincipal();
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);

            String body = "{\"lessonId\":10,\"classId\":2,\"orderedContentIds\":[]}";

            mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/lesson/contents/class-content-order")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
                .andExpect(status().isBadRequest());
        }
    }

    private FacultyCourseClassMappingDTO createMapping(int classId, String className) {
        FacultyCourseClassMappingDTO dto = new FacultyCourseClassMappingDTO();
        dto.setClassId(classId);
        dto.setClassName(className);
        return dto;
    }
}
