package com._42students.lms.model;

import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.Instant;

/** One row per distinct account seen hitting a given error signature -- see the V158 migration for why. */
@Data
@NoArgsConstructor
@Entity(name = "log_alert_signature_account")
@Table(name = "log_alert_signature_account")
@IdClass(LogAlertSignatureAccount.Key.class)
public class LogAlertSignatureAccount {

    @Id
    @Column(name = "signature_id", nullable = false)
    private Long signatureId;

    @Id
    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(name = "first_seen_at", nullable = false)
    private Instant firstSeenAt;

    public LogAlertSignatureAccount(Long signatureId, Long accountId, Instant firstSeenAt) {
        this.signatureId = signatureId;
        this.accountId = accountId;
        this.firstSeenAt = firstSeenAt;
    }

    public static final class Key implements java.io.Serializable {
        private Long signatureId;
        private Long accountId;

        public Key() {}

        public Key(Long signatureId, Long accountId) {
            this.signatureId = signatureId;
            this.accountId = accountId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Key)) return false;
            Key key = (Key) o;
            return java.util.Objects.equals(signatureId, key.signatureId)
                    && java.util.Objects.equals(accountId, key.accountId);
        }

        @Override
        public int hashCode() {
            return java.util.Objects.hash(signatureId, accountId);
        }
    }
}
