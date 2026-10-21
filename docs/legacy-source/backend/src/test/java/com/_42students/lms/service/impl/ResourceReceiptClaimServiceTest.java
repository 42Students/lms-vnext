package com._42students.lms.service.impl;

import com._42students.lms.dto.request.ContentDataDTO;
import com._42students.lms.dto.request.FileDTO;
import com._42students.lms.dto.request.ResourceMaterialDTO;
import com._42students.lms.model.AssignmentUploadReceipt;
import com._42students.lms.repository.AssignmentUploadReceiptRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import com._42students.lms.utils.ContentUrlValidator;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ResourceReceiptClaimServiceTest {
    private static final String KEY = "org-1/college-2/lesson-content/class-12/user-45/123e4567-e89b-12d3-a456-426614174000.pdf";

    private static ContentDataDTO files(String key) {
        FileDTO file = new FileDTO();
        file.setCloudStorageObject(key);
        file.setOriginalName("notes.pdf");
        file.setMimetype("application/pdf");
        file.setSize(100);
        ResourceMaterialDTO material = new ResourceMaterialDTO();
        material.setKind("FILE");
        material.setFileDTO(file);
        ContentDataDTO data = new ContentDataDTO();
        data.setResourceMaterials(List.of(material));
        return data;
    }

    private static AssignmentUploadReceipt receipt() {
        AssignmentUploadReceipt receipt = new AssignmentUploadReceipt();
        receipt.setReceiptId("receipt-1");
        receipt.setOwnerUserId(45);
        receipt.setOwnerUserType("FACULTY");
        receipt.setStorageKey(KEY);
        receipt.setFolder("lesson-content");
        receipt.setUploadType("resource");
        receipt.setDeclaredContentLength(100L);
        receipt.setDeclaredContentType("application/pdf");
        receipt.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        return receipt;
    }

    @Test
    void ownershipExpirationAndPriorConsumptionAreChecked() {
        UserPrincipal owner = new UserPrincipal(45, "FACULTY", "TEACHER", 1, 2, 0);
        AssignmentUploadReceipt receipt = receipt();
        FileDTO file = files(KEY).getResourceMaterials().get(0).getFileDTO();
        LocalDateTime now = LocalDateTime.now();
        assertTrue(ResourceReceiptClaimService.validNewReceipt(receipt, owner, KEY, file, now));
        assertFalse(ResourceReceiptClaimService.validNewReceipt(receipt,
                new UserPrincipal(46, "FACULTY", "TEACHER", 1, 2, 0), KEY, file, now));
        receipt.setConsumedAt(now);
        assertFalse(ResourceReceiptClaimService.validNewReceipt(receipt, owner, KEY, file, now));
        receipt.setConsumedAt(null);
        receipt.setExpiresAt(now.minusSeconds(1));
        assertFalse(ResourceReceiptClaimService.validNewReceipt(receipt, owner, KEY, file, now));
    }

    @Test
    void conflictingAtomicClaimRejectsSecondContentAndExistingFilesAreRetained() {
        AssignmentUploadReceiptRepository repository = mock(AssignmentUploadReceiptRepository.class);
        ContentUrlValidator urls = mock(ContentUrlValidator.class);
        SecurityContextUtil security = mock(SecurityContextUtil.class);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(
                new UserPrincipal(45, "FACULTY", "TEACHER", 1, 2, 0));
        when(urls.resolveStorageKeyFromValue(KEY)).thenReturn(KEY);
        when(repository.findByStorageKeyAndIsDeletedFalse(KEY)).thenReturn(Optional.of(receipt()));
        ResourceReceiptClaimService service = new ResourceReceiptClaimService(repository, urls, security);
        when(repository.claimResourceUpload(eq("receipt-1"), eq(KEY), eq(45), eq(101), any(LocalDateTime.class)))
                .thenReturn(1);
        service.claimNewFiles(files(KEY), null, 101);
        verify(repository, times(1)).claimResourceUpload(eq("receipt-1"), eq(KEY), eq(45), eq(101), any(LocalDateTime.class));
        clearInvocations(repository);
        service.claimNewFiles(files(KEY), files(KEY), 101);
        verifyNoInteractions(repository);

        when(repository.claimResourceUpload(eq("receipt-1"), eq(KEY), eq(45), eq(102), any(LocalDateTime.class)))
                .thenReturn(0);
        ResponseStatusException conflict = assertThrows(ResponseStatusException.class,
                () -> service.claimNewFiles(files(KEY), null, 102));
        assertEquals(HttpStatus.CONFLICT, conflict.getStatus());
    }
}
