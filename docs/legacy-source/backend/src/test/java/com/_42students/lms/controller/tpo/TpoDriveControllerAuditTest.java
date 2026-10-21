package com._42students.lms.controller.tpo;

import com._42students.lms.model.Job;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.TpoAccessGuard;
import com._42students.lms.service.tpo.TpoAuditService;
import com._42students.lms.service.tpo.TpoDriveService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** "Everything logs itself": every drive lifecycle action is written to the audit log, attributed to the acting TPO. */
class TpoDriveControllerAuditTest {

    private TpoDriveService drives;
    private JobRepository jobRepo;
    private TpoAuditService audit;
    private TpoDriveController controller;
    private Job job;

    @BeforeEach
    void setUp() {
        drives = mock(TpoDriveService.class);
        jobRepo = mock(JobRepository.class);
        audit = mock(TpoAuditService.class);
        SecurityContextUtil sec = mock(SecurityContextUtil.class);
        UserPrincipal p = new UserPrincipal(7, "FACULTY", "TPO", 1, 42, 0);
        when(sec.getAuthenticatedUserPrincipal()).thenReturn(p);
        controller = new TpoDriveController(drives, jobRepo, sec, mock(TpoAccessGuard.class), audit);
        job = new Job();
        job.setId(38);
        job.setCompanyName("Acme");
        job.setJobTitle("Engineer");
        when(jobRepo.findById(38)).thenReturn(Optional.of(job));
    }

    private void assertLogged(String action, String detailContains) {
        ArgumentCaptor<String> detail = ArgumentCaptor.forClass(String.class);
        verify(audit).log(eq(42), eq("TPO"), eq(7), eq(action), eq("DRIVE"), eq(38L), detail.capture());
        assertTrue(detail.getValue().startsWith("Acme · Engineer"), detail.getValue());
        if (detailContains != null) assertTrue(detail.getValue().contains(detailContains), detail.getValue());
    }

    @Test
    void publishIsLogged() {
        when(drives.publish(eq(38), eq(7), anyBoolean())).thenReturn(job);
        controller.publish(38, true);
        assertLogged("DRIVE_PUBLISHED", "students emailed");
    }

    @Test
    void cancelIsLoggedWithItsReason() {
        when(drives.cancel(eq(38), any(), eq(7))).thenReturn(job);
        controller.cancel(38, Map.of("reason", "Company withdrew"));
        assertLogged("DRIVE_CANCELLED", "Company withdrew");
    }

    @Test
    void closeExtendApproveRejectSendBackAreLogged() {
        when(drives.close(eq(38), eq(7))).thenReturn(job);
        controller.close(38);
        assertLogged("DRIVE_CLOSED", null);

        reset(audit);
        when(drives.extendDeadline(eq(38), any(LocalDateTime.class))).thenReturn(job);
        controller.extendDeadline(38, Map.of("newDeadline", "2026-11-01T10:00:00"));
        assertLogged("DEADLINE_EXTENDED", "2026-11-01T10:00:00");

        reset(audit);
        when(drives.approveRequest(eq(38), eq(7))).thenReturn(job);
        controller.approve(38);
        assertLogged("REQUEST_APPROVED", null);

        reset(audit);
        when(drives.rejectRequest(eq(38), any())).thenReturn(job);
        controller.reject(38, Map.of("reason", "Not a fit"));
        assertLogged("REQUEST_REJECTED", "Not a fit");

        reset(audit);
        when(drives.sendBack(eq(38), any())).thenReturn(job);
        controller.sendBack(38, Map.of("note", "Add the CTC"));
        assertLogged("DRIVE_SENT_BACK", "Add the CTC");
    }

    @Test
    void creatingADraftIsLoggedAndAutosavesAreLoggedAtMostEveryTenMinutes() {
        when(drives.createDraft(any(), anyInt(), anyInt(), anyInt())).thenReturn(job);
        controller.create(new com._42students.lms.dto.tpo.DriveForm());
        assertLogged("DRIVE_CREATED", null);

        reset(audit);
        when(drives.updateDraft(eq(38), any())).thenReturn(job);
        controller.update(38, new com._42students.lms.dto.tpo.DriveForm());
        // The form autosaves as you type; one entry per save would bury the log. BE-0056: edits must still show, so the
        // save goes through the rate-limited logAtMostEvery (one entry per person and drive per 10 minutes), never log().
        verify(audit, never()).log(any(), any(), any(), any(), any(), any(), any());
        verify(audit).logAtMostEvery(eq(10), any(), eq("TPO"), any(), eq("DRIVE_EDITED"), eq("DRIVE"), eq(38L), any());
        assertEquals(38, job.getId());
    }
}
