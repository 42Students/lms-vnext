package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.request.PresignUploadRequestDTO;
import com._42students.lms.model.College;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import com._42students.lms.utils.R2StorageUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import javax.servlet.http.HttpServletRequest;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

/**
 * The presign path has no per-folder size cap at all before this -- the global multipart limit
 * (5GB) is sized for lesson video content and doesn't apply to this presigned-upload path in the
 * first place, so a college-branding image (rendered on every visitor's login page) had no real
 * ceiling anywhere. Covers FileUploadController.FOLDER_MAX_UPLOAD_BYTES specifically for
 * college-branding: this whole controller had zero tests before.
 */
class FileUploadControllerCollegeBrandingSizeTest {

    private static final int COLLEGE_ID = 9;
    private static final long FIVE_MB = 5L * 1024 * 1024;

    private FileUploadController controller;
    private R2StorageUtils r2Storage;
    private CollegeRepository collegeRepository;

    @BeforeEach
    void setUp() {
        controller = new FileUploadController();
        SecurityContextUtil securityContextUtil = Mockito.mock(SecurityContextUtil.class);
        AccessControlService accessControlService = Mockito.mock(AccessControlService.class);
        r2Storage = Mockito.mock(R2StorageUtils.class);
        collegeRepository = Mockito.mock(CollegeRepository.class);

        UserPrincipal superAdmin = new UserPrincipal(0, "FACULTY", "ADMIN", null, null, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(superAdmin);

        College college = new College();
        college.setId(COLLEGE_ID);
        college.setOrgId(1);
        when(collegeRepository.findById(COLLEGE_ID)).thenReturn(Optional.of(college));

        // Field-injected (no constructor) — set only what this code path actually reaches.
        ReflectionTestUtils.setField(controller, "securityContextUtil", securityContextUtil);
        ReflectionTestUtils.setField(controller, "accessControlService", accessControlService);
        ReflectionTestUtils.setField(controller, "r2Storage", r2Storage);
        ReflectionTestUtils.setField(controller, "collegeRepository", collegeRepository);
        // @Value fields are never populated outside a Spring context; set the one this test's
        // success case reaches so a legitimately-small file isn't rejected by the *generic*
        // image cap (unrelated to the fix under test) just because the field defaulted to 0.
        ReflectionTestUtils.setField(controller, "maxImageSizeBytes", 10L * 1024 * 1024);
    }

    private PresignUploadRequestDTO request(long contentLength) {
        PresignUploadRequestDTO dto = new PresignUploadRequestDTO();
        dto.setFileName("logo.png");
        dto.setContentType("image/png");
        dto.setContentLength(contentLength);
        dto.setFolder("college-branding");
        dto.setType("image");
        dto.setCollegeId(COLLEGE_ID);
        return dto;
    }

    @Test
    @DisplayName("REGRESSION: a file over 5MB for college-branding is rejected, not just capped at the generic 10MB image limit")
    void oversizedCollegeBrandingImage_isRejected() {
        HttpServletRequest httpRequest = Mockito.mock(HttpServletRequest.class);
        ResponseEntity<?> response = controller.presign(httpRequest, request(FIVE_MB + 1));

        assertEquals(400, response.getStatusCodeValue());
        assertTrue(String.valueOf(response.getBody()).contains("too large for college-branding"));
    }

    @Test
    @DisplayName("a file within the 5MB cap is accepted and a presigned URL is returned")
    void withinCapCollegeBrandingImage_succeeds() {
        when(r2Storage.generatePresignedPutUrl(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyInt()))
                .thenReturn("https://example.com/presigned-put-url");
        when(r2Storage.getPublicUrl(org.mockito.ArgumentMatchers.anyString())).thenReturn("https://example.com/public-url");

        HttpServletRequest httpRequest = Mockito.mock(HttpServletRequest.class);
        ResponseEntity<?> response = controller.presign(httpRequest, request(FIVE_MB));

        assertEquals(200, response.getStatusCodeValue());
    }
}
