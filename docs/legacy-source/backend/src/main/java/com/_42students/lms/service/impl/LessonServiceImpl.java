package com._42students.lms.service.impl;

import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.ContentsDTO;
import com._42students.lms.dto.request.LessonDTO;
import com._42students.lms.dto.response.LessonResponseDTO;
import com._42students.lms.model.Course;
import com._42students.lms.model.Lesson;
import com._42students.lms.model.LessonContents;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.repository.LessonContentsRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.CourseService;
import com._42students.lms.repository.LessonRepository;
import com._42students.lms.service.LessonContentsService;
import com._42students.lms.service.LessonService;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class LessonServiceImpl implements LessonService {

    @Autowired
    LessonRepository lessonRepository;

    @Autowired
    LessonContentsRepository lessonContentsRepository;

    @Autowired
    LessonContentsService lessonContentsService;

    @Autowired
    CourseService courseService;

    @Autowired(required = false)
    SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    FacultyTeachingAssignmentRepository facultyTeachingAssignmentRepository;

    @Autowired
    com._42students.lms.repository.CourseRepository courseRepository;

    @Autowired
    com._42students.lms.repository.DepartmentRepository departmentRepository;

    @Autowired
    com._42students.lms.repository.StudentAssignmentRepository studentAssignmentRepository;

    @Autowired
    ScopeResolutionService scopeResolutionService;

    @Autowired
    com._42students.lms.repository.SemesterCourseRepository semesterCourseRepository;

    @Override
    public List<com._42students.lms.model.StudentAssignment> fetchSubmissionsByLearnerAndCourse(int learnerId, int courseId) {
        List<com._42students.lms.model.StudentAssignment> submissions = new ArrayList<>();
        submissions.addAll(studentAssignmentRepository.fetchAssignmentSubmissionsByLearnerAndCourse(learnerId, courseId));
        submissions.addAll(studentAssignmentRepository.fetchQuizSubmissionsByLearnerAndCourse(learnerId, courseId));
        return submissions;
    }

    /**
     * SECURITY: lessons are course-level (not class-scoped), so mutating one — including delete,
     * which cascades to soft-delete every LessonContents item under it — was gated only by the
     * college-wide requireAccessCourse() check at the controller, with no verification that the
     * calling faculty is actually assigned to teach this specific course. Mirrors
     * LessonContentsServiceImpl#enforceFacultyTeachingScope, admin-exempt via facultyType.
     */
    private void enforceFacultyTeachingScopeForCourse(int courseId) {
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        // Fail closed. This guard exists to keep a faculty member inside the courses they teach,
        // but it used to early-return for EVERY non-faculty principal — which silently exempted
        // learners, letting an enrolled student create, rename and delete lessons in their own
        // course (cascading to content rows and permanent R2 file deletion). Mutating lesson
        // endpoints are now role-gated in WebSecurityConfig too; this is the service-layer half
        // of that fix, so the rule holds no matter which controller calls in.
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        if (principal.isLearner()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Learners cannot modify lessons");
        }
        if (!principal.isFaculty()) return;
        boolean isAdminFaculty = principal.getFacultyType() != null && "ADMIN".equalsIgnoreCase(principal.getFacultyType());
        if (isAdminFaculty) return;
        Integer facultyId = principal.getId();
        if (facultyId == null || facultyId <= 0) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Valid faculty id is required");
        }
        if (facultyTeachingAssignmentRepository == null
                || !facultyTeachingAssignmentRepository.existsByFacultyIdAndCourseIdAndIsActive(facultyId, courseId, true)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Faculty is not assigned to this course");
        }
    }

    // 6.4: LessonServiceImpl had NO @Transactional anywhere, unlike CourseServiceImpl. deleteLesson
    // in particular soft-deletes the lesson row AND cascades to every content row in it -- two
    // separate saves with no transaction boundary meant a failure between them could leave the
    // lesson marked deleted while its content stayed live, or vice versa.
    @Override
    @org.springframework.transaction.annotation.Transactional(rollbackFor = Exception.class)
    public Lesson createLesson(LessonDTO lessonDTO) {
        int courseId = resolveCourseId(lessonDTO.getCourseSlug(), lessonDTO.getCourseId());

        // CC-09: validate courseId exists before creating lesson
        if (courseId <= 0 || courseService.fetchCourse(courseId) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course not found with id: " + courseId);
        }
        enforceFacultyTeachingScopeForCourse(courseId);

        String lessonName = lessonDTO.getLessonName();
        if (lessonName == null || lessonName.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lesson name is required");
        }
        Integer existsFlag = lessonRepository.existsByCourseIdAndLessonName(courseId, lessonName.trim());
        if (existsFlag != null && existsFlag.intValue() > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A lesson with this name already exists in the course");
        }

        Lesson lesson = new Lesson();
        lesson.setLessonName(lessonName.trim());
        lesson.setCourseId(courseId);
        long sequence = lessonDTO.getSequence();
        if (sequence <= 0) {
            sequence = lessonRepository.getMaxSequenceByCourseId(courseId) + 1;
        }
        lesson.setSequence(sequence);
        lesson.setEnabled(lessonDTO.getEnabled() != null ? lessonDTO.getEnabled() : true);
        lesson.setActive(lessonDTO.getActive() != null ? lessonDTO.getActive() : true);
        Lesson lesson1 = lessonRepository.save(lesson);
        
        // Only process contents if provided
        if (lessonDTO.getContentsDTOs() != null) {
            for (ContentsDTO contentsDTO : lessonDTO.getContentsDTOs()) {
                LessonContents lessonContents = new LessonContents();
                lessonContents.setLessonId(lesson.getId());
                lessonContents.setActive(contentsDTO.isActive());
                lessonContents.setEnabled(contentsDTO.isEnabled());
                lessonContents.setSequence(contentsDTO.getSequence());
                lessonContents.setContentTitle(contentsDTO.getContentTitle());
                lessonContents.setContentType(contentsDTO.getContentType().getContentType());
                lessonContents.setContentDataDTO(contentsDTO.getContentDataDTO());
                lessonContents.setPoints(contentsDTO.getPoints());
                int contentClassId = contentsDTO.getClassScheduleId();
                if (contentClassId > 0) {
                    Integer courseCollegeId = scopeResolutionService.resolveCourseToCollegeId(courseId);
                    Integer classCollegeId = scopeResolutionService.resolveClassToCollegeId(contentClassId);
                    if (courseCollegeId == null || classCollegeId == null || !courseCollegeId.equals(classCollegeId)) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "Lesson content class must belong to the same college as the course");
                    }
                    Integer classProgramId = scopeResolutionService.resolveClassToProgramId(contentClassId);
                    if (classProgramId == null || !semesterCourseRepository.existsByProgramIdAndCourseId(classProgramId, courseId)) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "Lesson content course is not part of the selected class program curriculum");
                    }
                    lessonContents.setClassId(contentClassId);
                } else {
                    lessonContents.setClassId(contentClassId);
                }
                lessonContentsRepository.save(lessonContents);
            }
        }
        return lesson1;
    }

    @Override
    public List<Lesson> getLessons(int courseId) {
        List<Lesson> lessons = lessonRepository.getLessons(courseId);
        Course course = courseService.fetchCourse(courseId);
        String slug = course != null ? course.getSlug() : null;
        for (Lesson lesson : lessons) {
            lesson.setCourseSlug(slug);
        }
        return lessons;
    }

    @Override
    public List<Lesson> findAll() {
        return lessonRepository.findAllByOrderByCourseIdAscSequenceAsc();
    }

    @Override
    public List<Lesson> findByCollegeId(Integer collegeId) {
        if (collegeId == null) return List.of();
        return lessonRepository.findByCollegeId(collegeId);
    }

    @Override
    public List<Lesson> findByOrganizationId(Integer orgId) {
        if (orgId == null) return List.of();
        return lessonRepository.findByOrganizationId(orgId);
    }

    @Override
    public org.springframework.data.domain.Page<Lesson> findAllPaged(
            org.springframework.data.domain.Pageable pageable) {
        return lessonRepository.findAllByOrderByCourseIdAscSequenceAsc(pageable);
    }

    @Override
    public org.springframework.data.domain.Page<Lesson> findByOrganizationIdPaged(Integer orgId,
            org.springframework.data.domain.Pageable pageable) {
        if (orgId == null) return org.springframework.data.domain.Page.empty(pageable);
        return lessonRepository.findByOrganizationIdPaged(orgId, pageable);
    }

    @Override
    public org.springframework.data.domain.Page<Lesson> findByCollegeIdPaged(Integer collegeId,
            org.springframework.data.domain.Pageable pageable) {
        if (collegeId == null) return org.springframework.data.domain.Page.empty(pageable);
        return lessonRepository.findByCollegeIdPaged(collegeId, pageable);
    }

    @Override
    public List<LessonResponseDTO> getLessonContents(int courseId) {
        List<LessonResponseDTO> lessonResponseDTOS = new ArrayList<>();
        List<Lesson> lessons = getLessons(courseId);
        for (Lesson lesson : lessons) {
            LessonResponseDTO lessonResponseDTO = new LessonResponseDTO();
            lessonResponseDTO.setLesson(lesson);
            List<LessonContents> contents = lessonContentsService.fetchLessonContents(lesson.getId());
            lessonResponseDTO.setLessonContents(lessonContentsService.toListSafeForResponse(contents));
            lessonResponseDTOS.add(lessonResponseDTO);
        }
        return lessonResponseDTOS;
    }

    @Override
    public List<LessonResponseDTO> getSpecificLessonContents(int courseId, int classId) {
        List<LessonResponseDTO> lessonResponseDTOS = new ArrayList<>();
        List<Lesson> lessons = getLessons(courseId);
        for (Lesson lesson : lessons) {
            LessonResponseDTO lessonResponseDTO = new LessonResponseDTO();
            lessonResponseDTO.setLesson(lesson);
            // Single query: generic (class_id IS NULL or < 1) + class-specific, ordered by sequence, no duplicates
            List<LessonContents> lessonContents = lessonContentsService
                    .fetchCombinedLessonContents(lesson.getId(), classId);
            lessonResponseDTO.setLessonContents(lessonContentsService.toListSafeForResponse(lessonContents));
            lessonResponseDTOS.add(lessonResponseDTO);
        }
        return lessonResponseDTOS;
    }

    @Override
    public Lesson fetchCourseId(int lessonId) {
        return lessonRepository.fetchCourseId(lessonId);
    }

    @Override
    @Deprecated
    public List<LessonResponseDTO> getLessonContentsByCourseAndClass(int courseId, int classId) {
        return getSpecificLessonContents(courseId, classId);
    }

    @Override
    public Optional<Lesson> findById(Integer id) {
        return lessonRepository.findById(id);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(rollbackFor = Exception.class)
    public Lesson updateLesson(Integer id, LessonDTO lessonDTO) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lesson not found with id: " + id));
        enforceFacultyTeachingScopeForCourse(lesson.getCourseId());

        int courseId = resolveCourseId(lessonDTO.getCourseSlug(), lessonDTO.getCourseId());
        // BE-0149: names are unique in the course the lesson ends up in. A move checks the destination (even without a
        // rename); before, a rename checked the course it was leaving.
        int targetCourse = courseId != 0 ? courseId : lesson.getCourseId();
        boolean moving = targetCourse != lesson.getCourseId();
        String currentName = lesson.getLessonName() != null ? lesson.getLessonName().trim() : "";
        String newName = currentName;
        if (lessonDTO.getLessonName() != null) {
            newName = lessonDTO.getLessonName().trim();
            if (newName.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lesson name is required");
            }
        }
        if (!newName.isEmpty() && (moving || !newName.equalsIgnoreCase(currentName))) {
            Integer existsFlag = lessonRepository.existsByCourseIdAndLessonName(targetCourse, newName);
            if (existsFlag != null && existsFlag.intValue() > 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, moving
                        ? "The other course already has a lesson with this name. Rename it first, or pick another course."
                        : "A lesson with this name already exists in the course");
            }
        }
        if (lessonDTO.getLessonName() != null) lesson.setLessonName(newName);
        if (courseId != 0 && courseId != lesson.getCourseId()) {
            // Moving the lesson to a different course: target must exist, and faculty must be assigned to it too.
            if (courseId < 0 || courseService.fetchCourse(courseId) == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course not found with id: " + courseId);
            }
            enforceFacultyTeachingScopeForCourse(courseId);
        }
        if (courseId != 0 && courseId != lesson.getCourseId()) {
            // BE-0142: a lesson's content moves with it. Only the lesson used to move, so its content stayed recorded under the
            // old course. Class-specific content belongs to the old course's classes and can't follow; such a lesson is refused.
            java.util.List<com._42students.lms.model.LessonContents> contents = lessonContentsRepository.findAllForLesson(id);
            boolean classSpecific = contents.stream().anyMatch(c -> c.getClassId() != null && c.getClassId() > 0);
            if (classSpecific) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "This lesson has class-specific content for its current course, so it can't move to another course. Create the lesson in the other course instead.");
            }
            for (com._42students.lms.model.LessonContents c : contents) c.setCourseId(courseId);
            lessonContentsRepository.saveAll(contents);
        }
        if (courseId != 0) lesson.setCourseId(courseId);
        if (lessonDTO.getSequence() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sequence must not be negative");
        }
        if (lessonDTO.getSequence() != 0) {
            // Nothing previously enforced sequence uniqueness within a course, so two lessons
            // could silently share one and the UI fell back to an arbitrary id-order tie-break.
            // Reject a collision outright rather than auto-shifting other lessons' sequences,
            // which could itself produce a confusing, unrequested reorder of unrelated lessons.
            Integer collision = lessonRepository.existsByCourseIdAndSequenceExcludingId(
                    lesson.getCourseId(), lessonDTO.getSequence(), id);
            if (collision != null && collision > 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Another lesson in this course already has sequence " + lessonDTO.getSequence()
                                + ". Choose a different value.");
            }
            lesson.setSequence(lessonDTO.getSequence());
        }
        if (lessonDTO.getEnabled() != null) lesson.setEnabled(lessonDTO.getEnabled());
        if (lessonDTO.getActive() != null) lesson.setActive(lessonDTO.getActive());
        
        return lessonRepository.save(lesson);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(rollbackFor = Exception.class)
    public void deleteLesson(Integer id) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lesson not found with id: " + id));
        enforceFacultyTeachingScopeForCourse(lesson.getCourseId());
        lesson.setIsDeleted(true);
        lessonRepository.save(lesson);
        // Cascade archive only the currently-live children and remember WHY they were
        // archived. Their backing files are retained: deleting a lesson must be reversible.
        java.util.List<com._42students.lms.model.LessonContents> contents = lessonContentsRepository.fetchLessonContents1(id);
        if (contents != null && !contents.isEmpty()) {
            for (com._42students.lms.model.LessonContents content : contents) {
                content.setIsDeleted(true);
                content.setDeletedWithLesson(true);
            }
            lessonContentsRepository.saveAll(contents);
        }
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public Lesson restoreLesson(Integer id, Integer collegeId) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));
        if (!Boolean.TRUE.equals(lesson.getIsDeleted())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson is not deleted");
        }
        Integer lessonCollegeId = courseRepository.findById(lesson.getCourseId())
                .map(com._42students.lms.model.Course::getDeptId)
                .flatMap(deptId -> departmentRepository.findById(deptId))
                .map(com._42students.lms.model.Department::getCollegeId)
                .orElse(null);
        if (collegeId == null || lessonCollegeId == null || !collegeId.equals(lessonCollegeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Lesson does not belong to the specified college");
        }
        lesson.setIsDeleted(false);
        Lesson restored = lessonRepository.save(lesson);

        // Restore only children archived by this parent delete. Individually removed content has
        // deleted_with_lesson=false and remains archived, so restore never resurrects unrelated
        // deletions. Files were retained during archive, so these rows are usable immediately.
        java.util.List<com._42students.lms.model.LessonContents> archivedWithLesson =
                lessonContentsRepository.findByLessonIdAndDeletedWithLessonTrue(id);
        if (archivedWithLesson != null && !archivedWithLesson.isEmpty()) {
            for (com._42students.lms.model.LessonContents content : archivedWithLesson) {
                content.setIsDeleted(false);
                content.setDeletedWithLesson(false);
            }
            lessonContentsRepository.saveAll(archivedWithLesson);
        }
        return restored;
    }

    @Override
    public List<Lesson> fetchDeletedLessons(Integer collegeId) {
        if (collegeId == null) return List.of();
        return lessonRepository.fetchDeletedByCollegeId(collegeId);
    }

    private int resolveCourseId(String courseSlug, int fallbackCourseId) {
        if (courseSlug != null && !courseSlug.trim().isEmpty()) {
            // Previously unreachable 400 -- see the same fix in ClassScheduleServiceImpl.
            return courseService.fetchCourseBySlug(courseSlug.trim())
                    .map(Course::getId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course not found for slug"));
        }
        return fallbackCourseId;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public int reorderLessons(int courseId, java.util.List<Integer> orderedLessonIds) {
        if (orderedLessonIds == null || orderedLessonIds.isEmpty()) {
            throw new IllegalArgumentException("lessonIds must not be empty");
        }
        List<Lesson> lessons = lessonRepository.findAllById(orderedLessonIds);
        if (lessons.size() != orderedLessonIds.size()) {
            throw new IllegalArgumentException("One or more lessons were not found");
        }
        // Every lesson must belong to the named course. Without this a caller could pass another
        // course's lesson id and have its position rewritten from outside its own scope.
        for (Lesson l : lessons) {
            if (l.getCourseId() != courseId) {
                throw new IllegalArgumentException("All lessons must belong to the same course");
            }
        }
        // BE-0148: the order must name every live lesson of the course exactly once. A partial list (or one made before
        // someone added a lesson) would leave the others on old numbers that now collide.
        java.util.Set<Integer> sent = new java.util.HashSet<>(orderedLessonIds);
        java.util.Set<Integer> live = new java.util.HashSet<>();
        for (Lesson l : lessonRepository.getLessons(courseId)) live.add(l.getId());
        if (sent.size() != orderedLessonIds.size() || !sent.equals(live)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The lesson list changed since you opened it. Refresh, then reorder again.");
        }
        java.util.Map<Integer, Lesson> byId = new java.util.HashMap<>();
        for (Lesson l : lessons) byId.put(l.getId(), l);
        for (int i = 0; i < orderedLessonIds.size(); i++) {
            Lesson l = byId.get(orderedLessonIds.get(i));
            if (l != null) {
                l.setSequence(i + 1);
            }
        }
        lessonRepository.saveAll(lessons);
        return lessons.size();
    }
}

