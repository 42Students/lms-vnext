package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.bugtracker.BugReportResponse;
import com._42students.lms.dto.bugtracker.BugReportRetestRequest;
import com._42students.lms.dto.bugtracker.BugReportStatusRequest;
import com._42students.lms.dto.bugtracker.BugReportWorkflowRequest;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.BugTrackerService;
import com._42students.lms.service.BugTrackerWorkflowService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Regression coverage for a real vulnerability: these three actions used to live under
 * /api/v1/public/bug-tracker with zero authorization -- anyone who knew or guessed a publicId
 * could close/reopen any bug report, fabricate a retest result, or overwrite its engineering
 * fields. This controller (and JwtAuthenticationFilter actually running for it, since it isn't
 * under /api/v1/public) is the fix; these tests pin that a non-super-admin caller is rejected.
 */
class SuperAdminBugTrackerControllerTest {

    private BugTrackerService trackerService;
    private BugTrackerWorkflowService workflowService;
    private SecurityContextUtil securityContextUtil;
    private AccessControlService accessControlService;
    private SuperAdminBugTrackerController controller;

    @BeforeEach
    void setup() {
        trackerService = mock(BugTrackerService.class);
        workflowService = mock(BugTrackerWorkflowService.class);
        securityContextUtil = mock(SecurityContextUtil.class);
        accessControlService = mock(AccessControlService.class);
        controller = new SuperAdminBugTrackerController(
                trackerService, workflowService, securityContextUtil, accessControlService);
    }

    private BugReportStatusRequest statusRequest(String status) {
        BugReportStatusRequest r = new BugReportStatusRequest();
        r.setStatus(status);
        return r;
    }

    private BugReportRetestRequest retestRequest(String result) {
        BugReportRetestRequest r = new BugReportRetestRequest();
        r.setResult(result);
        return r;
    }

    @Test
    void updateStatusRejectsANonSuperAdminCaller() {
        UserPrincipal learner = new UserPrincipal(42, "LEARNER", null, 1, 2, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(learner);
        when(accessControlService.isSuperAdmin(learner)).thenReturn(false);

        assertThrows(AccessDeniedException.class,
                () -> controller.updateStatus("BUG-1", statusRequest("CLOSED")));
        verifyNoInteractions(workflowService);
    }

    @Test
    void updateStatusRejectsAnUnauthenticatedCaller() {
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(null);
        when(accessControlService.isSuperAdmin(null)).thenReturn(false);

        assertThrows(AccessDeniedException.class,
                () -> controller.updateStatus("BUG-1", statusRequest("CLOSED")));
        verifyNoInteractions(workflowService);
    }

    @Test
    void updateStatusSucceedsForASuperAdmin() {
        UserPrincipal superAdmin = UserPrincipal.forSuperAdmin();
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(superAdmin);
        when(accessControlService.isSuperAdmin(superAdmin)).thenReturn(true);
        when(trackerService.get("BUG-1")).thenReturn(mock(BugReportResponse.class));

        controller.updateStatus("BUG-1", statusRequest("CLOSED"));

        verify(workflowService).updateStatus("BUG-1", "CLOSED");
    }

    @Test
    void updateWorkflowRejectsANonSuperAdminCaller() {
        UserPrincipal learner = new UserPrincipal(42, "LEARNER", null, 1, 2, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(learner);
        when(accessControlService.isSuperAdmin(learner)).thenReturn(false);

        assertThrows(AccessDeniedException.class,
                () -> controller.updateWorkflow("BUG-1", new BugReportWorkflowRequest()));
        verifyNoInteractions(workflowService);
    }

    @Test
    void updateWorkflowSucceedsForASuperAdmin() {
        UserPrincipal superAdmin = UserPrincipal.forSuperAdmin();
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(superAdmin);
        when(accessControlService.isSuperAdmin(superAdmin)).thenReturn(true);
        when(trackerService.get("BUG-1")).thenReturn(mock(BugReportResponse.class));
        BugReportWorkflowRequest request = new BugReportWorkflowRequest();

        controller.updateWorkflow("BUG-1", request);

        verify(workflowService).updateWorkflow("BUG-1", request);
    }

    @Test
    void retestIssueRejectsANonSuperAdminCaller() {
        UserPrincipal learner = new UserPrincipal(42, "LEARNER", null, 1, 2, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(learner);
        when(accessControlService.isSuperAdmin(learner)).thenReturn(false);

        assertThrows(AccessDeniedException.class,
                () -> controller.retestIssue("BUG-1", retestRequest("PASS")));
        verifyNoInteractions(workflowService);
    }

    @Test
    void retestIssueSucceedsForASuperAdmin() {
        UserPrincipal superAdmin = UserPrincipal.forSuperAdmin();
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(superAdmin);
        when(accessControlService.isSuperAdmin(superAdmin)).thenReturn(true);
        when(trackerService.get("BUG-1")).thenReturn(mock(BugReportResponse.class));
        BugReportRetestRequest request = retestRequest("PASS");

        controller.retestIssue("BUG-1", request);

        verify(workflowService).retest("BUG-1", request);
    }
}
