package com._42students.lms.service.impl;

import com._42students.lms.dto.request.AssignmentSubmissionAssetDTO;
import com._42students.lms.dto.request.ContentDataDTO;
import com._42students.lms.dto.request.NotificationRecipientDTO;
import com._42students.lms.dto.request.StudentAssignmentDTO;
import com._42students.lms.dto.response.LearnerResponseDTO;
import com._42students.lms.dto.response.SubmissionStatsDTO;
import com._42students.lms.enums.NotificationEvent;
import com._42students.lms.model.AssignmentUploadReceipt;
import com._42students.lms.model.GradeAuditLog;
import com._42students.lms.model.Learner;
import com._42students.lms.model.LessonContents;
import com._42students.lms.model.StudentAssignment;
import com._42students.lms.repository.AssignmentUploadReceiptRepository;
import com._42students.lms.repository.GradeAuditLogRepository;
import com._42students.lms.repository.StudentAssignmentRepository;
import com._42students.lms.model.Course;
import com._42students.lms.service.AssignmentService;
import com._42students.lms.service.CourseService;
import com._42students.lms.service.FacultyService;
import com._42students.lms.service.LearnerService;
import com._42students.lms.service.LessonContentsService;
import com._42students.lms.service.NotificationDispatcherService;
import com._42students.lms.service.NotificationService;
import com._42students.lms.service.NotificationTemplateContext;
import com._42students.lms.service.NotificationTemplateContextResolver;
import com._42students.lms.service.ZeptoMailService;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import lombok.extern.slf4j.Slf4j;
import com.amazonaws.services.s3.model.ObjectMetadata;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import com._42students.lms.repository.LessonContentsRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AssignmentServiceImpl implements AssignmentService {

    private static final String SUBMISSION_WRITTEN_RESPONSE = "WRITTEN_RESPONSE";
    private static final String SUBMISSION_PDF_UPLOAD = "PDF_UPLOAD";
    private static final String SUBMISSION_FILE_UPLOAD = "FILE_UPLOAD";
    private static final String SUBMISSION_REPOSITORY_LINK = "REPOSITORY_LINK";
    private static final String SUBMISSION_EXTERNAL_LINK = "EXTERNAL_LINK";

    @Autowired
    StudentAssignmentRepository studentAssignmentRepository;

    @Autowired
    LessonContentsService lessonContentsService;

    @Autowired
    FacultyService facultyService;

    @Autowired
    LearnerService learnerService;

    @Autowired(required = false)
    private com._42students.lms.repository.LearnerRepository learnerRepository;

    @Autowired
    LessonContentsRepository lessonContentsRepository;
    
    @Autowired(required = false)
    private ZeptoMailService zeptoMailService;
    
    @Autowired(required = false)
    private NotificationService notificationService;

    @Autowired(required = false)
    private NotificationDispatcherService notificationDispatcherService;
    
    @Autowired
    private NotificationTemplateContextResolver contextResolver;

    @Autowired
    private CourseService courseService;

    @Autowired(required = false)
    private SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    private com._42students.lms.access.AccessControlService accessControlService;

    @Autowired
    private GradeAuditLogRepository gradeAuditLogRepository;

    @Autowired(required = false)
    private com._42students.lms.access.ScopeResolutionService scopeResolutionService;

    @Autowired(required = false)
    private com._42students.lms.repository.FacultyTeachingAssignmentRepository facultyTeachingAssignmentRepository;

    @Autowired(required = false)
    private AssignmentUploadReceiptRepository assignmentUploadReceiptRepository;

    @Autowired(required = false)
    private com._42students.lms.utils.R2StorageUtils r2StorageUtils;

    /**
     * Check if the current user is allowed to access this lesson content (for submit).
     * Allowed: generic content (classId null or < 1), faculty, or learner in same class.
     */
    private boolean canAccessLessonContent(LessonContents lessonContents, Integer currentUserId, String currentUserType) {
        if (currentUserId == null) {
            return false;
        }
        Integer contentClassId = lessonContents.getClassId();
        if (contentClassId == null || contentClassId < 1) {
            return true; // generic content
        }
        if (currentUserType != null && (currentUserType.equalsIgnoreCase("FACULTY") || currentUserType.equalsIgnoreCase("ADMIN"))) {
            return true;
        }
        if (currentUserType != null && currentUserType.equalsIgnoreCase("LEARNER")) {
            Learner learner = learnerService.getLearnerDetails(String.valueOf(currentUserId));
            if (learner != null && contentClassId.equals(learner.getClassId())) return true;
            // BE-0009: a class-specific assignment of an elective (group-backed) class the learner belongs to is theirs too.
            // Only the home class used to count, so elective submissions were refused although course and class access passed.
            UserPrincipal caller = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
            return accessControlService != null && caller != null && caller.isLearner() && currentUserId.equals(caller.getId())
                    && accessControlService.resolveLearnerAudienceClassIds(caller).contains(contentClassId);
        }
        return false;
    }

    /**
     * Throws AccessDeniedException (403) if current user may not access this content or submit for the given student.
     */
    private void ensureCanAccessAndSubmit(LessonContents lessonContents, StudentAssignmentDTO dto) {
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Authentication required to submit");
        }
        if (!canAccessLessonContent(lessonContents, principal.getId(), principal.getUserType())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to this lesson content");
        }
        if (principal.isLearner() && (principal.getId() == null || dto.getStudentId() != principal.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Learners may only submit for themselves");
        }
    }

    /**
     * Throws if current user may not view or grade submissions for this lesson content.
     * Allowed: FACULTY who owns the content (lessonContents.getFacultyId()) or ADMIN.
     */
    @Override
    public void ensureCanViewOrGradeAssignment(int lessonContentId) {
        ensureCanViewOrGradeLessonContent(lessonContentId);
    }

    private void ensureCanViewOrGradeLessonContent(int lessonContentId) {
        LessonContents lessonContents = lessonContentsService.getLessonContents(lessonContentId);
        if (lessonContents == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson content not found");
        }
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Authentication required");
        }
        if (principal.isFaculty() || "ADMIN".equalsIgnoreCase(principal.getFacultyType())) {
            boolean isGlobalSuperAdmin = principal.getId() != null && principal.getId() == 0
                    && principal.getCollegeId() == null && principal.getOrganizationId() == null;
            if (!isGlobalSuperAdmin) {
                if (scopeResolutionService == null) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "Scope resolution unavailable; cannot authorize assignment grading");
                }
                Integer contentCollegeId = null;
                if (lessonContents.getClassId() != null && lessonContents.getClassId() > 0) {
                    contentCollegeId = scopeResolutionService.resolveClassToCollegeId(lessonContents.getClassId());
                } else if (lessonContents.getCourseId() != null && lessonContents.getCourseId() > 0) {
                    contentCollegeId = scopeResolutionService.resolveCourseToCollegeId(lessonContents.getCourseId());
                }
                if (contentCollegeId == null) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "Cannot resolve assignment college scope");
                }
                if (principal.getCollegeId() != null && !contentCollegeId.equals(principal.getCollegeId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to view or grade this content");
                }
                if (principal.getOrganizationId() != null) {
                    Integer contentOrganizationId = scopeResolutionService.resolveCollegeToOrganizationId(contentCollegeId);
                    if (!principal.getOrganizationId().equals(contentOrganizationId)) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to view or grade this content");
                    }
                }
            }
            Integer contentFacultyId = lessonContents.getFacultyId();
            if ("ADMIN".equalsIgnoreCase(principal.getFacultyType())) {
                return;
            }
            if (contentFacultyId != null && contentFacultyId.equals(principal.getId())) {
                return;
            }
            // Co-teachers may grade only when they are actively assigned to this exact course/class.
            if (facultyTeachingAssignmentRepository != null
                    && principal.getId() != null
                    && lessonContents.getCourseId() != null && lessonContents.getCourseId() > 0) {
                int courseId = lessonContents.getCourseId();
                Integer classId = lessonContents.getClassId();
                boolean assigned = classId != null && classId > 0
                        ? facultyTeachingAssignmentRepository.existsByFacultyIdAndCourseIdAndClassIdAndIsActive(
                                principal.getId(), courseId, classId, true)
                        : facultyTeachingAssignmentRepository.existsByFacultyIdAndCourseIdAndIsActive(
                                principal.getId(), courseId, true);
                if (assigned) return;
            }
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to view or grade this content");
    }

    private boolean hasNonEmptySubmissionFile(StudentAssignmentDTO dto) {
        if (dto == null || dto.getFileDTO() == null) return false;
        String key = dto.getFileDTO().getCloudStorageObject();
        return key != null && !key.trim().isEmpty();
    }

    private boolean hasNonEmptySubmissionHtml(StudentAssignmentDTO dto) {
        if (dto == null || dto.getHtmlContent() == null) return false;
        String html = dto.getHtmlContent().trim();
        if (html.isEmpty()) return false;
        return !org.jsoup.Jsoup.parse(html).text().trim().isEmpty();
    }

    private boolean hasNonEmptySubmissionLink(StudentAssignmentDTO dto) {
        return dto != null && dto.getSubmissionLink() != null && !dto.getSubmissionLink().trim().isEmpty();
    }

    private boolean hasNonEmptySubmissionFileDTO(com._42students.lms.dto.request.FileDTO fileDTO) {
        if (fileDTO == null) return false;
        String key = fileDTO.getCloudStorageObject();
        return key != null && !key.trim().isEmpty();
    }

    private String normalizeSubmissionType(String submissionType) {
        if (submissionType == null || submissionType.trim().isEmpty()) return null;
        return submissionType.trim().toUpperCase();
    }

    private List<AssignmentSubmissionAssetDTO> resolveSubmissionAssets(StudentAssignmentDTO dto) {
        List<AssignmentSubmissionAssetDTO> resolved = new ArrayList<>();
        if (dto != null && dto.getSubmissionAssets() != null) {
            for (AssignmentSubmissionAssetDTO asset : dto.getSubmissionAssets()) {
                if (asset != null) {
                    asset.setType(normalizeSubmissionType(asset.getType()));
                }
                resolved.add(asset);
            }
        }
        return resolved;
    }

    private String inferSubmissionAssetType(AssignmentSubmissionAssetDTO asset) {
        String normalizedType = normalizeSubmissionType(asset != null ? asset.getType() : null);
        if (normalizedType != null) return normalizedType;
        if (asset != null && asset.getLink() != null && !asset.getLink().trim().isEmpty()) return SUBMISSION_EXTERNAL_LINK;
        if (asset != null && hasNonEmptySubmissionFileDTO(asset.getFileDTO())) return SUBMISSION_FILE_UPLOAD;
        return null;
    }

    private List<String> resolveAllowedAssignmentSubmissionTypes(LessonContents lessonContents) {
        ContentDataDTO contentDataDTO = lessonContents != null ? lessonContents.getContentDataDTO() : null;
        List<String> resolved = new ArrayList<>();
        if (contentDataDTO != null && contentDataDTO.getAllowedSubmissionTypes() != null) {
            for (String type : contentDataDTO.getAllowedSubmissionTypes()) {
                String normalized = normalizeSubmissionType(type);
                if (normalized != null && !resolved.contains(normalized)) {
                    resolved.add(normalized);
                }
            }
        }
        if (!resolved.isEmpty()) return resolved;
        if (contentDataDTO != null) {
            if (contentDataDTO.getHtmlContent() != null && !contentDataDTO.getHtmlContent().trim().isEmpty()) {
                resolved.add(SUBMISSION_WRITTEN_RESPONSE);
            }
            if (contentDataDTO.getFileDTO() != null
                    && contentDataDTO.getFileDTO().getCloudStorageObject() != null
                    && !contentDataDTO.getFileDTO().getCloudStorageObject().trim().isEmpty()) {
                resolved.add(SUBMISSION_PDF_UPLOAD);
            }
        }
        if (resolved.isEmpty()) {
            resolved.add(SUBMISSION_PDF_UPLOAD);
        }
        return resolved;
    }

    private String inferAssignmentSubmissionType(StudentAssignmentDTO dto) {
        String normalized = normalizeSubmissionType(dto != null ? dto.getSubmissionType() : null);
        if (normalized != null) return normalized;
        if (hasNonEmptySubmissionLink(dto)) return SUBMISSION_EXTERNAL_LINK;
        if (hasNonEmptySubmissionFile(dto)) return SUBMISSION_FILE_UPLOAD;
        if (hasNonEmptySubmissionHtml(dto)) return SUBMISSION_WRITTEN_RESPONSE;
        return null;
    }

    private void validateAssignmentSubmissionPayload(StudentAssignmentDTO dto, LessonContents lessonContents) {
        List<String> allowedTypes = resolveAllowedAssignmentSubmissionTypes(lessonContents);
        List<AssignmentSubmissionAssetDTO> submissionAssets = resolveSubmissionAssets(dto);
        if (!submissionAssets.isEmpty()) {
            Set<String> assetIds = new HashSet<>();
            for (AssignmentSubmissionAssetDTO asset : submissionAssets) {
                if (asset == null) {
                    throw new IllegalArgumentException("Each submission item must include a valid type and content.");
                }
                if (asset.getId() != null && !asset.getId().trim().isEmpty()
                        && !assetIds.add(asset.getId().trim())) {
                    throw new IllegalArgumentException("Duplicate submission item ID.");
                }
                String assetType = inferSubmissionAssetType(asset);
                if (assetType == null) {
                    throw new IllegalArgumentException("Each submission item must include a valid type and content.");
                }
                if (!allowedTypes.contains(assetType)) {
                    throw new IllegalArgumentException("One or more submission items use a method not allowed for this assignment.");
                }
                switch (assetType) {
                    case SUBMISSION_WRITTEN_RESPONSE:
                        if (!hasNonEmptySubmissionHtml(dto)) {
                            throw new IllegalArgumentException("Written response submission requires html_content.");
                        }
                        break;
                    case SUBMISSION_PDF_UPLOAD:
                    case SUBMISSION_FILE_UPLOAD:
                        if (!hasNonEmptySubmissionFileDTO(asset.getFileDTO())) {
                            throw new IllegalArgumentException("File submission requires file_dto.cloud_storage_object.");
                        }
                        if (asset.getUploadReceiptId() == null || asset.getUploadReceiptId().trim().isEmpty()) {
                            throw new IllegalArgumentException("File submission requires upload_receipt_id.");
                        }
                        break;
                    case SUBMISSION_REPOSITORY_LINK:
                    case SUBMISSION_EXTERNAL_LINK:
                        if (asset.getLink() == null || asset.getLink().trim().isEmpty()) {
                            throw new IllegalArgumentException("Link submission requires a non-empty link.");
                        }
                        String assetLink = asset.getLink().trim();
                        if (!assetLink.startsWith("http://") && !assetLink.startsWith("https://")) {
                            throw new IllegalArgumentException("Link submission must be a valid http(s) URL.");
                        }
                        break;
                    default:
                        throw new IllegalArgumentException("Unsupported assignment submission type.");
                }
                asset.setType(assetType);
            }
            dto.setSubmissionAssets(submissionAssets);
            dto.setSubmissionType(submissionAssets.size() == 1 ? submissionAssets.get(0).getType() : "MULTI_PART");
            AssignmentSubmissionAssetDTO firstFileAsset = submissionAssets.stream()
                    .filter(asset -> SUBMISSION_PDF_UPLOAD.equals(asset.getType()) || SUBMISSION_FILE_UPLOAD.equals(asset.getType()))
                    .filter(asset -> hasNonEmptySubmissionFileDTO(asset.getFileDTO()))
                    .findFirst()
                    .orElse(null);
            AssignmentSubmissionAssetDTO firstLinkAsset = submissionAssets.stream()
                    .filter(asset -> SUBMISSION_REPOSITORY_LINK.equals(asset.getType()) || SUBMISSION_EXTERNAL_LINK.equals(asset.getType()))
                    .filter(asset -> asset.getLink() != null && !asset.getLink().trim().isEmpty())
                    .findFirst()
                    .orElse(null);
            if (firstFileAsset != null) dto.setFileDTO(firstFileAsset.getFileDTO());
            if (firstLinkAsset != null) dto.setSubmissionLink(firstLinkAsset.getLink());
            if (hasNonEmptySubmissionHtml(dto)) {
                if (!allowedTypes.contains(SUBMISSION_WRITTEN_RESPONSE)) {
                    throw new IllegalArgumentException("Written response is not allowed for this assignment.");
                }
                dto.setSubmissionType("MULTI_PART");
            }
            return;
        }

        String submissionType = inferAssignmentSubmissionType(dto);
        if (submissionType == null) {
            throw new IllegalArgumentException("Assignment submission requires content in one of the allowed submission methods.");
        }
        if (!allowedTypes.contains(submissionType)) {
            throw new IllegalArgumentException("Submission type is not allowed for this assignment.");
        }
        switch (submissionType) {
            case SUBMISSION_WRITTEN_RESPONSE:
                if (!hasNonEmptySubmissionHtml(dto)) {
                    throw new IllegalArgumentException("Written response submission requires html_content.");
                }
                break;
            case SUBMISSION_PDF_UPLOAD:
            case SUBMISSION_FILE_UPLOAD:
                if (!hasNonEmptySubmissionFile(dto)) {
                    throw new IllegalArgumentException("File submission requires file_dto.cloud_storage_object.");
                }
                if (dto.getUploadReceiptId() == null || dto.getUploadReceiptId().trim().isEmpty()) {
                    throw new IllegalArgumentException("File submission requires upload_receipt_id.");
                }
                break;
            case SUBMISSION_REPOSITORY_LINK:
            case SUBMISSION_EXTERNAL_LINK:
                if (!hasNonEmptySubmissionLink(dto)) {
                    throw new IllegalArgumentException("Link submission requires submission_link.");
                }
                String legacyLink = dto.getSubmissionLink().trim();
                if (!legacyLink.startsWith("http://") && !legacyLink.startsWith("https://")) {
                    throw new IllegalArgumentException("Link submission must be a valid http(s) URL.");
                }
                break;
            default:
                throw new IllegalArgumentException("Unsupported assignment submission type.");
        }
        dto.setSubmissionType(submissionType);
    }

    private List<AssignmentUploadReceipt> validateAndConsumeUploadReceipts(StudentAssignmentDTO dto, LessonContents lessonContents) {
        List<AssignmentUploadReceipt> consumed = new ArrayList<>();
        List<AssignmentSubmissionAssetDTO> assets = dto.getSubmissionAssets();
        if (assets != null && !assets.isEmpty()) {
            Set<String> receiptIds = new HashSet<>();
            for (AssignmentSubmissionAssetDTO asset : assets) {
                String assetType = asset != null ? asset.getType() : null;
                if (SUBMISSION_PDF_UPLOAD.equals(assetType) || SUBMISSION_FILE_UPLOAD.equals(assetType)) {
                    String receiptId = asset.getUploadReceiptId() != null ? asset.getUploadReceiptId().trim() : null;
                    if (receiptId == null || receiptId.isEmpty() || !receiptIds.add(receiptId)) {
                        throw new IllegalArgumentException("Each uploaded file requires a unique upload receipt.");
                    }
                    consumed.add(validateAndConsumeUploadReceipt(receiptId, asset.getFileDTO().getCloudStorageObject(), dto, lessonContents));
                }
            }
            return consumed;
        }
        String submissionType = dto.getSubmissionType();
        if (SUBMISSION_PDF_UPLOAD.equals(submissionType) || SUBMISSION_FILE_UPLOAD.equals(submissionType)) {
            consumed.add(validateAndConsumeUploadReceipt(dto.getUploadReceiptId(), dto.getFileDTO().getCloudStorageObject(), dto, lessonContents));
        }
        return consumed;
    }

    private AssignmentUploadReceipt validateAndConsumeUploadReceipt(String receiptId,
                                                                    String submittedKey,
                                                                    StudentAssignmentDTO dto,
                                                                    LessonContents lessonContents) {
        if (assignmentUploadReceiptRepository == null || r2StorageUtils == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Upload receipt verification is not configured");
        }
        String normalizedReceiptId = receiptId != null ? receiptId.trim() : "";
        String normalizedKey = submittedKey != null ? submittedKey.trim() : "";
        AssignmentUploadReceipt receipt = assignmentUploadReceiptRepository.findByReceiptIdAndIsDeletedFalse(normalizedReceiptId)
                .orElseThrow(() -> new IllegalArgumentException("Upload receipt is invalid or expired."));
        if (receipt.getConsumedAt() != null) {
            throw new IllegalArgumentException("Upload receipt has already been used.");
        }
        if (receipt.getExpiresAt() != null && LocalDateTime.now().isAfter(receipt.getExpiresAt())) {
            throw new IllegalArgumentException("Upload receipt is expired.");
        }
        if (!normalizedKey.equals(receipt.getStorageKey())) {
            throw new IllegalArgumentException("Upload receipt does not match the submitted file.");
        }
        if (receipt.getOwnerUserId() == null || receipt.getOwnerUserId() != dto.getStudentId()) {
            throw new IllegalArgumentException("Upload receipt does not belong to this learner.");
        }
        if (receipt.getLessonContentId() == null || receipt.getLessonContentId() != lessonContents.getId()) {
            throw new IllegalArgumentException("Upload receipt does not belong to this assignment.");
        }
        ObjectMetadata metadata;
        try {
            metadata = r2StorageUtils.getObjectMetadata(receipt.getStorageKey());
        } catch (Exception e) {
            throw new IllegalArgumentException("Uploaded file was not found in storage.");
        }
        long actualLength = metadata != null ? metadata.getContentLength() : -1L;
        if (actualLength <= 0) {
            throw new IllegalArgumentException("Uploaded file is empty or unavailable.");
        }
        if (receipt.getDeclaredContentLength() != null && receipt.getDeclaredContentLength() > 0
                && actualLength != receipt.getDeclaredContentLength()) {
            throw new IllegalArgumentException("Uploaded file size does not match the upload receipt.");
        }
        receipt.setActualContentLength(actualLength);
        receipt.setActualContentType(metadata.getContentType());
        receipt.setConsumedAt(LocalDateTime.now());
        return assignmentUploadReceiptRepository.save(receipt);
    }

    private void validateAssignmentIsSubmittable(LessonContents lessonContents) {
        String contentType = lessonContents.getContentType();
        if (contentType == null || !contentType.equalsIgnoreCase("assignment")) {
            throw new IllegalArgumentException(
                "Assignment submission requires lesson content type 'assignment' and file_dto or html_content.");
        }
        if (Boolean.TRUE.equals(lessonContents.getIsDeleted())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found");
        }
        if (!lessonContents.isActive() || !lessonContents.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Assignment is not available for submission");
        }
        LocalDateTime deadline = effectiveAssignmentDeadline(lessonContents);
        if (deadline == null) {
            throw new IllegalArgumentException("Assignment deadline is not configured");
        }
        if (isPastDeadline(deadline)) {
            throw new IllegalArgumentException("Submission deadline has passed");
        }
    }

    private static LocalDateTime effectiveAssignmentDeadline(LessonContents lessonContents) {
        if (lessonContents == null) return null;
        if (lessonContents.getDeadline() != null) return lessonContents.getDeadline();
        ContentDataDTO data = lessonContents.getContentDataDTO();
        String raw = data != null ? data.getDueDate() : null;
        if (raw == null || raw.trim().isEmpty()) return null;
        String value = raw.trim();
        try {
            return java.time.OffsetDateTime.parse(value)
                    .atZoneSameInstant(DEADLINE_ZONE)
                    .toLocalDateTime();
        } catch (java.time.format.DateTimeParseException ignored) {
            try {
                return LocalDateTime.parse(value);
            } catch (java.time.format.DateTimeParseException invalidLegacyDeadline) {
                log.warn("Rejecting malformed legacy assignment due_date for lessonContentId={}",
                        lessonContents.getId());
                throw new IllegalArgumentException("Assignment deadline is invalid");
            }
        }
    }

    // The assignment builder saves the deadline as the author's wall-clock time with no offset
    // ("2026-10-04T23:59:00"), and every college is in India. The JVM runs in UTC, so comparing
    // against LocalDateTime.now() kept submissions open for 5h30m after the deadline. Same rule
    // as QuizServiceImpl.isPastDue.
    static final java.time.ZoneId DEADLINE_ZONE = java.time.ZoneId.of("Asia/Kolkata");

    static boolean isPastDeadline(LocalDateTime deadline) {
        return deadline != null && LocalDateTime.now(DEADLINE_ZONE).isAfter(deadline);
    }

    @Override
    @Transactional
    public StudentAssignment submit(StudentAssignmentDTO studentAssignmentDTO) {
        // Assignment (file) submission only — quizzes are submitted via
        // POST /api/v1/quizzes/{quizId}/submit (QuizServiceImpl), not through this path.
        int lessonContentId = studentAssignmentDTO.getLessonContentId();
        LessonContents lessonContents = lessonContentsService.getLessonContents(lessonContentId);
        if (lessonContents == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson content not found");
        }
        validateAssignmentIsSubmittable(lessonContents);
        ensureCanAccessAndSubmit(lessonContents, studentAssignmentDTO);
        if (studentAssignmentRepository.existsByStudentIdAndLessonContentId(studentAssignmentDTO.getStudentId(), lessonContentId)) {
            throw new IllegalArgumentException("Already submitted for this assignment");
        }
        validateAssignmentSubmissionPayload(studentAssignmentDTO, lessonContents);
        return submitAssignmentWithFile(studentAssignmentDTO, lessonContents);
    }

    /**
     * Assignment (file/text) submission: persist student submission.
     */
    private StudentAssignment submitAssignmentWithFile(StudentAssignmentDTO dto, LessonContents lessonContents) {
        List<AssignmentUploadReceipt> consumedReceipts = validateAndConsumeUploadReceipts(dto, lessonContents);
        StudentAssignment studentAssignment = new StudentAssignment();
        setStudentAssignmentFromLessonContent(dto, studentAssignment, lessonContents);
        studentAssignment.setFileDTO(dto.getFileDTO());
        studentAssignment.setHtmlContent(dto.getHtmlContent() != null ? dto.getHtmlContent() : "");
        studentAssignment.setSubmissionType(dto.getSubmissionType());
        studentAssignment.setSubmissionLink(dto.getSubmissionLink() != null ? dto.getSubmissionLink() : "");
        studentAssignment.setSubmissionAssets(dto.getSubmissionAssets());
        studentAssignment.setGraded(0);
        studentAssignment.setPointsObtained(0);
        StudentAssignment saved;
        try {
            saved = studentAssignmentRepository.save(studentAssignment);
        } catch (DataIntegrityViolationException e) {
            // AQ-02: concurrent duplicate submission (race on check-then-insert)
            log.warn("AQ-02: Duplicate assignment submission race detected for studentId={}, lessonContentId={}",
                    dto.getStudentId(), dto.getLessonContentId());
            throw new IllegalArgumentException("Already submitted for this assignment");
        }
        for (AssignmentUploadReceipt receipt : consumedReceipts) {
            receipt.setStudentAssignmentId(saved.getId());
            assignmentUploadReceiptRepository.save(receipt);
        }
        sendAssignmentSubmittedNotification(saved);
        return saved;
    }

    /** Set assignment fields from lesson content and DTO. */
    private void setStudentAssignmentFromLessonContent(StudentAssignmentDTO dto, StudentAssignment studentAssignment, LessonContents lessonContents) {
        studentAssignment.setLessonContentId(dto.getLessonContentId());
        studentAssignment.setFileDTO(dto.getFileDTO());
        studentAssignment.setStudentId(dto.getStudentId());
        studentAssignment.setHtmlContent(dto.getHtmlContent() != null ? dto.getHtmlContent() : "");
        Learner learner = learnerService.getLearnerDetails(String.valueOf(dto.getStudentId()));
        if (learner != null) {
            studentAssignment.setStudentLastName(learner.getLastName());
            studentAssignment.setStudentFirstName(learner.getFirstName());
        }
        if (lessonContents.getContentDataDTO() != null && lessonContents.getContentDataDTO().getFileDTO() != null) {
            studentAssignment.setAssignmentName(lessonContents.getContentDataDTO().getFileDTO().getOriginalName());
        } else {
            studentAssignment.setAssignmentName(lessonContents.getContentTitle() != null ? lessonContents.getContentTitle() : "Assignment");
        }
        if (lessonContents.getClassId() != null) {
            studentAssignment.setFacultyId(facultyService.getFacultyId(lessonContents.getClassId()));
        } else {
            studentAssignment.setFacultyId(null);
        }
        studentAssignment.setPoints(lessonContents.getPoints());
    }

    @Override
    public List<StudentAssignment> fetchSubmissions(int lessonContentId) {
        ensureCanViewOrGradeLessonContent(lessonContentId);
        return studentAssignmentRepository.fetchSubmissions(lessonContentId);
    }

    @Override
    public Page<StudentAssignment> fetchSubmissions(int lessonContentId, Pageable pageable) {
        ensureCanViewOrGradeLessonContent(lessonContentId);
        return studentAssignmentRepository.findByLessonContentIdOrderByCreatedAtDesc(lessonContentId, pageable);
    }

    @Override
    public StudentAssignment fetchSubmission(int submissionId) {
        StudentAssignment assignment = studentAssignmentRepository.fetchSubmission(submissionId);
        if (assignment != null) {
            ensureCanViewOrGradeLessonContent(assignment.getLessonContentId());
        }
        return assignment;
    }

    @Override
    public List<StudentAssignment> fetchSubmissionsByLearnerId(int learnerId) {
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Authentication required");
        }
        if ((principal.getId() == null || !principal.getId().equals(learnerId)) && !principal.isFaculty() && !"ADMIN".equalsIgnoreCase(principal.getUserType())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to view these submissions");
        }
        List<StudentAssignment> submissions = studentAssignmentRepository.fetchSubmissionsByLearnerId(learnerId);
        // AQ-05: learners only see grade data after it is explicitly published.
        boolean isLearner = principal.isLearner() ||
                (principal.getId() != null && principal.getId().equals(learnerId) && !principal.isFaculty() && !"ADMIN".equalsIgnoreCase(principal.getUserType()));
        if (isLearner) {
            return submissions.stream().map(this::hideUnpublishedGrade).collect(java.util.stream.Collectors.toList());
        }
        // A college match is not teaching authorization. Plain faculty may only see the learner's
        // submissions for assignment content they own or actively teach.
        if (principal.isFaculty() && !"ADMIN".equalsIgnoreCase(principal.getFacultyType())) {
            return submissions.stream().filter(submission -> {
                try {
                    ensureCanViewOrGradeLessonContent(submission.getLessonContentId());
                    return true;
                } catch (RuntimeException denied) {
                    return false;
                }
            }).collect(java.util.stream.Collectors.toList());
        }
        return submissions;
    }

    @Override
    public Page<StudentAssignment> fetchSubmissionsForLearner(int learnerId, int lessonContentId, Pageable pageable) {
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Authentication required");
        }
        // Learners may only view their own submissions; faculty/admin may use this for scoped views.
        if ((principal.getId() == null || !principal.getId().equals(learnerId)) && !principal.isFaculty() && !"ADMIN".equalsIgnoreCase(principal.getUserType())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to view these submissions");
        }
        Page<StudentAssignment> page = studentAssignmentRepository.findByStudentIdAndLessonContentIdOrderByCreatedAtDesc(learnerId, lessonContentId, pageable);
        boolean isLearner = principal.isLearner() ||
                (principal.getId() != null && principal.getId().equals(learnerId) && !principal.isFaculty() && !"ADMIN".equalsIgnoreCase(principal.getUserType()));
        if (isLearner) {
            return page.map(this::hideUnpublishedGrade);
        }
        return page;
    }

    /**
     * AQ-05 masking for learners, on a copy. Zeroing the loaded entities only worked because this read runs without a
     * transaction (open-in-view is off): inside any transaction those managed rows would be flushed, overwriting the real
     * points and graded flag with zeros. A copy can never be written back.
     */
    private StudentAssignment hideUnpublishedGrade(StudentAssignment sa) {
        if (sa.isGradePublished()) return sa;
        StudentAssignment masked = new StudentAssignment();
        org.springframework.beans.BeanUtils.copyProperties(sa, masked);
        masked.setPointsObtained(0);
        masked.setPreviousPoints(0);
        masked.setGraded(0);
        masked.setGradingStatus("NOT_GRADED");
        masked.setGradedBy(null);
        masked.setGradedAt(null);
        masked.setGradingDate(null);
        return masked;
    }

    @Override
    @Transactional
    public StudentAssignment publishGrade(int studentAssignmentId, int publishedByFacultyId) {
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Authentication required");
        }
        StudentAssignment sa = studentAssignmentRepository.findById(studentAssignmentId);
        if (sa == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found");
        }
        ensureCanViewOrGradeLessonContent(sa.getLessonContentId());
        // Defense-in-depth: prevent spoofing publisher id unless admin/superadmin.
        boolean isAdmin = "ADMIN".equalsIgnoreCase(principal.getUserType())
                || ("FACULTY".equalsIgnoreCase(principal.getUserType()) && "ADMIN".equalsIgnoreCase(principal.getFacultyType()));
        boolean isSuperAdmin = principal.getCollegeId() == null && principal.getOrganizationId() == null;
        if (!isAdmin && !isSuperAdmin && (principal.getId() == null || principal.getId() != publishedByFacultyId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You may only publish as yourself");
        }
        if (sa.getGraded() != 1) {
            throw new IllegalStateException("Cannot publish grade: submission has not been graded yet");
        }
        if (sa.isGradePublished()) {
            return sa;
        }
        long previousPoints = sa.getPointsObtained();
        String previousStatus = sa.getGradingStatus();
        sa.setGradePublished(true);
        StudentAssignment saved = studentAssignmentRepository.save(sa);
        // Prompt 33: durable audit entry, actor always from the authenticated principal —
        // publishedByFacultyId is client-supplied and only used above for the self-publish check,
        // never trusted as the actor of record.
        logGradeChange(saved, previousPoints, previousStatus, previousStatus, "PUBLISH_GRADE");
        sendGradePublishedNotification(saved);
        return saved;
    }

    @Override
    public SubmissionStatsDTO getSubmissionStats(int lessonContentId) {
        ensureCanViewOrGradeLessonContent(lessonContentId);
        SubmissionStatsDTO submissionStats = new SubmissionStatsDTO();
        List<StudentAssignment> submittedAssignments = studentAssignmentRepository.fetchSubmissions(lessonContentId);
        Set<Integer> submittedStudentIds = new HashSet<>();
        Set<Integer> notGradedStudentIds = new HashSet<>();

        for (StudentAssignment assignment : submittedAssignments) {
            int studentId = assignment.getStudentId();
            submittedStudentIds.add(studentId);
            if (assignment.getGraded() != 1) {
                notGradedStudentIds.add(studentId);
            }
        }

        Integer classId = lessonContentsRepository.findClassIdByLessonContentId(lessonContentId);
        if (classId != null && classId > 0) {
            Set<Integer> classMemberIds = activeLearnerIdsForClass(classId);
            populateRosterBackedSubmissionStats(submissionStats, submittedStudentIds, notGradedStudentIds, classMemberIds);
        } else {
            Set<Integer> eligibleLearnerIds = eligibleLearnerIdsForAssignment(lessonContentId);
            populateRosterBackedSubmissionStats(submissionStats, submittedStudentIds, notGradedStudentIds, eligibleLearnerIds);
        }

        return submissionStats;
    }

    private Set<Integer> activeLearnerIdsForClass(int classId) {
        List<LearnerResponseDTO> classMembers = learnerService.getStudentDetailsByClassId(classId);
        Set<Integer> ids = new HashSet<>();
        for (LearnerResponseDTO dto : classMembers) {
            if (dto.getLearnerId() != null) {
                ids.add(dto.getLearnerId());
            }
        }
        return ids;
    }

    private Set<Integer> eligibleLearnerIdsForAssignment(int lessonContentId) {
        if (learnerRepository == null) {
            return new HashSet<>();
        }
        return learnerRepository.findEligibleLearnersForAssignment(lessonContentId).stream()
                .map(Learner::getId)
                .collect(Collectors.toCollection(HashSet::new));
    }

    private void populateRosterBackedSubmissionStats(SubmissionStatsDTO stats,
                                                    Set<Integer> submittedStudentIds,
                                                    Set<Integer> notGradedStudentIds,
                                                    Set<Integer> eligibleLearnerIds) {
        Set<Integer> rosterIds = eligibleLearnerIds != null ? new HashSet<>(eligibleLearnerIds) : new HashSet<>();
        rosterIds.addAll(submittedStudentIds);
        Set<Integer> notSubmittedStudentIds = new HashSet<>(rosterIds);
        notSubmittedStudentIds.removeAll(submittedStudentIds);

        stats.setTotalStudents(rosterIds.size());
        stats.setTotalSubmitted(submittedStudentIds.size());
        stats.setTotalGraded(submittedStudentIds.size() - notGradedStudentIds.size());
        stats.setNotGraded(notGradedStudentIds.size());
        stats.setNotSubmitted(notSubmittedStudentIds.size());
        stats.setNotSubmittedStudentIds(new ArrayList<>(notSubmittedStudentIds));
        stats.setNotGradedStudentIds(new ArrayList<>(notGradedStudentIds));
    }


    @Override
    @Transactional
    public StudentAssignment updatePoints(int studentAssignmentId, long pointsObtained) {
        StudentAssignment studentAssignment = studentAssignmentRepository.findById(studentAssignmentId);
        if (studentAssignment == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Student assignment not found");
        }
        ensureCanViewOrGradeLessonContent(studentAssignment.getLessonContentId());
        if (pointsObtained < 0) {
            throw new IllegalArgumentException("Points obtained cannot be negative");
        }
        long maxPoints = studentAssignment.getPoints();
        if (maxPoints < 0 || pointsObtained > maxPoints) {
            throw new IllegalArgumentException("Points obtained cannot exceed maximum points (" + maxPoints + ")");
        }
        // Fix #14: Audit trail for grade changes
        long previousPoints = studentAssignment.getPointsObtained();
        String previousStatus = studentAssignment.getGradingStatus();
        studentAssignment.setPreviousPoints(previousPoints);
        studentAssignment.setPointsObtained(pointsObtained);
        studentAssignment.setGraded(1);
        studentAssignment.setGradePublished(false);
        // Fix #6: Set explicit grading status
        studentAssignment.setGradingStatus("MANUALLY_GRADED");
        studentAssignment.setGradedAt(LocalDateTime.now());
        // Set graded_by from current user
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal != null && principal.getId() != null) {
            studentAssignment.setGradedBy(principal.getId());
        }
        try {
            // Fix #2: Optimistic locking — @Version will throw ObjectOptimisticLockingFailureException on conflict
            StudentAssignment savedAssignment = studentAssignmentRepository.save(studentAssignment);
            // Fix #14: Write audit log
            logGradeChange(savedAssignment, previousPoints, previousStatus, "MANUALLY_GRADED", "UPDATE_POINTS");
            return savedAssignment;
        } catch (ObjectOptimisticLockingFailureException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This submission was modified by another user. Please refresh and try again.");
        }
    }



