package com._42students.lms.service.impl;

import com._42students.lms.dto.request.NewProgramStructureDTO;
import com._42students.lms.model.NewProgramStructure;
import com._42students.lms.repository.NewProgramStructureRepository;
import com._42students.lms.service.ProgramStructureService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com._42students.lms.enums.StatusType;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class ProgramStructureServiceImpl implements ProgramStructureService {

    @Autowired
    private NewProgramStructureRepository newProgramStructureRepository;

    @Override
    public NewProgramStructure createProgramStructure(NewProgramStructureDTO dto) {
        NewProgramStructure structure = new NewProgramStructure();
        structure.setName(dto.getName());
        structure.setProgramId(dto.getProgramId());
        structure.setStartDate(dto.getStartDate());
        structure.setEndDate(dto.getEndDate());
        structure.setCourseIds(dto.getCourseIds() != null ? dto.getCourseIds() : new ArrayList<>());
        structure.setStatus(dto.getStatus() != null ? StatusType.valueOf(dto.getStatus()) : StatusType.ACTIVE);
        return newProgramStructureRepository.save(structure);
    }

    @Override
    public NewProgramStructure fetchById(int id) {
        Optional<NewProgramStructure> optStructure = newProgramStructureRepository.findById((long) id);
        if (optStructure.isEmpty()) {
            throw new NoSuchElementException("Program structure not found with id: " + id);
        }
        return optStructure.get();
    }

    @Override
    public NewProgramStructure updateProgramStructure(int id, NewProgramStructureDTO dto) {
        Optional<NewProgramStructure> optStructure = newProgramStructureRepository.findById((long) id);
        if (optStructure.isEmpty()) {
            throw new NoSuchElementException("Program structure not found with id: " + id);
        }
        NewProgramStructure structure = optStructure.get();
        if (dto.getName() != null) structure.setName(dto.getName());
        // programId is intentionally NOT updatable here: changing it would reassign this
        // structure to a different program/college, bypassing access to the original program.
        if (dto.getStartDate() != null) structure.setStartDate(dto.getStartDate());
        if (dto.getEndDate() != null) structure.setEndDate(dto.getEndDate());
        if (dto.getCourseIds() != null) structure.setCourseIds(dto.getCourseIds());
        if (dto.getStatus() != null) structure.setStatus(StatusType.valueOf(dto.getStatus()));
        return newProgramStructureRepository.save(structure);
    }

    @Override
    public void deleteProgramStructure(int id) {
        newProgramStructureRepository.deleteById((long) id);
    }

    @Override
    public List<NewProgramStructure> fetchAll() {
        return newProgramStructureRepository.findAll();
    }

    @Override
    public List<NewProgramStructure> fetchAllSemesters(int programId) {
        return newProgramStructureRepository.findByProgramId(programId);
    }

    @Override
    @Transactional
    public void updateStatus(int programId, int id, StatusType statusType) {
        if (programId <= 0 || id <= 0 || statusType == null) {
            throw new IllegalArgumentException("A valid program, structure and status are required");
        }
        // Validate the ACTUAL row and its program BEFORE touching sibling semesters.
        // Previously an unknown or foreign id with ACTIVE would deactivate every sibling
        // without ever activating the requested target.
        NewProgramStructure target = newProgramStructureRepository.findById((long) id)
                .orElseThrow(() -> new IllegalArgumentException("Program structure not found"));
        if (target.getProgramId() != programId) {
            throw new IllegalArgumentException("Program structure does not belong to the specified program");
        }
        List<NewProgramStructure> structures = newProgramStructureRepository.findByProgramId(programId);
        boolean found = false;
        for (NewProgramStructure structure : structures) {
            if (structure.getId() == id) {
                found = true;
                structure.setStatus(statusType);
            } else if (statusType == StatusType.ACTIVE && structure.getStatus() != StatusType.COMPLETED) {
                structure.setStatus(StatusType.INACTIVE);
            }
        }
        if (!found) {
            throw new IllegalArgumentException("Program structure is not in the specified program");
        }
        newProgramStructureRepository.saveAll(structures);
    }

    @Override
    public List<NewProgramStructure> fetchActiveSemesters(int programId) {
        List<NewProgramStructure> allSemesters = newProgramStructureRepository.findByProgramId(programId);
        List<NewProgramStructure> activeSemesters = new ArrayList<>();
        for (NewProgramStructure semester : allSemesters) {
            if (semester.getStatus() == StatusType.ACTIVE) {
                activeSemesters.add(semester);
            }
        }
        return activeSemesters;
    }
}
