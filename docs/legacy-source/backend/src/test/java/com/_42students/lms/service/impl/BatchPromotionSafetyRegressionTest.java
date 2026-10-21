package com._42students.lms.service.impl;

import com._42students.lms.enums.StatusType;
import com._42students.lms.model.Batch;
import com._42students.lms.model.FacultyTeachingAssignment;
import com._42students.lms.model.NewProgram;
import com._42students.lms.model.Semester;
import com._42students.lms.model.SemesterCourse;
import com._42students.lms.repository.BatchRepository;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.repository.NewProgramRepository;
import com._42students.lms.repository.SemesterCourseRepository;
import com._42students.lms.repository.SemesterRepository;
import com._42students.lms.service.FacultyTeachingAssignmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BatchPromotionSafetyRegressionTest {

    @Mock private BatchRepository batchRepository;
    @Mock private NewProgramRepository programRepository;
    @Mock private FacultyTeachingAssignmentService assignmentService;
    @Mock private SemesterRepository semesterRepository;
    @Mock private SemesterCourseRepository semesterCourseRepository;
    @Mock private FacultyTeachingAssignmentRepository assignmentRepository;

    private BatchServiceImpl service;
    private Batch batch;

    @BeforeEach
    void setUp() {
        service = new BatchServiceImpl(
                batchRepository, programRepository, assignmentService,
                semesterRepository, semesterCourseRepository, assignmentRepository);

        batch = new Batch();
        batch.setId(8L);
        batch.setBatchName("2026 Batch");
        batch.setProgramId(7L);
        batch.setCurrentSemester(2);
        batch.setAcademicYear("2026-27");
        batch.setStatus(StatusType.ACTIVE);
    }

    @Test
    void previewShowsAssignmentImpactAndAutomaticAcademicYearRollover() {
        stubValidPromotionContext();

        Map<String, Object> preview = service.previewPromotion(8L, 3);

        assertEquals(true, preview.get("valid"));
        assertEquals(2, preview.get("assignmentsToDeactivateCount"));
        assertEquals("2026-27", preview.get("currentAcademicYear"));
        assertEquals("2027-28", preview.get("suggestedAcademicYear"));
        assertEquals(40, preview.get("studentCount"));
        assertEquals(2, preview.get("classCount"));
    }

    @Test
    void promotionWithoutOverrideRollsAcademicYearForwardAtSemesterThree() {
        stubValidPromotionContext();
        when(batchRepository.updateCurrentSemesterIfMatch(any(), any(), any(), any())).thenAnswer(invocation -> {
            batch.setCurrentSemester(invocation.getArgument(2));
            return 1;
        });
        when(batchRepository.save(any(Batch.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.promoteBatch(8L, 3, null);

        assertEquals(3, batch.getCurrentSemester());
        assertEquals("2027-28", batch.getAcademicYear());
        verify(assignmentService).deactivateAssignmentsForBatchSemester(8, 2);
    }

    @Test
    void staleConfirmedTargetFailsInsteadOfAdvancingAgain() {
        batch.setCurrentSemester(3);
        when(batchRepository.findById(8L)).thenReturn(Optional.of(batch));
        when(programRepository.findById(7)).thenReturn(Optional.of(program(4)));
        when(batchRepository.findUsageCounts(anyList()))
                .thenReturn(List.<Object[]>of(new Object[]{8L, 2, 40}));

        Map<String, Object> preview = service.previewPromotion(8L, 3);

        assertFalse(Boolean.TRUE.equals(preview.get("valid")));
        assertTrue(String.valueOf(preview.get("message")).contains("next valid semester is 4"));
        assertThrows(IllegalArgumentException.class, () -> service.promoteBatch(8L, 3, null));
    }

    @Test
    void createRejectsNonConsecutiveAcademicYear() {
        com._42students.lms.dto.request.BatchRequestDTO dto =
                new com._42students.lms.dto.request.BatchRequestDTO();
        dto.setBatchName("Future");
        dto.setProgramId(7L);
        dto.setAcademicYear("2026-29");
        when(batchRepository.findByProgramIdAndBatchNameIgnoreCase(7L, "Future"))
                .thenReturn(List.of());

        assertThrows(IllegalArgumentException.class, () -> service.createBatch(dto));
    }

    private void stubValidPromotionContext() {
        when(batchRepository.findById(8L)).thenReturn(Optional.of(batch));
        when(programRepository.findById(7)).thenReturn(Optional.of(program(4)));

        Semester target = new Semester();
        target.setId(30);
        target.setProgramId(7);
        target.setSemesterNumber(3);
        target.setIsActive(true);
        when(semesterRepository.findFirstByProgramIdAndSemesterNumber(7, 3))
                .thenReturn(Optional.of(target));

        SemesterCourse mapping = new SemesterCourse();
        mapping.setId(90);
        mapping.setSemesterId(30);
        when(semesterCourseRepository.findBySemesterIdOrderByCourseOrder(30))
                .thenReturn(List.of(mapping));

        when(batchRepository.findUsageCounts(anyList()))
                .thenReturn(List.<Object[]>of(new Object[]{8L, 2, 40}));
        when(assignmentRepository.findByBatchIdAndSemesterNumberAndIsActive(8, 2, true))
                .thenReturn(List.of(new FacultyTeachingAssignment(), new FacultyTeachingAssignment()));
        when(assignmentRepository.findByBatchIdAndSemesterNumberAndIsActive(8, 3, true))
                .thenReturn(List.of(new FacultyTeachingAssignment()));
    }

    private NewProgram program(int years) {
        NewProgram program = new NewProgram();
        program.setId(7);
        program.setDurationYears(years);
        return program;
    }
}
