package com._42students.lms.dto.groups;

import lombok.Data;

/** Criteria in the {@link com._42students.lms.model.tpo.JobEligibility} shape. */
@Data
public class GroupRuleRequest {
    private Object criteria;
    private Boolean autoRefresh;
}
