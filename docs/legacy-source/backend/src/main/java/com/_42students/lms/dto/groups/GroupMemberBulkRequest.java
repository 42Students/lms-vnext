package com._42students.lms.dto.groups;

import lombok.Data;

import java.util.List;

/** Add members by learner id and/or roll number (roll numbers resolve inside the group's college only). */
@Data
public class GroupMemberBulkRequest {
    private List<Integer> learnerIds;
    private List<String> rollNumbers;
    /** MANUAL (default) or CSV. */
    private String source;
    private String note;
}
