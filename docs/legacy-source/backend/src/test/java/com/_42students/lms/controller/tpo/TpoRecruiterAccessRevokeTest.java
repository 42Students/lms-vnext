package com._42students.lms.controller.tpo;

import com._42students.lms.model.RecruiterCollegeAccess;
import com._42students.lms.service.company.CompanyDirectoryService;
import com._42students.lms.repository.RecruiterCollegeAccessRepository;
import com._42students.lms.repository.RecruiterRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.TpoAuditService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

/** Removing a recruiter's access: a reason too long for its column is refused in words, and removing again changes and logs nothing. */
class TpoRecruiterAccessRevokeTest {
    private final RecruiterCollegeAccessRepository access = mock(RecruiterCollegeAccessRepository.class);
    private final SecurityContextUtil ctx = mock(SecurityContextUtil.class);
    private final TpoAuditService audit = mock(TpoAuditService.class);
    private final TpoRecruiterAccessController controller = new TpoRecruiterAccessController(access, mock(RecruiterRepository.class),
            mock(CompanyDirectoryService.class), ctx, audit);

    @Test
    void longReasonsAreRefusedAndASecondRemovalIsANoOp() {
        when(ctx.getAuthenticatedUserPrincipal()).thenReturn(new UserPrincipal(5, "FACULTY", "FACULTY", 1, 6, 0));
        RecruiterCollegeAccess grant = new RecruiterCollegeAccess();
        when(access.findForRecruiterAndCollege(anyInt(), anyInt())).thenReturn(Optional.of(grant));
        TpoRecruiterAccessController.RevokeRequest tooLong = new TpoRecruiterAccessController.RevokeRequest();
        tooLong.reason = "x".repeat(501);
        assertThrows(IllegalArgumentException.class, () -> controller.revoke(9, tooLong));

        controller.revoke(9, null);
        controller.revoke(9, null);
        verify(access, times(1)).save(any());
        verify(audit, times(1)).log(any(), any(), any(), any(), any(), any(), any());
    }
}
