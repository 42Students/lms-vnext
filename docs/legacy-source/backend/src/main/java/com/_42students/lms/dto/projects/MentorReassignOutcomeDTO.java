package com._42students.lms.dto.projects;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Set;

// Internal result of a single workspace's mentor reassignment — used to let the bulk-reassign
// loop (ProjectWorkspaceServiceImpl#bulkReassignProjectMentor) decide per-item counting/
// notification batching without duplicating the member-swap logic itself. Not returned to the
// frontend directly.
@Data
@AllArgsConstructor
public class MentorReassignOutcomeDTO {
    private boolean noOp;
    private Set<Integer> previousMentorIds;
}