public double calculateAssignmentAveragePercentage(int studentId) {
    List<StudentAssignment> studentAssignments = studentAssignmentRepository.fetchAssignmentSubmissionsByLearnerId(studentId);

    if (studentAssignments.isEmpty()) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No assignment submissions found for student");
    }

    // AQ-05: learners only see published grades in statistics
    UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
    boolean callerIsLearner = principal != null && principal.isLearner();
    if (callerIsLearner) {
        studentAssignments = studentAssignments.stream()
                .filter(StudentAssignment::isGradePublished)
                .collect(java.util.stream.Collectors.toList());
    }

    long totalPoints = 0;
    long totalPointsObtained = 0;

    for (StudentAssignment assignment : studentAssignments) {
        totalPoints += assignment.getPoints();
        totalPointsObtained += assignment.getPointsObtained();
    }

    if (totalPoints == 0) {
        return 0.0;
    }
    return (totalPointsObtained * 100.0) / totalPoints;
}


public int countAssignmentSubmissionsByLearnerId(int studentId) {
    return studentAssignmentRepository.countAssignmentSubmissionsByLearnerId(studentId);
}



    @Override
    @Transactional
    public StudentAssignment addDescriptivePoints(int studentAssignmentId, long pointsToAdd) {
        StudentAssignment studentAssignment = studentAssignmentRepository.findById(studentAssignmentId);
        if (studentAssignment == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Student assignment not found");
        }
        ensureCanViewOrGradeLessonContent(studentAssignment.getLessonContentId());
        // AQ-08: Block adding descriptive points to an already auto-graded or manually graded submission
        String currentGradingStatus = studentAssignment.getGradingStatus();
        if ("AUTO_GRADED".equals(currentGradingStatus) || "MANUALLY_GRADED".equals(currentGradingStatus)) {
            throw new IllegalArgumentException("Cannot add descriptive points: submission is already graded (" + currentGradingStatus + "). Use updatePoints instead.");
        }
        if (pointsToAdd < 0) {
            throw new IllegalArgumentException("Points to add cannot be negative");
        }
        LessonContents lessonContents = lessonContentsService.getLessonContents(studentAssignment.getLessonContentId());
        if (lessonContents == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson content not found");
        }
        long currentPointsObtained = studentAssignment.getPointsObtained();
        long maxPoints = lessonContents.getPoints();
        // Check before addition to prevent long overflow from bypassing the maximum.
        if (maxPoints < 0 || currentPointsObtained < 0 || currentPointsObtained > maxPoints
                || pointsToAdd > maxPoints - currentPointsObtained) {
            throw new IllegalArgumentException("Points obtained cannot exceed the maximum points for this assignment (" + maxPoints + ")");
        }
        long newPointsObtained = currentPointsObtained + pointsToAdd;
        if (newPointsObtained > maxPoints) {
            throw new IllegalArgumentException("Points obtained cannot exceed the maximum points for this assignment (" + maxPoints + ")");
        }
        // Fix #14: Audit trail
        String previousStatus = studentAssignment.getGradingStatus();
        studentAssignment.setPreviousPoints(currentPointsObtained);
        studentAssignment.setPointsObtained(newPointsObtained);
        studentAssignment.setGraded(1);
        studentAssignment.setGradePublished(false);
        // Fix #6: Grading status
        studentAssignment.setGradingStatus("MANUALLY_GRADED");
        studentAssignment.setGradedAt(LocalDateTime.now());
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal != null && principal.getId() != null) {
            studentAssignment.setGradedBy(principal.getId());
        }
        try {
            StudentAssignment savedAssignment = studentAssignmentRepository.save(studentAssignment);
            logGradeChange(savedAssignment, currentPointsObtained, previousStatus, "MANUALLY_GRADED", "ADD_DESCRIPTIVE_POINTS");
            return savedAssignment;
        } catch (ObjectOptimisticLockingFailureException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This submission was modified by another user. Please refresh and try again.");
        }
    }

    /**
     * Send assignment submitted notification via multiple channels
     * Non-blocking - failures are logged but don't affect the submission
     */
    private void sendAssignmentSubmittedNotification(StudentAssignment assignment) {
        try {
            // Get learner
            Optional<Learner> learnerOpt = learnerService.findById(assignment.getStudentId());
            if (!learnerOpt.isPresent()) {
                log.warn("Cannot send assignment submitted notification - learner not found for studentId {}", assignment.getStudentId());
                return;
            }
            Learner learner = learnerOpt.get();
            
            // Get lesson contents for assignment details
            LessonContents lessonContents = lessonContentsService.getLessonContents(assignment.getLessonContentId());
            if (lessonContents == null) {
                log.warn("Cannot send assignment submitted notification - lesson contents not found");
                return;
            }

            Map<String, Object> variables = new HashMap<>();
            // Notification templates key off contentType for feature flag gating.
            variables.put("contentType", "ASSIGNMENT");
            String firstName = learner.getFirstName() != null ? learner.getFirstName() : "";
            String lastName = learner.getLastName() != null ? learner.getLastName() : "";
            variables.put("learnerName", (firstName + " " + lastName).trim());
            String assignmentName = assignment.getAssignmentName();
            variables.put("assignmentName", (assignmentName != null && !assignmentName.trim().isEmpty()) ? assignmentName : "Assignment");
            if (lessonContents.getCourseName() != null && !lessonContents.getCourseName().trim().isEmpty()) {
                variables.put("courseName", lessonContents.getCourseName());
            } else if (lessonContents.getCourseId() != null) {
                try {
                    Course course = courseService.fetchCourse(lessonContents.getCourseId());
                    if (course != null && course.getCourseName() != null) {
                        variables.put("courseName", course.getCourseName());
                    }
                } catch (Exception ignored) { }
            }
            variables.put("submissionDate", java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy")));

            NotificationTemplateContext context = contextResolver.getContextForLearner(learner);
            String learnerFirstName = learner.getFirstName() != null ? learner.getFirstName() : "";
            String learnerLastName = learner.getLastName() != null ? learner.getLastName() : "";
            String learnerName = (learnerFirstName + " " + learnerLastName).trim();
            Integer courseId = lessonContents.getCourseId() != null ? lessonContents.getCourseId() : null;
            NotificationRecipientDTO recipient = NotificationRecipientDTO.builder()
                    .email(learner.getContactMail())
                    .phone(learner.getContactMobile())
                    .recipientName(learnerName)
                    .learnerId(learner.getId())
                    .classId(learner.getClassId())
                    .courseId(courseId)
                    .build();
            if (notificationDispatcherService != null) {
                try {
                    notificationDispatcherService.dispatch(NotificationEvent.COURSE_ASSIGNMENT_SUBMITTED, context, recipient, variables);
                    log.info("Assignment submitted notifications sent for learner {} with {} context", learner.getId(), context);
                } catch (Exception e) {
                    log.error("Failed to send assignment submitted notifications: {}", e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error sending assignment submitted notifications: {}", e.getMessage(), e);
        }
    }

    /**
     * Send grade published notification via multiple channels
     * Non-blocking - failures are logged but don't affect the grade update
     */
    private void sendGradePublishedNotification(StudentAssignment assignment) {
        try {
            // Get learner
            Optional<Learner> learnerOpt = learnerService.findById(assignment.getStudentId());
            if (!learnerOpt.isPresent()) {
                log.warn("Cannot send grade published notification - learner not found for studentId {}", assignment.getStudentId());
                return;
            }
            Learner learner = learnerOpt.get();
            
            // Get lesson contents for assignment details
            LessonContents lessonContents = lessonContentsService.getLessonContents(assignment.getLessonContentId());
            if (lessonContents == null) {
                log.warn("Cannot send grade published notification - lesson contents not found");
                return;
            }
            
            Map<String, Object> variables = new HashMap<>();
            variables.put("contentType", "ASSIGNMENT");
            variables.put("learnerName", learner.getFirstName() + " " + learner.getLastName());
            String assignmentName = assignment.getAssignmentName();
            variables.put("assignmentName", (assignmentName != null && !assignmentName.trim().isEmpty()) ? assignmentName : "Assignment");
            
            // Add courseName, courseId and courseSlug from lessonContents (courseSlug for URLs in emails)
            if (lessonContents.getCourseName() != null && !lessonContents.getCourseName().trim().isEmpty()) {
                variables.put("courseName", lessonContents.getCourseName());
            }
            if (lessonContents.getCourseId() != null) {
                variables.put("courseId", lessonContents.getCourseId());
                Course course = courseService.fetchCourse(lessonContents.getCourseId());
                if (course != null && course.getSlug() != null) {
                    variables.put("courseSlug", course.getSlug());
                }
            }
            
            // Calculate grade percentage
            if (assignment.getPoints() > 0) {
                double percentage = (assignment.getPointsObtained() * 100.0) / assignment.getPoints();
                variables.put("grade", String.format("%.1f%%", percentage));
            }
            variables.put("pointsObtained", assignment.getPointsObtained());
            variables.put("maxPoints", assignment.getPoints());
            
            NotificationTemplateContext context = contextResolver.getContextForLearner(learner);
            String learnerName = learner.getFirstName() + " " + learner.getLastName();
            Integer courseId = lessonContents.getCourseId() != null ? lessonContents.getCourseId() : null;
            NotificationRecipientDTO recipient = NotificationRecipientDTO.builder()
                    .email(learner.getContactMail())
                    .phone(learner.getContactMobile())
                    .recipientName(learnerName)
                    .learnerId(learner.getId())
                    .classId(learner.getClassId())
                    .courseId(courseId)
                    .build();
            if (notificationDispatcherService != null) {
                try {
                    notificationDispatcherService.dispatch(NotificationEvent.COURSE_GRADE_PUBLISHED, context, recipient, variables);
                    log.info("Grade published notifications sent for learner {} with {} context", learner.getId(), context);
                } catch (Exception e) {
                    log.error("Failed to send grade published notifications: {}", e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error sending grade published notifications: {}", e.getMessage(), e);
        }
    }

    // --- Fix #14: Grade audit trail ---

    private void logGradeChange(StudentAssignment assignment, long previousPoints, String previousStatus, String newStatus, String action) {
        try {
            GradeAuditLog auditLog = new GradeAuditLog();
            auditLog.setStudentAssignmentId(assignment.getId());
            UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
            auditLog.setGradedBy(principal != null && principal.getId() != null ? principal.getId() : 0);
            auditLog.setPreviousPoints(previousPoints);
            auditLog.setNewPoints(assignment.getPointsObtained());
            auditLog.setPreviousGradingStatus(previousStatus);
            auditLog.setNewGradingStatus(newStatus);
            auditLog.setAction(action);
            gradeAuditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to write grade audit log for assignment {}: {}", assignment.getId(), e.getMessage());
        }
    }

}

