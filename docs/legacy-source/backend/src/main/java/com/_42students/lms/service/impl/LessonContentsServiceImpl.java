package com._42students.lms.service.impl;

import com._42students.lms.dto.request.ContentDataDTO;
import com._42students.lms.dto.request.FileDTO;
import com._42students.lms.dto.request.LessonContentsDTO;
import com._42students.lms.dto.response.PageResponseDTO;
import com._42students.lms.dto.response.PlaybackUrlResponseDTO;
import com._42students.lms.model.Course;
import com._42students.lms.model.Learner;
import com._42students.lms.model.Lesson;
import com._42students.lms.model.LessonContentClassSequence;
import com._42students.lms.model.LessonContents;
import com._42students.lms.repository.LessonContentClassSequenceRepository;
import com._42students.lms.repository.LessonContentsRepository;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.CourseService;
import com._42students.lms.service.LearnerService;
import com._42students.lms.repository.LessonRepository;
import com._42students.lms.service.LessonContentsService;
import com._42students.lms.util.SecurityContextUtil;
import com._42students.lms.utils.ContentUrlValidator;
import com._42students.lms.utils.R2StorageUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.transaction.annotation.Transactional;

import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.regex.Pattern;

@Service
public class LessonContentsServiceImpl implements LessonContentsService {

    private static final Logger log = LoggerFactory.getLogger(LessonContentsServiceImpl.class);

    // Lesson content writes had no admin audit trail. Delete is the most consequential:
    // deleteContentFileBestEffort permanently destroys the uploaded video/PDF/PPT in R2, so
    // this is the one action in the LMS that is genuinely unrecoverable — and it left no record
    // of who performed it. required=false keeps these optional for unit tests.
    @Autowired(required = false)
    com._42students.lms.service.AdminAuditLogService auditLogService;

    @Autowired(required = false)
    javax.servlet.http.HttpServletRequest httpRequest;

    private void auditContent(String actionKey, Object contentId, java.util.Map<String, Object> payload) {
        if (auditLogService == null) return;
        auditLogService.log(httpRequest, actionKey, "lesson_content", String.valueOf(contentId),
                null, null, payload != null ? payload : java.util.Map.of());
    }

    @Autowired
    LessonContentsRepository lessonContentsRepository;

    @Autowired
    LearnerService learnerService;

    @Autowired
    CourseService courseService;

    @Autowired(required = false)
    com._42students.lms.repository.CourseRepository courseRepository;

    @Autowired(required = false)
    LessonRepository lessonRepository;

    @Autowired(required = false)
    SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    ContentUrlValidator contentUrlValidator;

    @Autowired(required = false)
    R2StorageUtils r2StorageUtils;

    // A presigned PUT URL only binds Content-Type, not Content-Length — FileUploadController's
    // presign-time size check is against whatever the client SAYS it's about to upload, not what
    // actually lands in R2 (same gap Projects' enforceUploadedResourceSizeLimit already closes
    // for resource uploads). Re-verify against the real stored object's size here, at the point
    // this content is actually saved, so a caller can't declare a small size at presign time and
    // then PUT an arbitrarily large file straight to R2.
    @org.springframework.beans.factory.annotation.Value("${upload.video.max-size-bytes:5368709120}")
    private long maxVideoSizeBytes;

    @Autowired(required = false)
    com._42students.lms.service.ClassService classService;

    @Autowired(required = false)
    LessonContentClassSequenceRepository lessonContentClassSequenceRepository;

    @Autowired(required = false)
    FacultyTeachingAssignmentRepository facultyTeachingAssignmentRepository;

    @Autowired(required = false)
    AccessControlService accessControlService;

    @Autowired(required = false)
    ScopeResolutionService scopeResolutionService;

