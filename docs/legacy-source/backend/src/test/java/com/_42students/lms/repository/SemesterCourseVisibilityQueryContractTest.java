package com._42students.lms.repository;

import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Query;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertTrue;

/** Structural contract only; MySQL-backed integration must independently verify query behavior. */
class SemesterCourseVisibilityQueryContractTest {

    @Test
    void listingAndLearnerCurriculumAccessBothExcludeSoftDeletedMappings() throws Exception {
        Method listing = SemesterCourseRepository.class.getMethod("findBySemesterIdOrderByCourseOrder", Integer.class);
        Method curriculum = SemesterCourseRepository.class.getMethod("existsByProgramIdAndCourseId", Integer.class, Integer.class);
        String listingQuery = listing.getAnnotation(Query.class).value();
        String curriculumQuery = curriculum.getAnnotation(Query.class).value();
        assertTrue(listingQuery.contains("sc.isDeleted = false") && listingQuery.contains("sc.isDeleted IS NULL"));
        assertTrue(curriculumQuery.contains("sc.isDeleted = false") && curriculumQuery.contains("sc.isDeleted IS NULL"));
        assertTrue(curriculumQuery.contains("s.isDeleted = false") && curriculumQuery.contains("s.isDeleted IS NULL"));
        assertTrue(listingQuery.contains("sc.id ASC"), "Stable order must break course-order ties by mapping ID");
    }
}
