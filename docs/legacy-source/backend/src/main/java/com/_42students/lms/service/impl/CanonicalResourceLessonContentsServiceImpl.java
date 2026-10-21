package com._42students.lms.service.impl;

import com._42students.lms.controller.ResourceUploadController;
import com._42students.lms.dto.request.ContentDataDTO;
import com._42students.lms.dto.request.FileDTO;
import com._42students.lms.dto.request.LessonContentsDTO;
import com._42students.lms.dto.request.ResourceMaterialDTO;
import com._42students.lms.enums.ContentType;
import com._42students.lms.model.Lesson;
import com._42students.lms.model.LessonContents;
import com._42students.lms.security.UserPrincipal;
import com.amazonaws.services.s3.model.ObjectMetadata;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Canonical multi-material Resource writes. The existing lesson-content service still owns
 * authorization, lesson scope, sequence and persistence. Keep legacy readers and row IDs intact;
 * resource storage keys are retained on soft delete pending reference-aware cleanup.
 */
@Service
@Primary
public class CanonicalResourceLessonContentsServiceImpl extends LessonContentsServiceImpl {
    private static final Pattern TENANT_FILE = Pattern.compile("^org-(\\d+)/college-(\\d+)/lesson-content/[^\\s?#]+$");
    private static final Pattern ISSUED_FILE_NAME = Pattern.compile("^[0-9a-fA-F-]{36}\\.[a-z0-9]{2,5}$");
    private static final int MAX_MATERIALS = 20;

    @Value("${upload.generic.max-size-bytes:52428800}")
    private long maxResourceFileBytes = 52428800L;

    @Autowired
    private ResourceReceiptClaimService receiptClaims;

