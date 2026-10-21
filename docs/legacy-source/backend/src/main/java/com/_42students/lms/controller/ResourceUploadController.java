package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.PresignUploadRequestDTO;
import com._42students.lms.dto.response.PresignUploadResponseDTO;
import com._42students.lms.model.College;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.impl.ResourceMaterialMimePolicy;
import com._42students.lms.util.SecurityContextUtil;
import com._42students.lms.utils.R2StorageUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;
import java.util.UUID;

/**
 * Resource-only presign: mint a key bound to the authenticated uploader and the actual
 * course AND class when class-scoped. Historical class-only keys are never renamed.
 */
@RestController
@RequestMapping("/api/v1/resource-uploads")
public class ResourceUploadController {
    @Autowired private SecurityContextUtil securityContextUtil;
    @Autowired private AccessControlService accessControlService;
    @Autowired private ScopeResolutionService scopeResolutionService;
    @Autowired private CollegeRepository collegeRepository;
    @Autowired(required = false) private R2StorageUtils r2Storage;

    @Autowired(required = false)
    private com._42students.lms.security.RateLimitingService rateLimitingService;

    @Value("${upload.generic.max-size-bytes:52428800}")
    private long maxResourceFileBytes = 52428800L;

    public static String keyPrefix(int organizationId, int collegeId,
                                   Integer courseId, Integer classId, int uploaderId) {
        if (organizationId <= 0 || collegeId <= 0 || uploaderId < 0
                || courseId == null || courseId <= 0 || (classId != null && classId < 0)) {
            throw new IllegalArgumentException("A valid tenant, uploader and course are required");
        }
        String scope = "course-" + courseId
                + (classId != null && classId > 0 ? "/class-" + classId : "");
        return "org-" + organizationId + "/college-" + collegeId
                + "/lesson-content/" + scope + "/user-" + uploaderId + "/";
    }

    @PostMapping(value = "/presign", consumes = "application/json", produces = "application/json")
    public ResponseEntity<PresignUploadResponseDTO> presign(@Valid @RequestBody PresignUploadRequestDTO body) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        if (principal.getId() == null || (!principal.isFaculty() && !"ADMIN".equalsIgnoreCase(principal.getUserType()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only faculty or admins may upload Resources");
        }
        if (rateLimitingService != null && rateLimitingService.isRateLimited(
                "resource_presign:" + principal.getId(), 60, 3600)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many Resource uploads");
        }
        if (r2Storage == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Resource storage is unavailable");
        }
        if (!"lesson-content".equals(body.getFolder()) || !"resource".equalsIgnoreCase(body.getType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource presign requires folder=lesson-content and type=resource");
        }
        String name = body.getFileName();
        String mime = body.getContentType();
        long size = body.getContentLength() == null ? 0 : body.getContentLength();
        if (name == null || name.isBlank() || name.length() > 255 || name.contains("/") || name.contains("\\")
                || name.chars().anyMatch(c -> c < 32 || c == 127)
                || !ResourceMaterialMimePolicy.matches(name, mime)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported Resource file name or MIME type");
        }
        if (size <= 0 || size > maxResourceFileBytes) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource file must be between 1 byte and the configured size limit");
        }

        Integer courseId = body.getCourseId();
        Integer classId = body.getClassId();
        if (courseId == null || courseId <= 0 || (classId != null && classId <= 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid courseId is required, including for class Resources");
        }
        Integer courseCollege = null;
        Integer classCollege = null;
        accessControlService.requireAccessCourse(principal, courseId);
        courseCollege = scopeResolutionService.resolveCourseToCollegeId(courseId);
        if (classId != null) {
            accessControlService.requireAccessClass(principal, classId);
            classCollege = scopeResolutionService.resolveClassToCollegeId(classId);
        }
        if (courseCollege != null && classCollege != null && !courseCollege.equals(classCollege)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource class and course belong to different colleges");
        }
        Integer collegeId = classCollege != null ? classCollege : courseCollege;
        if (collegeId == null || !accessControlService.canAccessCollege(principal, collegeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Resource college access denied");
        }
        College college = collegeRepository.fetchCollege(collegeId);
        Integer organizationId = college != null ? college.getOrgId() : null;
        if (organizationId == null || organizationId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource college or organization not found");
        }
        if ((principal.getOrganizationId() != null && !principal.getOrganizationId().equals(organizationId))
                || (principal.getCollegeId() != null && !principal.getCollegeId().equals(collegeId))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Resource is outside the active tenant scope");
        }

        String extension = "." + ResourceMaterialMimePolicy.extension(name);
        String key = keyPrefix(organizationId, collegeId, courseId, classId, principal.getId())
                + UUID.randomUUID() + extension;
        try {
            String uploadUrl = r2Storage.generatePresignedPutUrl(key, mime, 15);
            return ResponseEntity.ok(new PresignUploadResponseDTO(uploadUrl, key, r2Storage.getPublicUrl(key)));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Cannot prepare Resource upload", e);
        }
    }
}
