package com._42students.lms.repository;

import com._42students.lms.model.FacultyTeachingAssignment;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;

import java.lang.reflect.Method;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Structural and delegation tests; actual MySQL deletion behavior remains a separate integration gate. */
class FacultyActiveAssignmentVisibilityContractTest {

    @Test
    void everyActiveListAndTeachingPermissionQueryExcludesSoftDeletedRows() throws Exception {
        for (Method method : FacultyTeachingAssignmentRepository.class.getMethods()) {
            String name = method.getName();
            if (!(name.equals("findByFacultyIdAndIsActive")
                    || name.equals("findByClassIdAndIsActive")
                    || name.equals("findByClassIdAndSemesterNumberAndIsActive")
                    || name.equals("findByBatchIdAndIsActive")
                    || name.equals("findByBatchIdAndSemesterNumberAndIsActive")
                    || name.equals("findByCourseIdAndIsActive")
                    || name.equals("findByIsActive")
                    || name.equals("findEligibleCourseClassAssignments")
                    || name.equals("existsByFacultyIdAndCourseIdAndClassIdAndIsActive")
                    || name.equals("existsByFacultyIdAndCourseIdAndIsActive")
                    || name.equals("existsByFacultyIdAndCourseIdAndClassIdAndSemesterNumberAndIsActive"))) continue;
            Query query = method.getAnnotation(Query.class);
            assertNotNull(query, "Missing scoped query on " + name);
            assertTrue(query.value().contains("f.isDeleted = false")
                            && query.value().contains("f.isDeleted IS NULL"),
                    "Soft-deleted assignment still eligible in " + name);
        }
    }

    @Test
    void firstAssignmentUsesSingleItemDatabasePageDespiteMultipleCoTeachers() {
        FacultyTeachingAssignmentRepository repository = mock(
                FacultyTeachingAssignmentRepository.class, CALLS_REAL_METHODS);
        FacultyTeachingAssignment one = new FacultyTeachingAssignment();
        one.setId(14);
        FacultyTeachingAssignment two = new FacultyTeachingAssignment();
        two.setId(15);
        doReturn(List.of(one, two)).when(repository)
                .findEligibleCourseClassAssignments(eq(5), eq(7), eq(true), any(Pageable.class));
        assertEquals(14, repository.findFirstByCourseIdAndClassIdAndIsActive(5, 7, true)
                .orElseThrow().getId());
        verify(repository).findEligibleCourseClassAssignments(eq(5), eq(7), eq(true),
                argThat(page -> page.getPageNumber() == 0 && page.getPageSize() == 1));
    }
}
