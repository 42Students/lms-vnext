package com._42students.lms.service;

import com._42students.lms.dto.bugtracker.BugTrackerAttachmentConfirmRequest;
import com._42students.lms.dto.bugtracker.BugTrackerAttachmentPresignRequest;
import com._42students.lms.dto.bugtracker.BugTrackerAttachmentPresignResponse;
import com._42students.lms.dto.bugtracker.BugTrackerAttachmentResponse;
import com._42students.lms.model.BugReport;
import com._42students.lms.model.BugReportAttachment;
import com._42students.lms.repository.BugReportAttachmentRepository;
import com._42students.lms.repository.BugReportRepository;
import com._42students.lms.utils.R2StorageUtils;
import com.amazonaws.services.s3.model.ObjectMetadata;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class BugTrackerAttachmentServiceTest {
    private BugReportRepository reportRepository;
    private BugReportAttachmentRepository attachmentRepository;
    private ObjectProvider<R2StorageUtils> storageProvider;
    private R2StorageUtils storage;
    private BugTrackerAttachmentService service;

    @BeforeEach
    void setUp() {
        reportRepository = mock(BugReportRepository.class);
        attachmentRepository = mock(BugReportAttachmentRepository.class);
        storageProvider = mock(ObjectProvider.class);
        storage = mock(R2StorageUtils.class);
        when(storageProvider.getIfAvailable()).thenReturn(storage);
        service = new BugTrackerAttachmentService(reportRepository, attachmentRepository, storageProvider);

        BugReport report = new BugReport();
        report.setId(42L);
        report.setPublicId("LMS-0042");
        when(reportRepository.findByPublicIdIgnoreCase("LMS-0042")).thenReturn(Optional.of(report));
        when(attachmentRepository.countByBugReportId(42L)).thenReturn(0L);
    }

    @Test
    void prepareUploadUsesIssueScopedRandomR2Key() {
        when(storage.generatePresignedPutUrl(anyString(), eq("image/png"), eq(15)))
                .thenReturn("https://upload.example/signed");

        BugTrackerAttachmentPresignRequest request = new BugTrackerAttachmentPresignRequest();
        request.setFileName("screenshot.png");
        request.setContentType("image/png");
        request.setContentLength(1200L);

        BugTrackerAttachmentPresignResponse response = service.prepareUpload("LMS-0042", request);

        assertEquals("https://upload.example/signed", response.getUploadUrl());
        assertTrue(response.getStorageKey().startsWith("bug-tracker/LMS-0042/"));
        assertTrue(response.getStorageKey().endsWith(".png"));
    }

    @Test
    void prepareUploadRejectsNonImageFiles() {
        BugTrackerAttachmentPresignRequest request = new BugTrackerAttachmentPresignRequest();
        request.setFileName("payload.pdf");
        request.setContentType("application/pdf");
        request.setContentLength(1200L);

        ResponseStatusException error =
                assertThrows(ResponseStatusException.class, () -> service.prepareUpload("LMS-0042", request));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
        verify(storage, never()).generatePresignedPutUrl(anyString(), anyString(), anyInt());
    }

    @Test
    void confirmUploadVerifiesActualR2MetadataBeforePersisting() {
        String key = "bug-tracker/LMS-0042/123e4567-e89b-12d3-a456-426614174000.jpg";
        when(attachmentRepository.findByStorageKey(key)).thenReturn(Optional.empty());
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(4096L);
        metadata.setContentType("image/jpeg");
        when(storage.getObjectMetadata(key)).thenReturn(metadata);
        when(storage.getPublicUrl(key)).thenReturn("https://cdn.example/" + key);
        when(attachmentRepository.save(any(BugReportAttachment.class))).thenAnswer(invocation -> {
            BugReportAttachment attachment = invocation.getArgument(0);
            attachment.setId(9L);
            return attachment;
        });

        BugTrackerAttachmentConfirmRequest request = new BugTrackerAttachmentConfirmRequest();
        request.setStorageKey(key);
        request.setOriginalFilename("lesson-error.jpg");

        BugTrackerAttachmentResponse response = service.confirmUpload("LMS-0042", request);

        assertEquals(9L, response.getId());
        assertEquals("image/jpeg", response.getContentType());
        assertEquals(4096L, response.getSizeBytes());
        verify(attachmentRepository).save(argThat(a ->
                a.getBugReportId().equals(42L) && key.equals(a.getStorageKey())));
    }

    @Test
    void confirmUploadDeletesOversizedObjectInsteadOfSavingIt() {
        String key = "bug-tracker/LMS-0042/123e4567-e89b-12d3-a456-426614174000.png";
        when(attachmentRepository.findByStorageKey(key)).thenReturn(Optional.empty());
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(BugTrackerAttachmentService.MAX_IMAGE_BYTES + 1);
        metadata.setContentType("image/png");
        when(storage.getObjectMetadata(key)).thenReturn(metadata);

        BugTrackerAttachmentConfirmRequest request = new BugTrackerAttachmentConfirmRequest();
        request.setStorageKey(key);
        request.setOriginalFilename("too-large.png");

        ResponseStatusException error =
                assertThrows(ResponseStatusException.class, () -> service.confirmUpload("LMS-0042", request));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
        verify(storage).deleteFile(key);
        verify(attachmentRepository, never()).save(any());
    }
}
