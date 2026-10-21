package com._42students.lms.repository;

import com._42students.lms.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import javax.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Integer> {

    // Company carries no @Version column, so the usual optimistic-lock retry doesn't apply to
    // it. deleteCompany's "zero active jobs linked" check and a concurrent applyCompanyLink
    // (AdminJobServiceImpl/PlacementJobServiceImpl, run in a completely separate transaction
    // when a job is created/updated to point at this company) both read-then-act on this same
    // row with no coordination otherwise — a job could be linked in the window between
    // deleteCompany's active-jobs count and its soft-delete write, leaving that job pointing at
    // a company that's now deleted. Row-level PESSIMISTIC_WRITE locking here, taken by both
    // deleteCompany and applyCompanyLink before they read isDeleted / decide, serializes the two
    // paths against each other so whichever transaction commits first is the one the other sees.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Company c WHERE c.id = :id")
    Optional<Company> lockById(@Param("id") Integer id);

    @Query("SELECT c FROM Company c WHERE (c.isDeleted = false OR c.isDeleted IS NULL) AND c.mergedIntoCompanyId IS NULL ORDER BY c.name ASC")
    List<Company> findAllLive();

    /** Live, unmerged companies whose name contains the text (company search; verified-by-42 first). */
    @Query("SELECT c FROM Company c WHERE (c.isDeleted = false OR c.isDeleted IS NULL) AND c.mergedIntoCompanyId IS NULL " +
           "AND LOWER(c.name) LIKE LOWER(CONCAT('%', :q, '%')) ORDER BY c.verifiedBy42 DESC, c.name ASC")
    List<Company> searchByName(@Param("q") String q, org.springframework.data.domain.Pageable page);
}
