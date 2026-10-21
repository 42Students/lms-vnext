package com._42students.lms.service;

import com._42students.lms.dto.request.BatchRequestDTO;
import com._42students.lms.dto.response.BatchResponseDTO;

import java.util.List;
import java.util.Map;

public interface BatchService {
    BatchResponseDTO createBatch(BatchRequestDTO batchRequestDTO);

    BatchResponseDTO getBatchDetails(Long Id);

    List<BatchResponseDTO> findAll();

    BatchResponseDTO promoteBatch(Long batchId, Integer targetSemester, String newAcademicYear);

    /**
     * Server-side, read-only dry run of the same validation promoteBatch() applies (ACTIVE
     * status, target > current, target <= program max semester), without persisting anything.
     * Lets the promote-confirmation UI show a server-verified preview instead of relying solely
     * on client-cached program/batch state, which can drift out of sync with backend rules.
     */
    Map<String, Object> previewPromotion(Long batchId, Integer targetSemester);
    
    BatchResponseDTO updateCurrentSemester(Long batchId, Integer semesterNumber);
    
    List<BatchResponseDTO> findByProgramId(Long programId);

    List<BatchResponseDTO> findByCollegeId(int collegeId);

    List<BatchResponseDTO> findByOrganizationId(int orgId);
    
    BatchResponseDTO updateBatch(Long batchId, BatchRequestDTO batchRequestDTO);
    
    void deleteBatch(Long batchId);
}

