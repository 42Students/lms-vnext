package com._42students.lms.service;

import com._42students.lms.repository.AdminAuditLogRepository;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminAuditLogCategoryTest {

    @Test
    void knownCategoryIsPassedThroughWithAClampedPage() {
        AdminAuditLogRepository repo = mock(AdminAuditLogRepository.class);
        when(repo.searchByCategory(any(), any(), any(), any(), any(), any(), any(Pageable.class))).thenReturn(Page.empty());
        AdminAuditLogService service = new AdminAuditLogService(repo, mock(SecurityContextUtil.class));

        service.searchByCategory("important", null, null, 6, null, null, -3, 5000);

        verify(repo).searchByCategory(eq("important"), isNull(), isNull(), eq(6), isNull(), isNull(),
                eq(org.springframework.data.domain.PageRequest.of(0, 500)));
    }

    @Test
    void unknownCategoryIsRejectedRatherThanReturningEverything() {
        AdminAuditLogService service = new AdminAuditLogService(mock(AdminAuditLogRepository.class), mock(SecurityContextUtil.class));
        assertThrows(IllegalArgumentException.class, () -> service.searchByCategory("anything", null, null, 6, null, null, 0, 50));
    }
}
