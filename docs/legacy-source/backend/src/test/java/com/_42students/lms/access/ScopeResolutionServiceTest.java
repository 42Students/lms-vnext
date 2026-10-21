package com._42students.lms.access;

import com._42students.lms.model.Batch;
import com._42students.lms.model.Department;
import com._42students.lms.model.Learner;
import com._42students.lms.model.NewProgram;
import com._42students.lms.model._Class;
import com._42students.lms.repository.BatchRepository;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.CourseRepository;
import com._42students.lms.repository.DepartmentRepository;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.NewProgramRepository;
import com._42students.lms.repository._ClassRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ScopeResolutionService covering plan Pass 2 edge cases:
 * Valid id → collegeId; invalid/not found → null; null id → null; orphaned data (e.g. dept deleted) → null.
 */
class ScopeResolutionServiceTest {

    private DepartmentRepository departmentRepository;
    private NewProgramRepository newProgramRepository;
    private _ClassRepository classRepository;
    private BatchRepository batchRepository;
    private LearnerRepository learnerRepository;
    private CourseRepository courseRepository;
    private FacultyRepository facultyRepository;
    private CollegeRepository collegeRepository;
    private ScopeResolutionService scopeResolutionService;

    @BeforeEach
    void setUp() {
        departmentRepository = mock(DepartmentRepository.class);
        newProgramRepository = mock(NewProgramRepository.class);
        classRepository = mock(_ClassRepository.class);
        batchRepository = mock(BatchRepository.class);
        learnerRepository = mock(LearnerRepository.class);
        courseRepository = mock(CourseRepository.class);
        facultyRepository = mock(FacultyRepository.class);
        collegeRepository = mock(CollegeRepository.class);
        scopeResolutionService = new ScopeResolutionService(
                departmentRepository,
                newProgramRepository,
                classRepository,
                batchRepository,
                learnerRepository,
                courseRepository,
                facultyRepository,
                collegeRepository
        );
    }

    @Test
    @DisplayName("resolveDepartmentToCollegeId - found returns collegeId")
    void resolveDepartment_found() {
        Department dept = new Department();
        dept.setId(1);
        dept.setCollegeId(10);
        when(departmentRepository.findByIdAndNotDeleted(1)).thenReturn(Optional.of(dept));

        assertEquals(10, scopeResolutionService.resolveDepartmentToCollegeId(1));
    }

    @Test
    @DisplayName("resolveDepartmentToCollegeId - not found returns null")
    void resolveDepartment_notFound() {
        when(departmentRepository.findByIdAndNotDeleted(999)).thenReturn(Optional.empty());
        assertNull(scopeResolutionService.resolveDepartmentToCollegeId(999));
    }

    @Test
    @DisplayName("resolveDepartmentToCollegeId - null deptId returns null")
    void resolveDepartment_nullId() {
        assertNull(scopeResolutionService.resolveDepartmentToCollegeId(null));
    }

    @Test
    @DisplayName("resolveProgramToCollegeId(Integer) - found via NewProgram and dept")
    void resolveProgramInteger_found() {
        NewProgram program = new NewProgram();
        program.setId(1);
        program.setDeptId(2);
        when(newProgramRepository.findByIdAndNotDeleted(1)).thenReturn(Optional.of(program));

        Department dept = new Department();
        dept.setId(2);
        dept.setCollegeId(20);
        when(departmentRepository.findByIdAndNotDeleted(2)).thenReturn(Optional.of(dept));

        assertEquals(20, scopeResolutionService.resolveProgramToCollegeId(1));
    }

    @Test
    @DisplayName("resolveProgramToCollegeId(Integer) - program not found returns null")
    void resolveProgramInteger_notFound() {
        when(newProgramRepository.findByIdAndNotDeleted(999)).thenReturn(Optional.empty());
        assertNull(scopeResolutionService.resolveProgramToCollegeId(999));
    }

    @Test
    @DisplayName("resolveProgramToCollegeId(Integer) - program found but dept missing (orphaned) returns null")
    void resolveProgramInteger_deptNotFound_returnsNull() {
        NewProgram program = new NewProgram();
        program.setId(1);
        program.setDeptId(999);
        when(newProgramRepository.findByIdAndNotDeleted(1)).thenReturn(Optional.of(program));
        when(departmentRepository.findByIdAndNotDeleted(999)).thenReturn(Optional.empty());
        assertNull(scopeResolutionService.resolveProgramToCollegeId(1));
    }

    @Test
    @DisplayName("resolveLearnerToCollegeId - found returns collegeId")
    void resolveLearner_found() {
        Learner learner = new Learner();
        learner.setId(1);
        learner.setCollegeId(30);
        when(learnerRepository.findByIdAndNotDeleted(1)).thenReturn(Optional.of(learner));

        assertEquals(30, scopeResolutionService.resolveLearnerToCollegeId(1));
    }

