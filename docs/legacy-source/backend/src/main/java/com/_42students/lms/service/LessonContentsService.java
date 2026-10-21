package com._42students.lms.service;

import com._42students.lms.dto.request.LessonContentsDTO;
import com._42students.lms.dto.response.PageResponseDTO;
import com._42students.lms.model.LessonContents;

import java.util.List;
import java.util.Optional;

public interface LessonContentsService {

    LessonContents createLessonContents(LessonContentsDTO lessonContentsDTO);
    LessonContents getLessonContents(int lessonContentId);
    List<LessonContents> fetchLessonContents(int lessonId);
    List<LessonContents> fetchLessonContents1(int lessonId);
    List<LessonContents> fetchSpecificLessonContents(int lessonId, int classId);

    /**
     * Sanitizes lesson contents for API response: strips quiz correct-answers from learner-facing
     * responses. Modifies the list in place and returns it.
     */
    List<LessonContents> toListSafeForResponse(List<LessonContents> list);
    
    /**
     * Optimized method to fetch both generic AND class-specific lesson contents
     * in a single database query, properly ordered by sequence.
     */
    List<LessonContents> fetchCombinedLessonContents(int lessonId, int classId);
    List<LessonContents> fetchAllAssignments(int facultyId);
    List<LessonContents> fetchAllAssignmentsByLearnerId(int learnerId) throws Exception;
    PageResponseDTO<LessonContents> fetchAllAssignmentsPaged(int facultyId, Integer courseId, int page, int size);
    PageResponseDTO<LessonContents> fetchAllAssignmentsByLearnerIdPaged(int learnerId, Integer courseId, int page, int size) throws Exception;
    List<com._42students.lms.dto.response.CourseFilterOptionDTO> fetchCoursesForClass(int learnerId) throws Exception;
    List<LessonContents> fetchAllByFacultyId(int facultyId) throws Exception;
    List<Integer> fetchUniqueClassIdsByCourseId(int courseId);
    
    // CRUD operations
    Optional<LessonContents> findById(Integer id);
    LessonContents updateLessonContent(Integer id, LessonContentsDTO lessonContentsDTO);
    void deleteLessonContent(Integer id);

    /**
     * Best-effort physical purge of the R2 object (if any) backing this content's file_dto.
     * Ordinary content/lesson deletion MUST NOT call this method; those paths archive rows and
     * retain files for recovery. Reserve this for an explicit retention/purge workflow.
     */
    void deleteContentFileBestEffort(LessonContents lessonContents);

    /**
     * A time-limited presigned URL for this content's stored file. Clients should use this
     * authorized path rather than treating the stored object reference as a playback URL.
     * Returns null if the content has no file (e.g. a lecture/BYO type with no attached object).
     */
    com._42students.lms.dto.response.PlaybackUrlResponseDTO generatePlaybackUrl(LessonContents lessonContents);

    /**
     * Update per-class content order for a lesson. Only affects the specified class.
     * @param lessonId lesson ID
     * @param classId class ID (must be > 0)
     * @param orderedContentIds list of lesson_content ids in desired order (positions 0, 1, 2, ...)
     */
    void updateClassContentOrder(int lessonId, int classId, List<Integer> orderedContentIds);
}

