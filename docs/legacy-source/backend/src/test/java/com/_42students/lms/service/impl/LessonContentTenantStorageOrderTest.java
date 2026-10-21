package com._42students.lms.service.impl;

import com._42students.lms.dto.request.ContentDataDTO;
import com._42students.lms.dto.request.FileDTO;
import com._42students.lms.dto.request.LessonContentsDTO;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import com._42students.lms.utils.ContentUrlValidator;
import com._42students.lms.utils.R2StorageUtils;
import com.amazonaws.services.s3.model.ObjectMetadata;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** An unauthorized storage key must never cause R2 HEAD or DELETE side effects. */
class LessonContentTenantStorageOrderTest {
    private LessonContentsServiceImpl service;
    private ContentUrlValidator validator;
    private R2StorageUtils storage;
    private SecurityContextUtil security;
    private UserPrincipal faculty;

    @BeforeEach
    void setup() {
        service = new LessonContentsServiceImpl();
        validator = mock(ContentUrlValidator.class);
        storage = mock(R2StorageUtils.class);
        security = mock(SecurityContextUtil.class);
        faculty = new UserPrincipal(17, "FACULTY", "TEACHER", 1, 10, 0);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(faculty);
        ReflectionTestUtils.setField(service, "contentUrlValidator", validator);
        ReflectionTestUtils.setField(service, "r2StorageUtils", storage);
        ReflectionTestUtils.setField(service, "securityContextUtil", security);
        ReflectionTestUtils.setField(service, "maxVideoSizeBytes", 100L);
    }

    private LessonContentsDTO file(String key) {
        FileDTO file = new FileDTO();
        file.setCloudStorageObject(key);
        ContentDataDTO contents = new ContentDataDTO();
        contents.setFileDTO(file);
        LessonContentsDTO request = new LessonContentsDTO();
        request.setContentDataDTO(contents);
        when(validator.resolveStorageKeyFromValue(key)).thenReturn(key);
        when(validator.isAllowedStorageKey(key)).thenReturn(true);
        return request;
    }

    @Test
    void crossTenantOversizedFileIsRejectedBeforeAnyR2Request() {
        String key = "org-2/college-20/lesson-content/known.pdf";
        LessonContentsDTO request = file(key);
        ResponseStatusException denied = assertThrows(ResponseStatusException.class,
                () -> ReflectionTestUtils.invokeMethod(service, "validateFileBasedContent", request, "video"));
        assertEquals(HttpStatus.FORBIDDEN, denied.getStatus());
        verifyNoInteractions(storage);
    }

    @Test
    void crossCollegeSameOrganizationCannotTriggerR2ReadsOrDeletion() {
        String key = "org-1/college-20/lesson-content/known.pdf";
        LessonContentsDTO request = file(key);
        assertThrows(ResponseStatusException.class,
                () -> ReflectionTestUtils.invokeMethod(service, "validateFileBasedContent", request, "video"));
        verifyNoInteractions(storage);
    }

    @Test
    void ownedFileWithinSizeLimitMayBeValidatedWithoutDeletion() {
        String key = "org-1/college-10/lesson-content/valid.pdf";
        LessonContentsDTO request = file(key);
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(80L);
        when(storage.getObjectMetadata(key)).thenReturn(metadata);
        assertDoesNotThrow(() -> ReflectionTestUtils.invokeMethod(service, "validateFileBasedContent", request, "video"));
        verify(storage).getObjectMetadata(key);
        verify(storage, never()).deleteFile(anyString());
    }

    @Test
    void ownedOversizedFileRetainsExistingBestEffortCleanupBehavior() {
        String key = "org-1/college-10/lesson-content/large.pdf";
        LessonContentsDTO request = file(key);
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(101L);
        when(storage.getObjectMetadata(key)).thenReturn(metadata);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> ReflectionTestUtils.invokeMethod(service, "validateFileBasedContent", request, "video"));
        assertTrue(ex.getMessage().contains("maximum allowed size"));
        verify(storage).getObjectMetadata(key);
        verify(storage).deleteFile(key);
    }
}
