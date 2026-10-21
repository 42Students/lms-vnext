package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.request.PresignUploadRequestDTO;
import com._42students.lms.dto.response.PresignUploadResponseDTO;
import com._42students.lms.model.AssignmentUploadReceipt;
import com._42students.lms.model.LessonContents;
import com._42students.lms.repository.AssignmentUploadReceiptRepository;
import com._42students.lms.repository.LessonContentsRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import com._42students.lms.utils.R2StorageUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import javax.servlet.http.HttpServletRequest;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FileUploadControllerAssignmentReceiptTest {
    private FileUploadController controller;
    private AssignmentUploadReceiptRepository uploadReceipts;

    @BeforeEach
    void setUp() {
        controller = new FileUploadController();
        SecurityContextUtil securityContextUtil = mock(SecurityContextUtil.class);
        R2StorageUtils r2Storage = mock(R2StorageUtils.class);
        LessonContentsRepository lessonContentsRepository = mock(LessonContentsRepository.class);
        uploadReceipts = mock(AssignmentUploadReceiptRepository.class);

        when(securityContextUtil.getAuthenticatedUserPrincipal())
                .thenReturn(new UserPrincipal(42, "LEARNER", null, 1, 6, 0));
        when(r2Storage.generatePresignedPutUrl(anyString(), anyString(), anyInt()))
                .thenReturn("https://example.com/upload");
        when(r2Storage.getPublicUrl(anyString())).thenAnswer(invocation -> "https://example.com/" + invocation.getArgument(0));
        when(uploadReceipts.save(any(AssignmentUploadReceipt.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LessonContents assignment = new LessonContents();
        assignment.setId(11);
        assignment.setContentType("assignment");
        assignment.setIsDeleted(false);
        when(lessonContentsRepository.findById(11)).thenReturn(Optional.of(assignment));

        ReflectionTestUtils.setField(controller, "securityContextUtil", securityContextUtil);
        ReflectionTestUtils.setField(controller, "accessControlService", mock(AccessControlService.class));
        ReflectionTestUtils.setField(controller, "r2Storage", r2Storage);
        ReflectionTestUtils.setField(controller, "lessonContentsRepository", lessonContentsRepository);
        ReflectionTestUtils.setField(controller, "assignmentUploadReceiptRepository", uploadReceipts);
        ReflectionTestUtils.setField(controller, "maxGenericSizeBytes", 10L * 1024 * 1024);
    }

    @Test
    void assignmentPresignMintsUploadReceipt() {
        PresignUploadRequestDTO request = new PresignUploadRequestDTO();
        request.setFileName("answer.pdf");
        request.setContentType("application/pdf");
        request.setContentLength(1024L);
        request.setFolder("assignments");
        request.setType("assignment");
        request.setLessonContentId(11);

        ResponseEntity<?> response = controller.presign(mock(HttpServletRequest.class), request);

        assertEquals(200, response.getStatusCodeValue());
        PresignUploadResponseDTO body = (PresignUploadResponseDTO) response.getBody();
        assertNotNull(body);
        assertNotNull(body.getUploadReceiptId());
        ArgumentCaptor<AssignmentUploadReceipt> receiptCaptor = ArgumentCaptor.forClass(AssignmentUploadReceipt.class);
        verify(uploadReceipts).save(receiptCaptor.capture());
        AssignmentUploadReceipt receipt = receiptCaptor.getValue();
        assertTrue(receipt.getStorageKey().startsWith("org-1/college-6/assignments/"));
        assertEquals(42, receipt.getOwnerUserId());
        assertEquals(11, receipt.getLessonContentId());
        assertEquals(1024L, receipt.getDeclaredContentLength());
    }
}
