package com._42students.lms.service;

import com._42students.lms.dto.request.SemesterDTO;
import com._42students.lms.dto.response.SemesterResponseDTO;

import java.util.List;

public interface SemesterService {
    
    SemesterResponseDTO createSemester(SemesterDTO dto);
    
    SemesterResponseDTO updateSemester(Integer id, SemesterDTO dto);
    
    void deleteSemester(Integer id);
    
    SemesterResponseDTO getSemesterById(Integer id);
    
    List<SemesterResponseDTO> getSemestersByProgram(Integer programId);
    
    List<SemesterResponseDTO> getAllSemesters();

    /** Superadmin scoped list: respects orgId/collegeId from JWT scope. */
    List<SemesterResponseDTO> getAllSemestersScoped(Integer orgId, Integer collegeId);
    
    SemesterResponseDTO getSemesterByProgramAndNumber(Integer programId, Integer semesterNumber);

    /** A2: paged variant of getAllSemestersScoped, college scope only (the org path is rare). */
    org.springframework.data.domain.Page<com._42students.lms.dto.response.SemesterResponseDTO> getSemestersByCollegePaged(Integer collegeId, org.springframework.data.domain.Pageable pageable);
}

