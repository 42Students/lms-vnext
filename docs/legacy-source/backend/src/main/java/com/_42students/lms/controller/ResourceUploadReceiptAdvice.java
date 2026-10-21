package com._42students.lms.controller;

import com._42students.lms.dto.request.ContentDataDTO;
import com._42students.lms.dto.request.LessonContentsDTO;
import com._42students.lms.dto.request.PresignUploadRequestDTO;
import com._42students.lms.dto.request.ResourceMaterialDTO;
import com._42students.lms.dto.response.PresignUploadResponseDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.enums.ContentType;
import com._42students.lms.model.AssignmentUploadReceipt;
import com._42students.lms.model.LessonContents;
import com._42students.lms.repository.AssignmentUploadReceiptRepository;
import com._42students.lms.repository.LessonContentsRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import com._42students.lms.utils.ContentUrlValidator;
import com._42students.lms.utils.R2StorageUtils;
import com.amazonaws.services.s3.model.ObjectMetadata;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.RequestBodyAdviceAdapter;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

import javax.servlet.http.HttpServletRequest;
import java.lang.reflect.Type;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Binds newly uploaded canonical Resource files to their uploader, tenant and first saved
 * lesson-content row, without changing old storage keys or the legacy content readers.
 *
 * The existing upload-receipt table is reused, but only receipts explicitly marked
 * folder=lesson-content and upload_type=generic/resource participate. Assignment receipts are untouched.
 * Legacy Resource materials may be kept on their ORIGINAL Resource during edits; moving one
 * of those keys to a new Resource requires a fresh upload.
 */
@ControllerAdvice(assignableTypes = {FileUploadController.class, ResourceUploadController.class, LessonContentController.class})
public class ResourceUploadReceiptAdvice extends RequestBodyAdviceAdapter implements ResponseBodyAdvice<Object> {
    private static final String PRESIGN_REQUEST = ResourceUploadReceiptAdvice.class.getName() + ".presign";
    private static final String NEW_RECEIPTS = ResourceUploadReceiptAdvice.class.getName() + ".newReceipts";
    private static final String LESSON_PREFIX = "/api/v1/lesson/contents/";
    private static final String RESOURCE_UPLOAD_FOLDER = "lesson-content";
    private static final String RESOURCE_UPLOAD_TYPE = "resource";
    private static final String LEGACY_GENERIC_TYPE = "generic";
    private static final long RECEIPT_VALID_MINUTES = 60;

    @Autowired
    private AssignmentUploadReceiptRepository receiptRepository;
    @Autowired
    private LessonContentsRepository lessonContentsRepository;
    @Autowired
    private SecurityContextUtil securityContextUtil;
    @Autowired
    private ContentUrlValidator contentUrlValidator;
    @Autowired(required = false)
    private R2StorageUtils r2StorageUtils;