    @Test
    @DisplayName("resolveLearnerToCollegeId - not found returns null")
    void resolveLearner_notFound() {
        when(learnerRepository.findByIdAndNotDeleted(999)).thenReturn(Optional.empty());
        assertNull(scopeResolutionService.resolveLearnerToCollegeId(999));
    }

    @Test
    @DisplayName("resolveLearnerToCollegeId - null returns null")
    void resolveLearner_nullId() {
        assertNull(scopeResolutionService.resolveLearnerToCollegeId(null));
    }

    @Test
    @DisplayName("resolveClassToCollegeId - class not found returns null")
    void resolveClass_notFound() {
        when(classRepository.findByIdAndNotDeleted(999)).thenReturn(Optional.empty());
        assertNull(scopeResolutionService.resolveClassToCollegeId(999));
    }

    @Test
    @DisplayName("resolveClassToCollegeId - class found but program missing returns null")
    void resolveClass_programNotFound_returnsNull() {
        _Class clazz = new _Class();
        clazz.setId(1);
        clazz.setProgramId(999);
        when(classRepository.findByIdAndNotDeleted(1)).thenReturn(Optional.of(clazz));
        when(newProgramRepository.findByIdAndNotDeleted(999)).thenReturn(Optional.empty());
        assertNull(scopeResolutionService.resolveClassToCollegeId(1));
    }

    @Test
    @DisplayName("resolveClassToCollegeId - null classId returns null")
    void resolveClass_nullId() {
        assertNull(scopeResolutionService.resolveClassToCollegeId(null));
    }

    @Test
    @DisplayName("resolveClassToCollegeId - found via class -> program -> dept")
    void resolveClass_found() {
        _Class clazz = new _Class();
        clazz.setId(1);
        clazz.setProgramId(10);
        when(classRepository.findByIdAndNotDeleted(1)).thenReturn(Optional.of(clazz));

        NewProgram program = new NewProgram();
        program.setId(10);
        program.setDeptId(2);
        when(newProgramRepository.findByIdAndNotDeleted(10)).thenReturn(Optional.of(program));

        Department dept = new Department();
        dept.setId(2);
        dept.setCollegeId(40);
        when(departmentRepository.findByIdAndNotDeleted(2)).thenReturn(Optional.of(dept));

        assertEquals(40, scopeResolutionService.resolveClassToCollegeId(1));
    }

    @Test
    @DisplayName("resolveBatchToCollegeId - found via batch -> program (NewProgram)")
    void resolveBatch_found() {
        Batch batch = new Batch();
        batch.setId(1L);
        batch.setProgramId(5L);
        when(batchRepository.findById(1L)).thenReturn(Optional.of(batch));

        NewProgram program = new NewProgram();
        program.setId(5);
        program.setDeptId(3);
        when(newProgramRepository.findByIdAndNotDeleted(5)).thenReturn(Optional.of(program));

        Department dept = new Department();
        dept.setId(3);
        dept.setCollegeId(50);
        when(departmentRepository.findByIdAndNotDeleted(3)).thenReturn(Optional.of(dept));

        assertEquals(50, scopeResolutionService.resolveBatchToCollegeId(1L));
    }

    @Test
    @DisplayName("resolveBatchToCollegeId - not found returns null")
    void resolveBatch_notFound() {
        when(batchRepository.findById(999L)).thenReturn(Optional.empty());
        assertNull(scopeResolutionService.resolveBatchToCollegeId(999L));
    }

    @Test
    @DisplayName("resolveBatchToCollegeId - null batchId returns null")
    void resolveBatch_nullId() {
        assertNull(scopeResolutionService.resolveBatchToCollegeId(null));
    }

    @Test
    @DisplayName("resolveBatchToCollegeId - batch found but program missing returns null")
    void resolveBatch_programNotFound_returnsNull() {
        Batch batch = new Batch();
        batch.setId(1L);
        batch.setProgramId(999L);
        when(batchRepository.findById(1L)).thenReturn(Optional.of(batch));
        when(newProgramRepository.findByIdAndNotDeleted(999)).thenReturn(Optional.empty());
        assertNull(scopeResolutionService.resolveBatchToCollegeId(1L));
    }

    @Test
    @DisplayName("resolveProgramToCollegeId(Long) - program not found returns null")
    void resolveProgramLong_notFound() {
        when(newProgramRepository.findByIdAndNotDeleted(999)).thenReturn(Optional.empty());
        assertNull(scopeResolutionService.resolveProgramToCollegeId(999L));
    }

    @Test
    @DisplayName("resolveProgramToCollegeId(Long) - program found but dept missing returns null")
    void resolveProgramLong_deptNotFound_returnsNull() {
        NewProgram program = new NewProgram();
        program.setId(5);
        program.setDeptId(999);
        when(newProgramRepository.findByIdAndNotDeleted(5)).thenReturn(Optional.of(program));
        when(departmentRepository.findByIdAndNotDeleted(999)).thenReturn(Optional.empty());
        assertNull(scopeResolutionService.resolveProgramToCollegeId(5L));
    }
}
