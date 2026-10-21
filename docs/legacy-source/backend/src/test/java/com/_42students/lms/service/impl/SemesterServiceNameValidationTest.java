package com._42students.lms.service.impl;

import com._42students.lms.dto.request.SemesterDTO;
import com._42students.lms.repository.CourseRepository;
import com._42students.lms.repository.NewProgramRepository;
import com._42students.lms.repository.SemesterCourseRepository;
import com._42students.lms.repository.SemesterRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SemesterServiceNameValidationTest {

    @Mock
    private SemesterRepository semesterRepository;
    @Mock
    private SemesterCourseRepository semesterCourseRepository;
    @Mock
    private NewProgramRepository newProgramRepository;
    @Mock
    private CourseRepository courseRepository;

    private SemesterServiceImpl semesterService;

    @BeforeEach
    void setUp() {
        semesterService = new SemesterServiceImpl(
                semesterRepository,
                semesterCourseRepository,
                newProgramRepository,
                courseRepository);
    }

    @Test
    void createSemesterRejectsBlankNameInsteadOfGeneratingOne() {
        SemesterDTO dto = new SemesterDTO();
        dto.setProgramId(11);
        dto.setSemesterNumber(3);
        dto.setName("   ");

        when(semesterRepository.existsByProgramIdAndSemesterNumber(11, 3)).thenReturn(false);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> semesterService.createSemester(dto));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
        assertEquals("Semester name is required", error.getReason());
        verify(semesterRepository, never()).save(any());
    }

    @Test
    void createSemesterTrimsAndPersistsExplicitName() {
        SemesterDTO dto = new SemesterDTO();
        dto.setProgramId(11);
        dto.setSemesterNumber(3);
        dto.setName("  Third Semester  ");

        when(semesterRepository.existsByProgramIdAndSemesterNumber(11, 3)).thenReturn(false);
        when(semesterRepository.save(any())).thenAnswer(invocation -> {
            com._42students.lms.model.Semester semester = invocation.getArgument(0);
            semester.setId(101);
            return semester;
        });
        when(semesterCourseRepository.findBySemesterIdOrderByCourseOrder(101)).thenReturn(java.util.List.of());
        when(newProgramRepository.findById(11)).thenReturn(java.util.Optional.empty());

        semesterService.createSemester(dto);

        verify(semesterRepository).save(org.mockito.ArgumentMatchers.argThat(
                semester -> "Third Semester".equals(semester.getName())));
    }
}
