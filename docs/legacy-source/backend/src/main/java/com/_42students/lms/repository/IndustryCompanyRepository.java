package com._42students.lms.repository;

import com._42students.lms.model.IndustryCompany;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IndustryCompanyRepository extends JpaRepository<IndustryCompany, Integer> {

    @Query("SELECT c FROM industry_company c WHERE c.isDeleted = false ORDER BY c.name ASC")
    List<IndustryCompany> findAllActive();

    @Query("SELECT c FROM industry_company c WHERE c.isDeleted = false AND LOWER(c.name) = LOWER(:name)")
    List<IndustryCompany> findActiveByNameIgnoreCase(@Param("name") String name);

    @Query("SELECT c FROM industry_company c WHERE c.id = :id AND c.isDeleted = false")
    Optional<IndustryCompany> findActiveById(@Param("id") Integer id);
}
