package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.request.PresignUploadRequestDTO;
import com._42students.lms.dto.response.PresignUploadResponseDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import com._42students.lms.utils.PrivateDocStorage;
import com._42students.lms.utils.R2StorageUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import javax.servlet.http.HttpServletRequest;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Identity documents and marksheets live in a private bucket: uploads are signed against it and answer with a private-doc: reference
 * (never a public URL), opening one returns a short-lived signed link after the access check, and nothing falls back to the public
 * bucket when the private one is not set up.
 */
class FileUploadControllerPrivateDocsTest {

    private FileUploadController controller;
    private R2StorageUtils r2Storage;
    private PrivateDocStorage privateDocs;
    private SecurityContextUtil security;
    private AccessControlService access;

    @BeforeEach
    void setUp() {
        controller = new FileUploadController();
        security = mock(SecurityContextUtil.class);
        r2Storage = mock(R2StorageUtils.class);
        privateDocs = mock(PrivateDocStorage.class);
        access = mock(AccessControlService.class);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(new UserPrincipal(42, "LEARNER", null, 1, 6, 0));
        when(r2Storage.generatePresignedPutUrl(anyString(), anyString(), anyInt())).thenReturn("https://public.example/put");
        when(r2Storage.getPublicUrl(anyString())).thenAnswer(i -> "https://public.example/" + i.getArgument(0));
        when(privateDocs.isConfigured()).thenReturn(true);
        when(privateDocs.presignedPut(anyString(), anyString(), anyInt())).thenReturn("https://private.example/put");
        when(privateDocs.presignedGet(anyString())).thenReturn("https://private.example/get?sig=1");
        when(privateDocs.exists(anyString())).thenReturn(true);
        ReflectionTestUtils.setField(controller, "securityContextUtil", security);
        ReflectionTestUtils.setField(controller, "accessControlService", access);
        ReflectionTestUtils.setField(controller, "r2Storage", r2Storage);
        ReflectionTestUtils.setField(controller, "privateDocs", privateDocs);
        ReflectionTestUtils.setField(controller, "maxGenericSizeBytes", 10L * 1024 * 1024);
    }

    private PresignUploadRequestDTO marksheet() {
        PresignUploadRequestDTO r = new PresignUploadRequestDTO();
        r.setFileName("12th.pdf");
        r.setContentType("application/pdf");
        r.setContentLength(2048L);
        r.setFolder("marksheets");
        r.setType("generic");
        r.setUserId(42);
        return r;
    }

    @Test
    void aMarksheetUploadIsSignedAgainstThePrivateBucketAndAnswersWithAReference() {
        ResponseEntity<?> res = controller.presign(mock(HttpServletRequest.class), marksheet());
        assertEquals(200, res.getStatusCodeValue());
        PresignUploadResponseDTO body = (PresignUploadResponseDTO) res.getBody();
        assertEquals("https://private.example/put", body.getUploadUrl());
        assertTrue(body.getPublicUrl().startsWith("private-doc:org-1/college-6/marksheets/user-42/"), body.getPublicUrl());
        verify(r2Storage, never()).generatePresignedPutUrl(anyString(), anyString(), anyInt());
        verify(r2Storage, never()).getPublicUrl(anyString());
    }

    @Test
    void withoutThePrivateBucketTheUploadIsRefusedNotPutInThePublicOne() {
        when(privateDocs.isConfigured()).thenReturn(false);
        ResponseEntity<?> res = controller.presign(mock(HttpServletRequest.class), marksheet());
        assertEquals(503, res.getStatusCodeValue());
        verify(r2Storage, never()).generatePresignedPutUrl(anyString(), anyString(), anyInt());
    }

    @Test
    void openingAReferenceGivesAShortLivedSignedLinkToTheOwner() {
        String ref = "private-doc:org-1/college-6/identity-docs/user-42/abc.pdf";
        ResponseEntity<?> res = controller.downloadFile(mock(HttpServletRequest.class), ref, 42, null, null);
        assertEquals(200, res.getStatusCodeValue());
        assertEquals("https://private.example/get?sig=1", ((Response<?>) res.getBody()).getData());
        verify(privateDocs).presignedGet("org-1/college-6/identity-docs/user-42/abc.pdf");
        verify(r2Storage, never()).fileExists(anyString());
    }

