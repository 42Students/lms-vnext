package com._42students.lms.repository;

import com._42students.lms.model.Recruiter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface RecruiterRepository extends JpaRepository<Recruiter, Integer> {

    /** Any row for this mobile, including a soft-deleted one (the mobile is unique). */
    Optional<Recruiter> findByContactMobile(String contactMobile);

    @Query("SELECT h FROM recruiter h WHERE h.contactMobile = :mobile AND h.isDeleted = false")
    Optional<Recruiter> findActiveByContactMobile(@Param("mobile") String mobile);

    /** email must already be lower-cased and trimmed by the caller (the account key is case-insensitive by convention, not by a DB collation this query relies on). */
    @Query("SELECT h FROM recruiter h WHERE LOWER(h.contactMail) = :email AND h.isDeleted = false")
    Optional<Recruiter> findActiveByContactMail(@Param("email") String email);

    /** Any row for this email, including a soft-deleted one (the email is unique) — same shape as {@link #findByContactMobile}, so callers can give a clean "this account cannot be used" instead of hitting the DB's unique constraint. */
    @Query("SELECT h FROM recruiter h WHERE LOWER(h.contactMail) = :email")
    Optional<Recruiter> findByContactMail(@Param("email") String email);

    @Query("SELECT h FROM recruiter h WHERE h.id = :id AND h.isDeleted = false")
    Optional<Recruiter> findActiveById(@Param("id") Integer id);

    /** likePattern is already lower-cased and wrapped in %...%; pass "%" to list everyone. */
    @Query("SELECT h FROM recruiter h WHERE h.isDeleted = false AND ("
            + " LOWER(h.firstName) LIKE :q"
            + " OR LOWER(h.lastName) LIKE :q"
            + " OR h.contactMobile LIKE :q"
            + " OR LOWER(h.contactMail) LIKE :q)")
    Page<Recruiter> searchActive(@Param("q") String likePattern, Pageable pageable);

    @Query("SELECT h FROM recruiter h WHERE h.isDeleted = false AND h.id IN :ids")
    List<Recruiter> findActiveByIds(@Param("ids") Collection<Integer> ids);
}
