package com._42students.lms.service.impl;

import com._42students.lms.dto.request.CourseDTO;
import com._42students.lms.model.Course;
import com._42students.lms.repository.CourseRepository;
import com._42students.lms.repository.LessonContentsRepository;
import com._42students.lms.search.courses.CourseSearchCache;
import com._42students.lms.service.CourseService;
import com._42students.lms.util.CourseSlugGenerator;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class CourseServiceImpl implements CourseService {

    // 25 attempts made sense when the retry loop couldn't actually succeed (see the fix on
    // createCourse -- the old logic caught the constraint violation inside the same @Transactional
    // method, which cannot work). Now that slugs are checked with existsBySlug BEFORE the single
    // save(), a collision on a randomly-generated slug is vanishingly rare; a handful of attempts
    // is enough headroom.
    private static final int SLUG_RETRY_ATTEMPTS = 5;

    @Autowired
    CourseRepository courseRepository;

    @Autowired
    CourseSlugGenerator slugGenerator;

    @Autowired(required = false)
    CourseSearchCache courseSearchCache;

    // Required, not optional. These two back the guards that stop a course being deleted while it
    // still has lessons or content. As @Autowired(required = false) with "if (repo != null)"
    // guards, a missing bean silently removed the protection entirely and let a delete orphan
    // every lesson and content row under a soft-deleted parent — a fail-open on a destructive
    // operation. If either bean genuinely cannot be injected the application should fail to start,
    // not quietly drop the safety check.
    @Autowired
    LessonContentsRepository lessonContentsRepository;

    @Autowired
    com._42students.lms.repository.LessonRepository lessonRepository;

    @Autowired
    com._42students.lms.repository.DepartmentRepository departmentRepository;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Course createCourse(CourseDTO courseDTO) {
        checkDuplicateCourse(courseDTO, null);

        Course course = new Course();
        setCourseFields(course, courseDTO);

        if (course.getSlug() == null || course.getSlug().trim().isEmpty()) {
            // Resolve collisions BEFORE the insert, never by catching one.
            //
            // This loop previously called save() inside the try and caught
            // DataIntegrityViolationException to retry with a fresh slug. That cannot work here:
            // the method is @Transactional, so a constraint violation marks the transaction
            // rollback-only and every subsequent save() in the same transaction fails too — the
            // "retry" could only ever surface as an UnexpectedRollbackException at commit. Probe
            // for a free slug first and save exactly once instead.
            String slug = null;
            for (int attempt = 0; attempt < SLUG_RETRY_ATTEMPTS; attempt++) {
                String candidate = slugGenerator.generateSlug();
                if (!slugGenerator.isValidSlug(candidate)) continue;
                if (!courseRepository.existsBySlug(candidate)) {
                    slug = candidate;
                    break;
                }
            }
            if (slug == null) {
                throw new RuntimeException("Failed to generate unique slug after " + SLUG_RETRY_ATTEMPTS + " attempts");
            }
            course.setSlug(slug);
            // A genuine race (two concurrent creates drawing the same random slug) still surfaces
            // as a constraint violation and rolls this transaction back, which is the correct
            // outcome — and is vanishingly rare given the slug is randomly generated.
            Course saved = courseRepository.save(course);
            refreshSearchCache();
            return saved;
        } else {
            if (!slugGenerator.isValidSlug(course.getSlug())) {
                throw new IllegalArgumentException("Invalid slug format");
            }
            if (courseRepository.existsBySlug(course.getSlug())) {
                throw new IllegalArgumentException("Slug already in use");
            }
            Course saved = courseRepository.save(course);
            refreshSearchCache();
            return saved;
        }
    }

    @Override
    public List<Course> fetchCourses(int deptId) {
        return courseRepository.fetchCourses(deptId);
    }

    @Override
    public List<Course> fetchByCollegeId(int collegeId) {
        return courseRepository.fetchByCollegeId(collegeId);
    }

    @Override
    public org.springframework.data.domain.Page<Course> fetchByCollegeIdPaged(int collegeId, org.springframework.data.domain.Pageable pageable) {
        return courseRepository.fetchByCollegeIdPaged(collegeId, pageable);
    }

    @Override
    public List<Course> fetchByOrganizationId(int orgId) {
        return courseRepository.fetchByOrganizationId(orgId);
    }

    @Override 
    public Course fetchCourse(int courseId) {
        return courseRepository.fetchCourse(courseId);
    }
    
    @Override
    public java.util.Optional<Course> fetchCourseBySlug(String slug) {
        return java.util.Optional.ofNullable(courseRepository.findBySlug(slug));
    }

    @Override
    public List<Course> findAll() {
        // Excludes soft-deleted courses. This backs the global super-admin listing, which
        // previously used the inherited findAll() and showed deleted courses as if live.
        return courseRepository.findAllNotDeleted();
    }

    @Override
    public org.springframework.data.domain.Page<Course> findAllPaged(org.springframework.data.domain.Pageable pageable) {
        return courseRepository.findAllNotDeletedPaged(pageable);
    }

    @Override
    public Optional<Course> findById(Integer id) {
        return courseRepository.findById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Course updateCourse(Integer id, CourseDTO courseDTO) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        checkDuplicateCourse(courseDTO, course);
        setCourseFields(course, courseDTO);
        Course saved = courseRepository.save(course);
        refreshSearchCache();
        return saved;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteCourse(Integer id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        // Guard: do not delete a course that has lesson content attached
        if (lessonContentsRepository.countByCourseId(id) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot delete course: it has lesson content. Remove all content first.");
        }
        // Guard: do not delete a course that still has lessons attached (even with no content),
        // otherwise those lessons are orphaned, pointing at a soft-deleted course.
        if (lessonRepository.countActiveByCourseId(id) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot delete course: it has lessons. Remove all lessons first.");
        }
        // Soft-delete: preserve all referencing records (progress, assignments, mappings)
        course.setIsDeleted(true);
        courseRepository.save(course);
        refreshSearchCache();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Course restoreCourse(Integer id, Integer collegeId) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        if (!Boolean.TRUE.equals(course.getIsDeleted())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Course is not deleted");
        }
        // Confirm the course actually belongs to the college the caller was authorized for —
        // findById above ignores is_deleted and therefore is not scope-restricted the way every
        // other lookup in this class is, so this check is what stands in for that.
        Integer courseCollegeId = departmentRepository.findById(course.getDeptId())
                .map(com._42students.lms.model.Department::getCollegeId)
                .orElse(null);
        if (collegeId == null || courseCollegeId == null || !collegeId.equals(courseCollegeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Course does not belong to the specified college");
        }
        course.setIsDeleted(false);
        Course saved = courseRepository.save(course);
        refreshSearchCache();
        return saved;
    }

    @Override
    public List<Course> fetchDeletedCourses(Integer collegeId) {
        if (collegeId == null) return List.of();
        return courseRepository.fetchDeletedByCollegeId(collegeId);
    }

    private void refreshSearchCache() {
        if (courseSearchCache != null) {
            try {
                courseSearchCache.refresh();
            } catch (Exception e) {
                // Cache refresh must not fail the course operation itself — but it must not be
                // silent either. This was previously an empty catch block, so a failed refresh
                // left deleted or renamed courses sitting in search results indefinitely with
                // nothing to indicate the cache had gone stale.
                log.warn("Course search cache refresh failed; search results may be stale until "
                        + "the next successful refresh: {}", e.getMessage(), e);
            }
        }
    }

    /**
     * Reject a create/update if another non-deleted course in the same department
     * already has the same course_name or short_title (case-insensitive).
     *
     * @param courseDTO      incoming payload
     * @param existingCourse the course being updated (null when creating)
     */
    private void checkDuplicateCourse(CourseDTO courseDTO, Course existingCourse) {
        int effectiveDeptId = courseDTO.getDeptId() != 0
                ? courseDTO.getDeptId()
                : (existingCourse != null ? existingCourse.getDeptId() : 0);

        String effectiveCourseName = courseDTO.getCourseName() != null
                ? courseDTO.getCourseName().trim()
                : (existingCourse != null ? existingCourse.getCourseName() : null);

        String effectiveShortTitle = courseDTO.getShortTitle() != null
                ? courseDTO.getShortTitle().trim()
                : (existingCourse != null ? existingCourse.getShortTitle() : null);

        if (effectiveDeptId <= 0 || (effectiveCourseName == null && effectiveShortTitle == null)) {
            return;
        }
        // Avoid NULL-safe LOWER() comparisons matching unrelated NULL columns
        String courseNameForCheck = effectiveCourseName != null ? effectiveCourseName : "";
        String shortTitleForCheck = effectiveShortTitle != null ? effectiveShortTitle : "";

        Integer existsFlag = existingCourse == null
                ? courseRepository.existsByDeptIdAndCourseNameOrShortTitle(effectiveDeptId, courseNameForCheck, shortTitleForCheck)
                : courseRepository.existsByDeptIdAndCourseNameOrShortTitleExcludingId(
                        effectiveDeptId, courseNameForCheck, shortTitleForCheck, existingCourse.getId());

        if (existsFlag != null && existsFlag.intValue() > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A course with this name or short title already exists in this department");
        }
    }

    /**
     * Copies every field that the incoming payload left null from the stored metaData, so an
     * update never wipes a value the caller simply didn't send.
     *
     * Reflection is used deliberately in preference to a hand-maintained getter/setter list: the
     * previous list covered 9 of MetaData's 14 fields and would have silently dropped any field
     * added afterwards. All MetaData fields are reference types, so a null check is meaningful
     * for every one of them.
     */
    private void mergeMissingMetaDataFields(com._42students.lms.dto.request.MetaData incoming,
                                            com._42students.lms.dto.request.MetaData existing) {
        if (incoming == null || existing == null) {
            return;
        }
        for (java.lang.reflect.Field field : com._42students.lms.dto.request.MetaData.class.getDeclaredFields()) {
            if (field.isSynthetic() || java.lang.reflect.Modifier.isStatic(field.getModifiers())) {
                continue;
            }
            try {
                field.setAccessible(true);
                if (field.get(incoming) == null) {
                    field.set(incoming, field.get(existing));
                }
            } catch (ReflectiveOperationException | RuntimeException e) {
                // A single inaccessible field must not fail the whole course update; the worst
                // case is that this one field falls back to the payload's (null) value, which is
                // the pre-existing behaviour rather than a regression.
                log.warn("Could not merge MetaData field '{}' during course update: {}",
                        field.getName(), e.getMessage());
            }
        }
    }

    private void setCourseFields(Course course, CourseDTO courseDTO) {
        if (courseDTO.getCourseName() != null) course.setCourseName(courseDTO.getCourseName().trim());
        // parentCourseId is boxed (Integer), unlike deptId below, specifically so "absent from
        // the payload" (null -- leave existing value alone) is distinguishable from "explicitly
        // sent as 0 or negative" (clear it to no-parent). A primitive here could only ever mean
        // the former: every update payload that doesn't set a parent would silently wipe an
        // existing one to 0, and there would be no way to clear a parent course once set,
        // separately from simply never sending the field.
        if (courseDTO.getParentCourseId() != null) {
            course.setParentCourseId(Math.max(courseDTO.getParentCourseId(), 0));
        }
        if (courseDTO.getActive() != null) course.setActive(courseDTO.getActive());
        if (courseDTO.getEnabled() != null) course.setEnabled(courseDTO.getEnabled());
        if (courseDTO.getCreatedByOrgId() != null) course.setCreatedByOrgId(courseDTO.getCreatedByOrgId());
        // deptId is primitive int, only update if non-zero
        if (courseDTO.getDeptId() != 0) course.setDeptId(courseDTO.getDeptId());
        if (courseDTO.getAllowedForDisplay() != null) course.setAllowedForDisplay(courseDTO.getAllowedForDisplay());
        if (courseDTO.getShortTitle() != null) course.setShortTitle(courseDTO.getShortTitle().trim());
        if (courseDTO.getMetaData() != null) {
            com._42students.lms.dto.request.MetaData metaData = courseDTO.getMetaData();
            if (metaData.getHtmlContent() != null) {
                metaData.setHtmlContent(Jsoup.clean(metaData.getHtmlContent(), Safelist.relaxed()));
            }
            if (metaData.getIntroduction_content() != null) {
                metaData.setIntroduction_content(Jsoup.clean(metaData.getIntroduction_content(), Safelist.relaxed()));
            }
            // 4.3/4.4: image_url/image_url_lp/thumbnail flow into <img src>/<a href> on the
            // course card with no server-side guard, and course_color flows into inline CSS.
            // Jsoup sanitisation above only covers the two rich-text fields; a javascript:/data:
            // URI here, or a CSS-injection payload in course_color, had nothing to stop it.
            requireSafeUrlOrBlank(metaData.getImageUrl(), "image_url");
            requireSafeUrlOrBlank(metaData.getImageUrlLp(), "image_url_lp");
            requireSafeUrlOrBlank(metaData.getThumbnail(), "thumbnail");
            requireSafeColorOrBlank(metaData.getCourseColor());
            // course.setMetaData(metaData) replaces the WHOLE meta_data JSON blob, so any field the
            // incoming payload didn't set would be wiped. (The admin edit form only ever sends
            // image_url/image_url_lp/course_code/introduction_content/html_content, which once
            // silently destroyed takeaways, courseType, courseColor, courseCategory,
            // courseStartDate/EndDate, thumbnail, amount and updatedOn on every single edit.)
            //
            // This merge used to be a hand-maintained list of nine getter/setter pairs, which was
            // correct only by coincidence: MetaData has fourteen fields, and any field added later
            // — or any client that sends a partial payload, such as the mobile app — would be
            // wiped again with nothing to catch it. Merge generically over the declared fields
            // instead, so "absent in the payload means keep what's stored" holds for every field,
            // including ones that don't exist yet.
            mergeMissingMetaDataFields(metaData, course.getMetaData());
            course.setMetaData(metaData);
        }
    }

    /**
     * Rejects a javascript:/data: (or any non-http(s)) URI. Blank/null passes — these fields are
     * optional. Used for image_url/image_url_lp/thumbnail, which flow into an &lt;img src&gt; or
     * &lt;a href&gt; on the course card with no other server-side guard.
     */
    private void requireSafeUrlOrBlank(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) return;
        String trimmed = value.trim();
        if (!trimmed.matches("(?i)^https?://.+")) {
            throw new IllegalArgumentException(fieldName + " must be a valid http(s) URL");
        }
    }

    /** Rejects anything that isn't a #rgb/#rrggbb hex colour. Blank/null passes. */
    private void requireSafeColorOrBlank(String value) {
        if (value == null || value.trim().isEmpty()) return;
        if (!value.trim().matches("^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")) {
            throw new IllegalArgumentException("course_color must be a hex colour like #1677ff");
        }
    }
}
 

