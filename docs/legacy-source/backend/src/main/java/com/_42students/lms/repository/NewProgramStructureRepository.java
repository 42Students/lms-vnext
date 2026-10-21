package com._42students.lms.repository;

import com._42students.lms.model.NewProgramStructure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NewProgramStructureRepository extends JpaRepository<NewProgramStructure, Long> {
    List<NewProgramStructure> findByProgramId(int programId);
}

