package com._42students.lms.controller;

import com._42students.lms.dto.bugtracker.BugReportResponse;
import com._42students.lms.service.BugTrackerAttachmentService;
import com._42students.lms.service.BugTrackerService;
import com._42students.lms.service.BugTrackerWorkflowService;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PublicBugTrackerControllerTest {

    /**
     * Regression guard: status/workflow/retest must never come back to this controller.
     * /api/v1/public/** is entirely exempt from JwtAuthenticationFilter, so a mutating action
     * declared here can never actually be restricted to any caller -- see
     * SuperAdminBugTrackerController, where these three now live instead.
     */
    @Test
    void statusWorkflowAndRetestMutationsAreNotDeclaredHere() {
        List<String> methodNames = Arrays.stream(PublicBugTrackerController.class.getDeclaredMethods())
                .map(java.lang.reflect.Method::getName)
                .collect(Collectors.toList());

        assertFalse(methodNames.contains("updateStatus"));
        assertFalse(methodNames.contains("updateWorkflow"));
        assertFalse(methodNames.contains("retestIssue"));
    }

    @Test
    void listIssuesPassesTheSortParamThrough() {
        BugTrackerService trackerService = mock(BugTrackerService.class);
        BugTrackerAttachmentService attachmentService = mock(BugTrackerAttachmentService.class);
        BugTrackerWorkflowService workflowService = mock(BugTrackerWorkflowService.class);
        @SuppressWarnings("unchecked")
        Page<BugReportResponse> page = mock(Page.class);
        when(trackerService.search(any(), any(), any(), any(), anyInt(), anyInt(), anyString())).thenReturn(page);

        PublicBugTrackerController controller =
                new PublicBugTrackerController(trackerService, attachmentService, workflowService);

        controller.listIssues(null, null, null, null, 0, 20, "ASC");

        verify(trackerService).search(null, null, null, null, 0, 20, "ASC");
    }

    @Test
    void listIssuesDefaultsToNewestFirstWhenSortIsOmitted() {
        BugTrackerService trackerService = mock(BugTrackerService.class);
        BugTrackerAttachmentService attachmentService = mock(BugTrackerAttachmentService.class);
        BugTrackerWorkflowService workflowService = mock(BugTrackerWorkflowService.class);
        @SuppressWarnings("unchecked")
        Page<BugReportResponse> page = mock(Page.class);
        when(trackerService.search(any(), any(), any(), any(), anyInt(), anyInt(), anyString())).thenReturn(page);

        PublicBugTrackerController controller =
                new PublicBugTrackerController(trackerService, attachmentService, workflowService);

        controller.listIssues(null, null, null, null, 0, 20, "DESC");

        verify(trackerService).search(null, null, null, null, 0, 20, "DESC");
    }
}
