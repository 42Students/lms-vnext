package com._42students.lms.repository.tpo;

import com._42students.lms.model.tpo.CollegeWhatCompaniesSee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CollegeWhatCompaniesSeeRepository extends JpaRepository<CollegeWhatCompaniesSee, Integer> {
}