    private static HttpServletRequest request() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Request context is unavailable");
        }
        return ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
    }

    @Override
    public boolean supports(MethodParameter parameter, Type targetType,
                            Class<? extends HttpMessageConverter<?>> converterType) {
        Class<?> type = parameter.getParameterType();
        return PresignUploadRequestDTO.class.isAssignableFrom(type)
                || LessonContentsDTO.class.isAssignableFrom(type);
    }

    @Override
    public Object afterBodyRead(Object body, HttpInputMessage inputMessage, MethodParameter parameter,
                                Type targetType, Class<? extends HttpMessageConverter<?>> converterType) {
        String method = parameter.getMethod() == null ? "" : parameter.getMethod().getName();
        if (body instanceof PresignUploadRequestDTO && "presign".equals(method)) {
            request().setAttribute(PRESIGN_REQUEST, body);
        } else if (body instanceof LessonContentsDTO
                && ("createLessonContents".equals(method) || "updateLessonContent".equals(method))) {
            checkResourceMaterials((LessonContentsDTO) body, "updateLessonContent".equals(method));
        }
        return body;
    }

    private void checkResourceMaterials(LessonContentsDTO dto, boolean update) {
        HttpServletRequest req = request();
        Integer targetId = null;
        LessonContents existing = null;
        if (update) {
            String uri = req.getServletPath();
            String prefix = LESSON_PREFIX + "update/";
            if (!uri.startsWith(prefix)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Resource update path");
            try {
                targetId = Integer.valueOf(uri.substring(prefix.length()));
            } catch (NumberFormatException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Resource id", ex);
            }
            existing = lessonContentsRepository.findById(targetId).orElse(null);
        }
        boolean resource = dto.getContentType() == ContentType.RESOURCE
                || (existing != null && "resource".equalsIgnoreCase(existing.getContentType()));
        if (!resource || dto.getContentDataDTO() == null) return;
        List<ResourceMaterialDTO> materials = dto.getContentDataDTO().getResourceMaterials();
        if (materials == null) return; // Canonical service checks create requirements and merges update data.

        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null || principal.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required for Resource uploads");
        }
        if (principal.getOrganizationId() == null || principal.getCollegeId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Select a college scope before attaching Resource files");
        }
        String tenantPrefix = "org-" + principal.getOrganizationId() + "/college-"
                + principal.getCollegeId() + "/lesson-content/";
        Set<String> newReceiptIds = new HashSet<>();
        for (ResourceMaterialDTO material : materials) {
            if (material == null || !"FILE".equalsIgnoreCase(material.getKind()) || material.getFileDTO() == null) continue;
            String raw = material.getFileDTO().getCloudStorageObject();
            String key = raw == null ? null : contentUrlValidator.resolveStorageKeyFromValue(raw.trim());
            if (key == null || !key.startsWith(tenantPrefix) || key.contains("..") || key.contains("//")) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Resource file is outside the selected college");
            }
            // Keep pre-receipt Resource files editable without allowing an arbitrary existing key
            // to be attached to another row. Exact keys only, never substring matching.
            if (existing != null && "resource".equalsIgnoreCase(existing.getContentType()) && hasFileKey(existing, key)) {
                continue;
            }
            Optional<AssignmentUploadReceipt> matching = receiptRepository.findByStorageKeyAndIsDeletedFalse(key);
            if (matching.isEmpty() || !isOwnedUnconsumedReceipt(matching.get(), principal, key,
                    material.getFileDTO().getSize(), material.getFileDTO().getMimetype(), LocalDateTime.now(), targetId)
                    || !keyMatchesResourceScope(key, matching.get().getUploadType(), principal,
                        dto.getCourseId() != null && dto.getCourseId() > 0 ? dto.getCourseId()
                            : existing != null ? existing.getCourseId() : null,
                        dto.getClassId() != null && dto.getClassId() > 0 ? dto.getClassId()
                            : existing != null && existing.getClassId() != null && existing.getClassId() > 0
                                ? existing.getClassId() : null)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Upload the Resource file with your account before attaching it");
            }
            if (matching.get().getConsumedAt() == null) {
                if (r2StorageUtils == null) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "R2 storage is unavailable");
                // The presign request's length is a declaration, not a signed PUT size limit.
                // Check the actual R2 object before accepting the upload as this Resource's file.
                try {
                    ObjectMetadata stored = r2StorageUtils.getObjectMetadata(key);
                    if (stored == null || stored.getContentLength() != matching.get().getDeclaredContentLength()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded Resource file size does not match its receipt");
                    }
                } catch (ResponseStatusException ex) {
                    throw ex;
                } catch (Exception ex) {
                    throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Unable to verify Resource upload", ex);
                }
            }
            if (matching.get().getConsumedAt() == null && !newReceiptIds.add(matching.get().getReceiptId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duplicate Resource upload receipt");
            }
        }
        req.setAttribute(NEW_RECEIPTS, new ArrayList<>(newReceiptIds));
    }

    private boolean hasFileKey(LessonContents content, String key) {
        ContentDataDTO data = content.getContentDataDTO();
        if (data == null || data.getResourceMaterials() == null) return false;
        for (ResourceMaterialDTO material : data.getResourceMaterials()) {
            if (material != null && "FILE".equalsIgnoreCase(material.getKind()) && material.getFileDTO() != null
                    && (key.equals(material.getFileDTO().getCloudStorageObject())
                        || key.equals(contentUrlValidator.resolveStorageKeyFromValue(material.getFileDTO().getCloudStorageObject())))) return true;
        }
        return false;
    }

    static boolean isOwnedUnconsumedReceipt(AssignmentUploadReceipt receipt, UserPrincipal principal,
                                            String key, long size, String mime, LocalDateTime now, Integer targetContentId) {
        return receipt != null && principal != null && principal.getId() != null
                && principal.getId().equals(receipt.getOwnerUserId())
                && String.valueOf(principal.isFaculty() ? "FACULTY" : principal.getUserType())
                    .equalsIgnoreCase(receipt.getOwnerUserType() == null ? "" : receipt.getOwnerUserType())
                && RESOURCE_UPLOAD_FOLDER.equals(receipt.getFolder())
                && (RESOURCE_UPLOAD_TYPE.equalsIgnoreCase(receipt.getUploadType())
                    || LEGACY_GENERIC_TYPE.equalsIgnoreCase(receipt.getUploadType()))
                && key.equals(receipt.getStorageKey())
                && ((receipt.getConsumedAt() == null && receipt.getExpiresAt() != null && receipt.getExpiresAt().isAfter(now))
                    || (receipt.getConsumedAt() != null && targetContentId != null
                        && targetContentId.equals(receipt.getLessonContentId())))
                && receipt.getDeclaredContentLength() != null && receipt.getDeclaredContentLength() == size
                && mime != null && receipt.getDeclaredContentType() != null
                && receipt.getDeclaredContentType().equalsIgnoreCase(mime);
    }

    /** Dedicated Resource upload keys encode the owner and course/class at presign time.
     * Generic keys minted by the older upload endpoint have no scope segments; their
     * receipt still binds uploader and tenant for in-flight compatibility.
     */
    static boolean keyMatchesResourceScope(String key, String uploadType, UserPrincipal principal,
                                            Integer courseId, Integer classId) {
        if (LEGACY_GENERIC_TYPE.equalsIgnoreCase(uploadType)) return true;
        if (!RESOURCE_UPLOAD_TYPE.equalsIgnoreCase(uploadType) || principal == null
                || principal.getOrganizationId() == null || principal.getCollegeId() == null
                || principal.getId() == null || key == null) return false;
        try {
            return key.startsWith(ResourceUploadController.keyPrefix(
                    principal.getOrganizationId(), principal.getCollegeId(), courseId, classId, principal.getId()));
        } catch (IllegalArgumentException invalidScope) {
            return false;
        }
    }

    @Override
    public boolean supports(MethodParameter returnType,
                            Class<? extends HttpMessageConverter<?>> converterType) {
        String method = returnType.getMethod() == null ? "" : returnType.getMethod().getName();
        return "presign".equals(method) || "uploadFile".equals(method)
                || "createLessonContents".equals(method) || "updateLessonContent".equals(method);
    }

    @Override
    public Object beforeBodyWrite(Object body, MethodParameter returnType, MediaType selectedContentType,
                                  Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                  ServerHttpRequest inputMessage, ServerHttpResponse outputMessage) {
        HttpServletRequest req = request();
        String method = returnType.getMethod() == null ? "" : returnType.getMethod().getName();
        if ("presign".equals(method) && body instanceof PresignUploadResponseDTO) {
            PresignUploadRequestDTO upload = (PresignUploadRequestDTO) req.getAttribute(PRESIGN_REQUEST);
            if (upload != null && isReceiptEligibleUpload(upload.getFolder(), upload.getType())) {
                PresignUploadResponseDTO response = (PresignUploadResponseDTO) body;
                AssignmentUploadReceipt receipt = saveUploadReceipt(response.getKey(), response.getPublicUrl(),
                        upload.getContentType(), upload.getContentLength(), upload.getType());
                response.setUploadReceiptId(receipt.getReceiptId());
            }
        } else if ("uploadFile".equals(method) && body instanceof Response<?>) {
            Response<?> response = (Response<?>) body;
            if ("OK".equals(response.getStatus())
                    && isReceiptEligibleUpload(req.getParameter("folder"), req.getParameter("type"))
                    && response.getData() instanceof Map<?, ?>) {
                Map<?, ?> data = (Map<?, ?>) response.getData();
                String key = string(data.get("key"));
                String publicUrl = string(data.get("publicUrl"));
                String mime = string(data.get("mimetype"));
                Object length = data.get("size");
                AssignmentUploadReceipt receipt = saveUploadReceipt(key, publicUrl, mime,
                        length instanceof Number ? ((Number) length).longValue() : null, req.getParameter("type"));
                // This response is already a mutable map produced by uploadFile().
                @SuppressWarnings("unchecked")
                Map<String, Object> mutable = (Map<String, Object>) data;
                mutable.put("uploadReceiptId", receipt.getReceiptId());
            }
        } else if (("createLessonContents".equals(method) || "updateLessonContent".equals(method))
                && body instanceof Response<?>) {
            Response<?> response = (Response<?>) body;
            if ("OK".equals(response.getStatus()) && response.getData() instanceof LessonContents
                    && "resource".equalsIgnoreCase(((LessonContents) response.getData()).getContentType())) {
                @SuppressWarnings("unchecked")
                List<String> ids = (List<String>) req.getAttribute(NEW_RECEIPTS);
                if (ids != null) {
                    Integer contentId = ((LessonContents) response.getData()).getId();
                    for (String receiptId : ids) {
                        AssignmentUploadReceipt receipt = receiptRepository.findByReceiptIdAndIsDeletedFalse(receiptId)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Resource upload receipt missing"));
                        if (receipt.getConsumedAt() != null && !contentId.equals(receipt.getLessonContentId())) {
                            throw new ResponseStatusException(HttpStatus.CONFLICT, "Resource upload already attached elsewhere");
                        }
                        if (receipt.getConsumedAt() == null) {
                            receipt.setLessonContentId(contentId);
                            receipt.setConsumedAt(LocalDateTime.now());
                            receiptRepository.save(receipt);
                        }
                    }
                }
            }
        }
        return body;
    }

    private static String string(Object value) {
        return value instanceof String ? (String) value : null;
    }

    private static boolean isReceiptEligibleUpload(String folder, String type) {
        return RESOURCE_UPLOAD_FOLDER.equals(folder)
                && (type == null || type.isBlank() || LEGACY_GENERIC_TYPE.equalsIgnoreCase(type.trim())
                    || RESOURCE_UPLOAD_TYPE.equalsIgnoreCase(type.trim()));
    }

    private AssignmentUploadReceipt saveUploadReceipt(String key, String publicUrl, String mime, Long size,
                                                      String uploadType) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null || principal.getId() == null || principal.getOrganizationId() == null
                || principal.getCollegeId() == null || key == null || mime == null || size == null || size <= 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Scoped uploader and file metadata are required");
        }
        String prefix = "org-" + principal.getOrganizationId() + "/college-" + principal.getCollegeId() + "/lesson-content/";
        if (!key.startsWith(prefix)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Resource upload tenant mismatch");
        AssignmentUploadReceipt receipt = new AssignmentUploadReceipt();
        receipt.setReceiptId(UUID.randomUUID().toString());
        receipt.setStorageKey(key);
        receipt.setPublicUrl(publicUrl);
        receipt.setFolder(RESOURCE_UPLOAD_FOLDER);
        receipt.setUploadType(RESOURCE_UPLOAD_TYPE.equalsIgnoreCase(uploadType)
                ? RESOURCE_UPLOAD_TYPE : LEGACY_GENERIC_TYPE);
        receipt.setOwnerUserId(principal.getId());
        receipt.setOwnerUserType(principal.isFaculty() ? "FACULTY" : principal.getUserType().toUpperCase(Locale.ROOT));
        receipt.setDeclaredContentType(mime);
        receipt.setDeclaredContentLength(size);
        receipt.setExpiresAt(LocalDateTime.now().plusMinutes(RECEIPT_VALID_MINUTES));
        return receiptRepository.save(receipt);
    }
}
