package com._42students.lms.util;

import com._42students.lms.model.Course;
import com._42students.lms.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Resolves course identifier from either slug or numeric ID.
 * Use in controllers that accept optional courseSlug or courseId.
 * Validates slug format before DB lookup; returns 400 for invalid format, 404 for not found.
 */
@Component
public class CourseSlugResolver {

    private static final int MAX_SLUG_LENGTH = 64;

    @Autowired
    private CourseService courseService;

    @Autowired
    private CourseSlugGenerator courseSlugGenerator;

    /**
     * Resolve to internal course ID. If courseSlug is non-null and non-empty, resolve from slug; otherwise use courseId.
     * Invalid slug format returns 400; valid but unknown slug returns 404.
     *
     * @param courseSlug optional slug (e.g. crs-X9kMn3...)
     * @param courseId   optional numeric ID (used when courseSlug is null/empty)
     * @return internal course ID
     * @throws ResponseStatusException 400 invalid format or slug/courseId mismatch, 404 not found
     */
    public int resolve(String courseSlug, Integer courseId) {
        if (courseSlug != null && !courseSlug.trim().isEmpty()) {
            String trimmed = courseSlug.trim();
            validateSlugFormat(trimmed);
            Course course = courseService.fetchCourseBySlug(trimmed)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
            int resolvedId = course.getId();
            if (courseId != null && resolvedId != courseId) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "courseSlug and courseId do not refer to the same course");
            }
            return resolvedId;
        }
        if (courseId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Either courseSlug or courseId required");
        }
        Course course = courseService.fetchCourse(courseId);
        if (course == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found");
        }
        return course.getId();
    }

    /**
     * Validate slug format and length. Throw 400 if invalid so clients get clear feedback.
     */
    public void validateSlugFormat(String slug) {
        if (slug == null || slug.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Slug is required");
        }
        // Numeric check runs BEFORE the length check: a purely-numeric string that also happens
        // to be over 64 chars is much more informatively told "use courseId" than "too long" --
        // the length message is technically true but doesn't tell the caller what they actually
        // did wrong (sent an id where a slug was expected).
        if (slug.matches("^\\d+$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use courseId parameter for numeric identifiers");
        }
        if (slug.length() > MAX_SLUG_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Slug length must not exceed " + MAX_SLUG_LENGTH);
        }
        if (!courseSlugGenerator.isValidSlug(slug)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid slug format");
        }
    }
}

