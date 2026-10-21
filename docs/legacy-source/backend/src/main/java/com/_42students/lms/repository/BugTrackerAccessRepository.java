package com._42students.lms.repository;

import com._42students.lms.model.BugTrackerAccess;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BugTrackerAccessRepository extends JpaRepository<BugTrackerAccess, Long> {
    Optional<BugTrackerAccess> findByTokenHashAndActiveTrue(String tokenHash);
    Optional<BugTrackerAccess> findByDisplayNameIgnoreCaseAndActiveTrue(String displayName);
}
