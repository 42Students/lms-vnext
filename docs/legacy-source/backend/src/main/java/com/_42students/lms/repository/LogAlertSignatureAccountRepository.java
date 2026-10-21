package com._42students.lms.repository;

import com._42students.lms.model.LogAlertSignatureAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface LogAlertSignatureAccountRepository extends JpaRepository<LogAlertSignatureAccount, LogAlertSignatureAccount.Key> {

    boolean existsBySignatureIdAndAccountId(Long signatureId, Long accountId);

    long countBySignatureId(Long signatureId);

    @Query("SELECT a.signatureId AS sigId, COUNT(a) AS cnt FROM log_alert_signature_account a "
            + "WHERE a.signatureId IN :signatureIds GROUP BY a.signatureId")
    java.util.List<CountRow> countBySignatureIds(@Param("signatureIds") java.util.List<Long> signatureIds);

    interface CountRow {
        Long getSigId();
        Long getCnt();
    }
}
