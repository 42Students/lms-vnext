package com._42students.lms.service.impl;

import com._42students.lms.dto.request.DepartmentDTO;
import com._42students.lms.model.Faculty;
import com._42students.lms.repository.CourseRepository;
import com._42students.lms.repository.DepartmentRepository;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.NewProgramRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DepartmentServiceLeadershipValidationTest {

    @Mock
    private DepartmentRepository departmentRepository;
    @Mock
    private NewProgramRepository newProgramRepository;
    @Mock
    private FacultyRepository facultyRepository;
    @Mock
    private CourseRepository courseRepository;

    private DepartmentServiceImpl departmentService;

    @BeforeEach
    void setUp() {
        departmentService = new DepartmentServiceImpl();
        org.springframework.test.util.ReflectionTestUtils.setField(departmentService, "departmentRepository", departmentRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(departmentService, "newProgramRepository", newProgramRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(departmentService, "facultyRepository", facultyRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(departmentService, "courseRepository", courseRepository);
    }

    @Test
    void createRejectsChairFromAnotherCollege() {
        DepartmentDTO dto = baseDto();
        dto.setDeptChairId(77);

        Faculty foreignFaculty = new Faculty();
        foreignFaculty.setId(77);
        foreignFaculty.setCollegeId(99);

        when(departmentRepository.findByExactName(12, "Computer Science")).thenReturn(List.of());
        when(facultyRepository.findByIdAndNotDeleted(77)).thenReturn(Optional.of(foreignFaculty));

        assertThrows(IllegalArgumentException.class, () -> departmentService.createDepartment(dto));

        verify(departmentRepository, never()).save(any());
    }

    @Test
    void createAllowsNoLeadershipAssignment() {
        DepartmentDTO dto = baseDto();
        when(departmentRepository.findByExactName(12, "Computer Science")).thenReturn(List.of());
        when(departmentRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        departmentService.createDepartment(dto);

        verify(facultyRepository, never()).findByIdAndNotDeleted(any());
        verify(departmentRepository).save(any());
    }

    private DepartmentDTO baseDto() {
        DepartmentDTO dto = new DepartmentDTO();
        dto.setName("Computer Science");
        dto.setCollegeId(12);
        return dto;
    }
}