    @Override
    @Transactional
    public LessonContents createLessonContents(LessonContentsDTO dto) {
        if (dto == null || dto.getContentType() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "content_type is required");
        }
        if (dto.getContentType() != ContentType.RESOURCE) return super.createLessonContents(dto);
        if (dto.getLessonContentId() != null && dto.getLessonContentId() > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use the update endpoint to edit an existing Resource");
        }
        ContentDataDTO data = dto.getContentDataDTO();
        validateResource(data, dto, null);
        prepareForStorage(data);
        setFirstFileCompatibilityField(data);
        ResourceMaterialDTO firstLink = firstMaterial(data, "LINK");
        if (firstLink != null) data.setLink(firstLink.getUrl());
        LessonContents created = super.createLessonContents(dto);
        // Claim after the row has an id, but before its transaction commits. If another
        // request claimed a receipt first, the thrown conflict rolls back THIS new row.
        receiptClaims.claimNewFiles(data, null, created.getId());
        return created;
    }

    @Override
    @Transactional
    public LessonContents updateLessonContent(Integer id, LessonContentsDTO dto) {
        if (dto == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lesson content payload is required");
        LessonContents before = lessonContentsRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson content not found"));
        if (Boolean.TRUE.equals(before.getIsDeleted())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson content not found");
        }
        if (!ContentType.RESOURCE.getContentType().equalsIgnoreCase(before.getContentType())) {
            if (dto.getContentType() == ContentType.RESOURCE) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Legacy content must be migrated before editing as a Resource");
            }
            return super.updateLessonContent(id, dto);
        }
        if (dto.getContentType() != null && dto.getContentType() != ContentType.RESOURCE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot change an existing Resource into another content type");
        }

        // Authorize the existing content before reading its files or performing any R2 HEAD.
        // Do not send content_data through the legacy update path: it can delete replaced files.
        LessonContentsDTO metadata = new LessonContentsDTO();
        BeanUtils.copyProperties(dto, metadata);
        metadata.setContentType(null);
        metadata.setContentDataDTO(null);
        LessonContents authorized = super.updateLessonContent(id, metadata);

        ContentDataDTO incoming = dto.getContentDataDTO();
        if (incoming != null) {
            ContentDataDTO oldData = before.getContentDataDTO();
            if (oldData != null) {
                if (incoming.getResourceMaterials() == null) incoming.setResourceMaterials(oldData.getResourceMaterials());
                if (incoming.getText() == null) incoming.setText(oldData.getText());
                if (incoming.getHtmlContent() == null) incoming.setHtmlContent(oldData.getHtmlContent());
            }
            // Old unowned keys may be retained only when this already-authorized Resource
            // references the exact key. A different Resource cannot import that legacy key.
            validateResource(incoming, null, authorized);
            prepareForStorage(incoming);
            setFirstFileCompatibilityField(incoming);
            // Capture oldData before replacing it: an existing file need not be re-uploaded.
            receiptClaims.claimNewFiles(incoming, oldData, authorized.getId());
            authorized.setContentDataDTO(incoming);
            authorized = lessonContentsRepository.save(authorized);
        }
        return authorized;
    }

    @Override
    public void deleteContentFileBestEffort(LessonContents content) {
        // Do not delete a shared object on soft delete; migration and R2 reference counts are
        // not yet reconciled. The row remains recoverable without breaking another Resource.
        if (content != null && ContentType.RESOURCE.getContentType().equalsIgnoreCase(content.getContentType())) return;
        super.deleteContentFileBestEffort(content);
    }

    private static ResourceMaterialDTO firstMaterial(ContentDataDTO data, String kind) {
        if (data.getResourceMaterials() == null) return null;
        for (ResourceMaterialDTO item : data.getResourceMaterials()) {
            if (item != null && kind.equalsIgnoreCase(item.getKind())) return item;
        }
        return null;
    }

    private static void setFirstFileCompatibilityField(ContentDataDTO data) {
        FileDTO first = null;
        if (data.getResourceMaterials() != null) {
            for (ResourceMaterialDTO material : data.getResourceMaterials()) {
                if (material != null && "FILE".equalsIgnoreCase(material.getKind())) {
                    first = material.getFileDTO();
                    break;
                }
            }
        }
        data.setFileDTO(first);
    }

    private static void prepareForStorage(ContentDataDTO data) {
        if (data.getHtmlContent() != null) {
            data.setHtmlContent(Jsoup.clean(data.getHtmlContent(), Safelist.relaxed()
                    .addTags("u", "s", "sub", "sup", "ins", "del")
                    .addAttributes("a", "target", "rel")
                    .addProtocols("a", "href", "https")));
        }
    }

    /** Retains the reflective test entrypoint; non-empty file inputs require a real scope. */
    private void validateResource(ContentDataDTO data) {
        validateResource(data, null, null);
    }

    private String expectedFilePrefix(LessonContentsDTO dto, LessonContents existing, UserPrincipal principal) {
        if (scopeResolutionService == null || accessControlService == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Resource scope validation unavailable");
        }
        Integer classId = existing != null ? existing.getClassId() : dto != null ? dto.getClassId() : null;
        Integer courseId = existing != null ? existing.getCourseId() : dto != null ? dto.getCourseId() : null;
        Integer lessonId = existing != null ? existing.getLessonId() : dto != null ? dto.getLessonId() : null;
        // The lesson is the authority for course ownership. A client-supplied course from
        // another lesson must never create a Resource that its own viewer will reject.
        if (lessonId != null && lessonId > 0) {
            if (lessonRepository == null) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Lesson scope lookup unavailable");
            }
            Integer lessonCourseId = lessonRepository.findById(lessonId)
                    .map(Lesson::getCourseId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource lesson not found"));
            if (lessonCourseId <= 0 || (courseId != null && courseId > 0 && !courseId.equals(lessonCourseId))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource lesson and course do not match");
            }
            courseId = lessonCourseId;
        }
        if (courseId == null || courseId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid Resource course is required");
        }
        Integer classCollege = null;
        Integer courseCollege = null;
        if (classId != null && classId > 0) {
            accessControlService.requireAccessClass(principal, classId);
            classCollege = scopeResolutionService.resolveClassToCollegeId(classId);
        }
        if (courseId != null && courseId > 0) {
            accessControlService.requireAccessCourse(principal, courseId);
            courseCollege = scopeResolutionService.resolveCourseToCollegeId(courseId);
        }
        if (classCollege != null && courseCollege != null && !classCollege.equals(courseCollege)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource class and course college mismatch");
        }
        Integer collegeId = classCollege != null ? classCollege : courseCollege;
        if (collegeId == null || !accessControlService.canAccessCollege(principal, collegeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Resource college access denied");
        }
        Integer organizationId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
        if (organizationId == null || organizationId <= 0 || principal.getId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot resolve Resource owner or tenant scope");
        }
        if (principal.getOrganizationId() != null && !principal.getOrganizationId().equals(organizationId)
                || principal.getCollegeId() != null && !principal.getCollegeId().equals(collegeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Resource is outside the active tenant scope");
        }
        return ResourceUploadController.keyPrefix(organizationId, collegeId, courseId, classId, principal.getId());
    }

    private void validateResource(ContentDataDTO data, LessonContentsDTO dto, LessonContents existing) {
        if (data == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource content_data_dto is required");
        List<ResourceMaterialDTO> items = data.getResourceMaterials();
        if (items == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "resource_materials is required");
        if (items.size() > MAX_MATERIALS) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Too many Resource materials");
        boolean hasNotes = (data.getText() != null && !data.getText().isBlank())
                || (data.getHtmlContent() != null && !data.getHtmlContent().isBlank());
        if (items.isEmpty() && !hasNotes) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource needs a file, HTTPS link, or notes");

        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        Set<String> previousKeys = new HashSet<>();
        if (existing != null && existing.getContentDataDTO() != null
                && existing.getContentDataDTO().getResourceMaterials() != null && contentUrlValidator != null) {
            for (ResourceMaterialDTO prior : existing.getContentDataDTO().getResourceMaterials()) {
                if (prior != null && "FILE".equalsIgnoreCase(prior.getKind()) && prior.getFileDTO() != null) {
                    String priorKey = contentUrlValidator.resolveStorageKeyFromValue(prior.getFileDTO().getCloudStorageObject());
                    if (priorKey != null) previousKeys.add(priorKey);
                }
            }
        }
        // Validate course/class/tenant even for notes-only and links-only Resources;
        // otherwise the file-only check can be bypassed by omitting files entirely.
        String expectedPrefix = dto != null || existing != null
                ? expectedFilePrefix(dto, existing, principal) : null;
        Set<String> seen = new HashSet<>();
        for (ResourceMaterialDTO item : items) {
            if (item == null || item.getKind() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource material kind is required");
            if (item.getTitle() != null && item.getTitle().length() > 255) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource material title is too long");
            }
            if ("LINK".equalsIgnoreCase(item.getKind())) {
                if (item.getFileDTO() != null || !validHttpsLink(item.getUrl())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource link must be a valid HTTPS URL without credentials");
                }
                if (!seen.add("link:" + item.getUrl().trim())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duplicate Resource link");
                continue;
            }
            if (!"FILE".equalsIgnoreCase(item.getKind())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown Resource material kind");
            }
            if (item.getUrl() != null && !item.getUrl().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File materials must not have external URLs");
            }
            FileDTO file = item.getFileDTO();
            if (file == null || file.getOriginalName() == null || file.getMimetype() == null
                    || file.getCloudStorageObject() == null || file.getSize() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource file metadata is incomplete");
            }
            String filename = file.getOriginalName();
            if (filename.length() > 255 || filename.contains("/") || filename.contains("\\")
                    || filename.chars().anyMatch(c -> c < 32 || c == 127)
                    || !ResourceMaterialMimePolicy.matches(filename, file.getMimetype())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported Resource file name or MIME type");
            }
            if (file.getSize() > maxResourceFileBytes) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource file exceeds the allowed size");
            }
            String raw = file.getCloudStorageObject().trim();
            if (contentUrlValidator == null) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Storage validation unavailable");
            if (raw.contains("://") && !contentUrlValidator.isAllowedContentUrl(raw)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource file URL is not from configured storage");
            }
            String key = contentUrlValidator.resolveStorageKeyFromValue(raw);
            if (key == null || !TENANT_FILE.matcher(key).matches() || key.contains("..") || key.contains("//")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource file requires a tenant-scoped lesson-content key");
            }
            if (expectedPrefix == null) expectedPrefix = expectedFilePrefix(dto, existing, principal);
            String tenantPrefix = expectedPrefix.substring(0, expectedPrefix.indexOf("/lesson-content/") + "/lesson-content/".length());
            if (!key.startsWith(tenantPrefix)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Resource file is outside the selected college");
            }
            boolean issuedForThisUploaderAndScope = key.startsWith(expectedPrefix)
                    && ISSUED_FILE_NAME.matcher(key.substring(expectedPrefix.length())).matches();
            if (!issuedForThisUploaderAndScope && !previousKeys.contains(key)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Resource file was not uploaded for this user and class/course");
            }
            if (!seen.add("file:" + key)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duplicate Resource file");
            if (r2StorageUtils == null) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Storage metadata unavailable");
            try {
                ObjectMetadata stored = r2StorageUtils.getObjectMetadata(key);
                if (stored == null || stored.getContentLength() <= 0 || stored.getContentLength() > maxResourceFileBytes
                        || !ResourceMaterialMimePolicy.matchesStored(filename, stored.getContentType())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stored Resource file size or content type is invalid");
                }
            } catch (ResponseStatusException e) {
                throw e;
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Cannot verify uploaded Resource file", e);
            }
        }
    }

    static boolean validHttpsLink(String value) {
        if (value == null || value.isBlank() || value.length() > 2048
                || value.chars().anyMatch(c -> c <= 32 || c == 127)) return false;
        try {
            URI uri = new URI(value);
            return "https".equalsIgnoreCase(uri.getScheme()) && uri.getHost() != null
                    && !uri.getHost().isBlank() && uri.getRawUserInfo() == null;
        } catch (Exception ignored) {
            return false;
        }
    }
}
