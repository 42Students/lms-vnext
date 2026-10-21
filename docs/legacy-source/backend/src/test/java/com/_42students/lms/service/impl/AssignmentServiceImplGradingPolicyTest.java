package com._42students.lms.service.impl;

import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.response.SubmissionStatsDTO;
import com._42students.lms.model.Learner;
import com._42students.lms.model.LessonContents;
import com._42students.lms.model.StudentAssignment;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.repository.GradeAuditLogRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.LessonContentsRepository;
import com._42students.lms.repository.StudentAssignmentRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.CourseService;
import com._42students.lms.service.FacultyService;
import com._42students.lms.service.LearnerService;
import com._42students.lms.service.LessonContentsService;
import com._42students.lms.service.NotificationTemplateContextResolver;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AssignmentServiceImplGradingPolicyTest {
    private AssignmentServiceImpl service;
    private StudentAssignmentRepository submissions;
    private LessonContentsRepository lessonContentsRepository;
    private LearnerRepository learnerRepository;
    private SecurityContextUtil security;
    private LessonContentsService contents;
    private ScopeResolutionService scopes;
    private FacultyTeachingAssignmentRepository teachingAssignments;

    @BeforeEach
    void setUp() {
        service = new AssignmentServiceImpl();
        submissions = mock(StudentAssignmentRepository.class);
        contents = mock(LessonContentsService.class);
        lessonContentsRepository = mock(LessonContentsRepository.class);
        learnerRepository = mock(LearnerRepository.class);
        security = mock(SecurityContextUtil.class);
        scopes = mock(ScopeResolutionService.class);
        teachingAssignments = mock(FacultyTeachingAssignmentRepository.class);

        UserPrincipal admin = new UserPrincipal(31, "FACULTY", "ADMIN", 1, 6, 0);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(admin);
        LessonContents assignment = new LessonContents();
        assignment.setId(11);
        assignment.setCourseId(4);
        assignment.setPoints(10);
        when(contents.getLessonContents(11)).thenReturn(assignment);
        when(scopes.resolveCourseToCollegeId(4)).thenReturn(6);
        when(scopes.resolveCollegeToOrganizationId(6)).thenReturn(1);
        when(submissions.save(any(StudentAssignment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReflectionTestUtils.setField(service, "studentAssignmentRepository", submissions);
        ReflectionTestUtils.setField(service, "lessonContentsService", contents);
        ReflectionTestUtils.setField(service, "facultyService", mock(FacultyService.class));
        ReflectionTestUtils.setField(service, "learnerService", mock(LearnerService.class));
        ReflectionTestUtils.setField(service, "courseService", mock(CourseService.class));
        ReflectionTestUtils.setField(service, "contextResolver", mock(NotificationTemplateContextResolver.class));
        ReflectionTestUtils.setField(service, "gradeAuditLogRepository", mock(GradeAuditLogRepository.class));
        ReflectionTestUtils.setField(service, "securityContextUtil", security);
        ReflectionTestUtils.setField(service, "lessonContentsRepository", lessonContentsRepository);
        ReflectionTestUtils.setField(service, "learnerRepository", learnerRepository);
        ReflectionTestUtils.setField(service, "scopeResolutionService", scopes);
        ReflectionTestUtils.setField(service, "facultyTeachingAssignmentRepository", teachingAssignments);
    }

    @Test
    void updatePointsSavesGradeWithoutPublishingIt() {
        StudentAssignment submission = submission(10);
        when(submissions.findById(77)).thenReturn(submission);

        StudentAssignment saved = service.updatePoints(77, 8);

        assertFalse(saved.isGradePublished());
        verify(submissions).save(submission);
    }

    @Test
    void zeroPointAssignmentCannotReceivePositiveMarks() {
        StudentAssignment submission = submission(0);
        when(submissions.findById(77)).thenReturn(submission);

        assertThrows(IllegalArgumentException.class, () -> service.updatePoints(77, 1));
    }

    @Test
    void publishGradeMarksGradeVisibleOnlyOnce() {
        StudentAssignment submission = submission(10);
        submission.setGraded(1);
        submission.setGradePublished(false);
        submission.setPointsObtained(8);
        submission.setGradingStatus("MANUALLY_GRADED");
        when(submissions.findById(77)).thenReturn(submission);

        StudentAssignment published = service.publishGrade(77, 31);

        assertTrue(published.isGradePublished());
        verify(submissions).save(submission);
    }

    @Test
    void alreadyPublishedGradeIsIdempotent() {
        StudentAssignment submission = submission(10);
        submission.setGraded(1);
        submission.setGradePublished(true);
        when(submissions.findById(77)).thenReturn(submission);

        StudentAssignment published = service.publishGrade(77, 31);

        assertTrue(published.isGradePublished());
        verify(submissions, never()).save(any(StudentAssignment.class));
    }

    @Test
    void learnerSubmissionListRedactsUnpublishedGradeData() {
        StudentAssignment submission = submission(10);
        submission.setGraded(1);
        submission.setGradePublished(false);
        submission.setPointsObtained(8);
        submission.setPreviousPoints(6);
        submission.setGradingDate("2026-10-06");
        submission.setGradingStatus("MANUALLY_GRADED");
        submission.setGradedBy(31);
        submission.setGradedAt(LocalDateTime.now());
        when(security.getAuthenticatedUserPrincipal()).thenReturn(new UserPrincipal(42, "LEARNER", null, 1, 6, 0));
        when(submissions.fetchSubmissionsByLearnerId(42)).thenReturn(List.of(submission));

        StudentAssignment visible = service.fetchSubmissionsByLearnerId(42).get(0);

        assertEquals(0, visible.getPointsObtained());
        assertEquals(0, visible.getPreviousPoints());
        assertNull(visible.getGradingDate());
        assertEquals(0, visible.getGraded());
        assertEquals("NOT_GRADED", visible.getGradingStatus());
        assertNull(visible.getGradedBy());
        assertNull(visible.getGradedAt());
    }

    @Test
    void plainFacultyLearnerHistoryIsLimitedToAssignmentsTheyTeach() {
        when(security.getAuthenticatedUserPrincipal()).thenReturn(
                new UserPrincipal(7, "FACULTY", "LECTURER", 1, 6, 0));
        StudentAssignment taught = submission(10);
        taught.setId(71);
        taught.setLessonContentId(11);
        StudentAssignment unrelated = submission(10);
        unrelated.setId(72);
        unrelated.setLessonContentId(12);

        LessonContents unrelatedContent = new LessonContents();
        unrelatedContent.setId(12);
        unrelatedContent.setCourseId(5);
        unrelatedContent.setPoints(10);
        when(contents.getLessonContents(12)).thenReturn(unrelatedContent);
        when(scopes.resolveCourseToCollegeId(5)).thenReturn(6);
        when(teachingAssignments.existsByFacultyIdAndCourseIdAndIsActive(7, 4, true)).thenReturn(true);
        when(teachingAssignments.existsByFacultyIdAndCourseIdAndIsActive(7, 5, true)).thenReturn(false);
        when(submissions.fetchSubmissionsByLearnerId(42)).thenReturn(List.of(taught, unrelated));

        List<StudentAssignment> visible = service.fetchSubmissionsByLearnerId(42);

        assertEquals(1, visible.size());
        assertEquals(11, visible.get(0).getLessonContentId());
    }

    @Test
    void activeCoTeacherCanGradeAnAssignmentOwnedByAnotherFaculty() {
        when(security.getAuthenticatedUserPrincipal()).thenReturn(
                new UserPrincipal(7, "FACULTY", "LECTURER", 1, 6, 0));
        LessonContents assignment = contents.getLessonContents(11);
        assignment.setFacultyId(99);
        assignment.setClassId(12);
        when(scopes.resolveClassToCollegeId(12)).thenReturn(6);
        when(teachingAssignments.existsByFacultyIdAndCourseIdAndClassIdAndIsActive(7, 4, 12, true))
                .thenReturn(true);
        StudentAssignment submission = submission(10);
        when(submissions.findById(77)).thenReturn(submission);

        StudentAssignment saved = service.updatePoints(77, 8);

        assertEquals(8, saved.getPointsObtained());
        verify(submissions).save(submission);
    }

    @Test
    void organizationScopedSuperadminCannotGradeAnotherOrganizationsAssignment() {
        when(security.getAuthenticatedUserPrincipal()).thenReturn(
                UserPrincipal.forSuperAdminScoped(99, null));
        when(scopes.resolveCourseToCollegeId(4)).thenReturn(6);
        when(scopes.resolveCollegeToOrganizationId(6)).thenReturn(1);
        StudentAssignment submission = submission(10);
        when(submissions.findById(77)).thenReturn(submission);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.updatePoints(77, 8));

        assertEquals(org.springframework.http.HttpStatus.FORBIDDEN, ex.getStatus());
        verify(submissions, never()).save(any(StudentAssignment.class));
    }

    @Test
    void sharedAssignmentStatsUseEligibleLearnerRoster() {
        StudentAssignment graded = submissionForStudent(1, 1);
        StudentAssignment ungraded = submissionForStudent(3, 0);
        when(submissions.fetchSubmissions(11)).thenReturn(List.of(graded, ungraded));
        when(lessonContentsRepository.findClassIdByLessonContentId(11)).thenReturn(null);
        when(learnerRepository.findEligibleLearnersForAssignment(11))
                .thenReturn(List.of(learner(1), learner(2), learner(3), learner(4)));

        SubmissionStatsDTO stats = service.getSubmissionStats(11);

        assertEquals(4, stats.getTotalStudents());
        assertEquals(2, stats.getTotalSubmitted());
        assertEquals(1, stats.getTotalGraded());
        assertEquals(1, stats.getNotGraded());
        assertEquals(2, stats.getNotSubmitted());
        assertEquals(List.of(2, 4), stats.getNotSubmittedStudentIds().stream().sorted().toList());
        assertEquals(List.of(3), stats.getNotGradedStudentIds());
    }

    private StudentAssignment submission(long points) {
        StudentAssignment submission = new StudentAssignment();
        submission.setId(77);
        submission.setLessonContentId(11);
        submission.setStudentId(42);
        submission.setPoints(points);
        submission.setGradePublished(true);
        return submission;
    }

    private StudentAssignment submissionForStudent(int learnerId, int graded) {
        StudentAssignment submission = submission(10);
        submission.setStudentId(learnerId);
        submission.setGraded(graded);
        return submission;
    }

    private Learner learner(int id) {
        Learner learner = new Learner();
        learner.setId(id);
        return learner;
    }
}
