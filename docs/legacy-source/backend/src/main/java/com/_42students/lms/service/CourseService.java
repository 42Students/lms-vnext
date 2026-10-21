package com._42students.lms.service;

import com._42students.lms.dto.request.CourseDTO;
import com._42students.lms.model.Course;

import java.util.List;
import java.util.Optional;

public interface CourseService {
    Course createCourse(CourseDTO course);

    List<Course> fetchCourses(int deptId);

    List<Course> fetchByCollegeId(int collegeId);

    org.springframework.data.domain.Page<Course> fetchByCollegeIdPaged(int collegeId, org.springframework.data.domain.Pageable pageable);

    List<Course> fetchByOrganizationId(int orgId);

    Course fetchCourse(int courseId);
    
    /**
     * Find course by slug (public identifier)
     * @param slug The course slug
     * @return Course if found
     * @throws RuntimeException if course not found
     */
    /**
     * Non-security #45: this used to throw a bare RuntimeException("Course not found") for the
     * ordinary "no such slug" case, which callers then caught and translated. Three of them also
     * carried an {@code if (course != null)} guard that could never be false, so their intended
     * 400 was dead code and an unknown slug surfaced as a 500 instead. Returning Optional makes
     * absence a value the compiler forces every caller to handle.
     */
    java.util.Optional<Course> fetchCourseBySlug(String slug);

    List<Course> findAll();

    org.springframework.data.domain.Page<Course> findAllPaged(org.springframework.data.domain.Pageable pageable);

    Optional<Course> findById(Integer id);

    Course updateCourse(Integer id, CourseDTO courseDTO);

    void deleteCourse(Integer id);

    /**
     * Reverses a soft delete. The only recovery path through the product for a deleted course —
     * previously a developer with SQL access was the only way back. No slug-collision check is
     * needed: existsBySlug deliberately never filters deleted rows (see CourseRepository), so a
     * deleted course's slug stays reserved to it and cannot have been claimed by another course
     * while it was deleted.
     *
     * @throws org.springframework.web.server.ResponseStatusException 404 if not found or not
     *         deleted.
     */
    com._42students.lms.model.Course restoreCourse(Integer id, Integer collegeId);

    /** Soft-deleted courses for a college, newest-deleted first — backs the restore screen. */
    java.util.List<com._42students.lms.model.Course> fetchDeletedCourses(Integer collegeId);
}

