package com._42students.lms.service.impl;

import com._42students.lms.dto.response.StudentCoursesResponseDTO;
import com._42students.lms.model.Batch;
import com._42students.lms.model.Course;
import com._42students.lms.model.NewProgram;
import com._42students.lms.model.Semester;
import com._42students.lms.model.SemesterCourse;
import com._42students.lms.model._Class;
import com._42students.lms.repository.BatchRepository;
import com._42students.lms.repository.CourseRepository;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.NewProgramRepository;
import com._42students.lms.repository.SemesterCourseRepository;
import com._42students.lms.repository.SemesterRepository;
import com._42students.lms.repository._ClassRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/** Learner course visibility; null means legacy visible, explicit 0 means hidden. */
@ExtendWith(MockitoExtension.class)
@DisplayName("Learner course list — allowedForDisplay")
class StudentCourseVisibilityTest {
    @Mock private LearnerRepository learnerRepository;
    @Mock private _ClassRepository classRepository;
    @Mock private BatchRepository batchRepository;
    @Mock private NewProgramRepository programRepository;
    @Mock private SemesterRepository semesterRepository;
    @Mock private SemesterCourseRepository semesterCourseRepository;
    @Mock private CourseRepository courseRepository;
    @Mock private FacultyTeachingAssignmentRepository assignmentRepository;
    @Mock private FacultyRepository facultyRepository;
    @InjectMocks private StudentCourseServiceImpl service;

    private static final int CLASS_ID = 10;

    @BeforeEach
    void setUpHierarchy() {
        _Class cls = new _Class();
        cls.setId(CLASS_ID);
        cls.setName("CSE-A");
        cls.setBatchId(20);
        Batch batch = new Batch();
        batch.setId(20L);
        batch.setBatchName("2026");
        batch.setProgramId(30L);
        batch.setCurrentSemester(1);
        NewProgram program = new NewProgram();
        program.setId(30);
        program.setName("B.Tech CSE");
        Semester semester = new Semester();
        semester.setId(40);
        semester.setSemesterNumber(1);
        semester.setName("Semester 1");
        semester.setProgramId(30);
        lenient().when(classRepository.findById(CLASS_ID)).thenReturn(Optional.of(cls));
        lenient().when(batchRepository.findById(20L)).thenReturn(Optional.of(batch));
        lenient().when(programRepository.findById(30)).thenReturn(Optional.of(program));
        lenient().when(semesterRepository.findFirstByProgramIdAndSemesterNumber(30, 1))
            .thenReturn(Optional.of(semester));
    }

    private StudentCoursesResponseDTO listWithSecondCourseVisibility(Integer allowedForDisplay) {
        SemesterCourse sc1 = new SemesterCourse();
        sc1.setSemesterId(40);
        sc1.setCourseId(101);
        SemesterCourse sc2 = new SemesterCourse();
        sc2.setSemesterId(40);
        sc2.setCourseId(102);
        when(semesterCourseRepository.findBySemesterIdOrderByCourseOrder(40)).thenReturn(List.of(sc1, sc2));
        Course visible = new Course();
        visible.setId(101);
        visible.setCourseName("Always Visible");
        visible.setSlug("always-visible");
        Course subject = new Course();
        subject.setId(102);
        subject.setCourseName("Subject Course");
        subject.setSlug("subject-course");
        subject.setAllowedForDisplay(allowedForDisplay);
        // The service now makes one bulk query; stubbing findById masked valid cards as absent.
        when(courseRepository.findAllById(any())).thenReturn(List.of(visible, subject));
        return service.getCoursesByClass(CLASS_ID);
    }

    private List<String> names(StudentCoursesResponseDTO response) {
        return response.getCourses().stream()
            .map(StudentCoursesResponseDTO.CourseWithFacultyDTO::getCourseName).toList();
    }

    @Test
    @DisplayName("a course explicitly hidden (0) is left out of the learner's list")
    void hiddenCourseIsExcluded() {
        assertEquals(List.of("Always Visible"), names(listWithSecondCourseVisibility(0)));
    }

    @Test
    @DisplayName("a course explicitly visible (1) is shown")
    void visibleCourseIsIncluded() {
        StudentCoursesResponseDTO response = listWithSecondCourseVisibility(1);
        assertTrue(names(response).contains("Subject Course"));
        assertEquals(2, response.getCourses().size());
    }

    @Test
    @DisplayName("a course that predates the control (null) keeps showing — the deploy-safety case")
    void nullVisibilityStillShows() {
        StudentCoursesResponseDTO response = listWithSecondCourseVisibility(null);
        assertTrue(names(response).contains("Subject Course"),
            "null must mean 'never configured', not 'hidden' — otherwise every existing course vanishes");
        assertEquals(2, response.getCourses().size());
    }

    @Test
    @DisplayName("an unexpected value is treated as visible, not hidden")
    void unexpectedValueStillShows() {
        assertTrue(names(listWithSecondCourseVisibility(7)).contains("Subject Course"));
    }
}
