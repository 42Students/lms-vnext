package com._42students.lms.service;

import com._42students.lms.model.NewProgramStructure;
import com._42students.lms.dto.request.NewProgramStructureDTO;
import com._42students.lms.enums.StatusType;

import java.util.List;

public interface ProgramStructureService {
    
    NewProgramStructure createProgramStructure(NewProgramStructureDTO dto);

    NewProgramStructure fetchById(int id);

    NewProgramStructure updateProgramStructure(int id, NewProgramStructureDTO dto);
    
    void deleteProgramStructure(int id);

    List<NewProgramStructure> fetchAllSemesters(int programId);

    void updateStatus(int programId, int id, StatusType statusType);

    List<NewProgramStructure> fetchActiveSemesters(int programId);
    
    List<NewProgramStructure> fetchAll();
}

