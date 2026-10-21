package com._42students.lms.service;

import com._42students.lms.dto.request.LessonDTO;
import com._42students.lms.dto.response.LessonResponseDTO;
import com._42students.lms.model.Lesson;

import java.util.List;
import java.util.Optional;

public interface LessonService {

    /**
     * A learner's assignment + quiz submissions for a course, combined. Moved out of
     * LessonController (47: it was the only controller in the module reaching past the service
     * layer into StudentAssignmentRepository directly) and into the service that owns the
     * "grades by course and class" use case.
     */
    List<com._42students.lms.model.StudentAssignment> fetchSubmissionsByLearnerAndCourse(int learnerId, int courseId);
    Lesson createLesson(LessonDTO lessonDTO);

    List<Lesson> getLessons(int courseId);
    
    List<Lesson> findAll();

    /**
     * Lessons for courses in the given college (for non–super-admin scope).
     */
    List<Lesson> findByCollegeId(Integer collegeId);

    List<Lesson> findByOrganizationId(Integer orgId);

    /** Non-security #31: additive paged variants of the two unscoped list methods above. */
    org.springframework.data.domain.Page<Lesson> findAllPaged(org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<Lesson> findByOrganizationIdPaged(Integer orgId,
            org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<Lesson> findByCollegeIdPaged(Integer collegeId,
            org.springframework.data.domain.Pageable pageable);

    List<LessonResponseDTO> getLessonContents(int courseId);

    List<LessonResponseDTO> getSpecificLessonContents(int courseId, int classScheduleId);

    Lesson fetchCourseId(int lessonId);

    /** @deprecated Use {@link #getSpecificLessonContents(int, int)} instead. Same result. */
    @Deprecated
    List<LessonResponseDTO> getLessonContentsByCourseAndClass(int courseId, int classId);

    Optional<Lesson> findById(Integer id);

    Lesson updateLesson(Integer id, LessonDTO lessonDTO);

    /**
     * Reorders a course's lessons, assigning sequence from list position.
     *
     * @return how many lessons were repositioned
     */
    int reorderLessons(int courseId, java.util.List<Integer> orderedLessonIds);

    void deleteLesson(Integer id);

    /**
     * Reverses a soft delete of the lesson and cascade-restores its content rows. Any uploaded
     * file the delete already destroyed via best-effort R2 cleanup is NOT recovered — this brings
     * back the records, not the files.
     *
     * @throws org.springframework.web.server.ResponseStatusException 404 if not found, not
     *         deleted, or not in the given college.
     */
    com._42students.lms.model.Lesson restoreLesson(Integer id, Integer collegeId);

    /** Soft-deleted lessons for a college, newest-deleted first — backs the restore screen. */
    java.util.List<com._42students.lms.model.Lesson> fetchDeletedLessons(Integer collegeId);
}

