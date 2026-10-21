package com._42students.lms.model.tpo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;
import java.time.LocalDateTime;

/** An email that asked not to be contacted again ("Not hiring this season" / "Stop all emails"). */
@Entity
@Table(name = "email_suppression")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
@Getter
@Setter
public class EmailSuppressionEntity {

    @Id
    @Column(name = "email_norm")
    private String emailNorm;

    @Column(name = "reason")
    private String reason;

    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
