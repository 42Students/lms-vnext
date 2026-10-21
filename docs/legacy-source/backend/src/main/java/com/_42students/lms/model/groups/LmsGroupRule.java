package com._42students.lms.model.groups;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.vladmihalcea.hibernate.type.json.JsonType;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.TypeDef;
import org.hibernate.annotations.TypeDefs;
import org.hibernate.annotations.UpdateTimestamp;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import java.time.LocalDateTime;

/**
 * The saved criteria that fill a group automatically. {@code criteriaJson} has the same shape as
 * {@code job.eligibility_json} ({@link com._42students.lms.model.tpo.JobEligibility}) so the TPO
 * evaluator serves both; a rule materialises into {@code lms_group_member} rows with
 * {@code source=RULE}, and re-runs never touch other sources or locked rows.
 */
@Entity
@Table(name = "lms_group_rule")
@TypeDefs({@TypeDef(name = "json", typeClass = JsonType.class)})
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
@Getter
@Setter
public class LmsGroupRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_id", nullable = false, unique = true)
    private Long groupId;

    @Type(type = "json")
    @Column(name = "criteria_json", columnDefinition = "json", nullable = false)
    private Object criteriaJson;

    @Column(name = "auto_refresh", nullable = false)
    private Boolean autoRefresh = false;

    @Column(name = "last_run_at")
    private LocalDateTime lastRunAt;

    @Column(name = "last_run_matched")
    private Integer lastRunMatched;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
