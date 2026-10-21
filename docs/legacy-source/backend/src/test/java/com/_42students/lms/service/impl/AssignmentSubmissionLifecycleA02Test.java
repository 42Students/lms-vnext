package com._42students.lms.service.impl;

import com._42students.lms.dto.request.ContentDataDTO;
import com._42students.lms.dto.request.StudentAssignmentDTO;
import com._42students.lms.model.Learner;
import com._42students.lms.model.LessonContents;
import com._42students.lms.model.StudentAssignment;
import com._42students.lms.repository.StudentAssignmentRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.FacultyService;
import com._42students.lms.service.LearnerService;
import com._42students.lms.service.LessonContentsService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AssignmentSubmissionLifecycleA02Test {
    private AssignmentServiceImpl service;
    private StudentAssignmentRepository repository;
    private LessonContents content;
    private StudentAssignmentDTO request;

    @BeforeEach
    void setUp() {
        service = new AssignmentServiceImpl();
        repository = mock(StudentAssignmentRepository.class);
        LessonContentsService contentService = mock(LessonContentsService.class);
        LearnerService learnerService = mock(LearnerService.class);
        FacultyService facultyService = mock(FacultyService.class);
        SecurityContextUtil security = mock(SecurityContextUtil.class);
        ReflectionTestUtils.setField(service, "studentAssignmentRepository", repository);
        ReflectionTestUtils.setField(service, "lessonContentsService", contentService);
        ReflectionTestUtils.setField(service, "learnerService", learnerService);
        ReflectionTestUtils.setField(service, "facultyService", facultyService);
        ReflectionTestUtils.setField(service, "securityContextUtil", security);
        when(security.getAuthenticatedUserPrincipal())
                .thenReturn(new UserPrincipal(12, "LEARNER", null, 2, 9, 0));
        Learner learner = new Learner();
        learner.setId(12);
        learner.setClassId(44);
        learner.setFirstName("Learner");
        when(learnerService.getLearnerDetails("12")).thenReturn(learner);
        when(learnerService.findById(12)).thenReturn(Optional.empty());
        when(facultyService.getFacultyId(44)).thenReturn(55);

        content = new LessonContents();
        content.setId(33);
        content.setClassId(44);
        content.setContentType("assignment");
        content.setActive(true);
        content.setEnabled(true);
        content.setIsDeleted(false);
        content.setDeadline(LocalDateTime.now(AssignmentServiceImpl.DEADLINE_ZONE).plusDays(2));
        ContentDataDTO data = new ContentDataDTO();
        data.setAllowedSubmissionTypes(List.of("WRITTEN_RESPONSE"));
        content.setContentDataDTO(data);
        when(contentService.getLessonContents(33)).thenReturn(content);

        request = new StudentAssignmentDTO();
        request.setLessonContentId(33);
        request.setStudentId(12);
        request.setHtmlContent("Completed assignment");
        when(repository.save(any(StudentAssignment.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private void assertUnavailable(HttpStatus status) {
        ResponseStatusException failure = assertThrows(ResponseStatusException.class,
                () -> service.submit(request));
        assertEquals(status, failure.getStatus());
        verify(repository, never()).save(any());
    }

    @Test
    void deletedAssignmentCannotBeSubmittedDirectly() {
        content.setIsDeleted(true);
        assertUnavailable(HttpStatus.NOT_FOUND);
    }

    @Test
    void disabledAssignmentCannotBeSubmittedDirectly() {
        content.setEnabled(false);
        assertUnavailable(HttpStatus.CONFLICT);
    }

    @Test
    void inactiveAssignmentCannotBeSubmittedDirectly() {
        content.setActive(false);
        assertUnavailable(HttpStatus.CONFLICT);
    }

    @Test
    void disabledAndDeletedAssignmentIsNotFound() {
        content.setEnabled(false);
        content.setIsDeleted(true);
        assertUnavailable(HttpStatus.NOT_FOUND);
    }

    @Test
    void activeAssignmentStillAcceptsValidWrittenSubmission() {
        StudentAssignment saved = service.submit(request);
        assertEquals(12, saved.getStudentId());
        assertEquals(33, saved.getLessonContentId());
        verify(repository).save(any(StudentAssignment.class));
    }

    @Test
    void deadlineStillBlocksAnOtherwiseActiveAssignment() {
        content.setDeadline(LocalDateTime.now().minusHours(1));
        assertThrows(IllegalArgumentException.class, () -> service.submit(request));
        verify(repository, never()).save(any());
    }

    @Test
    void assignmentWithoutAnyDeadlineFailsClosed() {
        content.setDeadline(null);
        content.getContentDataDTO().setDueDate(null);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.submit(request));

        assertEquals("Assignment deadline is not configured", ex.getMessage());
        verify(repository, never()).save(any(StudentAssignment.class));
    }

    @Test
    void malformedLegacyDeadlineFailsClosedInsteadOfBecomingUnlimited() {
        content.setDeadline(null);
        content.getContentDataDTO().setDueDate("not-a-date");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.submit(request));

        assertEquals("Assignment deadline is invalid", ex.getMessage());
        verify(repository, never()).save(any(StudentAssignment.class));
    }

    @Test
    void legacyNestedDueDateAlsoBlocksSubmissionWhenDeadlineColumnWasNeverWritten() {
        content.setDeadline(null);
        content.getContentDataDTO().setDueDate(
                java.time.OffsetDateTime.now(AssignmentServiceImpl.DEADLINE_ZONE)
                        .minusMinutes(5)
                        .format(java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.submit(request));

        assertEquals("Submission deadline has passed", ex.getMessage());
        verify(repository, never()).save(any());
    }
}
