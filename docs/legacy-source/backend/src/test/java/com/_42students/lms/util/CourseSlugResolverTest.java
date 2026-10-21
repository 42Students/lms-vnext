package com._42students.lms.util;

import com._42students.lms.model.Course;
import com._42students.lms.service.CourseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for CourseSlugResolver.
 * Valid slug resolves to courseId; invalid slug returns 404; null slug with courseId works; both null returns 400.
 */
@ExtendWith(MockitoExtension.class)
class CourseSlugResolverTest {

    @Mock
    private CourseService courseService;

    private CourseSlugResolver resolver;

    @BeforeEach
    void setUp() {
        resolver = new CourseSlugResolver();
        try {
            java.lang.reflect.Field field = CourseSlugResolver.class.getDeclaredField("courseService");
            field.setAccessible(true);
            field.set(resolver, courseService);
            field = CourseSlugResolver.class.getDeclaredField("courseSlugGenerator");
            field.setAccessible(true);
            field.set(resolver, new CourseSlugGenerator());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    @DisplayName("Valid slug resolves to correct courseId")
    void validSlugResolvesToCourseId() {
        String slug = "crs-X9kMn3QwRtYuVwXz";
        Course course = new Course();
        course.setId(5);
        course.setSlug(slug);
        when(courseService.fetchCourseBySlug(slug)).thenReturn(java.util.Optional.of(course));

        int result = resolver.resolve(slug, null);

        assertEquals(5, result);
        verify(courseService).fetchCourseBySlug(slug);
    }

    @Test
    @DisplayName("Valid format but course not found returns 404")
    void validFormatButNotFoundReturns404() {
        when(courseService.fetchCourseBySlug(anyString())).thenReturn(java.util.Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
            () -> resolver.resolve("crs-nonexistent", null));

        assertEquals(404, ex.getStatus().value());
    }

    @Test
    @DisplayName("Invalid slug format returns 400")
    void invalidSlugFormatReturns400() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
            () -> resolver.resolve("not-a-valid-slug", null));

        assertEquals(400, ex.getStatus().value());
        verify(courseService, never()).fetchCourseBySlug(anyString());
    }

    @Test
    @DisplayName("Null slug with valid courseId returns courseId")
    void nullSlugWithValidCourseIdWorks() {
        Course course = new Course();
        course.setId(10);
        when(courseService.fetchCourse(10)).thenReturn(course);

        int result = resolver.resolve(null, 10);

        assertEquals(10, result);
        verify(courseService, never()).fetchCourseBySlug(anyString());
    }

    @Test
    @DisplayName("Empty slug with valid courseId returns courseId")
    void emptySlugWithValidCourseIdWorks() {
        Course course = new Course();
        course.setId(7);
        when(courseService.fetchCourse(7)).thenReturn(course);

        int result = resolver.resolve("  ", 7);

        assertEquals(7, result);
        verify(courseService, never()).fetchCourseBySlug(anyString());
    }

    @Test
    @DisplayName("Both null throws 400")
    void bothNullThrows400() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
            () -> resolver.resolve(null, null));

        assertEquals(400, ex.getStatus().value());
        assertNotNull(ex.getReason());
        assertTrue(ex.getReason().toLowerCase().contains("required") || ex.getReason().toLowerCase().contains("course"));
    }

    @Test
    @DisplayName("When both provided and match, returns resolved id")
    void slugWinsWhenBothProvided() {
        String slug = "crs-abc123";
        Course course = new Course();
        course.setId(3);
        when(courseService.fetchCourseBySlug(slug)).thenReturn(java.util.Optional.of(course));

        int result = resolver.resolve(slug, 3);

        assertEquals(3, result);
        verify(courseService).fetchCourseBySlug(slug);
    }

    @Test
    @DisplayName("When both provided but slug and courseId refer to different courses, returns 400")
    void slugAndCourseIdMismatchReturns400() {
        String slug = "crs-abc123";
        Course course = new Course();
        course.setId(3);
        when(courseService.fetchCourseBySlug(slug)).thenReturn(java.util.Optional.of(course));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
            () -> resolver.resolve(slug, 99));

        assertEquals(400, ex.getStatus().value());
        assertTrue(ex.getReason() != null && ex.getReason().toLowerCase().contains("same course"));
    }

    @Test
    @DisplayName("An unknown slug is a 404, not an escaping RuntimeException")
    void unknownSlugResultsIn404() {
        // Non-security #45: fetchCourseBySlug used to signal "no such course" by throwing a bare
        // RuntimeException, which callers caught and translated -- and which, at three other call
        // sites, escaped as a 500 instead. Absence is now an empty Optional, so this is the whole
        // contract: no course, clean 404.
        when(courseService.fetchCourseBySlug(anyString())).thenReturn(java.util.Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
            () -> resolver.resolve("crs-bad", null));

        assertEquals(404, ex.getStatus().value());
    }
}
