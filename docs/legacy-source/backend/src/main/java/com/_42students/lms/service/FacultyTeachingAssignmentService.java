package com._42students.lms.service;

import com._42students.lms.dto.request.FacultyTeachingAssignmentDTO;
import com._42students.lms.dto.response.FacultyTeachingAssignmentResponseDTO;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface FacultyTeachingAssignmentService {
    
    FacultyTeachingAssignmentResponseDTO getAssignmentById(Integer id);
    
    FacultyTeachingAssignmentResponseDTO createAssignment(FacultyTeachingAssignmentDTO dto);
    
    List<FacultyTeachingAssignmentResponseDTO> createBulkAssignments(FacultyTeachingAssignmentDTO dto);
    
    FacultyTeachingAssignmentResponseDTO updateAssignment(Integer id, FacultyTeachingAssignmentDTO dto);
    
    void deleteAssignment(Integer id);
    
    void deactivateAssignment(Integer id);
    
    List<FacultyTeachingAssignmentResponseDTO> getAssignmentsByFaculty(Integer facultyId);
    
    List<FacultyTeachingAssignmentResponseDTO> getActiveAssignmentsByFaculty(Integer facultyId);
    
    List<FacultyTeachingAssignmentResponseDTO> getAssignmentsByClass(Integer classId);
    
    List<FacultyTeachingAssignmentResponseDTO> getAssignmentsByClassAndSemester(Integer classId, Integer semesterNumber);
    
    List<FacultyTeachingAssignmentResponseDTO> getAssignmentsByBatch(Integer batchId);
    
    List<FacultyTeachingAssignmentResponseDTO> getAllActiveAssignments();
    
    List<FacultyTeachingAssignmentResponseDTO> getAllAssignments();

    Page<FacultyTeachingAssignmentResponseDTO> getAdminAssignmentsPage(
            Integer collegeId, Integer classId, Pageable pageable);

    
    void deactivateAssignmentsForBatchSemester(Integer batchId, Integer semesterNumber);

    /**
     * Reactivates faculty teaching assignments for a batch/semester. Used to undo the side effect
     * of {@link #deactivateAssignmentsForBatchSemester} when a batch promotion is reverted.
     */
    void reactivateAssignmentsForBatchSemester(Integer batchId, Integer semesterNumber);
}