    @Test
    void anotherStudentCannotOpenIt() {
        when(security.getAuthenticatedUserPrincipal()).thenReturn(new UserPrincipal(43, "LEARNER", null, 1, 6, 0));
        String ref = "private-doc:org-1/college-6/identity-docs/user-42/abc.pdf";
        ResponseEntity<?> res = controller.downloadFile(mock(HttpServletRequest.class), ref, 42, null, null);
        assertEquals(403, res.getStatusCodeValue(), "not allowed, not a server error");
        verify(privateDocs, never()).presignedGet(anyString());
    }

    @Test
    void aReferenceOutsideThePrivateFoldersIsRefused() {
        when(security.getAuthenticatedUserPrincipal()).thenReturn(new UserPrincipal(0, "FACULTY", "ADMIN", null, null, 0));
        ResponseEntity<?> res = controller.downloadFile(mock(HttpServletRequest.class), "private-doc:org-1/college-6/profile-images/user-42/a.png", 42, null, null);
        assertNotEquals(200, res.getStatusCodeValue());
        verify(privateDocs, never()).presignedGet(anyString());
    }

    @Test
    void referenceHelpers() {
        assertTrue(PrivateDocStorage.isRef(" private-doc:a/b"));
        assertFalse(PrivateDocStorage.isRef("https://cdn/x.pdf"));
        assertEquals("a/b", PrivateDocStorage.keyOf("private-doc:/a/b"));
        assertEquals("private-doc:a/b", PrivateDocStorage.refOf("a/b"));
        PrivateDocStorage blank = new PrivateDocStorage();
        assertFalse(blank.isConfigured(), "no bucket name: not set up");
        ReflectionTestUtils.setField(blank, "accountId", "acc");
        ReflectionTestUtils.setField(blank, "bucket", "lms-private-docs");
        ReflectionTestUtils.setField(blank, "accessKey", "k");
        assertTrue(blank.isConfigured(), "falls back to the main R2 key");
    }

    @Test
    void aStaffMembersDocumentIsTheirsAndAStudentWithTheSameNumberIsNotTheOwner() {
        String ref = "private-doc:org-1/college-6/identity-docs/faculty-42/aadhaar.pdf";
        // a student whose id is also 42
        assertNotEquals(200, controller.downloadFile(mock(HttpServletRequest.class), ref, null, null, null).getStatusCodeValue());
        // the staff member 42
        when(security.getAuthenticatedUserPrincipal()).thenReturn(new UserPrincipal(42, "FACULTY", "TEACHER", 1, 6, 0));
        assertEquals(200, controller.downloadFile(mock(HttpServletRequest.class), ref, null, null, null).getStatusCodeValue());
        // and the college admin
        when(security.getAuthenticatedUserPrincipal()).thenReturn(new UserPrincipal(7, "FACULTY", "ADMIN", 1, 6, 0));
        assertEquals(200, controller.downloadFile(mock(HttpServletRequest.class), ref, null, null, null).getStatusCodeValue());
        // a staff member's new upload goes under faculty-<id>
        when(security.getAuthenticatedUserPrincipal()).thenReturn(new UserPrincipal(42, "FACULTY", "TEACHER", 1, 6, 0));
        PresignUploadRequestDTO r = marksheet();
        r.setFolder("identity-docs");
        PresignUploadResponseDTO body = (PresignUploadResponseDTO) controller.presign(mock(HttpServletRequest.class), r).getBody();
        assertTrue(body.getPublicUrl().startsWith("private-doc:org-1/college-6/identity-docs/faculty-42/"), body.getPublicUrl());
    }

    @Test
    void onlyTheOwnerOrAnAdminDeletesAPrivateDocument() {
        String ref = "private-doc:org-1/college-6/marksheets/user-42/12th.pdf";
        when(security.getAuthenticatedUserPrincipal()).thenReturn(new UserPrincipal(9, "FACULTY", "TEACHER", 1, 6, 0));
        assertEquals(403, controller.deleteFile(mock(HttpServletRequest.class), ref, null, null, 42, null).getStatusCodeValue());
        verify(privateDocs, never()).delete(anyString());
        when(security.getAuthenticatedUserPrincipal()).thenReturn(new UserPrincipal(42, "LEARNER", null, 1, 6, 0));
        assertEquals(200, controller.deleteFile(mock(HttpServletRequest.class), ref, null, null, 42, null).getStatusCodeValue());
        verify(privateDocs).delete("org-1/college-6/marksheets/user-42/12th.pdf");
        verify(r2Storage, never()).deleteFile(anyString());
    }
}
