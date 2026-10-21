package com._42students.lms.service.impl;

import com._42students.lms.dto.request.BatchRequestDTO;
import com._42students.lms.dto.response.BatchResponseDTO;
import com._42students.lms.enums.StatusType;
import com._42students.lms.model.Batch;
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
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BatchServiceIntegrityTest {

    @Mock BatchRepository batchRepository;
    @Mock NewProgramRepository newProgramRepository;
    @Mock FacultyTeachingAssignmentService facultyTeachingAssignmentService;
    @Mock SemesterRepository semesterRepository;
    @Mock SemesterCourseRepository semesterCourseRepository;
    @Mock FacultyTeachingAssignmentRepository facultyTeachingAssignmentRepository;

    private BatchServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new BatchServiceImpl(
                batchRepository,
                newProgramRepository,
                facultyTeachingAssignmentService,
                semesterRepository,
                semesterCourseRepository,
                facultyTeachingAssignmentRepository);
    }

    @Test
    void createIgnoresClientStudentCountAndReturnsAuthoritativeUsage() {
        BatchRequestDTO dto = new BatchRequestDTO();
        dto.setBatchName("2026 CSE");
        dto.setProgramId(7L);
        dto.setCurrentStudents(999999);
        dto.setStatus(StatusType.ACTIVE);

        NewProgram program = program(7, "B.Tech CSE", 4);
        when(batchRepository.findByProgramIdAndBatchNameIgnoreCase(7L, "2026 CSE"))
                .thenReturn(List.of());
        when(batchRepository.save(any(Batch.class))).thenAnswer(invocation -> {
            Batch batch = invocation.getArgument(0);
            batch.setId(41L);
            return batch;
        });
        when(newProgramRepository.findById(7)).thenReturn(Optional.of(program));
        when(batchRepository.findUsageCounts(anyList()))
                .thenReturn(List.<Object[]>of(new Object[] { 41L, 2L, 37L }));

        BatchResponseDTO response = service.createBatch(dto);

        ArgumentCaptor<Batch> saved = ArgumentCaptor.forClass(Batch.class);
        verify(batchRepository).save(saved.capture());
        assertEquals(0, saved.getValue().getCurrentStudents());
        assertEquals(37, response.getCurrentStudents());
        assertEquals(2, response.getClassCount());
    }

    @Test
    void updateRejectsChangingOwningProgram() {
        Batch existing = batch(41L, 7L, 1);
        when(batchRepository.findById(41L)).thenReturn(Optional.of(existing));

        BatchRequestDTO dto = new BatchRequestDTO();
        dto.setBatchName("2026 CSE");
        dto.setProgramId(8L);
        dto.setStatus(StatusType.ACTIVE);

        assertThrows(IllegalArgumentException.class, () -> service.updateBatch(41L, dto));
        verify(batchRepository, never()).save(any(Batch.class));
    }

    @Test
    void promotionCannotSkipSemesters() {
        Batch batch = batch(41L, 7L, 1);
        when(batchRepository.findById(41L)).thenReturn(Optional.of(batch));

        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> service.promoteBatch(41L, 3, null));

        assertEquals(
                "Batch Promotion advances exactly one semester at a time. Current semester is 1; the next valid semester is 2.",
                error.getMessage());
        verify(facultyTeachingAssignmentService, never())
                .deactivateAssignmentsForBatchSemester(any(), any());
    }

    @Test
    void promotionRequiresConfiguredTargetSemesterCurriculum() {
        Batch batch = batch(41L, 7L, 1);
        NewProgram program = program(7, "B.Tech CSE", 4);
        when(batchRepository.findById(41L)).thenReturn(Optional.of(batch));
        when(newProgramRepository.findById(7)).thenReturn(Optional.of(program));
        when(semesterRepository.findFirstByProgramIdAndSemesterNumber(7, 2))
                .thenReturn(Optional.empty());

        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> service.promoteBatch(41L, null, null));

        assertEquals(
                "Cannot promote: Semester 2 is not configured as an active semester for this program.",
                error.getMessage());
        verify(facultyTeachingAssignmentService, never())
                .deactivateAssignmentsForBatchSemester(any(), any());
    }

    @Test
    void directSemesterCorrectionIsDisabledRatherThanReactivatingAssignmentsBroadly() {
        Batch batch = batch(41L, 7L, 2);
        when(batchRepository.findById(41L)).thenReturn(Optional.of(batch));

        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> service.updateCurrentSemester(41L, 1));

        assertEquals(
                "Direct semester correction is disabled because it cannot safely restore teaching assignments. "
                        + "Use Batch Promotion for forward movement.",
                error.getMessage());
        verify(facultyTeachingAssignmentService, never())
                .reactivateAssignmentsForBatchSemester(any(), any());
        verify(facultyTeachingAssignmentService, never())
                .deactivateAssignmentsForBatchSemester(any(), any());
    }

    @Test
    void validPromotionUsesCurriculumCheckAndOptimisticSemesterUpdate() {
        Batch before = batch(41L, 7L, 1);
        Batch after = batch(41L, 7L, 2);
        NewProgram program = program(7, "B.Tech CSE", 4);
        Semester semester = new Semester();
        semester.setId(22);
        semester.setProgramId(7);
        semester.setSemesterNumber(2);
        semester.setName("Semester 2");
        semester.setIsActive(true);
        SemesterCourse mapping = new SemesterCourse(22, 501);

        when(batchRepository.findById(41L)).thenReturn(Optional.of(before), Optional.of(after));
        when(newProgramRepository.findById(7)).thenReturn(Optional.of(program));
        when(semesterRepository.findFirstByProgramIdAndSemesterNumber(7, 2))
                .thenReturn(Optional.of(semester));
        when(semesterCourseRepository.findBySemesterIdOrderByCourseOrder(22))
                .thenReturn(List.of(mapping));
        // validatePromotion also counts the assignments the promotion will deactivate (current
        // semester), not just the next semester's staffing - strict stubs need both calls.
        when(facultyTeachingAssignmentRepository
                .findByBatchIdAndSemesterNumberAndIsActive(41, 1, true))
                .thenReturn(List.of());
        when(facultyTeachingAssignmentRepository
                .findByBatchIdAndSemesterNumberAndIsActive(41, 2, true))
                .thenReturn(List.of());
        when(batchRepository.updateCurrentSemesterIfMatch(
                org.mockito.ArgumentMatchers.eq(41L),
                org.mockito.ArgumentMatchers.eq(1),
                org.mockito.ArgumentMatchers.eq(2),
                any(java.util.Date.class))).thenReturn(1);
        when(batchRepository.save(any(Batch.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(batchRepository.findUsageCounts(anyList()))
                .thenReturn(List.<Object[]>of(new Object[] { 41L, 3L, 42L }));

        BatchResponseDTO response = service.promoteBatch(41L, null, "2026-27");

        verify(facultyTeachingAssignmentService)
                .deactivateAssignmentsForBatchSemester(41, 1);
        verify(batchRepository).updateCurrentSemesterIfMatch(
                org.mockito.ArgumentMatchers.eq(41L),
                org.mockito.ArgumentMatchers.eq(1),
                org.mockito.ArgumentMatchers.eq(2),
                any(java.util.Date.class));
        assertEquals(2, response.getCurrentSemester());
        assertEquals(42, response.getCurrentStudents());
        assertEquals(3, response.getClassCount());
    }

    private Batch batch(Long id, Long programId, int semester) {
        Batch batch = new Batch();
        batch.setId(id);
        batch.setBatchName("2026 CSE");
        batch.setProgramId(programId);
        batch.setCurrentSemester(semester);
        batch.setStatus(StatusType.ACTIVE);
        return batch;
    }

    private NewProgram program(int id, String name, int durationYears) {
        NewProgram program = new NewProgram();
        program.setId(id);
        program.setName(name);
        program.setDurationYears(durationYears);
        return program;
    }
}
