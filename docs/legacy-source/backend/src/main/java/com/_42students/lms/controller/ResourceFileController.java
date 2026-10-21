package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.ContentDataDTO;
import com._42students.lms.dto.request.FileDTO;
import com._42students.lms.dto.request.ResourceMaterialDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.Lesson;
import com._42students.lms.model.LessonContents;
import com._42students.lms.repository.LessonContentsRepository;
import com._42students.lms.repository.LessonRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import com._42students.lms.utils.ContentUrlValidator;
import com._42students.lms.utils.R2StorageUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Resolve a canonical Resource FILE by its exact content row and material index.
 * This deliberately does not use FileUploadController's JSON LIKE/first-owner lookup.
 * A signed R2 GET URL is short-lived; the R2 public bucket must separately be made
 * private before signed URLs can enforce revocation of already-shared public links.
 */
@RestController
@RequestMapping("/api/v1/resource-files")
public class ResourceFileController {
    private static final Pattern RESOURCE_KEY = Pattern.compile(
            "^org-([0-9]+)/college-([0-9]+)/lesson-content/[^\\s?#]+$");

    @Autowired private LessonContentsRepository lessonContentsRepository;
    @Autowired private LessonRepository lessonRepository;
    @Autowired private AccessControlService accessControlService;
    @Autowired private ScopeResolutionService scopeResolutionService;
    @Autowired private SecurityContextUtil securityContextUtil;
    @Autowired private ContentUrlValidator contentUrlValidator;
    @Autowired(required = false) private R2StorageUtils r2StorageUtils;

    @GetMapping(value = "/{contentId}/materials/{materialIndex}/url", produces = "application/json")
    public ResponseEntity<Response<Map<String, String>>> getMaterialUrl(
            @PathVariable int contentId, @PathVariable int materialIndex) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        if (contentId <= 0 || materialIndex < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Resource material");
        LessonContents content = lessonContentsRepository.findById(contentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found"));
        if (Boolean.TRUE.equals(content.getIsDeleted()) || !"resource".equalsIgnoreCase(content.getContentType())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found");
        }
        if (principal.isLearner() && (!content.isActive() || !content.isEnabled())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not available");
        }

        Lesson lesson = lessonRepository.fetchCourseId(content.getLessonId());
        if (lesson == null || lesson.getCourseId() <= 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource lesson not found");
        }
        int courseId = lesson.getCourseId();
        if (content.getCourseId() != null && content.getCourseId() > 0 && content.getCourseId() != courseId) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Resource lesson/course mismatch");
        }
        Integer courseCollege = scopeResolutionService.resolveCourseToCollegeId(courseId);
        if (courseCollege == null || courseCollege <= 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Resource college unavailable");
        }
        Integer classId = content.getClassId();
        if (classId != null && classId > 0) {
            Integer classCollege = scopeResolutionService.resolveClassToCollegeId(classId);
            if (!courseCollege.equals(classCollege)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Resource class/course mismatch");
            }
        }
        Integer organizationId = scopeResolutionService.resolveCollegeToOrganizationId(courseCollege);
        if (organizationId == null || organizationId <= 0
                || (principal.getCollegeId() != null && !courseCollege.equals(principal.getCollegeId()))
                || (principal.getOrganizationId() != null && !organizationId.equals(principal.getOrganizationId()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Resource is outside your scope");
        }
        accessControlService.requireAccessCourse(principal, courseId);
        if (classId != null && classId > 0) accessControlService.requireAccessClass(principal, classId);

        ContentDataDTO data = content.getContentDataDTO();
        List<ResourceMaterialDTO> materials = data == null ? null : data.getResourceMaterials();
        if (materials == null || materialIndex >= materials.size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource material not found");
        }
        ResourceMaterialDTO material = materials.get(materialIndex);
        FileDTO file = material == null ? null : material.getFileDTO();
        if (material == null || !"FILE".equalsIgnoreCase(material.getKind()) || file == null
                || file.getCloudStorageObject() == null || file.getCloudStorageObject().isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource file not found");
        }
        String raw = file.getCloudStorageObject().trim();
        if (raw.contains("://") && !contentUrlValidator.isAllowedContentUrl(raw)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Resource file storage is not allowed");
        }
        String key = contentUrlValidator.resolveStorageKeyFromValue(raw);
        Matcher match = key == null ? RESOURCE_KEY.matcher("") : RESOURCE_KEY.matcher(key);
        if (!match.matches() || key.contains("..") || key.contains("//")
                || !String.valueOf(organizationId).equals(match.group(1))
                || !String.valueOf(courseCollege).equals(match.group(2))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Resource file tenant mismatch");
        }
        if (r2StorageUtils == null) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Resource storage unavailable");
        try {
            String signedUrl = r2StorageUtils.generatePresignedGetUrl(key, 15);
            if (signedUrl == null || !signedUrl.startsWith("https://")) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Cannot sign Resource file URL");
            }
            return ResponseEntity.ok(new Response<>(HttpStatus.OK.name(), "OK", Map.of("url", signedUrl)));
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Cannot sign Resource file URL", exception);
        }
    }
}
