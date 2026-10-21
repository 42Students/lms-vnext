package com._42students.lms.repository;

import com._42students.lms.model.CompanyDomain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyDomainRepository extends JpaRepository<CompanyDomain, Long> {

    Optional<CompanyDomain> findByDomain(String domain);

    List<CompanyDomain> findByCompanyIdOrderByIdAsc(Integer companyId);

    @Query("SELECT d FROM CompanyDomain d WHERE d.companyId IN :ids ORDER BY d.id ASC")
    List<CompanyDomain> findByCompanyIds(@Param("ids") Collection<Integer> ids);
}
