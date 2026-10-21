package com._42students.lms.service;

import com._42students.lms.dto.request.NewProgramDTO;
import com._42students.lms.dto.response.NewProgramDetailsDTO;
import com._42students.lms.dto.response.NewProgramResponseDTO;
import com._42students.lms.model.NewProgram;

import java.util.List;

public interface NewProgramService {
    NewProgram createProgram(NewProgramDTO programDTO);
    
    List<NewProgramResponseDTO> findAll();
    
    List<NewProgramResponseDTO> findByDeptId(int deptId);

    List<NewProgramResponseDTO> findByCollegeId(int collegeId);

    List<NewProgramResponseDTO> findByOrganizationId(int orgId);
    
    NewProgramResponseDTO findById(int id);
    
    NewProgram updateProgram(int id, NewProgramDTO programDTO);
    
    void deleteProgram(int id);
    
    NewProgramDetailsDTO fetchProgramDetails(int programId);

    /** A2: paged variant of the college-scoped list. Additive -- the unpaged method stays. */
    org.springframework.data.domain.Page<com._42students.lms.model.NewProgram> findByCollegeIdPaged(int collegeId, org.springframework.data.domain.Pageable pageable);
}

