package com._42students.lms.service;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.AssignmentResourceDTO;
import com._42students.lms.dto.request.ContentDataDTO;
import com._42students.lms.dto.request.FileDTO;
import com._42students.lms.dto.request.LessonContentsDTO;
import com._42students.lms.enums.ContentType;
import com._42students.lms.model.Lesson;
import com._42students.lms.model.LessonContents;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.repository.LessonContentsRepository;
import com._42students.lms.repository.SemesterCourseRepository;
import com._42students.lms.repository.StudentAssignmentRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import com._42students.lms.utils.ContentUrlValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AssignmentContentWriteServiceTest {
    private LessonContentsRepository contents;
    private FacultyTeachingAssignmentRepository teaching;
    private SecurityContextUtil security;
    private AccessControlService access;
    private ScopeResolutionService scopes;
    private SemesterCourseRepository semesterCourses;
    private StudentAssignmentRepository studentAssignments;
    private AssignmentContentWriteService writer;
    private LessonContentsDTO dto;

    @BeforeEach
    void init() {
        contents = mock(LessonContentsRepository.class);
        LessonService lessons = mock(LessonService.class);
        access = mock(AccessControlService.class);
        scopes = mock(ScopeResolutionService.class);
        teaching = mock(FacultyTeachingAssignmentRepository.class);
        semesterCourses = mock(SemesterCourseRepository.class);
        security = mock(SecurityContextUtil.class);
        studentAssignments = mock(StudentAssignmentRepository.class);
        writer = new AssignmentContentWriteService(contents, lessons, access, scopes, teaching,
                semesterCourses, security, mock(ContentUrlValidator.class));
        ReflectionTestUtils.setField(writer, "studentAssignments", studentAssignments);
        Lesson lesson = mock(Lesson.class);
        when(lesson.getCourseId()).thenReturn(5);
        when(lessons.fetchCourseId(7)).thenReturn(lesson);
        when(scopes.resolveCourseToCollegeId(5)).thenReturn(9);
        when(scopes.resolveClassToCollegeId(12)).thenReturn(9);
        when(scopes.resolveClassToProgramId(12)).thenReturn(4);
        when(semesterCourses.existsByProgramIdAndCourseId(4, 5)).thenReturn(true);
        when(scopes.resolveCollegeToOrganizationId(9)).thenReturn(2);
        when(access.canAccessCollege(any(), eq(9))).thenReturn(true);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(
                new UserPrincipal(31, "FACULTY", "TEACHER", 2, 9, 0));
        when(teaching.existsByFacultyIdAndCourseIdAndClassIdAndIsActive(31, 5, 12, true))
                .thenReturn(true);
        when(contents.save(any(LessonContents.class))).thenAnswer(a -> a.getArgument(0));
        dto = new LessonContentsDTO();
        dto.setLessonId(7);
        dto.setCourseId(5);
        dto.setClassId(12);
        dto.setContentType(ContentType.ASSIGNMENT);
        dto.setContentTitle("Week one");
        dto.setPoints(10);
        dto.setDeadline(java.time.LocalDateTime.now().plusDays(1));
        AssignmentResourceDTO instructions = new AssignmentResourceDTO();
        instructions.setId("instructions");
        instructions.setType("INSTRUCTIONS");
        instructions.setTitle("Instructions");
        instructions.setText("<p>Complete the exercise</p>");
        ContentDataDTO data = new ContentDataDTO();
        data.setAssignmentResources(List.of(instructions));
        data.setAllowedSubmissionTypes(List.of("WRITTEN_RESPONSE"));
        dto.setContentDataDTO(data);
    }

    @Test
    void newAssignmentWithoutDeadlineIsRejected() {
        dto.setDeadline(null);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> writer.save(dto));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Assignment due date is required", ex.getReason());
        verify(contents, never()).save(any());
    }

    @Test
    void newAssignmentWithPastDeadlineIsRejected() {
        dto.setDeadline(java.time.LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")).minusMinutes(1));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> writer.save(dto));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Assignment due date must be in the future", ex.getReason());
        verify(contents, never()).save(any());
    }

    @Test
    void assignmentDeadlineCannotBeCleared() {
        dto.setLessonContentId(44);
        dto.setClearDeadline(true);
        LessonContents previous = new LessonContents();
        previous.setId(44);
        previous.setContentType("assignment");
        previous.setCourseId(5);
        previous.setLessonId(7);
        previous.setClassId(12);
        previous.setPoints(10);
        previous.setDeadline(java.time.LocalDateTime.now().plusDays(2));
        previous.setContentDataDTO(dto.getContentDataDTO());
        when(contents.findById(44)).thenReturn(Optional.of(previous));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> writer.save(dto));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Assignment due date cannot be cleared", ex.getReason());
    }

    @Test
    void teacherAssignedToExactCourseAndClassCanCreate() {
        LessonContents result = writer.save(dto);
        assertEquals("assignment", result.getContentType());
        assertEquals(31, result.getFacultyId());
        assertEquals(12, result.getClassId());
        assertEquals(10, result.getPoints());
        verify(contents).save(any(LessonContents.class));
        verify(access).requireCurrentCourseAudienceClass(12, 5);
    }

    @Test
    void teacherWithoutClassAssignmentCannotCreate() {
        when(teaching.existsByFacultyIdAndCourseIdAndClassIdAndIsActive(31, 5, 12, true))
                .thenReturn(false);
        assertEquals(403, assertThrows(ResponseStatusException.class, () -> writer.save(dto)).getRawStatusCode());
        verify(contents, never()).save(any());
    }

    @Test
    void tenantBoundaryBlocksAdminEvenWhenCourseAccessCheckIsMocked() {
        when(security.getAuthenticatedUserPrincipal()).thenReturn(
                new UserPrincipal(18, "FACULTY", "ADMIN", 2, 8, 0));
        when(access.canAccessCollege(any(), eq(9))).thenReturn(false);
        assertEquals(403, assertThrows(ResponseStatusException.class, () -> writer.save(dto)).getRawStatusCode());
        verify(contents, never()).save(any());
    }

    @Test
    void classFromAnotherCollegeIsRejectedEvenForAdmin() {
        when(security.getAuthenticatedUserPrincipal()).thenReturn(
                new UserPrincipal(18, "FACULTY", "ADMIN", 2, 9, 0));
        when(scopes.resolveClassToCollegeId(12)).thenReturn(99);
        assertEquals(400, assertThrows(ResponseStatusException.class, () -> writer.save(dto)).getRawStatusCode());
        verify(contents, never()).save(any());
    }

    @Test
    void classOutsideCurrentCourseAudienceIsRejectedEvenForAdmin() {
        when(security.getAuthenticatedUserPrincipal()).thenReturn(
                new UserPrincipal(18, "FACULTY", "ADMIN", 2, 9, 0));
        doThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "not current"))
                .when(access).requireCurrentCourseAudienceClass(12, 5);
        assertEquals(400, assertThrows(ResponseStatusException.class, () -> writer.save(dto)).getRawStatusCode());
        verify(contents, never()).save(any());
    }

    @Test
    void attachmentFromDifferentCollegeIsRejected() {
        when(security.getAuthenticatedUserPrincipal()).thenReturn(
                new UserPrincipal(18, "FACULTY", "ADMIN", 2, 9, 0));
        AssignmentResourceDTO file = new AssignmentResourceDTO();
        file.setId("file-1");
        file.setType("FILE");
        file.setTitle("Wrong college");
        FileDTO fileDTO = new FileDTO();
        fileDTO.setCloudStorageObject("org-2/college-99/assignments/secret.pdf");
        fileDTO.setOriginalName("secret.pdf");
        file.setFileDTO(fileDTO);
        dto.getContentDataDTO().setAssignmentResources(List.of(file));
        assertEquals(403, assertThrows(ResponseStatusException.class, () -> writer.save(dto)).getRawStatusCode());
        verify(contents, never()).save(any());
    }

    @Test
    void emptyResourcesAreRejected() {
        dto.getContentDataDTO().setAssignmentResources(List.of());
        assertEquals(400, assertThrows(ResponseStatusException.class, () -> writer.save(dto)).getRawStatusCode());
    }

    @Test
    void superadminCreatesWithoutInventingFacultyId() {
        when(security.getAuthenticatedUserPrincipal()).thenReturn(UserPrincipal.forSuperAdminScoped(2, 9));
        when(access.isSuperAdmin(any())).thenReturn(true);
        LessonContents result = writer.save(dto);
        assertNull(result.getFacultyId());
    }

    @Test
    void updateCannotMoveExistingAssignmentAcrossLessons() {
        dto.setLessonContentId(44);
        LessonContents previous = new LessonContents();
        previous.setContentType("assignment");
        previous.setCourseId(5);
        previous.setLessonId(99);
        previous.setClassId(12);
        when(contents.findById(44)).thenReturn(Optional.of(previous));
        assertEquals(400, assertThrows(ResponseStatusException.class, () -> writer.save(dto)).getRawStatusCode());
        verify(contents, never()).save(any());
    }

    @Test
    void existingAssignmentEditFailsClosedWhenSubmissionStateCannotBeVerified() {
        dto.setLessonContentId(44);
        LessonContents previous = new LessonContents();
        previous.setId(44);
        previous.setContentType("assignment");
        previous.setCourseId(5);
        previous.setLessonId(7);
        previous.setClassId(12);
        previous.setPoints(10);
        previous.setDeadline(java.time.LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")).plusDays(1));
        previous.setContentDataDTO(dto.getContentDataDTO());
        dto.setDeadline(previous.getDeadline());
        when(contents.findById(44)).thenReturn(Optional.of(previous));
        ReflectionTestUtils.setField(writer, "studentAssignments", null);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> writer.save(dto));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, ex.getStatus());
        verify(contents, never()).save(any());
    }

    @Test
    void assignmentDeadlineCannotChangeAfterLearnerSubmission() {
        dto.setLessonContentId(44);
        LessonContents previous = new LessonContents();
        previous.setId(44);
        previous.setContentType("assignment");
        previous.setCourseId(5);
        previous.setLessonId(7);
        previous.setClassId(12);
        previous.setPoints(10);
        previous.setDeadline(java.time.LocalDateTime.of(2026, 10, 7, 10, 0));
        previous.setContentDataDTO(dto.getContentDataDTO());
        dto.setDeadline(java.time.LocalDateTime.of(2026, 10, 8, 10, 0));
        when(contents.findById(44)).thenReturn(Optional.of(previous));
        when(studentAssignments.countActiveByLessonContentId(44)).thenReturn(1L);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> writer.save(dto));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("Assignment deadline cannot be changed after learner submissions exist", ex.getReason());
        verify(contents, never()).save(any());
    }

    @Test
    void assignmentWithSubmissionCannotBeSoftDisabled() {
        dto.setLessonContentId(44);
        dto.setEnabled(false);
        dto.setClassId(null);
        dto.getContentDataDTO().setAssignmentResources(null);
        LessonContents previous = new LessonContents();
        previous.setId(44);
        previous.setContentType("assignment");
        previous.setCourseId(5);
        previous.setLessonId(7);
        previous.setClassId(12);
        previous.setPoints(10);
        previous.setContentDataDTO(new ContentDataDTO());
        when(contents.findById(44)).thenReturn(Optional.of(previous));
        when(studentAssignments.countActiveByLessonContentId(44)).thenReturn(1L);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> writer.save(dto));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("An assignment with learner submissions cannot be disabled", ex.getReason());
    }

    @Test
    void legacyDisableDoesNotEraseExistingFiles() {
        dto.setLessonContentId(44);
        dto.setEnabled(false);
        dto.setClassId(null);
        dto.getContentDataDTO().setAssignmentResources(null);
        LessonContents previous = new LessonContents();
        previous.setContentType("assignment");
        previous.setCourseId(5);
        previous.setLessonId(7);
        previous.setClassId(12);
        ContentDataDTO original = new ContentDataDTO();
        original.setHtmlContent("<p>Keep resources</p>");
        previous.setContentDataDTO(original);
        when(contents.findById(44)).thenReturn(Optional.of(previous));
        LessonContents result = writer.save(dto);
        assertFalse(result.isEnabled());
        assertSame(original, result.getContentDataDTO());
        verify(access, never()).requireCurrentCourseAudienceClass(anyInt(), anyInt());
    }
}
