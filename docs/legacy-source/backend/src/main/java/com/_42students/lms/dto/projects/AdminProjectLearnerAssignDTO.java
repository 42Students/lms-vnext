package com._42students.lms.dto.projects;

import lombok.Data;

import javax.validation.constraints.Size;
import java.util.List;

@Data
public class AdminProjectLearnerAssignDTO {
    private Integer collegeId;
    // assignProjectLearners does one DB read + one write per entry synchronously in the request
    // thread with no size limit — an unbounded list is a request-size DoS vector against this
    // endpoint. 500 comfortably covers any real class/cohort roster.
    @Size(max = 500, message = "learnerIds must not contain more than 500 entries")
    private List<Integer> learnerIds;
    private String roleLabel;
    private Boolean replaceExisting = true;
}
