package com._42students.lms.dto.projects;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class BulkMentorReassignResultDTO {
    private int reassignedCount;
    // Workspaces that already had this exact mentor (and role label) — left untouched, not
    // counted as a failure, but also not re-notified/re-audited as if something changed.
    private int skippedCount;
    private List<String> failures = new ArrayList<>();
}