    /** Policy: multiple video, lecture, and other file-based contents per lesson are allowed. To enforce one-per-lesson or replace-by-sequence, add a check here and either update existing or throw 400. */
    @Override
    @Transactional
    public LessonContents createLessonContents(LessonContentsDTO lessonContentsDTO) {
        if (lessonContentsDTO == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lesson content payload is required");
        }
        if (lessonContentsDTO.getLessonId() == null || lessonContentsDTO.getLessonId() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "lesson_id is required");
        }
        int lessonId = lessonContentsDTO.getLessonId();
        if (lessonRepository != null) {
            Lesson lesson = lessonRepository.findById(lessonId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));
            if ((lessonContentsDTO.getCourseId() == null || lessonContentsDTO.getCourseId() == 0) && lesson.getCourseId() != 0) {
                lessonContentsDTO.setCourseId(lesson.getCourseId());
            }
        }
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal != null) {
            if (!principal.isFaculty() && !"ADMIN".equalsIgnoreCase(principal.getUserType())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only faculty or admin may create lesson content");
            }
            // SECURITY FIX: this must check facultyType (ADMIN = "college admin" faculty), not
            // userType (which is only ever "FACULTY" or "LEARNER" and can never equal "ADMIN" here).
            // The previous condition was always true for every faculty account, so a college-admin
            // faculty could never actually create content on another faculty member's behalf as
            // enforceFacultyTeachingScopeForCreate() below (correctly, via getFacultyType()) intends.
            boolean isAdminFacultyForCreate = principal.isFaculty()
                    && "ADMIN".equalsIgnoreCase(principal.getFacultyType());
            if (principal.isFaculty() && !isAdminFacultyForCreate) {
                lessonContentsDTO.setFacultyId(principal.getId() != null ? principal.getId() : 0);
            }
        }
        // BE-0022: an update is checked against the item's own class and course. A delete (an update that disables the item)
        // used to arrive without the class, so a teacher's own class assignment failed the teaching-scope check.
        Integer existingId = lessonContentsDTO.getLessonContentId();
        LessonContents current = existingId != null && existingId > 0 ? getLessonContents(existingId) : null;
        if (current != null) {
            if ((lessonContentsDTO.getClassId() == null || lessonContentsDTO.getClassId() <= 0) && current.getClassId() != null && current.getClassId() > 0) {
                lessonContentsDTO.setClassId(current.getClassId());
            }
            if (principal != null && principal.isFaculty()) {
                enforceFacultyTeachingScope(principal, current.getCourseId(), current.getClassId() != null && current.getClassId() > 0 ? current.getClassId() : null);
            }
        }
        enforceFacultyTeachingScopeForCreate(principal, lessonContentsDTO);
        Integer lessonContentId = lessonContentsDTO.getLessonContentId();
        if (lessonContentId != null && lessonContentId > 0) {
            LessonContents existing = getLessonContents(lessonContentId);
            if (existing != null) {
                // Update path: merge existing file_dto when incoming is blank (e.g. VideoDrawer edit without new file)
                if (lessonContentsDTO.getContentDataDTO() != null && existing.getContentDataDTO() != null
                        && existing.getContentDataDTO().getFileDTO() != null
                        && existing.getContentDataDTO().getFileDTO().getCloudStorageObject() != null
                        && !existing.getContentDataDTO().getFileDTO().getCloudStorageObject().trim().isEmpty()) {
                    String incomingUrl = lessonContentsDTO.getContentDataDTO().getFileDTO() != null
                            ? lessonContentsDTO.getContentDataDTO().getFileDTO().getCloudStorageObject()
                            : null;
                    boolean incomingBlank = incomingUrl == null || incomingUrl.trim().isEmpty();
                    if (incomingBlank && isFileBasedContentType(existing.getContentType())) {
                        if (lessonContentsDTO.getContentDataDTO().getFileDTO() == null) {
                            lessonContentsDTO.getContentDataDTO().setFileDTO(existing.getContentDataDTO().getFileDTO());
                        } else {
                            lessonContentsDTO.getContentDataDTO().getFileDTO().setCloudStorageObject(
                                    existing.getContentDataDTO().getFileDTO().getCloudStorageObject());
                        }
                    }
                }
                setLessonContents(lessonContentsDTO, existing);
                lessonContentsRepository.save(existing);
                auditContent("LESSON_CONTENT_CREATE", existing.getId(),
                        java.util.Map.of("lessonId", String.valueOf(existing.getLessonId()), "reusedExisting", "true"));
                return existing;
            }
        }
        enforceCurrentCourseAudienceForNewScope(lessonContentsDTO.getCourseId(), lessonContentsDTO.getClassId());
        LessonContents lessonContents = new LessonContents();
        setLessonContents(lessonContentsDTO, lessonContents);
        lessonContentsRepository.save(lessonContents);
        auditContent("LESSON_CONTENT_CREATE", lessonContents.getId(),
                java.util.Map.of("lessonId", String.valueOf(lessonContents.getLessonId())));
        return lessonContents;
    }

    private void enforceFacultyTeachingScopeForCreate(UserPrincipal principal, LessonContentsDTO dto) {
        if (principal == null || dto == null || !principal.isFaculty()) return;
        enforceFacultyTeachingScope(principal, dto.getCourseId(), dto.getClassId());
    }

    private void enforceCurrentCourseAudienceForNewScope(Integer courseId, Integer classId) {
        if (classId == null || classId <= 0) return;
        if (courseId == null || courseId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "course_id is required for class-scoped content");
        }
        if (accessControlService == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Course audience validation unavailable");
        }
        accessControlService.requireCurrentCourseAudienceClass(classId, courseId);
    }

    /**
     * SECURITY: shared teaching-scope check for both create and update of lesson content.
     * A non-admin faculty member may only touch content scoped to a course+class they are
     * actively assigned to teach. facultyType=ADMIN ("college admin") and pure ADMIN accounts
     * are exempt (they are gated by college scope elsewhere, e.g. requireAccessCourse/Class).
     */
    private void enforceFacultyTeachingScope(UserPrincipal principal, Integer courseId, Integer classId) {
        if (principal == null || !principal.isFaculty()) return;
        boolean isAdminFaculty = principal.getFacultyType() != null
                && "ADMIN".equalsIgnoreCase(principal.getFacultyType());
        if (isAdminFaculty) return;

        Integer facultyId = principal.getId();
        if (facultyId == null || facultyId <= 0) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Valid faculty id is required");
        }
        if (courseId == null || courseId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "course_id is required");
        }
        if (classId == null || classId <= 0) {
            // A regular faculty member can never create class-less (fully generic) content either
            // (see the check above), so they may not edit it after the fact — only an admin can.
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Faculty is not assigned to this course/class");
        }
        if (facultyTeachingAssignmentRepository == null ||
                !facultyTeachingAssignmentRepository.existsByFacultyIdAndCourseIdAndClassIdAndIsActive(
                        facultyId, courseId, classId, true)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Faculty is not assigned to this course/class");
        }
    }

    private static final int MAX_ORIGINAL_NAME_LENGTH = 255;
    private static final Pattern CONTROL_OR_PATH = Pattern.compile("[\\x00-\\x1F\\x7F]|[\\\\/]");

    private static String sanitizeOriginalName(String originalName) {
        if (originalName == null || originalName.isEmpty()) return originalName;
        String name = originalName;
        int lastSlash = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
        if (lastSlash >= 0 && lastSlash < name.length() - 1) {
            name = name.substring(lastSlash + 1);
        }
        name = CONTROL_OR_PATH.matcher(name).replaceAll("_");
        if (name.length() > MAX_ORIGINAL_NAME_LENGTH) {
            name = name.substring(0, MAX_ORIGINAL_NAME_LENGTH);
        }
        return name;
    }

    private static void applyOriginalNameSanitization(FileDTO fileDTO) {
        if (fileDTO != null && fileDTO.getOriginalName() != null) {
            fileDTO.setOriginalName(sanitizeOriginalName(fileDTO.getOriginalName()));
        }
    }

    /** Video requires file_dto.cloud_storage_object validated against allowed storage; R2 cleanup on delete. */
    private static boolean isFileBasedContentType(String contentType) {
        return contentType != null && "video".equals(contentType.toLowerCase().trim());
    }

    private static boolean isResourceContentType(String contentType) {
        return contentType != null && "resource".equals(contentType.toLowerCase().trim());
    }

    private static boolean isYouTubeContentType(String contentType) {
        return contentType != null && "youtube".equals(contentType.toLowerCase().trim());
    }

    private static String getYouTubeUrlFromContentData(ContentDataDTO contentDataDTO) {
        if (contentDataDTO == null) return null;
        if (contentDataDTO.getLink() != null && !contentDataDTO.getLink().trim().isEmpty()) {
            return contentDataDTO.getLink().trim();
        }
        if (contentDataDTO.getFileDTO() != null && contentDataDTO.getFileDTO().getCloudStorageObject() != null
                && !contentDataDTO.getFileDTO().getCloudStorageObject().trim().isEmpty()) {
            return contentDataDTO.getFileDTO().getCloudStorageObject().trim();
        }
        return null;
    }

    private void validateYouTubeContent(LessonContentsDTO dto, String resolvedContentType) {
        if (!isYouTubeContentType(resolvedContentType)) return;
        ContentDataDTO contentDataDTO = dto.getContentDataDTO();
        if (contentDataDTO == null) {
            throw new IllegalArgumentException("YouTube content requires content_data_dto with link or file_dto.cloud_storage_object");
        }
        String url = getYouTubeUrlFromContentData(contentDataDTO);
        if (url == null || url.isEmpty()) {
            throw new IllegalArgumentException("YouTube content requires a URL in link or file_dto.cloud_storage_object");
        }
        if (contentUrlValidator != null && !contentUrlValidator.isAllowedYouTubeUrl(url)) {
            throw new IllegalArgumentException("YouTube URL must be from youtube.com or youtu.be");
        }
        if (contentUrlValidator != null && contentUrlValidator.extractYouTubeVideoId(url) == null) {
            throw new IllegalArgumentException("YouTube URL must contain a valid video ID");
        }
    }

    private void enforceUploadedContentSizeLimit(String storageKey, String resolvedContentType) {
        if (r2StorageUtils == null || storageKey == null || storageKey.isBlank()) {
            return;
        }
        long maxBytes;
        switch (resolvedContentType == null ? "" : resolvedContentType.toLowerCase()) {
            case "video": maxBytes = maxVideoSizeBytes; break;
            default: return;
        }
        try {
            long size = r2StorageUtils.getObjectMetadata(storageKey).getContentLength();
            if (size > maxBytes) {
                // The object is already sitting in R2 (uploaded via presigned PUT before this
                // create/update request); this rejection would otherwise leave it as a permanent
                // orphan with no record it happened. Best-effort delete it before failing.
                try {
                    r2StorageUtils.deleteFile(storageKey);
                } catch (Exception cleanupEx) {
                    log.warn("Failed to delete oversized R2 object {} rejected for exceeding size limit: {}", storageKey, cleanupEx.getMessage());
                }
                throw new IllegalArgumentException("Uploaded file exceeds the maximum allowed size for this content type");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            // Object not found / R2 unreachable — the storage-key/tenant checks already ran, so
            // this isn't a security gap, just a size cap we couldn't verify. Don't block the save
            // on a transient storage-availability issue (same tradeoff as Projects' equivalent
            // check, enforceUploadedResourceSizeLimit).
        }
    }

    private void validateFileBasedContent(LessonContentsDTO dto, String resolvedContentType) {
        if (!isFileBasedContentType(resolvedContentType)) return;
        ContentDataDTO contentDataDTO = dto.getContentDataDTO();
        if (contentDataDTO == null) {
            throw new IllegalArgumentException("Video content requires content_data_dto with file_dto and cloud_storage_object");
        }
        FileDTO fileDTO = contentDataDTO.getFileDTO();
        String url = fileDTO != null ? fileDTO.getCloudStorageObject() : null;
        if (url == null || url.trim().isEmpty()) {
            throw new IllegalArgumentException("Video content requires content_data_dto with file_dto and cloud_storage_object");
        }
        if (contentUrlValidator != null) {
            String storageKey = contentUrlValidator.resolveStorageKeyFromValue(url);
            if (storageKey == null || storageKey.trim().isEmpty()) {
                throw new IllegalArgumentException("Video/file key must be from allowed storage (e.g. lesson-content/, video-intros/)");
            }
            if (!contentUrlValidator.isAllowedStorageKey(storageKey)) {
                throw new IllegalArgumentException("Video/file key must be from allowed storage (e.g. lesson-content/, video-intros/)");
            }
            // SECURITY: verify tenant ownership BEFORE any R2 metadata call or cleanup.
            // The size check can delete oversized uploads; running it first could delete
            // another tenant's object when a caller supplies that known storage key.
            UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
            if (principal != null && principal.getOrganizationId() != null && principal.getCollegeId() != null) {
                String tenantPrefix = "org-" + principal.getOrganizationId() + "/college-" + principal.getCollegeId() + "/";
                if (!storageKey.startsWith(tenantPrefix)) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "File does not belong to your tenant scope");
                }
            }
            // This may read and delete the object, so ownership must already be established.
            enforceUploadedContentSizeLimit(storageKey, resolvedContentType);
        }
    }

    /**
     * 50: the enum ContentType already rejects genuinely unrecognised strings at JSON binding, but
     * one of its own values -- ASSIGNMENT -- was never wired into any of the is*ContentType checks
     * below. That meant content_type="assignment" sailed through this whole validation pipeline
     * with no content_data requirement at all (no file, no link, no html), since every validator
     * here is gated behind an is* match and none of them matched it. Assignments have their own
     * dedicated module (AssignmentController) with their own validation; this generic pipeline
     * should never accept them. Reject anything that isn't one of the types this pipeline actually
     * knows how to validate, rather than silently saving it unchecked.
     */
    private static boolean isKnownGenericContentType(String contentType) {
        return isFileBasedContentType(contentType) || isYouTubeContentType(contentType)
                || isResourceContentType(contentType) || isLiveClassContentType(contentType);
    }

    private static boolean isLiveClassContentType(String contentType) {
        if (contentType == null) return false;
        String t = contentType.toLowerCase().trim();
        return "live class".equals(t) || "live_class".equals(t);
    }

    private void validateLiveClassContent(LessonContentsDTO dto, String resolvedContentType) {
        if (!isLiveClassContentType(resolvedContentType)) return;
        ContentDataDTO contentDataDTO = dto.getContentDataDTO();
        if (contentDataDTO == null) {
            throw new IllegalArgumentException("Live class content requires content_data_dto with link");
        }
        String link = contentDataDTO.getLink();
        if (link == null || link.trim().isEmpty()) {
            throw new IllegalArgumentException("Live class content requires a non-empty link (e.g. Meet link)");
        }
        if (!link.trim().startsWith("https://")) {
            throw new IllegalArgumentException("Live class link must be a valid https URL");
        }
        // If schedule exists, enforce end > start to avoid broken calendar events and UI crashes.
        String start = contentDataDTO.getStartTime();
        String end = contentDataDTO.getEndTime();
        if (start != null && end != null) {
            try {
                java.time.Instant startI;
                java.time.Instant endI;
                // Accept both RFC3339 with offset/Z and local date-time interpreted as UTC (UI also sends local date-time).
                if (start.contains("Z") || start.contains("+") || start.matches(".*-\\d\\d:\\d\\d$")) {
                    startI = java.time.OffsetDateTime.parse(start).toInstant();
                } else {
                    startI = java.time.LocalDateTime.parse(start).toInstant(java.time.ZoneOffset.UTC);
                }
                if (end.contains("Z") || end.contains("+") || end.matches(".*-\\d\\d:\\d\\d$")) {
                    endI = java.time.OffsetDateTime.parse(end).toInstant();
                } else {
                    endI = java.time.LocalDateTime.parse(end).toInstant(java.time.ZoneOffset.UTC);
                }
                if (!endI.isAfter(startI)) {
                    throw new IllegalArgumentException("Live class end_time must be after start_time");
                }
            } catch (RuntimeException e) {
                throw new IllegalArgumentException("Invalid live class schedule: " + e.getMessage());
            }
        }
    }

    private void setLessonContents(LessonContentsDTO lessonContentsDTO, LessonContents lessonContents) {
        String resolvedContentType;
        if (lessonContentsDTO.getContentType() != null) {
            resolvedContentType = lessonContentsDTO.getContentType().getContentType();
            lessonContents.setContentType(resolvedContentType);
        } else {
            throw new IllegalArgumentException("content_type is required");
        }
        // Quizzes are created via the dedicated Quiz system (POST /api/v1/quizzes) only —
        // ContentType has no QUIZ value, so "quiz" is rejected by ContentType.fromString at the
        // JSON-binding boundary before this method is ever reached.
        if (!isKnownGenericContentType(resolvedContentType)) {
            throw new IllegalArgumentException("Unsupported content type for lesson content: '" + resolvedContentType
                    + "'. Assignments are created via the Assignment module, not lesson content.");
        }
        validateFileBasedContent(lessonContentsDTO, resolvedContentType);
        validateYouTubeContent(lessonContentsDTO, resolvedContentType);
        validateLiveClassContent(lessonContentsDTO, resolvedContentType);
        Integer courseId = resolveCourseIdFromDto(lessonContentsDTO);
        lessonContents.setCourseId(courseId);
        if (courseId != null && null != courseService.fetchCourse(courseId)) {
            lessonContents.setCourseName(courseService.fetchCourse(courseId).getCourseName());
        }
        String title = lessonContentsDTO.getContentTitle();
        String trimmedTitle = title != null ? title.trim() : null;
        if (trimmedTitle == null || trimmedTitle.isEmpty()) {
            throw new IllegalArgumentException("contentTitle is required");
        }
        lessonContents.setContentTitle(trimmedTitle);
        lessonContents.setLessonId(lessonContentsDTO.getLessonId());
        lessonContents.setFacultyId(lessonContentsDTO.getFacultyId());
        if (lessonContentsDTO.getContentDataDTO() != null) {
            applyOriginalNameSanitization(lessonContentsDTO.getContentDataDTO().getFileDTO());
        }
        lessonContents.setContentDataDTO(lessonContentsDTO.getContentDataDTO());
        long pts = lessonContentsDTO.getPoints();
        if (pts < 0) pts = 0;
        lessonContents.setPoints(pts);
        if (Boolean.TRUE.equals(lessonContentsDTO.getClearDeadline())) {
            // Course audit C-1: the deadline was settable but not removable — a null was ignored,
            // so an assignment given a cutoff by mistake kept it forever.
            lessonContents.setDeadline(null);
        } else if (lessonContentsDTO.getDeadline() != null) {
            lessonContents.setDeadline(lessonContentsDTO.getDeadline());
        }
        lessonContents.setSequence(lessonContentsDTO.getSequence());
        // Never let missing fields silently disable content (DTO booleans default to false).
        // Create defaults to true; update preserves existing when omitted.
        boolean enabled = lessonContentsDTO.getEnabled() != null
                ? lessonContentsDTO.getEnabled()
                : (lessonContents.getId() > 0 ? lessonContents.isEnabled() : true);
        boolean active = lessonContentsDTO.getActive() != null
                ? lessonContentsDTO.getActive()
                : (lessonContents.getId() > 0 ? lessonContents.isActive() : true);
        lessonContents.setEnabled(enabled);
        lessonContents.setActive(active);
        Integer requestedClassId = lessonContentsDTO.getClassId();
        int dtoClassId = requestedClassId != null ? requestedClassId : 0;
        if (dtoClassId > 0 && classService != null) {
            if (classService.findById(dtoClassId).isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class not found for classId: " + dtoClassId);
            }
        }
        lessonContents.setClassId(dtoClassId > 0 ? dtoClassId : null);
    }

    private Integer resolveCourseIdFromDto(LessonContentsDTO dto) {
        if (dto.getCourseSlug() != null && !dto.getCourseSlug().trim().isEmpty()) {
            // Previously unreachable 400 -- see the same fix in ClassScheduleServiceImpl.
            return courseService.fetchCourseBySlug(dto.getCourseSlug().trim())
                    .map(Course::getId)
                    .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.BAD_REQUEST, "Course not found for slug"));
        }
        return dto.getCourseId();
    }

    @Override
    public LessonContents getLessonContents(int lessonContentId) {
        return lessonContentsRepository.getLessonContents(lessonContentId);
    }

    private static boolean isEnabledAndActiveForLearner(LessonContents c) {
        if (c == null) return false;
        return c.isEnabled() && c.isActive();
    }


    // getLessonContentPlaybackUrl removed: lesson video now stores a plain public R2 URL in
    // cloud_storage_object at upload time (see FileUploadController#presign, which already
    // returns publicUrl for every upload type) and is no longer stripped from the normal list
    // response (see toListSafeForResponse above) — so there is nothing left to sign or resolve
    // at play time. The frontend reads the URL straight off the lesson content, same as it
    // already does for a link-based YouTube video. This also removes the endpoint that was
    // uniquely fragile to JWT-scope staleness after a DB/tenant swap (it re-validated class/
    // course/college access on every single play request; nothing else in the video path does
    // per-request scope checks now).

    @Override
    public List<LessonContents> toListSafeForResponse(List<LessonContents> list) {
        if (list == null) return list;
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        boolean isLearner = principal != null && principal.isLearner();
        for (LessonContents c : list) {
            if (c == null) continue;
            // Video used to have its cloud_storage_object nulled out here unconditionally (even
            // for faculty), forcing every client to call the separate playback-url endpoint to
            // get a signed URL. Video now stores a plain public R2 link at upload time and there is no signing
            // step left to gate — so it flows through in the list response like every other type.
        }
        return list;
    }

    @Override
    public List<LessonContents> fetchLessonContents(int lessonId) {
        List<LessonContents> contents = lessonContentsRepository.fetchLessonContents(lessonId);
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal != null && principal.isLearner() && contents != null) {
            contents.removeIf(c -> !isEnabledAndActiveForLearner(c));
        }
        return contents;
    } 

    @Override
    public List<LessonContents> fetchLessonContents1(int lessonId) {
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal != null) {
            if (principal.isLearner()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Use class-specific fetch for lesson contents");
            }
        }
        return lessonContentsRepository.fetchLessonContents1(lessonId);
    }
 
    @Override
    public List<LessonContents> fetchSpecificLessonContents(int lessonId, int classId) {
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal != null && principal.isLearner()) {
            Learner learner = learnerService != null ? learnerService.getLearnerDetails(String.valueOf(principal.getId())) : null;
            if (learner == null || learner.getClassId() == null || !learner.getClassId().equals(classId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to this class lesson contents");
            }
        }
        List<LessonContents> contents = lessonContentsRepository.fetchSpecificLessonContents(lessonId, classId);
        if (principal != null && principal.isLearner() && contents != null) {
            contents.removeIf(c -> !isEnabledAndActiveForLearner(c));
        }
        return contents;
    }
    
    @Override
    public List<LessonContents> fetchCombinedLessonContents(int lessonId, int classId) {
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal != null && principal.isLearner()) {
            Learner learner = learnerService.getLearnerDetails(String.valueOf(principal.getId()));
            if (learner == null || learner.getClassId() == null || !learner.getClassId().equals(classId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to this class lesson contents");
            }
        }
        List<LessonContents> contents = lessonContentsRepository.fetchCombinedLessonContents(lessonId, classId);
        if (principal != null && principal.isLearner() && contents != null) {
            // Learners should only see enabled + active contents (defense-in-depth against UI/DTO bugs).
            contents.removeIf(c -> !isEnabledAndActiveForLearner(c));
        }
        if (classId <= 0 || contents == null || contents.isEmpty() || lessonContentClassSequenceRepository == null) {
            return contents;
        }
        List<Integer> contentIds = contents.stream().map(LessonContents::getId).distinct().collect(Collectors.toList());
        List<LessonContentClassSequence> overrides = lessonContentClassSequenceRepository
            .findByLessonContentIdInAndClassId(contentIds, classId);
        Map<Integer, Long> overrideSeq = overrides != null
            ? overrides.stream().collect(Collectors.toMap(LessonContentClassSequence::getLessonContentId, LessonContentClassSequence::getSequence, (a, b) -> a))
            : Map.of();
        contents.sort(Comparator
            .comparingLong((LessonContents c) -> overrideSeq.getOrDefault(c.getId(), c.getSequence()))
            .thenComparingInt(LessonContents::getId));
        return contents;
    }

    private List<Integer> learnerAudienceClassIds(int learnerId, Integer homeClassId) {
        if (scopeResolutionService != null) {
            List<Integer> resolved = scopeResolutionService.resolveLearnerToClassIds(learnerId);
            if (resolved != null && !resolved.isEmpty()) return resolved;
        }
        return homeClassId != null && homeClassId > 0 ? List.of(homeClassId) : List.of();
    }

    @Override
    public List<LessonContents> fetchAllAssignments(int facultyId) {
        return lessonContentsRepository.fetchAllAssignments(facultyId);
    }

    @Override
    public List<LessonContents> fetchAllAssignmentsByLearnerId(int learnerId) throws Exception {
        Learner learner = learnerService.getLearnerDetails(String.valueOf(learnerId));
        if(null == learner){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No Learner found with learner id: " + learnerId);
        }
        // A learner who is not yet assigned to a class (newly created, mid-transfer, or whose
        // class was soft-deleted) has a null classId. Unboxing it into the int parameter below
        // threw an NPE and surfaced as a 500; return an empty list instead, which is the honest
        // answer — no class means no class-scoped assignments.
        if (learner.getClassId() == null) {
            return new ArrayList<>();
        }
        List<Integer> audienceClassIds = learnerAudienceClassIds(learnerId, learner.getClassId());
        List<LessonContents> assignments = lessonContentsRepository.fetchAllAssignmentsByLearnerClassIds(audienceClassIds);
        if (assignments != null && !assignments.isEmpty()) {
            assignments.removeIf(a -> a == null || !isEnabledAndActiveForLearner(a));
        }
        populateLessonNames(assignments);
        return assignments;
    }

    @Override
    public PageResponseDTO<LessonContents> fetchAllAssignmentsPaged(int facultyId, Integer courseId, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 20 : Math.min(size, 100);
        Page<LessonContents> result = lessonContentsRepository.fetchAllAssignmentsPaged(facultyId, courseId, PageRequest.of(safePage, safeSize));
        populateLessonNames(result.getContent());
        PageResponseDTO<LessonContents> response = toPageResponse(result);
        response.setSummary(java.util.Map.of("thisMonth", countCreatedThisMonth(
                lessonContentsRepository.fetchAllAssignmentsPaged(facultyId, courseId, PageRequest.of(0, 5000)).getContent())));
        return response;
    }

    @Override
    public PageResponseDTO<LessonContents> fetchAllAssignmentsByLearnerIdPaged(int learnerId, Integer courseId, int page, int size) throws Exception {
        Learner learner = learnerService.getLearnerDetails(String.valueOf(learnerId));
        if (null == learner) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No Learner found with learner id: " + learnerId);
        }
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 20 : Math.min(size, 100);
        if (learner.getClassId() == null) {
            return PageResponseDTO.<LessonContents>builder()
                    .content(List.of())
                    .totalElements(0)
                    .totalPages(0)
                    .size(safeSize)
                    .number(safePage)
                    .first(true)
                    .last(true)
                    .build();
        }
        // enabled/active-for-learner is now filtered in the repository query itself (see
        // fetchAllAssignmentsByLearnerIdPaged), so totalElements/totalPages already match what's
        // in `result.getContent()` — no post-query filtering needed here.
        List<Integer> audienceClassIds = learnerAudienceClassIds(learnerId, learner.getClassId());
        Page<LessonContents> result = lessonContentsRepository.fetchAllAssignmentsByLearnerClassIdsPaged(
                audienceClassIds, courseId, PageRequest.of(safePage, safeSize));
        populateLessonNames(result.getContent());
        PageResponseDTO<LessonContents> response = toPageResponse(result);
        response.setSummary(java.util.Map.of("thisMonth", countCreatedThisMonth(
                lessonContentsRepository.fetchAllAssignmentsByLearnerClassIdsPaged(audienceClassIds, courseId, PageRequest.of(0, 5000)).getContent())));
        return response;
    }

    @Override
    public List<com._42students.lms.dto.response.CourseFilterOptionDTO> fetchCoursesForClass(int learnerId) throws Exception {
        Learner learner = learnerService.getLearnerDetails(String.valueOf(learnerId));
        if (learner == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No Learner found with learner id: " + learnerId);
        }
        if (courseRepository == null || learner.getClassId() == null || learner.getClassId() <= 0) {
            return List.of();
        }
        List<Integer> audienceClassIds = learnerAudienceClassIds(learnerId, learner.getClassId());
        return courseRepository.findDistinctCoursesForAudienceClasses(audienceClassIds).stream()
                .filter(course -> audienceClassIds.stream().anyMatch(classId ->
                        accessControlService != null
                                && accessControlService.isClassCurrentlyEligibleForCourse(classId, course.getId())))
                .map(course -> com._42students.lms.dto.response.CourseFilterOptionDTO.builder()
                        .slug(course.getSlug())
                        .courseName(course.getCourseName())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Assignments created this calendar month (India time), over the whole filtered list. The list
     * page's "N this month" used to be counted from the current page only (LRN-A-04).
     */
    static long countCreatedThisMonth(List<LessonContents> all) {
        java.time.YearMonth now = java.time.YearMonth.now(java.time.ZoneId.of("Asia/Kolkata"));
        return all.stream()
                .map(LessonContents::getCreatedAt)
                .filter(java.util.Objects::nonNull)
                .map(created -> java.time.YearMonth.from(created.atZone(java.time.ZoneOffset.UTC).withZoneSameInstant(java.time.ZoneId.of("Asia/Kolkata"))))
                .filter(now::equals)
                .count();
    }

    private PageResponseDTO<LessonContents> toPageResponse(Page<LessonContents> page) {
        return PageResponseDTO.<LessonContents>builder()
                .content(page.getContent())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .size(page.getSize())
                .number(page.getNumber())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    private void populateCourseAndLessonNames(List<LessonContents> contents) {
        if (contents == null || contents.isEmpty()) return;
        populateLessonNames(contents);
        populateCourseNames(contents);
    }

    private void populateLessonNames(List<LessonContents> contents) {
        if (contents == null || contents.isEmpty() || lessonRepository == null) return;
        List<Integer> lessonIds = contents.stream()
                .map(LessonContents::getLessonId)
                .distinct()
                .collect(Collectors.toList());
        Map<Integer, String> lessonNameMap = lessonRepository.findAllById(lessonIds).stream()
                .collect(Collectors.toMap(Lesson::getId, Lesson::getLessonName, (a, b) -> a));
        contents.forEach(c -> c.setLessonName(lessonNameMap.get(c.getLessonId())));
    }

    private void populateCourseNames(List<LessonContents> contents) {
        if (contents == null || contents.isEmpty() || courseService == null) return;
        List<Integer> courseIds = contents.stream()
                .map(LessonContents::getCourseId)
                .filter(id -> id != null && id > 0)
                .distinct()
                .collect(Collectors.toList());
        if (courseIds.isEmpty()) return;
        Map<Integer, String> courseNameMap = new java.util.HashMap<>();
        for (Integer courseId : courseIds) {
            Course course = courseService.fetchCourse(courseId);
            if (course != null && course.getCourseName() != null) {
                courseNameMap.put(course.getId(), course.getCourseName());
            }
        }
        contents.forEach(c -> c.setCourseName(courseNameMap.get(c.getCourseId())));
    }

    @Override
    public List<LessonContents> fetchAllByFacultyId(int facultyId) throws Exception {
        List<LessonContents> contents = lessonContentsRepository.findByFacultyId(facultyId);
        populateCourseAndLessonNames(contents);
        return contents;
    }



  
    @Override
    public List<Integer> fetchUniqueClassIdsByCourseId(int courseId) {
        return lessonContentsRepository.fetchUniqueClassIdsByCourseId(courseId);
    }

    @Override
    public Optional<LessonContents> findById(Integer id) {
        return lessonContentsRepository.findById(id);
    }

    @Override
    public LessonContents updateLessonContent(Integer id, LessonContentsDTO lessonContentsDTO) {
        LessonContents lessonContents = lessonContentsRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson content not found"));
        if (lessonContents.getIsDeleted() != null && lessonContents.getIsDeleted()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson content not found");
        }
        if ("assignment".equalsIgnoreCase(lessonContents.getContentType())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Assignments must be edited through the assignment module");
        }

        String previousFileStorageValue = null;
        if (lessonContents.getContentDataDTO() != null
                && lessonContents.getContentDataDTO().getFileDTO() != null) {
            previousFileStorageValue = lessonContents.getContentDataDTO().getFileDTO().getCloudStorageObject();
        }

        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal != null) {
            if (!principal.isFaculty() && !"ADMIN".equalsIgnoreCase(principal.getUserType())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only faculty or admin may update lesson content");
            }
            // SECURITY: "admin" here must include facultyType=ADMIN ("college admin" faculty), not
            // just pure userType=="ADMIN" accounts, matching the create-path admin bypass.
            boolean isAdminForUpdate = "ADMIN".equalsIgnoreCase(principal.getUserType())
                    || (principal.isFaculty() && "ADMIN".equalsIgnoreCase(principal.getFacultyType()));
            Integer contentFacultyId = lessonContents.getFacultyId();
            if (contentFacultyId != null && !contentFacultyId.equals(principal.getId()) && !isAdminForUpdate) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the content owner or admin may update this lesson content");
            }
            // SECURITY FIX: previously, generic (unowned, facultyId == null) content could be edited
            // by ANY faculty member in the same college, regardless of whether they are actually
            // assigned to teach the course/class it belongs to — create() enforced teaching-scope
            // via enforceFacultyTeachingScopeForCreate() but update() had no equivalent check at all.
            // Enforce the same teaching-assignment scope here, using the content's OWN resolved
            // course/class (not the possibly-attacker-supplied DTO), skipped for admins as above.
            if (!isAdminForUpdate) {
                Integer scopeCourseId = lessonContents.getCourseId();
                Integer scopeClassId = lessonContents.getClassId();
                if ((scopeCourseId == null || scopeCourseId <= 0) && lessonRepository != null) {
                    scopeCourseId = lessonRepository.findById(lessonContents.getLessonId())
                            .map(Lesson::getCourseId)
                            .orElse(null);
                }
                enforceFacultyTeachingScope(principal, scopeCourseId, scopeClassId);
            }
        }
        // Update fields if provided
        if (lessonContentsDTO.getContentTitle() != null) {
            String t = lessonContentsDTO.getContentTitle().trim();
            if (t.isEmpty()) {
                throw new IllegalArgumentException("contentTitle is required");
            }
            lessonContents.setContentTitle(t);
        }
        // Content type is typically not changed after creation, but handle it if provided.
        // Quizzes are created via the dedicated Quiz system (POST /api/v1/quizzes) only —
        // ContentType has no QUIZ value, so "quiz" is rejected at the JSON-binding boundary.
        if (lessonContentsDTO.getContentType() != null) {
            String newContentType = lessonContentsDTO.getContentType().getContentType();
            if (!isKnownGenericContentType(newContentType)) {
                throw new IllegalArgumentException("Unsupported content type for lesson content: '" + newContentType
                        + "'. Assignments are created via the Assignment module, not lesson content.");
            }
            lessonContents.setContentType(newContentType);
        }
        // Only update sequence if it's a positive value (0 means not provided)
        if (lessonContentsDTO.getSequence() > 0) {
            lessonContents.setSequence(lessonContentsDTO.getSequence());
        }
        // Points can be 0, but never negative
        long pts = lessonContentsDTO.getPoints();
        if (pts < 0) pts = 0;
        lessonContents.setPoints(pts);
        
        if (lessonContentsDTO.getContentDataDTO() != null) {
            String contentTypeForValidation = lessonContents.getContentType();
            ContentDataDTO incomingContentData = lessonContentsDTO.getContentDataDTO();
            if (isFileBasedContentType(contentTypeForValidation)) {
                String url = incomingContentData.getFileDTO() != null
                        ? incomingContentData.getFileDTO().getCloudStorageObject()
                        : null;
                boolean incomingUrlBlank = url == null || url.trim().isEmpty();
                ContentDataDTO existingContentData = lessonContents.getContentDataDTO();
                if (incomingUrlBlank && existingContentData != null && existingContentData.getFileDTO() != null
                        && existingContentData.getFileDTO().getCloudStorageObject() != null
                        && !existingContentData.getFileDTO().getCloudStorageObject().trim().isEmpty()) {
                    if (incomingContentData.getFileDTO() == null) {
                        incomingContentData.setFileDTO(existingContentData.getFileDTO());
                    } else {
                        incomingContentData.getFileDTO().setCloudStorageObject(
                                existingContentData.getFileDTO().getCloudStorageObject());
                    }
                } else if (!incomingUrlBlank && contentUrlValidator != null) {
                    if (url.contains("://")) {
                        if (!contentUrlValidator.isAllowedContentUrl(url)) {
                            throw new IllegalArgumentException("Video/file URL must be from allowed storage");
                        }
                    } else {
                        if (!contentUrlValidator.isAllowedStorageKey(url)) {
                            throw new IllegalArgumentException("Video/file key must be from allowed storage (e.g. lesson-content/, video-intros/)");
                        }
                    }
                }
                // BE-0159: the replaced video is not deleted here. It used to be deleted from storage before the edited row was
                // saved, so a failed save left the item pointing at a file that was gone. deleteReplacedR2FileBestEffort removes it
                // after the save (after the commit when there is a transaction).
            }
            if (isYouTubeContentType(contentTypeForValidation)) {
                String incomingUrl = getYouTubeUrlFromContentData(incomingContentData);
                ContentDataDTO existingContentData = lessonContents.getContentDataDTO();
                String existingUrl = getYouTubeUrlFromContentData(existingContentData);
                if (incomingUrl == null || incomingUrl.isEmpty()) {
                    if (existingUrl != null && !existingUrl.isEmpty()) {
                        incomingContentData.setLink(existingUrl);
                        if (incomingContentData.getFileDTO() == null) {
                            FileDTO f = new FileDTO();
                            f.setCloudStorageObject(existingUrl);
                            incomingContentData.setFileDTO(f);
                        } else {
                            incomingContentData.getFileDTO().setCloudStorageObject(existingUrl);
                        }
                    }
                } else if (contentUrlValidator != null) {
                    if (!contentUrlValidator.isAllowedYouTubeUrl(incomingUrl)) {
                        throw new IllegalArgumentException("YouTube URL must be from youtube.com or youtu.be");
                    }
                    if (contentUrlValidator.extractYouTubeVideoId(incomingUrl) == null) {
                        throw new IllegalArgumentException("YouTube URL must contain a valid video ID");
                    }
                }
            }
            if (isLiveClassContentType(contentTypeForValidation)) {
                String incomingLink = incomingContentData.getLink();
                boolean incomingLinkBlank = incomingLink == null || incomingLink.trim().isEmpty();
                ContentDataDTO existingContentData = lessonContents.getContentDataDTO();
                if (incomingLinkBlank && existingContentData != null) {
                    if (existingContentData.getLink() != null && !existingContentData.getLink().trim().isEmpty()) {
                        incomingContentData.setLink(existingContentData.getLink());
                    }
                    if (incomingContentData.getStartTime() == null && existingContentData.getStartTime() != null) {
                        incomingContentData.setStartTime(existingContentData.getStartTime());
                    }
                    if (incomingContentData.getEndTime() == null && existingContentData.getEndTime() != null) {
                        incomingContentData.setEndTime(existingContentData.getEndTime());
                    }
                }
                String resolvedLink = incomingContentData.getLink();
                if (resolvedLink == null || resolvedLink.trim().isEmpty()) {
                    throw new IllegalArgumentException("Live class content requires a non-empty link (e.g. Meet link)");
                }
                if (!resolvedLink.trim().startsWith("https://")) {
                    throw new IllegalArgumentException("Live class link must be a valid https URL");
                }
            }
            applyOriginalNameSanitization(incomingContentData.getFileDTO());
            lessonContents.setContentDataDTO(lessonContentsDTO.getContentDataDTO());
        }
        // Faculty may edit their own content now (WebSecurityConfig), so the two fields that move
        // content elsewhere are admin-only for anyone else: owner, and a section they don't teach.
        UserPrincipal updater = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        boolean updaterIsAdmin = updater == null
                || "ADMIN".equalsIgnoreCase(updater.getUserType())
                || (updater.isFaculty() && "ADMIN".equalsIgnoreCase(updater.getFacultyType()));
        if (lessonContentsDTO.getFacultyId() != null && lessonContentsDTO.getFacultyId() > 0
                && (updaterIsAdmin || lessonContentsDTO.getFacultyId().equals(updater.getId()))) {
            lessonContents.setFacultyId(lessonContentsDTO.getFacultyId());
        }
        Integer updClassId = lessonContentsDTO.getClassId();
        if (!updaterIsAdmin && updClassId != null && updClassId != 0
                && !java.util.Objects.equals(lessonContents.getClassId(), updClassId)) {
            Integer targetCourseId = lessonContents.getCourseId();
            if ((targetCourseId == null || targetCourseId <= 0) && lessonRepository != null) {
                targetCourseId = lessonRepository.findById(lessonContents.getLessonId()).map(Lesson::getCourseId).orElse(null);
            }
            enforceFacultyTeachingScope(updater, targetCourseId, updClassId > 0 ? updClassId : null);
        }
        if (updClassId != null && updClassId > 0) {
            if (classService != null && classService.findById(updClassId).isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class not found for classId: " + updClassId);
            }
            if (!java.util.Objects.equals(lessonContents.getClassId(), updClassId)) {
                enforceCurrentCourseAudienceForNewScope(lessonContents.getCourseId(), updClassId);
            }
            lessonContents.setClassId(updClassId);
        } else if (updClassId != null && updClassId < 0) {
            lessonContents.setClassId(null);
        }
        // updClassId == 0 (DTO default) means "not provided" — preserve the existing value
        if (lessonContentsDTO.getEnabled() != null) lessonContents.setEnabled(lessonContentsDTO.getEnabled());
        if (lessonContentsDTO.getActive() != null) lessonContents.setActive(lessonContentsDTO.getActive());

        // BE-0160: "Move to another lesson" really moves it. The controller already checked access to the target lesson and
        // set courseId from it. Content made for particular sections belongs to the current course's sections, so it can
        // move between lessons of the same course only.
        Integer targetLesson = lessonContentsDTO.getLessonId();
        if (targetLesson != null && targetLesson > 0 && targetLesson != lessonContents.getLessonId()) {
            Integer targetCourse = lessonContentsDTO.getCourseId();
            if (targetCourse == null) {
                targetCourse = lessonRepository.findById(targetLesson).map(l -> l.getCourseId()).orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));
            }
            boolean courseChanges = !java.util.Objects.equals(targetCourse, lessonContents.getCourseId());
            if (courseChanges && lessonContents.getClassId() != null && lessonContents.getClassId() > 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "This content was made for particular sections of its course, so it can only move to another lesson of the same course.");
            }
            lessonContents.setLessonId(targetLesson);
            lessonContents.setCourseId(targetCourse);
        }

        LessonContents saved = lessonContentsRepository.save(lessonContents);
        deleteReplacedR2FileBestEffort(previousFileStorageValue, saved);
        auditContent("LESSON_CONTENT_UPDATE", saved.getId(),
                java.util.Map.of("lessonId", String.valueOf(saved.getLessonId())));
        return saved;
    }

    private void deleteReplacedR2FileBestEffort(String previousStorageValue, LessonContents saved) {
        if (previousStorageValue == null || previousStorageValue.trim().isEmpty()) return;
        if (contentUrlValidator == null || r2StorageUtils == null) return;
        if (saved == null || saved.getContentDataDTO() == null || saved.getContentDataDTO().getFileDTO() == null) return;

        String currentStorageValue = saved.getContentDataDTO().getFileDTO().getCloudStorageObject();
        if (currentStorageValue == null || currentStorageValue.trim().isEmpty()) return;

        String prevKey = contentUrlValidator.resolveStorageKeyFromValue(previousStorageValue);
        String nextKey = contentUrlValidator.resolveStorageKeyFromValue(currentStorageValue);
        if (prevKey == null || nextKey == null) return;
        if (prevKey.equals(nextKey)) return;

        Runnable delete = () -> {
            try {
                r2StorageUtils.deleteFile(prevKey);
            } catch (Exception e) {
                log.warn("Failed to delete replaced R2 file {} for lessonContentId {}: {}", prevKey, saved.getId(), e.getMessage());
            }
        };
        // Only once the new reference is committed: a rolled-back save must still find its old file (BE-0159).
        if (org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                    new org.springframework.transaction.support.TransactionSynchronization() {
                        @Override public void afterCommit() { delete.run(); }
                    });
        } else {
            delete.run();
        }
    }

    @Override
    public void deleteLessonContent(Integer id) {
        LessonContents lessonContents = lessonContentsRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson content not found"));
        if ("assignment".equalsIgnoreCase(lessonContents.getContentType())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Assignments must be deleted or disabled through the assignment module");
        }
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal != null) {
            if (!principal.isFaculty() && !"ADMIN".equalsIgnoreCase(principal.getUserType())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only faculty or admin may delete lesson content");
            }
            boolean isAdminForDelete = "ADMIN".equalsIgnoreCase(principal.getUserType())
                    || (principal.isFaculty() && "ADMIN".equalsIgnoreCase(principal.getFacultyType()));
            Integer contentFacultyId = lessonContents.getFacultyId();
            if (contentFacultyId != null && !contentFacultyId.equals(principal.getId()) && !isAdminForDelete) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the content owner or admin may delete this lesson content");
            }
            // SECURITY FIX: same teaching-scope gap as updateLessonContent — generic content could
            // previously be deleted by any faculty member in the college, not just one actually
            // assigned to teach its course/class.
            if (!isAdminForDelete) {
                Integer scopeCourseId = lessonContents.getCourseId();
                Integer scopeClassId = lessonContents.getClassId();
                if ((scopeCourseId == null || scopeCourseId <= 0) && lessonRepository != null) {
                    scopeCourseId = lessonRepository.findById(lessonContents.getLessonId())
                            .map(Lesson::getCourseId)
                            .orElse(null);
                }
                enforceFacultyTeachingScope(principal, scopeCourseId, scopeClassId);
            }
        }
        // Archive first; do not destroy the backing object during an ordinary user delete.
        // The row can now be recovered without a broken file reference, and destructive storage
        // cleanup can be a separate retention/purge operation with its own safeguards.
        lessonContents.setIsDeleted(true);
        lessonContents.setDeletedWithLesson(false);
        // Defense-in-depth: hide from learners immediately.
        lessonContents.setEnabled(false);
        lessonContents.setActive(false);
        lessonContentsRepository.save(lessonContents);
        auditContent("LESSON_CONTENT_ARCHIVE", id, java.util.Map.of(
                "lessonId", String.valueOf(lessonContents.getLessonId()),
                "storedFileRetained", "true"));
    }

    @Override
    public com._42students.lms.dto.response.PlaybackUrlResponseDTO generatePlaybackUrl(LessonContents lessonContents) {
        if (lessonContents == null || lessonContents.getContentDataDTO() == null
                || lessonContents.getContentDataDTO().getFileDTO() == null) {
            return null;
        }
        String stored = lessonContents.getContentDataDTO().getFileDTO().getCloudStorageObject();
        if (stored == null || stored.trim().isEmpty() || contentUrlValidator == null || r2StorageUtils == null) {
            return null;
        }
        String key = contentUrlValidator.resolveStorageKeyFromValue(stored);
        if (key == null || key.isEmpty()) return null;
        int expiryMinutes = r2StorageUtils.getPlaybackExpiryMinutes();
        String url = r2StorageUtils.generatePresignedGetUrl(key, expiryMinutes);
        return new com._42students.lms.dto.response.PlaybackUrlResponseDTO(url, expiryMinutes * 60L);
    }

    @Override
    public void deleteContentFileBestEffort(LessonContents lessonContents) {
        if (lessonContents == null || lessonContents.getContentDataDTO() == null
                || lessonContents.getContentDataDTO().getFileDTO() == null) {
            return;
        }
        String stored = lessonContents.getContentDataDTO().getFileDTO().getCloudStorageObject();
        if (stored == null || stored.trim().isEmpty() || contentUrlValidator == null || r2StorageUtils == null) {
            return;
        }
        String key = contentUrlValidator.resolveStorageKeyFromValue(stored);
        if (key == null || key.isEmpty()) return;
        try {
            r2StorageUtils.deleteFile(key);
        } catch (Exception e) {
            log.warn("Failed to delete R2 file for key {}: {}", key, e.getMessage());
            // 8.3: a log line alone isn't discoverable -- nobody queries application logs to find
            // out storage is silently leaking. This makes an orphaned object queryable through the
            // existing admin audit log (searchable by action key) instead, without building a
            // full reconciliation sweeper. Not a substitute for one -- an admin still has to know
            // to look -- but it is the first real visibility this ever had.
            auditContent("LESSON_CONTENT_R2_DELETE_FAILED", lessonContents.getId(),
                    java.util.Map.of("r2Key", key, "error", String.valueOf(e.getMessage())));
        }
    }

    @Override
    @Transactional
    public void updateClassContentOrder(int lessonId, int classId, List<Integer> orderedContentIds) {
        if (classId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "classId must be positive for per-class ordering");
        }
        if (orderedContentIds == null || orderedContentIds.isEmpty()) {
            return;
        }
        List<LessonContents> existing = lessonContentsRepository.fetchCombinedLessonContents(lessonId, classId);
        java.util.Set<Integer> validIds = existing.stream().map(LessonContents::getId).collect(Collectors.toSet());
        List<Integer> requestedIds = orderedContentIds.stream()
            .filter(id -> id != null && id > 0 && validIds.contains(id))
            .distinct()
            .collect(Collectors.toList());
        if (requestedIds.isEmpty()) {
            return;
        }
        if (lessonContentClassSequenceRepository == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Per-class ordering not available");
        }
        // Materialise a FULL ordering for every content item in this lesson+class, not just the
        // ones the caller reordered. A partial write here previously left overridden items (new
        // 0-based sequence values from this call) and untouched items (their raw default
        // `sequence` column) sharing the same numeric space at read time — an override of 1
        // collided directly with an untouched default of 1, resolved arbitrarily by id. Any
        // content not in the request keeps its existing relative order, appended after the
        // explicitly-reordered items.
        java.util.Set<Integer> requestedSet = new java.util.HashSet<>(requestedIds);
        List<Integer> fullOrder = new java.util.ArrayList<>(requestedIds);
        existing.stream()
            .filter(c -> !requestedSet.contains(c.getId()))
            .sorted(Comparator.comparingLong(LessonContents::getSequence).thenComparingInt(LessonContents::getId))
            .forEach(c -> fullOrder.add(c.getId()));
        lessonContentClassSequenceRepository.deleteByLessonContentIdInAndClassId(fullOrder, classId);
        for (int i = 0; i < fullOrder.size(); i++) {
            LessonContentClassSequence seq = new LessonContentClassSequence();
            seq.setLessonContentId(fullOrder.get(i));
            seq.setClassId(classId);
            seq.setSequence(i);
            lessonContentClassSequenceRepository.save(seq);
        }
    }

}

