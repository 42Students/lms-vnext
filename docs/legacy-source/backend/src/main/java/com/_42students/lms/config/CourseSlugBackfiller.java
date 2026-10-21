package com._42students.lms.config;

import com._42students.lms.model.Course;
import com._42students.lms.repository.CourseRepository;
import com._42students.lms.util.CourseSlugGenerator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.PostConstruct;
import java.util.List;

/**
 * Backfills slugs for existing courses that have slug IS NULL.
 * Runs once on application startup. Transactional with per-row retry on slug collision.
 */
@Component
@Slf4j
public class CourseSlugBackfiller {

    private static final int PER_ROW_RETRIES = 15;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CourseSlugGenerator slugGenerator;

    @PostConstruct
    @Transactional(rollbackFor = Exception.class)
    public void backfillCourseSlugs() {
        List<Course> coursesWithoutSlugs = courseRepository.findBySlugIsNull();
        if (coursesWithoutSlugs.isEmpty()) {
            return;
        }
        int saved = 0;
        for (Course course : coursesWithoutSlugs) {
            for (int attempt = 0; attempt < PER_ROW_RETRIES; attempt++) {
                String slug = slugGenerator.generateSlug();
                if (!slugGenerator.isValidSlug(slug)) continue;
                if (courseRepository.existsBySlug(slug)) continue;
                course.setSlug(slug);
                try {
                    courseRepository.save(course);
                    saved++;
                    break;
                } catch (DataIntegrityViolationException e) {
                    if (attempt == PER_ROW_RETRIES - 1) {
                        log.warn("Could not backfill slug for course id {} after {} attempts", course.getId(), PER_ROW_RETRIES);
                        throw e;
                    }
                }
            }
        }
        log.info("Backfilled slugs for {} courses", saved);
    }
}

