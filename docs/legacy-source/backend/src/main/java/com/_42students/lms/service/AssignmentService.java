package com._42students.lms.service;

import com._42students.lms.dto.request.StudentAssignmentDTO;
import com._42students.lms.dto.response.SubmissionStatsDTO;
import com._42students.lms.model.StudentAssignment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AssignmentService {

    StudentAssignment submit(StudentAssignmentDTO studentAssignmentDTO);

    List<StudentAssignment> fetchSubmissions(int lessonContentId);

    Page<StudentAssignment> fetchSubmissions(int lessonContentId, Pageable pageable);

    List<StudentAssignment> fetchSubmissionsByLearnerId(int learnerId);

    Page<StudentAssignment> fetchSubmissionsForLearner(int learnerId, int lessonContentId, Pageable pageable);

    StudentAssignment fetchSubmission(int submissionId);
    SubmissionStatsDTO getSubmissionStats(int lessonContentId);
    StudentAssignment updatePoints(int studentAssignmentId, long pointsObtained);
    double calculateAssignmentAveragePercentage(int studentId);
    int countAssignmentSubmissionsByLearnerId(int studentId);
    StudentAssignment addDescriptivePoints(int studentAssignmentId, long pointsToAdd);

    /** AQ-05: Publish grade so it becomes visible to the learner */
    StudentAssignment publishGrade(int studentAssignmentId, int publishedByFacultyId);

    /**
     * SA-ASSIGN-001/002: authorize the caller against a lesson content's course/college once,
     * before a bulk operation loads any of its submissions. Throws (404/403) if the content
     * doesn't exist or the caller lacks access; returns normally otherwise. Callers that only
     * authorize per-row after loading data (the bulk publish endpoint previously did this) leak
     * submission/student identifiers to a caller who was never entitled to see them.
     */
    void ensureCanViewOrGradeAssignment(int lessonContentId);

}
