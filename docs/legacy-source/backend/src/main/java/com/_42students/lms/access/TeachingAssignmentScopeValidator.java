package com._42students.lms.access;

import com._42students.lms.dto.request.FacultyTeachingAssignmentDTO;
import com._42students.lms.dto.response.FacultyTeachingAssignmentResponseDTO;
import com._42students.lms.model.Batch;
import com._42students.lms.model.FacultyTeachingAssignment;
import com._42students.lms.model.Semester;
import com._42students.lms.model._Class;
import com._42students.lms.repository.BatchRepository;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.repository.SemesterRepository;
import com._42students.lms.repository._ClassRepository;
import com._42students.lms.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

/** Enforces relational integrity and destination authorization before teaching-assignment writes. */
@Service
@RequiredArgsConstructor
public class TeachingAssignmentScopeValidator {
    private final ScopeResolutionService scopeResolutionService;
    private final AccessControlService accessControlService;
    private final _ClassRepository classRepository;

    @Autowired private BatchRepository batchRepository;
    @Autowired private SemesterRepository semesterRepository;
    @Autowired private FacultyTeachingAssignmentRepository assignmentRepository;

    /** Validate the effective graph: update DTOs may omit fields retained from the existing row. */
    public void validate(UserPrincipal principal, FacultyTeachingAssignmentDTO request,
                         FacultyTeachingAssignmentResponseDTO existing, boolean bulk) {
        Integer facultyId = choose(request.getFacultyId(), existing == null ? null : existing.getFacultyId());
        Integer courseId = choose(request.getCourseId(), existing == null ? null : existing.getCourseId());
        Integer classId = choose(request.getClassId(), existing == null ? null : existing.getClassId());
        Integer batchId = choose(request.getBatchId(), existing == null ? null : existing.getBatchId());
        Integer semesterNumber = choose(request.getSemesterNumber(),
                existing == null ? null : existing.getSemesterNumber());
        if (facultyId == null || (!bulk && courseId == null) || classId == null
                || semesterNumber == null || semesterNumber < 1) {
            throw new IllegalArgumentException("Faculty, course, class and semester are required");
        }
        if (request.getRole() != null) {
            try {
                FacultyTeachingAssignment.TeachingRole.valueOf(request.getRole());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid teaching role", e);
            }
        }
        Date previousStart = null;
        Date previousEnd = null;
        if (existing != null && existing.getId() != null) {
            FacultyTeachingAssignment previous = assignmentRepository.findById(existing.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Existing assignment no longer exists"));
            previousStart = previous.getStartDate();
            previousEnd = previous.getEndDate();
        }
        Date effectiveStart = request.getStartDate() != null ? request.getStartDate() : previousStart;
        Date effectiveEnd = request.getEndDate() != null ? request.getEndDate() : previousEnd;
        if (effectiveStart != null && effectiveEnd != null && effectiveStart.after(effectiveEnd)) {
            throw new IllegalArgumentException("Assignment start date must not be after end date");
        }

        Integer facultyCollege = scopeResolutionService.resolveFacultyToCollegeId(facultyId);
        Integer classCollege = scopeResolutionService.resolveClassToCollegeId(classId);
        if (facultyCollege == null || classCollege == null || !facultyCollege.equals(classCollege)) {
            throw new IllegalArgumentException("Faculty and class must belong to the same valid college");
        }
        accessControlService.requireAccessCollege(principal, facultyCollege);
        accessControlService.requireAccessClass(principal, classId);

        _Class actualClass = classRepository.findByIdAndNotDeleted(classId)
                .orElseThrow(() -> new IllegalArgumentException("Class does not exist"));
        int programId = actualClass.getProgramId();
        if (programId <= 0 ||
                !facultyCollege.equals(scopeResolutionService.resolveProgramToCollegeId(programId))) {
            throw new IllegalArgumentException("Class program is missing or outside its college");
        }
        Integer actualBatchId = actualClass.getBatchId();
        // Historically the API may omit batchId, letting the service derive it from the class.
        // Keep that valid path while rejecting any explicitly supplied mismatching batch ID.
        if (actualBatchId == null || (batchId != null && !Objects.equals(batchId, actualBatchId))) {
            throw new IllegalArgumentException("Assignment batch must match the class batch");
        }
        Batch actualBatch = batchRepository.findById(actualBatchId.longValue())
                .orElseThrow(() -> new IllegalArgumentException("Assignment batch does not exist"));
        if (actualBatch.getProgramId() == null ||
                !Long.valueOf(programId).equals(actualBatch.getProgramId())) {
            throw new IllegalArgumentException("Class and batch must belong to the same program");
        }
        if (!facultyCollege.equals(scopeResolutionService.resolveBatchToCollegeId(actualBatchId.longValue()))) {
            throw new IllegalArgumentException("Assignment batch is outside its college");
        }
        accessControlService.requireAccessBatch(principal, actualBatchId.longValue());
        Semester term = semesterRepository.findFirstByProgramIdAndSemesterNumber(programId, semesterNumber)
                .orElseThrow(() -> new IllegalArgumentException("Assignment semester does not exist in this program"));
        if (Boolean.TRUE.equals(term.getIsDeleted())) {
            throw new IllegalArgumentException("Assignment semester is deleted");
        }
        if (!bulk) validateCourse(courseId, facultyCollege);
        if (bulk) {
            if (request.getCourseIds() == null || request.getCourseIds().isEmpty()) {
                throw new IllegalArgumentException("At least one course ID is required for bulk assignments");
            }
            Set<Integer> uniqueIds = new HashSet<>();
            for (Integer requestedCourse : request.getCourseIds()) {
                if (requestedCourse == null || requestedCourse <= 0 || !uniqueIds.add(requestedCourse)) {
                    throw new IllegalArgumentException("Bulk course IDs must be positive and unique");
                }
                validateCourse(requestedCourse, facultyCollege);
            }
        }
        // Electives and retake courses may be taught to a class without a SemesterCourse
        // mapping; do not unilaterally change this product contract to a strict curriculum check.
    }

    private Integer choose(Integer requested, Integer previous) {
        return requested != null ? requested : previous;
    }

    private void validateCourse(Integer courseId, Integer collegeId) {
        Integer courseCollege = scopeResolutionService.resolveCourseToCollegeId(courseId);
        if (courseCollege == null || !collegeId.equals(courseCollege)) {
            throw new IllegalArgumentException("Course is missing or belongs to a different college");
        }
    }
}
