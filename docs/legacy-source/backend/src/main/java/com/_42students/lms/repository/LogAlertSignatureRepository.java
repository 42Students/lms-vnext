package com._42students.lms.repository;

import com._42students.lms.model.LogAlertSignature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LogAlertSignatureRepository extends JpaRepository<LogAlertSignature, Long> {
    Optional<LogAlertSignature> findByEnvironmentAndSignatureHash(String environment, String signatureHash);

    List<LogAlertSignature> findByEnvironmentOrderByLastSeenAtDesc(String environment);
}
