package com._42students.lms.repository.electives;

import com._42students.lms.model.electives.ElectiveSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ElectiveSlotRepository extends JpaRepository<ElectiveSlot, Long> {

    Optional<ElectiveSlot> findByIdAndIsDeletedFalse(Long id);

    List<ElectiveSlot> findByCollegeIdAndIsDeletedFalseOrderBySemesterNumberAscNameAsc(Integer collegeId);
}
