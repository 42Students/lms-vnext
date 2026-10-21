package com._42students.lms.service.impl;

import com._42students.lms.dto.request.ContentDataDTO;
import com._42students.lms.dto.request.AssignmentSubmissionAssetDTO;
import com._42students.lms.dto.request.FileDTO;
import com._42students.lms.dto.request.StudentAssignmentDTO;
import com._42students.lms.model.AssignmentUploadReceipt;
import com._42students.lms.model.LessonContents;
import com._42students.lms.model.StudentAssignment;
import com._42students.lms.repository.AssignmentUploadReceiptRepository;
import com._42students.lms.repository.GradeAuditLogRepository;
import com._42students.lms.repository.StudentAssignmentRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.CourseService;
import com._42students.lms.service.FacultyService;
import com._42students.lms.service.LearnerService;
import com._42students.lms.service.LessonContentsService;
import com._42students.lms.service.NotificationTemplateContextResolver;
import com._42students.lms.util.SecurityContextUtil;
import com._42students.lms.utils.R2StorageUtils;
import com.amazonaws.services.s3.model.ObjectMetadata;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AssignmentServiceImplSubmitLifecycleTest {
    private AssignmentServiceImpl service;
    private StudentAssignmentRepository submissions;
    private LessonContentsService contents;
    private AssignmentUploadReceiptRepository uploadReceipts;
    private R2StorageUtils r2StorageUtils;

    @BeforeEach
    void setUp() {
        service = new AssignmentServiceImpl();
        submissions = mock(StudentAssignmentRepository.class);
        contents = mock(LessonContentsService.class);
        uploadReceipts = mock(AssignmentUploadReceiptRepository.class);
        r2StorageUtils = mock(R2StorageUtils.class);
        SecurityContextUtil security = mock(SecurityContextUtil.class);
        when(security.getAuthenticatedUserPrincipal())
                .thenReturn(new UserPrincipal(42, "LEARNER", null, 1, 6, 0));
        when(submissions.save(any(StudentAssignment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReflectionTestUtils.setField(service, "studentAssignmentRepository", submissions);
        ReflectionTestUtils.setField(service, "lessonContentsService", contents);
        ReflectionTestUtils.setField(service, "facultyService", mock(FacultyService.class));
        ReflectionTestUtils.setField(service, "learnerService", mock(LearnerService.class));
        ReflectionTestUtils.setField(service, "courseService", mock(CourseService.class));
        ReflectionTestUtils.setField(service, "contextResolver", mock(NotificationTemplateContextResolver.class));
        ReflectionTestUtils.setField(service, "gradeAuditLogRepository", mock(GradeAuditLogRepository.class));
        ReflectionTestUtils.setField(service, "securityContextUtil", security);
        ReflectionTestUtils.setField(service, "assignmentUploadReceiptRepository", uploadReceipts);
        ReflectionTestUtils.setField(service, "r2StorageUtils", r2StorageUtils);
    }

    @Test
    void submitRejectsAssignmentsThatAreNotLearnerVisible() {
        assertUnavailable(inactiveAssignment(), "Assignment is not available for submission");
        assertUnavailable(disabledAssignment(), "Assignment is not available for submission");
        assertUnavailable(deletedAssignment(), "Assignment not found");
        assertUnavailable(nonAssignmentContent(), "lesson content type 'assignment'");
        assertUnavailable(expiredAssignment(), "Submission deadline has passed");
    }

    @Test
    void submitPersistsVisibleAssignment() {
        when(contents.getLessonContents(11)).thenReturn(openAssignment());

        StudentAssignment saved = service.submit(request());

        assertEquals(11, saved.getLessonContentId());
        assertEquals(42, saved.getStudentId());
        assertEquals("WRITTEN_RESPONSE", saved.getSubmissionType());
        verify(submissions).save(any(StudentAssignment.class));
    }

    @Test
    void multipartSubmissionRejectsDuplicateAssetIdsAndBlankWrittenResponse() {
        when(contents.getLessonContents(11)).thenReturn(openAssignment());

        StudentAssignmentDTO duplicate = request();
        AssignmentSubmissionAssetDTO first = asset("same", "WRITTEN_RESPONSE");
        AssignmentSubmissionAssetDTO second = asset("same", "WRITTEN_RESPONSE");
        duplicate.setSubmissionAssets(List.of(first, second));
        assertThrows(IllegalArgumentException.class, () -> service.submit(duplicate));

        StudentAssignmentDTO blankWritten = request();
        blankWritten.setHtmlContent(" ");
        blankWritten.setSubmissionAssets(List.of(asset("written", "WRITTEN_RESPONSE")));
        assertThrows(IllegalArgumentException.class, () -> service.submit(blankWritten));

        StudentAssignmentDTO tagOnlyWritten = request();
        tagOnlyWritten.setHtmlContent("<p><br></p>");
        assertThrows(IllegalArgumentException.class, () -> service.submit(tagOnlyWritten));
    }

    @Test
    void fileSubmissionConsumesMatchingUploadReceiptAfterStorageHead() {
        LessonContents content = openAssignment();
        content.getContentDataDTO().setAllowedSubmissionTypes(List.of("FILE_UPLOAD"));
        when(contents.getLessonContents(11)).thenReturn(content);

        AssignmentUploadReceipt receipt = new AssignmentUploadReceipt();
        receipt.setReceiptId("receipt-1");
        receipt.setStorageKey("org-1/college-6/assignments/file.pdf");
        receipt.setOwnerUserId(42);
        receipt.setLessonContentId(11);
        receipt.setDeclaredContentLength(1024L);
        receipt.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        when(uploadReceipts.findByReceiptIdAndIsDeletedFalse("receipt-1")).thenReturn(Optional.of(receipt));
        when(uploadReceipts.save(any(AssignmentUploadReceipt.class))).thenAnswer(invocation -> invocation.getArgument(0));
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(1024L);
        metadata.setContentType("application/pdf");
        when(r2StorageUtils.getObjectMetadata("org-1/college-6/assignments/file.pdf")).thenReturn(metadata);

        StudentAssignmentDTO dto = request();
        dto.setHtmlContent(null);
        dto.setSubmissionType("FILE_UPLOAD");
        dto.setUploadReceiptId("receipt-1");
        FileDTO file = new FileDTO();
        file.setCloudStorageObject("org-1/college-6/assignments/file.pdf");
        dto.setFileDTO(file);

        StudentAssignment saved = service.submit(dto);

        assertEquals("FILE_UPLOAD", saved.getSubmissionType());
        org.junit.jupiter.api.Assertions.assertNotNull(receipt.getConsumedAt());
        assertEquals(1024L, receipt.getActualContentLength());
        verify(uploadReceipts, org.mockito.Mockito.atLeastOnce()).save(receipt);
    }

    @Test
    void fileSubmissionRejectsForgedReusedOrMismatchedUploadReceipt() {
        LessonContents content = openAssignment();
        content.getContentDataDTO().setAllowedSubmissionTypes(List.of("FILE_UPLOAD"));
        when(contents.getLessonContents(11)).thenReturn(content);

        assertReceiptRejected(receipt(99, 11, "org-1/college-6/assignments/file.pdf", null, 1024L),
                "Upload receipt does not belong to this learner.");
        assertReceiptRejected(receipt(42, 11, "org-1/college-6/assignments/other.pdf", null, 1024L),
                "Upload receipt does not match the submitted file.");
        assertReceiptRejected(receipt(42, 11, "org-1/college-6/assignments/file.pdf", LocalDateTime.now(), 1024L),
                "Upload receipt has already been used.");

        AssignmentUploadReceipt sizeMismatch = receipt(42, 11, "org-1/college-6/assignments/file.pdf", null, 2048L);
        when(uploadReceipts.findByReceiptIdAndIsDeletedFalse("receipt-1")).thenReturn(Optional.of(sizeMismatch));
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(1024L);
        metadata.setContentType("application/pdf");
        when(r2StorageUtils.getObjectMetadata("org-1/college-6/assignments/file.pdf")).thenReturn(metadata);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.submit(fileRequest()));
        org.junit.jupiter.api.Assertions.assertTrue(ex.getMessage().contains("size does not match"));
    }

    private void assertUnavailable(LessonContents lessonContents, String expectedMessage) {
        when(contents.getLessonContents(11)).thenReturn(lessonContents);
        if (Boolean.TRUE.equals(lessonContents.getIsDeleted()) || !lessonContents.isActive() || !lessonContents.isEnabled()) {
            ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.submit(request()));
            HttpStatus expectedStatus = Boolean.TRUE.equals(lessonContents.getIsDeleted())
                    ? HttpStatus.NOT_FOUND : HttpStatus.CONFLICT;
            assertEquals(expectedStatus, ex.getStatus());
            assertTrue(ex.getReason() != null && ex.getReason().contains(expectedMessage));
        } else {
            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.submit(request()));
            assertTrue(ex.getMessage().contains(expectedMessage));
        }
        verify(submissions, never()).save(any(StudentAssignment.class));
    }

    private StudentAssignmentDTO request() {
        StudentAssignmentDTO dto = new StudentAssignmentDTO();
        dto.setLessonContentId(11);
        dto.setStudentId(42);
        dto.setHtmlContent("My answer");
        return dto;
    }

    private StudentAssignmentDTO fileRequest() {
        StudentAssignmentDTO dto = request();
        dto.setHtmlContent(null);
        dto.setSubmissionType("FILE_UPLOAD");
        dto.setUploadReceiptId("receipt-1");
        FileDTO file = new FileDTO();
        file.setCloudStorageObject("org-1/college-6/assignments/file.pdf");
        dto.setFileDTO(file);
        return dto;
    }

    private AssignmentUploadReceipt receipt(int ownerUserId, int lessonContentId, String key, LocalDateTime consumedAt, long declaredLength) {
        AssignmentUploadReceipt receipt = new AssignmentUploadReceipt();
        receipt.setReceiptId("receipt-1");
        receipt.setStorageKey(key);
        receipt.setOwnerUserId(ownerUserId);
        receipt.setLessonContentId(lessonContentId);
        receipt.setDeclaredContentLength(declaredLength);
        receipt.setConsumedAt(consumedAt);
        receipt.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        return receipt;
    }

    private void assertReceiptRejected(AssignmentUploadReceipt receipt, String expectedMessage) {
        when(uploadReceipts.findByReceiptIdAndIsDeletedFalse("receipt-1")).thenReturn(Optional.of(receipt));
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.submit(fileRequest()));
        org.junit.jupiter.api.Assertions.assertTrue(ex.getMessage().contains(expectedMessage));
    }

    private AssignmentSubmissionAssetDTO asset(String id, String type) {
        AssignmentSubmissionAssetDTO asset = new AssignmentSubmissionAssetDTO();
        asset.setId(id);
        asset.setType(type);
        return asset;
    }

    private LessonContents openAssignment() {
        LessonContents content = new LessonContents();
        content.setId(11);
        content.setContentType("assignment");
        content.setContentTitle("Lifecycle assignment");
        content.setActive(true);
        content.setEnabled(true);
        content.setIsDeleted(false);
        content.setDeadline(LocalDateTime.now().plusDays(1));
        ContentDataDTO data = new ContentDataDTO();
        data.setAllowedSubmissionTypes(List.of("WRITTEN_RESPONSE"));
        content.setContentDataDTO(data);
        return content;
    }

    private LessonContents inactiveAssignment() {
        LessonContents content = openAssignment();
        content.setActive(false);
        return content;
    }

    private LessonContents disabledAssignment() {
        LessonContents content = openAssignment();
        content.setEnabled(false);
        return content;
    }

    private LessonContents deletedAssignment() {
        LessonContents content = openAssignment();
        content.setIsDeleted(true);
        return content;
    }

    private LessonContents nonAssignmentContent() {
        LessonContents content = openAssignment();
        content.setContentType("video");
        return content;
    }

    private LessonContents expiredAssignment() {
        LessonContents content = openAssignment();
        content.setDeadline(LocalDateTime.now().minusMinutes(1));
        return content;
    }
}
