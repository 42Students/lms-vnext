package com._42students.lms.controller;

import com._42students.lms.dto.request.ContentDataDTO;
import com._42students.lms.dto.request.FileDTO;
import com._42students.lms.dto.request.ResourceMaterialDTO;
import com._42students.lms.model.AssignmentUploadReceipt;
import com._42students.lms.model.LessonContents;
import com._42students.lms.security.UserPrincipal;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ResourceUploadReceiptAdviceTest {
    private static final String KEY = "org-1/college-2/lesson-content/12345678.pdf";
    private static final String MIME = "application/pdf";

    private static AssignmentUploadReceipt receipt() {
        AssignmentUploadReceipt receipt = new AssignmentUploadReceipt();
        receipt.setReceiptId("test-receipt");
        receipt.setOwnerUserId(45);
        receipt.setOwnerUserType("FACULTY");
        receipt.setFolder("lesson-content");
        receipt.setUploadType("generic");
        receipt.setStorageKey(KEY);
        receipt.setDeclaredContentType(MIME);
        receipt.setDeclaredContentLength(100L);
        receipt.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        return receipt;
    }

    private static UserPrincipal faculty(int id) {
        return new UserPrincipal(id, "FACULTY", "TEACHER", 1, 2, 0);
    }

    @Test
    void rejectsBorrowedExpiredOrReusedUploads() {
        LocalDateTime now = LocalDateTime.now();
        AssignmentUploadReceipt receipt = receipt();
        assertTrue(ResourceUploadReceiptAdvice.isOwnedUnconsumedReceipt(receipt, faculty(45), KEY, 100, MIME, now, null));
        assertFalse(ResourceUploadReceiptAdvice.isOwnedUnconsumedReceipt(receipt, faculty(46), KEY, 100, MIME, now, null));
        assertFalse(ResourceUploadReceiptAdvice.isOwnedUnconsumedReceipt(receipt, faculty(45), KEY + "x", 100, MIME, now, null));
        assertFalse(ResourceUploadReceiptAdvice.isOwnedUnconsumedReceipt(receipt, faculty(45), KEY, 101, MIME, now, null));
        assertFalse(ResourceUploadReceiptAdvice.isOwnedUnconsumedReceipt(receipt, faculty(45), KEY, 100, "text/plain", now, null));
        receipt.setExpiresAt(now.minusSeconds(1));
        assertFalse(ResourceUploadReceiptAdvice.isOwnedUnconsumedReceipt(receipt, faculty(45), KEY, 100, MIME, now, null));
        receipt.setConsumedAt(now.minusMinutes(1));
        receipt.setLessonContentId(12);
        assertFalse(ResourceUploadReceiptAdvice.isOwnedUnconsumedReceipt(receipt, faculty(45), KEY, 100, MIME, now, null));
        assertFalse(ResourceUploadReceiptAdvice.isOwnedUnconsumedReceipt(receipt, faculty(45), KEY, 100, MIME, now, 13));
        assertTrue(ResourceUploadReceiptAdvice.isOwnedUnconsumedReceipt(receipt, faculty(45), KEY, 100, MIME, now, 12));
    }

    @Test
    void dedicatedResourceReceiptsAreBoundToUploaderAndCourseOrClass() {
        LocalDateTime now = LocalDateTime.now();
        UserPrincipal owner = faculty(45);
        String scopedCourse = ResourceUploadController.keyPrefix(1, 2, 8, null, 45) + "abc.pdf";
        AssignmentUploadReceipt receipt = receipt();
        receipt.setUploadType("resource");
        receipt.setStorageKey(scopedCourse);
        assertTrue(ResourceUploadReceiptAdvice.isOwnedUnconsumedReceipt(
                receipt, owner, scopedCourse, 100, MIME, now, null));
        assertTrue(ResourceUploadReceiptAdvice.keyMatchesResourceScope(scopedCourse, "resource", owner, 8, null));
        assertFalse(ResourceUploadReceiptAdvice.keyMatchesResourceScope(scopedCourse, "resource", owner, 9, null));
        assertFalse(ResourceUploadReceiptAdvice.keyMatchesResourceScope(scopedCourse, "resource", faculty(46), 8, null));
        assertFalse(ResourceUploadReceiptAdvice.keyMatchesResourceScope(scopedCourse, "resource", owner, 8, 12));
        String scopedClass = ResourceUploadController.keyPrefix(1, 2, 8, 12, 45) + "abc.pdf";
        assertTrue(ResourceUploadReceiptAdvice.keyMatchesResourceScope(scopedClass, "resource", owner, 8, 12));
        assertFalse(ResourceUploadReceiptAdvice.keyMatchesResourceScope(scopedClass, "resource", owner, 8, 13));
        assertFalse(ResourceUploadReceiptAdvice.keyMatchesResourceScope(KEY, "resource", owner, 8, null));
        // Older, flat generic-upload keys remain eligible only with their own uploader receipt.
        assertTrue(ResourceUploadReceiptAdvice.keyMatchesResourceScope(KEY, "generic", owner, 8, null));
    }

    @Test
    void rejectsAssignmentReceiptsForResourceFiles() {
        AssignmentUploadReceipt receipt = receipt();
        receipt.setFolder("assignments");
        assertFalse(ResourceUploadReceiptAdvice.isOwnedUnconsumedReceipt(receipt, faculty(45), KEY, 100, MIME, LocalDateTime.now(), null));
        receipt.setFolder("lesson-content");
        receipt.setUploadType("assignment");
        assertFalse(ResourceUploadReceiptAdvice.isOwnedUnconsumedReceipt(receipt, faculty(45), KEY, 100, MIME, LocalDateTime.now(), null));
    }
}
