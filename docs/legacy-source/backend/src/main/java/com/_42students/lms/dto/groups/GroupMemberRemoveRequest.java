package com._42students.lms.dto.groups;

import lombok.Data;

@Data
public class GroupMemberRemoveRequest {
    private String reason;
    /** true = the learner may not re-join on their own and rule re-runs will not re-add them. */
    private Boolean lock;
}
