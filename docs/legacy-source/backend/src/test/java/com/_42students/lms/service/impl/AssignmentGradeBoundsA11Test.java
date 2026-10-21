package com._42students.lms.service.impl;

import com._42students.lms.model.LessonContents;
import com._42students.lms.model.StudentAssignment;
import com._42students.lms.repository.GradeAuditLogRepository;
import com._42students.lms.repository.StudentAssignmentRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.LearnerService;
import com._42students.lms.service.LessonContentsService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AssignmentGradeBoundsA11Test {
    private AssignmentServiceImpl service;
    private StudentAssignmentRepository repository;
    private StudentAssignment submission;
    private LessonContents content;

    @BeforeEach
    void setUp() {
        service = new AssignmentServiceImpl();
        repository = mock(StudentAssignmentRepository.class);
        LessonContentsService lessonService = mock(LessonContentsService.class);
        LearnerService learnerService = mock(LearnerService.class);
        SecurityContextUtil security = mock(SecurityContextUtil.class);
        ReflectionTestUtils.setField(service, "studentAssignmentRepository", repository);
        ReflectionTestUtils.setField(service, "lessonContentsService", lessonService);
        ReflectionTestUtils.setField(service, "learnerService", learnerService);
        ReflectionTestUtils.setField(service, "securityContextUtil", security);
        ReflectionTestUtils.setField(service, "gradeAuditLogRepository", mock(GradeAuditLogRepository.class));
        when(security.getAuthenticatedUserPrincipal())
                .thenReturn(new UserPrincipal(44, "FACULTY", "ADMIN", 2, 9, 0));
        // Grading resolves the assignment college and organization (fail closed when it cannot).
        com._42students.lms.access.ScopeResolutionService scopes = mock(com._42students.lms.access.ScopeResolutionService.class);
        when(scopes.resolveCourseToCollegeId(5)).thenReturn(9);
        when(scopes.resolveCollegeToOrganizationId(9)).thenReturn(2);
        ReflectionTestUtils.setField(service, "scopeResolutionService", scopes);
        content = new LessonContents();
        content.setId(33);
        content.setCourseId(5);
        content.setPoints(0);
        when(lessonService.getLessonContents(33)).thenReturn(content);
        submission = new StudentAssignment();
        submission.setId(71);
        submission.setLessonContentId(33);
        submission.setStudentId(12);
        submission.setPoints(0);
        submission.setGradingStatus("NOT_GRADED");
        when(repository.findById(71)).thenReturn(submission);
        when(repository.save(any(StudentAssignment.class))).thenAnswer(call -> call.getArgument(0));
        when(learnerService.findById(12)).thenReturn(Optional.empty());
    }

    @Test
    void rejectsPositiveScoreWhenAssignmentHasZeroMaximum() {
        assertThrows(IllegalArgumentException.class, () -> service.updatePoints(71, 1));
        verify(repository, never()).save(any());
    }

    @Test
    void permitsZeroScoreWhenMaximumIsZero() {
        StudentAssignment saved = service.updatePoints(71, 0);
        assertEquals(0, saved.getPointsObtained());
        verify(repository).save(submission);
    }

    @Test
    void rejectsNegativeScoreAndAbovePositiveMaximum() {
        submission.setPoints(10);
        assertThrows(IllegalArgumentException.class, () -> service.updatePoints(71, -1));
        assertThrows(IllegalArgumentException.class, () -> service.updatePoints(71, 11));
        verify(repository, never()).save(any());
    }

    @Test
    void acceptsScoreEqualToMaximum() {
        submission.setPoints(10);
        assertEquals(10, service.updatePoints(71, 10).getPointsObtained());
        verify(repository).save(submission);
    }

    @Test
    void descriptivePointsRejectZeroMaximumAndOverflowWithoutWriting() {
        assertThrows(IllegalArgumentException.class, () -> service.addDescriptivePoints(71, 1));
        submission.setPointsObtained(5);
        content.setPoints(10);
        assertThrows(IllegalArgumentException.class, () -> service.addDescriptivePoints(71, Long.MAX_VALUE));
        assertThrows(IllegalArgumentException.class, () -> service.addDescriptivePoints(71, -1));
        verify(repository, never()).save(any());
    }

    @Test
    void descriptivePointsAtMaximumRemainValid() {
        submission.setPointsObtained(4);
        content.setPoints(10);
        assertEquals(10, service.addDescriptivePoints(71, 6).getPointsObtained());
        verify(repository).save(submission);
    }
}
