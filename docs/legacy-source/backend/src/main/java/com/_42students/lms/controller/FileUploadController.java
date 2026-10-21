package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ResolvedLearnerScope;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.ImportFileFromUrlRequestDTO;
import com._42students.lms.dto.request.ImportVideoFromUrlRequestDTO;
import com._42students.lms.dto.request.PresignUploadRequestDTO;
import com._42students.lms.dto.response.PresignUploadResponseDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import com._42students.lms.utils.R2StorageUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.Valid;
import javax.servlet.http.HttpServletRequest;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Controller for file upload/download operations using Cloudflare R2.
 */
@RestController
@RequestMapping("/api/v1/upload")
@Slf4j
@Validated
public class FileUploadController {

    @Autowired(required = false)
    private R2StorageUtils r2Storage;

    /** Identity documents and marksheets: a private bucket, opened only through signed links after the access check. */
    @Autowired(required = false)
    private com._42students.lms.utils.PrivateDocStorage privateDocs;

    private boolean privateDocsReady() {
        return privateDocs != null && privateDocs.isConfigured();
    }

    private static <T> ResponseEntity<T> privateDocsNotReady() {
        @SuppressWarnings("unchecked") ResponseEntity<T> r = (ResponseEntity<T>) new ResponseEntity<>(
                new Response<>(HttpStatus.SERVICE_UNAVAILABLE.name(), "Private document storage is not set up yet. Please try again later.", null),
                HttpStatus.SERVICE_UNAVAILABLE);
        return r;
    }

    /** The private-document folder a tenant-scoped key sits in ("<tenant>/identity-docs/user-12/..."), or null when it is not one. */
    private static String folderOfKey(String key) {
        return key == null ? null : findPrivateFolder(key.split("/"));
    }

    private static String findPrivateFolder(String[] parts) {
        for (String p : parts) if (isPrivateDocFolder(p)) return p;
        return null;
    }

    @Autowired(required = true)
    private SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    private com._42students.lms.service.tpo.ProfileVerificationService profileVerificationService;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired(required = false)
    private ScopeResolutionService scopeResolutionService;

    // Every other outbound-fetch-triggering or resource-minting endpoint in this app that a
    // regular authenticated user can call opts into RateLimitingService (see JobController's
    // job_apply/job_withdraw limits) — this controller never did, despite presign() minting
    // upload URLs on demand and the two import-from-url endpoints making the BACKEND itself
    // perform a real outbound HTTP fetch per call. An authenticated user could loop either for
    // unbounded storage/egress cost, or use the import endpoints as a repeated external-fetch
    // amplifier (the SSRF host-blocklist added elsewhere stops internal targets, not the ability
    // to hit the same or many different allowed external hosts repeatedly).
    @Autowired(required = false)
    private com._42students.lms.security.RateLimitingService rateLimitingService;

    @Autowired
    private com._42students.lms.service.FeatureFlagService featureFlagService;

    @Autowired(required = false)
    private com._42students.lms.repository.ProjectWorkspaceRepository projectWorkspaceRepository;

    @Autowired(required = false)
    private com._42students.lms.repository.ProjectMemberRepository projectMemberRepository;

    @Autowired(required = false)
    private com._42students.lms.repository.ProjectResourceRepository projectResourceRepository;

    @Autowired(required = false)
    private com._42students.lms.repository.ProjectDeliveryRepository projectDeliveryRepository;

    @Autowired(required = false)
    private com._42students.lms.repository.LessonContentsRepository lessonContentsRepository;

    @Autowired(required = false)
    private com._42students.lms.repository.StudentAssignmentRepository studentAssignmentRepository;

    @Autowired(required = false)
    private com._42students.lms.repository.CourseRepository courseRepository;

    @Autowired(required = false)
    private com._42students.lms.repository.CollegeRepository collegeRepository;

    @Autowired(required = false)
    private com._42students.lms.repository.AssignmentUploadReceiptRepository assignmentUploadReceiptRepository;

    @Value("${upload.video.max-size-bytes:5368709120}")
    private long maxVideoSizeBytes;

    @Value("${upload.lecture.max-size-bytes:52428800}")
    private long maxLectureSizeBytes;

    @Value("${upload.ppt.max-size-bytes:104857600}")
    private long maxPptSizeBytes;

    @Value("${upload.pdf.max-size-bytes:52428800}")
    private long maxPdfSizeBytes;

    @Value("${upload.image.max-size-bytes:10485760}")
    private long maxImageSizeBytes;

    @Value("${upload.generic.max-size-bytes:52428800}")
    private long maxGenericSizeBytes;

    @Value("${upload.import-video.timeout-seconds:120}")
    private int importVideoTimeoutSeconds;

    private static final Set<String> ALLOWED_FOLDERS = Collections.unmodifiableSet(new HashSet<>(Arrays.asList(
            "lesson-content", "profile-images", "video-intros", "resumes", "assignments", "course-images", "identity-docs", "marksheets", "college-branding", "offer-letters", "jd-files"
    )));

    // Folders with no entry here fall back to the global multipart.max-file-size (sized for
    // lesson video content) -- only image-only folders that render unconditionally on a public
    // page (a login screen, a profile) get a tight cap here.
    private static final Map<String, Long> FOLDER_MAX_UPLOAD_BYTES = Collections.unmodifiableMap(new HashMap<String, Long>() {{
        put("college-branding", 5L * 1024 * 1024);
        put("profile-images", 5L * 1024 * 1024);
        put("course-images", 5L * 1024 * 1024);
        put("offer-letters", 10L * 1024 * 1024);
        put("jd-files", 5L * 1024 * 1024);
        put("marksheets", 5L * 1024 * 1024);
    }});

    private static final int PRESIGN_EXPIRY_MINUTES = 15;
    private static final Pattern USER_SEGMENT_PATTERN = Pattern.compile("(^|/)user-(\\d+)(/|$)");
    /**
     * Private documents of staff are stored under faculty-<id>, students' under user-<id>: learner and faculty ids are separate
     * sequences, so a shared "user-5" could not tell a teacher's Aadhaar from a student's.
     */
    private static final Pattern FACULTY_SEGMENT_PATTERN = Pattern.compile("(^|/)faculty-(\\d+)(/|$)");

    /** The owner part of a new self-owned key: faculty-<id> for staff in the private folders, otherwise user-<id>. */
    private static String ownerSegment(String folder, UserPrincipal principal) {
        if (principal == null || principal.getId() == null) return "";
        return (isPrivateDocFolder(folder) && principal.isFaculty() ? "/faculty-" : "/user-") + principal.getId();
    }
    private static final Set<String> URL_IMPORT_ALLOWED_HOSTS = Collections.unmodifiableSet(new HashSet<>(Arrays.asList(
            "drive.google.com", "docs.google.com"
    )));

    private static boolean isPositiveId(Integer id) {
        return id != null && id > 0;
    }

    private static boolean isPossiblyUnsafeKey(String key) {
        if (key == null) return true;
        return key.contains("..")
                || key.contains("\\")
                || key.contains("\u0000")
                || key.startsWith("/")
                || key.contains("//");
    }

    private static String redactIfSignedUrl(String value) {
        if (value == null) return null;
        String lower = value.toLowerCase();
        if (!lower.contains("x-amz-signature") && !lower.contains("x-amz-credential") && !lower.contains("x-amz-security-token")) {
            return value;
        }
        int q = value.indexOf('?');
        return q >= 0 ? value.substring(0, q) + "?REDACTED" : "REDACTED";
    }

    private boolean isAuthoringFolder(String folder) {
        // "assignments" deliberately excluded — it's shared by course-assignment SUBMISSIONS
        // (learner-authored, must stay open to learners) and the Projects Resources/Delivery
        // tabs (also learner-writable, gated separately by project membership in presign()).
        // This used to include "assignments", which made validateUploadAuthorization() (used by
        // import-file-from-url, i.e. every "Upload from link" button — including a learner
        // submitting a course assignment via submitAssignment.js/SubmitAssignmentModal.jsx)
        // reject every learner outright, while presign() (the direct-file-upload path) already
        // correctly allowed them. Same folder, two different authorization rules — the direct
        // symptom was "upload a file to this assignment" working but "paste a link to this
        // assignment" 403ing for every learner.
        return "lesson-content".equals(folder) || "course-images".equals(folder) || "offer-letters".equals(folder) || "jd-files".equals(folder);
    }

    /** Identity documents and marksheets: owned by the student, opened only by them and by whoever may verify them. */
    private static boolean isPrivateDocFolder(String folder) {
        return "identity-docs".equals(folder) || "marksheets".equals(folder);
    }

    private boolean isSelfOwnedFolder(String folder) {
        return "profile-images".equals(folder) || "video-intros".equals(folder) || isPrivateDocFolder(folder) || "resumes".equals(folder);
    }

    private ResponseEntity<?> validateUploadAuthorization(UserPrincipal principal,
                                                          String folder,
                                                          Integer userId,
                                                          Integer courseId,
                                                          Integer classId) {
        if (principal == null) {
            return new ResponseEntity<>(new Response<>(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        if (folder == null || folder.trim().isEmpty()) {
            return new ResponseEntity<>(new Response<>(HttpStatus.BAD_REQUEST.name(), "folder is required", null), HttpStatus.BAD_REQUEST);
        }
        if (folder.contains("..") || folder.startsWith("/") || folder.contains("//") || !ALLOWED_FOLDERS.contains(folder)) {
            return new ResponseEntity<>(new Response<>(HttpStatus.BAD_REQUEST.name(), "Folder not allowed", null), HttpStatus.BAD_REQUEST);
        }
        if (principal.isLearner() && isAuthoringFolder(folder)) {
            return new ResponseEntity<>(new Response<>(HttpStatus.FORBIDDEN.name(), "Learners cannot upload to folder: " + folder, null), HttpStatus.FORBIDDEN);
        }
        if ("lesson-content".equals(folder) || "video-intros".equals(folder)) {
            boolean isSelfOwnedVideoIntro = "video-intros".equals(folder) && isPositiveId(userId);
            if (!isSelfOwnedVideoIntro) {
                if (accessControlService == null) {
                    return new ResponseEntity<>(new Response<>(HttpStatus.SERVICE_UNAVAILABLE.name(), "Access control is not configured", null), HttpStatus.SERVICE_UNAVAILABLE);
                }
                if (isPositiveId(courseId)) {
                    accessControlService.requireAccessCourse(principal, courseId);
                } else if (isPositiveId(classId)) {
                    accessControlService.requireAccessClass(principal, classId);
                } else {
                    return new ResponseEntity<>(new Response<>(HttpStatus.BAD_REQUEST.name(), "courseId or classId required for uploads to folder: " + folder, null), HttpStatus.BAD_REQUEST);
                }
            }
        }
        if (isSelfOwnedFolder(folder) && userId != null) {
            int principalId = principal.getId() != null ? principal.getId() : 0;
            if (principalId != userId.intValue()) {
                return new ResponseEntity<>(new Response<>(HttpStatus.FORBIDDEN.name(), "Upload is only allowed for your own profile", null), HttpStatus.FORBIDDEN);
            }
        }
        if (isSelfOwnedFolder(folder) && principal.isLearner() && userId == null) {
            return new ResponseEntity<>(new Response<>(HttpStatus.BAD_REQUEST.name(), "userId is required for uploads to folder: " + folder, null), HttpStatus.BAD_REQUEST);
        }
        return null;
    }

    // Shared by presign() (direct-PUT path) and uploadFile() (the multipart backend-proxy
    // fallback used when direct-PUT is blocked by browser CORS) — this used to live only inline
    // in presign(), so the proxy path had no course/class scope binding for lesson-content/
    // video-intros and no project-membership check for assignments at all. Same folder, same
    // intended protection, two different transports; whichever one a caller happened to use
    // decided whether the check applied.
    private ResponseEntity<?> validateFolderBinding(UserPrincipal principal, String folder,
                                                     Integer courseId, Integer classId,
                                                     String projectId, Integer userId) {
        if ("lesson-content".equals(folder) || "video-intros".equals(folder)) {
            boolean isSelfOwnedVideoIntro = "video-intros".equals(folder) && isPositiveId(userId);
            if (!isSelfOwnedVideoIntro) {
                if (accessControlService == null) {
                    return new ResponseEntity<>(
                            new Response<>(HttpStatus.SERVICE_UNAVAILABLE.name(), "Access control is not configured", null),
                            HttpStatus.SERVICE_UNAVAILABLE);
                }
                if (isPositiveId(courseId)) {
                    accessControlService.requireAccessCourse(principal, courseId);
                } else if (isPositiveId(classId)) {
                    accessControlService.requireAccessClass(principal, classId);
                } else {
                    return new ResponseEntity<>(
                            new Response<>(HttpStatus.BAD_REQUEST.name(), "courseId or classId required for uploads to folder: " + folder, null),
                            HttpStatus.BAD_REQUEST);
                }
            }
        }
        if ("assignments".equals(folder) && projectId != null && !projectId.isBlank()) {
            if (projectWorkspaceRepository == null || projectMemberRepository == null) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.SERVICE_UNAVAILABLE.name(), "Project access verification is not configured", null),
                        HttpStatus.SERVICE_UNAVAILABLE);
            }
            String rawProjectId = projectId.trim();
            com._42students.lms.model.ProjectWorkspace resolvedProject;
            try {
                resolvedProject = projectWorkspaceRepository.findActiveById(Integer.parseInt(rawProjectId)).orElse(null);
            } catch (NumberFormatException notNumeric) {
                resolvedProject = projectWorkspaceRepository.findActiveBySlug(rawProjectId).orElse(null);
            }
            if (resolvedProject == null) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.BAD_REQUEST.name(), "Project not found", null),
                        HttpStatus.BAD_REQUEST);
            }
            String projectUserType = principal.isLearner() ? "LEARNER" : "FACULTY";
            com._42students.lms.model.ProjectMember projectMember = projectMemberRepository
                    .findByProjectAndUserAndType(resolvedProject.getId(), principal.getId(), projectUserType)
                    .filter(member -> !Boolean.TRUE.equals(member.getIsDeleted()))
                    .filter(member -> member.getMemberStatus() == null || member.getMemberStatus().isBlank()
                            || "ACTIVE".equalsIgnoreCase(member.getMemberStatus().trim()))
                    .orElse(null);
            if (projectMember == null) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.FORBIDDEN.name(), "You are not an active member of this project", null),
                        HttpStatus.FORBIDDEN);
            }
            // Project uploads share the assignments folder with core Course submissions.
            // Gate only a validated, active project request; preserve Course uploads.
            // The target college gate covers global/org Superadmins; the principal gate
            // additionally honors learner/class/batch/program/department overrides.
            featureFlagService.requireEnabledForCollege("module.projects.enabled", resolvedProject.getCollegeId());
            featureFlagService.requireEnabled("module.projects.enabled", principal, null);
        }
        return null;
    }

    private Integer resolveProjectUploadId(String projectId) {
        if (projectId == null || projectId.isBlank()) return null;
        if (projectWorkspaceRepository == null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Project upload validation unavailable");
        }
        String id = projectId.trim();
        com._42students.lms.model.ProjectWorkspace project;
        try {
            project = projectWorkspaceRepository.findActiveById(Integer.parseInt(id)).orElse(null);
        } catch (NumberFormatException e) {
            project = projectWorkspaceRepository.findActiveBySlug(id).orElse(null);
        }
        if (project == null) throw new IllegalArgumentException("Project not found for upload");
        return project.getId();
    }

    private String resolveTenantPrefix(UserPrincipal principal, HttpServletRequest request) {
        if (principal == null) return null;

        Integer collegeId = principal.getCollegeId();
        Integer organizationId = principal.getOrganizationId();

        if (principal.isLearner() && scopeResolutionService != null && (collegeId == null || organizationId == null)) {
            ResolvedLearnerScope scope = scopeResolutionService.resolveFullScope(principal.getId());
            if (scope != null) {
                if (collegeId == null) collegeId = scope.getCollegeId();
                if (organizationId == null) organizationId = scope.getOrganizationId();
            }
        }

        // Fallback for session-based auth or older tokens without org/college populated.
        if ((collegeId == null || organizationId == null) && securityContextUtil != null) {
            if (organizationId == null) organizationId = securityContextUtil.getAuthenticatedOrganizationId(request);
            if (collegeId == null) collegeId = securityContextUtil.getAuthenticatedCollegeId(request);
        }

        if (collegeId == null || organizationId == null) return null;
        return "org-" + organizationId + "/college-" + collegeId;
    }

    // "college-branding" is the one folder whose tenant scope can't come from the caller's own
    // principal (resolveTenantPrefix above) — a superadmin editing a college's branding is
    // typically global (no collegeId/organizationId of their own), so the target college is
    // supplied explicitly and must be authorized/resolved separately. Mirrors
    // TenantAdminController's requireCollegeInScope pattern: global superadmin may target any
    // college, org-scoped must match the college's org, college-scoped must match exactly.
    private String resolveTenantPrefixForCollegeBranding(UserPrincipal principal, Integer targetCollegeId) {
        if (targetCollegeId == null || targetCollegeId <= 0 || collegeRepository == null) return null;
        accessControlService.requireSuperAdmin(principal);
        com._42students.lms.model.College college = collegeRepository.findById(targetCollegeId).orElse(null);
        if (college == null || Boolean.TRUE.equals(college.getIsDeleted())) return null;
        if (principal.getCollegeId() != null) {
            if (!principal.getCollegeId().equals(targetCollegeId)) {
                throw new org.springframework.security.access.AccessDeniedException("Superadmin is college-scoped and cannot access other colleges");
            }
        } else if (principal.getOrganizationId() != null && college.getOrgId() != null
                && !principal.getOrganizationId().equals(college.getOrgId())) {
            throw new org.springframework.security.access.AccessDeniedException("Superadmin is org-scoped and cannot access other organizations");
        }
        return "org-" + college.getOrgId() + "/college-" + college.getId();
    }

    /**
     * Get a presigned PUT URL for direct upload to R2.
     * Client must PUT the file to uploadUrl with the same Content-Type as requested.
     *
     * @param body fileName, contentType, contentLength, optional folder, optional type
     * @return uploadUrl, key, publicUrl
     */
    @PostMapping(value = "/presign", consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> presign(HttpServletRequest request, @Valid @RequestBody PresignUploadRequestDTO body) {
        if (securityContextUtil == null) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.UNAUTHORIZED.name(), "Authentication service unavailable", null),
                    HttpStatus.UNAUTHORIZED
            );
        }
        UserPrincipal rateLimitPrincipal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (rateLimitingService != null && rateLimitPrincipal != null && rateLimitPrincipal.getId() != null
                && rateLimitingService.isRateLimited("upload_presign:" + rateLimitPrincipal.getId(), 60, 3600)) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.TOO_MANY_REQUESTS.name(), "Too many upload requests. Please wait before trying again.", null),
                    HttpStatus.TOO_MANY_REQUESTS
            );
        }
        if (r2Storage == null) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.SERVICE_UNAVAILABLE.name(), "R2 storage is not configured", null),
                    HttpStatus.SERVICE_UNAVAILABLE
            );
        }
        long size = body.getContentLength() != null ? body.getContentLength() : 0;
        if (size < 0) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.BAD_REQUEST.name(), "contentLength must be non-negative", null),
                    HttpStatus.BAD_REQUEST
            );
        }
        if (size == 0) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.BAD_REQUEST.name(), "File size must be greater than zero", null),
                    HttpStatus.BAD_REQUEST
            );
        }
        String typeNorm = body.getType() != null ? body.getType().trim().toLowerCase() : "generic";
        String folder = body.getFolder() != null ? body.getFolder().trim() : null;
        if (folder == null || folder.isEmpty()) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.BAD_REQUEST.name(), "folder is required", null),
                    HttpStatus.BAD_REQUEST
            );
        }
        if (folder != null && !folder.isEmpty()) {
            if (folder.contains("..") || folder.startsWith("/") || folder.contains("//")) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.BAD_REQUEST.name(), "Invalid folder path", null),
                        HttpStatus.BAD_REQUEST
                );
            }
            if (!ALLOWED_FOLDERS.contains(folder)) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.BAD_REQUEST.name(), "Folder not allowed", null),
                        HttpStatus.BAD_REQUEST
                );
            }
        }
        // spring.servlet.multipart.max-file-size (5120MB) is sized for lesson video content and
        // doesn't apply to this presigned-upload path at all -- nothing anywhere capped how large a
        // login background image could be. A college-branding image renders on every visitor's
        // login page on every load; an admin who picks a multi-hundred-MB photo straight off a
        // phone would silently make that page slow for everyone at that college, with no error to
        // explain why. Small, generous-for-a-login-image cap, enforced server-side since the
        // frontend's own check is only a fast first line of defense, not the real one.
        Long folderMaxBytes = FOLDER_MAX_UPLOAD_BYTES.get(folder);
        if (folderMaxBytes != null && size > folderMaxBytes) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.BAD_REQUEST.name(),
                            "File is too large for " + folder + " (max " + (folderMaxBytes / (1024 * 1024)) + "MB)", null),
                    HttpStatus.BAD_REQUEST
            );
        }
        if ("jd-files".equals(folder)) {
            String ct = body.getContentType() == null ? "" : body.getContentType().trim().toLowerCase();
            if (!Set.of("application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document").contains(ct)) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.BAD_REQUEST.name(), "A job description must be a PDF or a Word file", null),
                        HttpStatus.BAD_REQUEST
                );
            }
        }
        if ("offer-letters".equals(folder)) {
            String ct = body.getContentType() == null ? "" : body.getContentType().trim().toLowerCase();
            if (!Set.of("application/pdf", "image/png", "image/jpeg").contains(ct)) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.BAD_REQUEST.name(), "An offer letter must be a PDF, PNG or JPG", null),
                        HttpStatus.BAD_REQUEST
                );
            }
        }
        // Auth: lesson/content types require faculty or admin; profile-images and video-intros allow any authenticated user (learners can upload their own)
        if (securityContextUtil != null) {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null),
                        HttpStatus.UNAUTHORIZED
                );
            }
            boolean authoringFolder = "lesson-content".equals(folder) || "course-images".equals(folder) || "offer-letters".equals(folder) || "jd-files".equals(folder);
            if (principal.isLearner() && authoringFolder) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.FORBIDDEN.name(), "Learners cannot upload to folder: " + folder, null),
                        HttpStatus.FORBIDDEN
                );
            }
            ResponseEntity<?> bindingError = validateFolderBinding(principal, folder, body.getCourseId(), body.getClassId(), body.getProjectId(), body.getUserId());
            if (bindingError != null) return bindingError;

            boolean selfOwnedFolder = "profile-images".equals(folder) || "video-intros".equals(folder) || isPrivateDocFolder(folder) || "resumes".equals(folder);
            // When folder is profile-images/video-intros/identity-docs, if userId is provided it must match the principal (bind upload to profile owner)
            if (selfOwnedFolder && body.getUserId() != null) {
                int principalId = principal.getId() != null ? principal.getId() : 0;
                if (principalId != body.getUserId().intValue()) {
                    return new ResponseEntity<>(
                            new Response<>(HttpStatus.FORBIDDEN.name(), "Upload is only allowed for your own profile", null),
                            HttpStatus.FORBIDDEN
                    );
                }
            }
            if (selfOwnedFolder && principal.isLearner() && body.getUserId() == null) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.BAD_REQUEST.name(), "userId is required for uploads to folder: " + folder, null),
                        HttpStatus.BAD_REQUEST
                );
            }
            if ("assignments".equals(folder) && "assignment".equals(typeNorm)
                    && (body.getProjectId() == null || body.getProjectId().isBlank())) {
                if (body.getLessonContentId() == null || body.getLessonContentId() <= 0) {
                    return new ResponseEntity<>(
                            new Response<>(HttpStatus.BAD_REQUEST.name(), "lessonContentId is required for assignment uploads", null),
                            HttpStatus.BAD_REQUEST
                    );
                }
                if (lessonContentsRepository == null) {
                    return new ResponseEntity<>(
                            new Response<>(HttpStatus.SERVICE_UNAVAILABLE.name(), "Assignment verification is not configured", null),
                            HttpStatus.SERVICE_UNAVAILABLE
                    );
                }
                com._42students.lms.model.LessonContents lessonContent = lessonContentsRepository.findById(body.getLessonContentId()).orElse(null);
                if (lessonContent == null || Boolean.TRUE.equals(lessonContent.getIsDeleted())
                        || lessonContent.getContentType() == null
                        || !lessonContent.getContentType().equalsIgnoreCase("assignment")) {
                    return new ResponseEntity<>(
                            new Response<>(HttpStatus.BAD_REQUEST.name(), "Assignment lesson content not found", null),
                            HttpStatus.BAD_REQUEST
                    );
                }
            }
        }
        // Type + size validation
        String contentType = body.getContentType();
        if (contentType == null) contentType = "";
        String ct = contentType.toLowerCase();
        switch (typeNorm) {
            case "video":
                if (!ct.startsWith("video/")) {
                    return new ResponseEntity<>(new Response<>(HttpStatus.BAD_REQUEST.name(), "Video upload requires a video file type", null), HttpStatus.BAD_REQUEST);
                }
                if (size > maxVideoSizeBytes) {
                    return new ResponseEntity<>(new Response<>(HttpStatus.BAD_REQUEST.name(), "Video file size exceeds maximum allowed", null), HttpStatus.BAD_REQUEST);
                }
                break;
            case "lecture":
                if (!ct.equals("application/pdf") && !ct.equals("application/msword") && !ct.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
                    return new ResponseEntity<>(new Response<>(HttpStatus.BAD_REQUEST.name(), "Lecture upload requires PDF or Word document", null), HttpStatus.BAD_REQUEST);
                }
                if (size > maxLectureSizeBytes) {
                    return new ResponseEntity<>(new Response<>(HttpStatus.BAD_REQUEST.name(), "Lecture document size exceeds maximum allowed", null), HttpStatus.BAD_REQUEST);
                }
                break;
            case "ppt":
                if (!ct.equals("application/vnd.ms-powerpoint") && !ct.equals("application/vnd.openxmlformats-officedocument.presentationml.presentation")) {
                    return new ResponseEntity<>(new Response<>(HttpStatus.BAD_REQUEST.name(), "PPT upload requires PPT or PPTX presentation", null), HttpStatus.BAD_REQUEST);
                }
                if (size > maxPptSizeBytes) {
                    return new ResponseEntity<>(new Response<>(HttpStatus.BAD_REQUEST.name(), "Presentation size exceeds maximum allowed", null), HttpStatus.BAD_REQUEST);
                }
                break;
            case "pdf":
                if (!"application/pdf".equals(ct)) {
                    return new ResponseEntity<>(new Response<>(HttpStatus.BAD_REQUEST.name(), "PDF upload requires a PDF file", null), HttpStatus.BAD_REQUEST);
                }
                if (size > maxPdfSizeBytes) {
                    return new ResponseEntity<>(new Response<>(HttpStatus.BAD_REQUEST.name(), "PDF file size exceeds maximum allowed", null), HttpStatus.BAD_REQUEST);
                }
                break;
            case "image":
                if (!ct.startsWith("image/")) {
                    return new ResponseEntity<>(new Response<>(HttpStatus.BAD_REQUEST.name(), "Image upload requires an image file type", null), HttpStatus.BAD_REQUEST);
                }
                // "image/*" matches image/svg+xml too, which streamFile serves inline — an SVG
                // can carry <script>, so it would execute same-origin as stored XSS. Block it
                // (and other dangerous-inline types) the same way the generic/assignment branch does.
                if (isDangerousInlineContentType(ct)) {
                    return new ResponseEntity<>(new Response<>(HttpStatus.BAD_REQUEST.name(), "This file type is not allowed for upload", null), HttpStatus.BAD_REQUEST);
                }
                if (size > maxImageSizeBytes) {
                    return new ResponseEntity<>(new Response<>(HttpStatus.BAD_REQUEST.name(), "Image file size exceeds maximum allowed", null), HttpStatus.BAD_REQUEST);
                }
                break;
            // Item 193: "resume" had no case here at all, so it fell through to default —
            // size-checked only against the generic cap, with no content-type restriction beyond
            // the default branch's narrow dangerous-inline-type blocklist. Any file type could be
            // uploaded as a "resume". Mirrors "lecture"'s PDF/Word allowlist, since a resume is
            // the same category of document.
            case "resume":
                if (!ct.equals("application/pdf") && !ct.equals("application/msword") && !ct.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
                    return new ResponseEntity<>(new Response<>(HttpStatus.BAD_REQUEST.name(), "Resume upload requires a PDF or Word document", null), HttpStatus.BAD_REQUEST);
                }
                if (size > maxPdfSizeBytes) {
                    return new ResponseEntity<>(new Response<>(HttpStatus.BAD_REQUEST.name(), "Resume file size exceeds maximum allowed", null), HttpStatus.BAD_REQUEST);
                }
                break;
            case "assignment":
            case "generic":
            default:
                if (size > maxGenericSizeBytes) {
                    return new ResponseEntity<>(new Response<>(HttpStatus.BAD_REQUEST.name(), "File size exceeds maximum allowed", null), HttpStatus.BAD_REQUEST);
                }
                // Unlike the typed branches above (video/lecture/ppt/pdf/image), this branch had
                // NO content-type restriction at all — a caller could presign+PUT an SVG or HTML
                // file into a project's Resources/assignments folder. streamFile then serves image/*
                // content back with Content-Disposition: inline, so an SVG containing <script> would
                // execute same-origin when opened — stored XSS. Block the specific dangerous types
                // rather than allowlisting (this branch legitimately needs to accept a wide range of
                // document/archive formats).
                if (ct != null && isDangerousInlineContentType(ct)) {
                    return new ResponseEntity<>(new Response<>(HttpStatus.BAD_REQUEST.name(), "This file type is not allowed for upload", null), HttpStatus.BAD_REQUEST);
                }
                // Also block known executable/script file types (checked via both declared
                // content-type and file name extension, since either can be spoofed independently).
                if (isDangerousExecutableUpload(ct, body.getFileName())) {
                    return new ResponseEntity<>(new Response<>(HttpStatus.BAD_REQUEST.name(), "This file type is not allowed for upload", null), HttpStatus.BAD_REQUEST);
                }
                break;
        }
        String extension = getExtensionFromFileNameOrContentType(body.getFileName(), body.getContentType());
        if (extension == null || extension.isEmpty()) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.BAD_REQUEST.name(), "Could not determine file extension", null),
                    HttpStatus.BAD_REQUEST
            );
        }
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        String tenantPrefix = "college-branding".equals(folder)
                ? resolveTenantPrefixForCollegeBranding(principal, body.getCollegeId())
                : resolveTenantPrefix(principal, request);
        if (tenantPrefix == null) {
            String message = "college-branding".equals(folder)
                    ? "collegeId is required and must reference an existing college"
                    : "Tenant scope is required for uploads. Set org/college scope first.";
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.BAD_REQUEST.name(), message, null),
                    HttpStatus.BAD_REQUEST
            );
        }
        boolean selfOwnedFolder = "profile-images".equals(folder) || "video-intros".equals(folder) || isPrivateDocFolder(folder) || "resumes".equals(folder);
        String ownerPart = selfOwnedFolder ? ownerSegment(folder, principal) : "";
        String projectPart = "assignments".equals(folder) && body.getProjectId() != null
                && !body.getProjectId().isBlank() ? "/project-" + resolveProjectUploadId(body.getProjectId()) : "";
        String key = tenantPrefix + "/" + folder + ownerPart + projectPart + "/" + UUID.randomUUID().toString() + extension;
        if (isPrivateDocFolder(folder)) {
            if (!privateDocsReady()) return privateDocsNotReady();
            try {
                String uploadUrl = privateDocs.presignedPut(key, body.getContentType(), PRESIGN_EXPIRY_MINUTES);
                return new ResponseEntity<>(new PresignUploadResponseDTO(uploadUrl, key, com._42students.lms.utils.PrivateDocStorage.refOf(key), null), HttpStatus.OK);
            } catch (Exception e) {
                log.error("Error generating private upload URL (folder={})", folder, e);
                return new ResponseEntity<>(new Response<>(HttpStatus.INTERNAL_SERVER_ERROR.name(), "Failed to generate upload URL", null), HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        try {
            String uploadUrl = r2Storage.generatePresignedPutUrl(key, body.getContentType(), PRESIGN_EXPIRY_MINUTES);
            String publicUrl = r2Storage.getPublicUrl(key);
            String receiptId = createAssignmentUploadReceiptIfNeeded(folder, typeNorm, body, principal, key, publicUrl);
            return new ResponseEntity<>(
                    new PresignUploadResponseDTO(uploadUrl, key, publicUrl, receiptId),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            log.error("Error generating presigned URL (tenantPrefix={}, folder={}, type={})", tenantPrefix, folder, typeNorm, e);
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.INTERNAL_SERVER_ERROR.name(), "Failed to generate upload URL", null),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    private String createAssignmentUploadReceiptIfNeeded(String folder,
                                                         String typeNorm,
                                                         PresignUploadRequestDTO body,
                                                         UserPrincipal principal,
                                                         String key,
                                                         String publicUrl) {
        if (!"assignments".equals(folder) || !"assignment".equals(typeNorm)
                || body.getProjectId() != null && !body.getProjectId().isBlank()) {
            return null;
        }
        if (assignmentUploadReceiptRepository == null || principal == null || principal.getId() == null) {
            return null;
        }
        com._42students.lms.model.AssignmentUploadReceipt receipt = new com._42students.lms.model.AssignmentUploadReceipt();
        receipt.setReceiptId(UUID.randomUUID().toString());
        receipt.setStorageKey(key);
        receipt.setPublicUrl(publicUrl);
        receipt.setFolder(folder);
        receipt.setUploadType(typeNorm);
        receipt.setOwnerUserId(principal.getId());
        receipt.setOwnerUserType(principal.isLearner() ? "LEARNER" : (principal.isFaculty() ? "FACULTY" : "ADMIN"));
        receipt.setLessonContentId(body.getLessonContentId());
        receipt.setDeclaredContentType(body.getContentType());
        receipt.setDeclaredContentLength(body.getContentLength());
        receipt.setExpiresAt(LocalDateTime.now().plusMinutes(PRESIGN_EXPIRY_MINUTES + 30L));
        return assignmentUploadReceiptRepository.save(receipt).getReceiptId();
    }

    @PostMapping(value = "/import-file-from-url", consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> importFileFromUrl(HttpServletRequest request, @Valid @RequestBody ImportFileFromUrlRequestDTO body) {
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal == null) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null),
                    HttpStatus.UNAUTHORIZED
            );
        }
        if (r2Storage == null) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.SERVICE_UNAVAILABLE.name(), "R2 storage is not configured", null),
                    HttpStatus.SERVICE_UNAVAILABLE
            );
        }
        // Stricter than presign()'s limit — this endpoint makes the BACKEND itself perform a real
        // outbound HTTP fetch per call, unlike presign() which just mints a URL.
        if (rateLimitingService != null && principal.getId() != null
                && rateLimitingService.isRateLimited("upload_import:" + principal.getId(), 20, 3600)) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.TOO_MANY_REQUESTS.name(), "Too many import requests. Please wait before trying again.", null),
                    HttpStatus.TOO_MANY_REQUESTS
            );
        }
        String folder = body.getFolder() != null ? body.getFolder().trim() : "";
        ResponseEntity<?> authError = validateUploadAuthorization(principal, folder, body.getUserId(), body.getCourseId(), body.getClassId());
        if (authError != null) return authError;
        String typeNorm = body.getType() != null ? body.getType().trim().toLowerCase() : "generic";
        if ("assignments".equals(folder) && "assignment".equals(typeNorm)) {
            if (body.getLessonContentId() == null || body.getLessonContentId() <= 0) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.BAD_REQUEST.name(), "lessonContentId is required for assignment uploads", null),
                        HttpStatus.BAD_REQUEST
                );
            }
            if (lessonContentsRepository == null) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.SERVICE_UNAVAILABLE.name(), "Assignment verification is not configured", null),
                        HttpStatus.SERVICE_UNAVAILABLE
                );
            }
            com._42students.lms.model.LessonContents lessonContent = lessonContentsRepository.findById(body.getLessonContentId()).orElse(null);
            if (lessonContent == null || Boolean.TRUE.equals(lessonContent.getIsDeleted())
                    || lessonContent.getContentType() == null
                    || !lessonContent.getContentType().equalsIgnoreCase("assignment")) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.BAD_REQUEST.name(), "Assignment lesson content not found", null),
                        HttpStatus.BAD_REQUEST
                );
            }
        }

        String tenantPrefix = resolveTenantPrefix(principal, request);
        if (tenantPrefix == null) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.BAD_REQUEST.name(), "Tenant scope is required for uploads. Set org/college scope first.", null),
                    HttpStatus.BAD_REQUEST
            );
        }

        try {
            Map<String, Object> result = fetchAndUploadFileFromUrl(
                    body.getUrl(),
                    tenantPrefix,
                    folder,
                    body.getType(),
                    principal,
                    body.getLessonContentId()
            );
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), result),
                    HttpStatus.OK
            );
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.BAD_REQUEST.name(), e.getMessage(), null),
                    HttpStatus.BAD_REQUEST
            );
        } catch (Exception e) {
            log.error("Error importing file from URL: {}", e.getMessage(), e);
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.INTERNAL_SERVER_ERROR.name(), "Import failed", null),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Import a video from a public URL: fetch the file, upload to R2 under lesson-content/, return the key.
     * Allowed for faculty or admin only. Enforces timeout and max size (same as video upload).
     */
    @PostMapping(value = "/import-video-from-url", consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> importVideoFromUrl(@Valid @RequestBody ImportVideoFromUrlRequestDTO body) {
        UserPrincipal principal = null;
        if (securityContextUtil != null) {
            principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null),
                        HttpStatus.UNAUTHORIZED
                );
            }
            boolean canUploadLesson = principal.isFaculty() || "ADMIN".equalsIgnoreCase(principal.getUserType());
            if (!canUploadLesson) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.FORBIDDEN.name(), "Only faculty or admin may import video from URL", null),
                        HttpStatus.FORBIDDEN
                );
            }
            // Same reasoning as import-file-from-url's limit — a real outbound fetch per call.
            if (rateLimitingService != null && principal.getId() != null
                    && rateLimitingService.isRateLimited("upload_import:" + principal.getId(), 20, 3600)) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.TOO_MANY_REQUESTS.name(), "Too many import requests. Please wait before trying again.", null),
                        HttpStatus.TOO_MANY_REQUESTS
                );
            }
        }
        String url = body.getUrl() != null ? body.getUrl().trim() : "";
        if (url.isEmpty()) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.BAD_REQUEST.name(), "url is required", null),
                    HttpStatus.BAD_REQUEST
            );
        }
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.BAD_REQUEST.name(), "URL must be http or https", null),
                    HttpStatus.BAD_REQUEST
            );
        }
        if (r2Storage == null) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.SERVICE_UNAVAILABLE.name(), "R2 storage is not configured", null),
                    HttpStatus.SERVICE_UNAVAILABLE
            );
        }
        try {
            rejectInternalHost(URI.create(url));
            String tenantPrefix = resolveTenantPrefix(principal, null);
            if (tenantPrefix == null) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.BAD_REQUEST.name(), "Tenant scope is required for uploads. Set org/college scope first.", null),
                        HttpStatus.BAD_REQUEST
                );
            }
            Map<String, Object> result = fetchAndUploadVideoFromUrl(url, tenantPrefix);
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), result),
                    HttpStatus.OK
            );
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.BAD_REQUEST.name(), e.getMessage(), null),
                    HttpStatus.BAD_REQUEST
            );
        } catch (Exception e) {
            log.error("Error importing video from URL", e);
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.INTERNAL_SERVER_ERROR.name(), "Import failed. Please try again or contact support.", null),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Lightweight validation of a video URL before import: HEAD (or minimal GET) to check Content-Type and optional Content-Length.
     * Does not download the full file. Allowed for faculty or admin only.
     */
    @PostMapping(value = "/validate-video-url", consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> validateVideoUrl(@Valid @RequestBody ImportVideoFromUrlRequestDTO body) {
        if (securityContextUtil != null) {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null),
                        HttpStatus.UNAUTHORIZED
                );
            }
            boolean canUploadLesson = principal.isFaculty() || "ADMIN".equalsIgnoreCase(principal.getUserType());
            if (!canUploadLesson) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.FORBIDDEN.name(), "Only faculty or admin may validate video URL", null),
                        HttpStatus.FORBIDDEN
                );
            }
        }
        String url = body.getUrl() != null ? body.getUrl().trim() : "";
        if (url.isEmpty()) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.BAD_REQUEST.name(), "url is required", null),
                    HttpStatus.BAD_REQUEST
            );
        }
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.BAD_REQUEST.name(), "URL must be http or https", null),
                    HttpStatus.BAD_REQUEST
            );
        }
        try {
            rejectInternalHost(URI.create(url));
            Map<String, Object> result = validateVideoUrlLightweight(url);
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), result),
                    HttpStatus.OK
            );
        } catch (IllegalArgumentException e) {
            Map<String, Object> fail = new HashMap<>();
            fail.put("valid", false);
            fail.put("message", e.getMessage());
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.OK.name(), "Validation failed", fail),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            log.warn("Validate video URL error", e);
            Map<String, Object> fail = new HashMap<>();
            fail.put("valid", false);
            fail.put("message", "Could not reach URL or validate it. Please check the URL and try again.");
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.OK.name(), "Validation failed", fail),
                    HttpStatus.OK
            );
        }
    }

    /**
     * HEAD request (or GET Range 0-0) to get Content-Type and Content-Length without downloading the full file.
     */
    private Map<String, Object> validateVideoUrlLightweight(String urlString) throws IOException {
        URI uri = resolveSafeRedirectTarget(URI.create(urlString), 10_000, 15_000);
        RestTemplate rest = newNonRedirectingRestTemplate(10_000, 15_000);
        org.springframework.http.HttpHeaders requestHeaders = new org.springframework.http.HttpHeaders();
        org.springframework.http.HttpEntity<Void> entity = new org.springframework.http.HttpEntity<>(requestHeaders);

        org.springframework.http.HttpHeaders responseHeaders = null;
        try {
            ResponseEntity<Void> headResp = rest.exchange(uri, org.springframework.http.HttpMethod.HEAD, entity, Void.class);
            // Redirects are disabled on this client — a 3xx here means the target moved between
            // the safety probe above and this real check; reject rather than silently proceed.
            if (headResp.getStatusCodeValue() >= 300 && headResp.getStatusCodeValue() < 400) {
                throw new IllegalArgumentException("URL redirected unexpectedly. Please try again.");
            }
            responseHeaders = headResp.getHeaders();
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            if (e.getStatusCode() == org.springframework.http.HttpStatus.METHOD_NOT_ALLOWED) {
                requestHeaders.set("Range", "bytes=0-0");
                ResponseEntity<org.springframework.core.io.Resource> getResp = rest.exchange(uri, org.springframework.http.HttpMethod.GET,
                        new org.springframework.http.HttpEntity<>(requestHeaders), org.springframework.core.io.Resource.class);
                responseHeaders = getResp.getHeaders();
                if (getResp.getBody() != null) {
                    try (InputStream ignored = getResp.getBody().getInputStream()) {
                        ignored.read(new byte[1]);
                    }
                }
            } else {
                throw new IllegalArgumentException("URL returned " + e.getStatusCode() + ". Link may be invalid or inaccessible.");
            }
        }
        if (responseHeaders == null) {
            throw new IllegalArgumentException("Could not retrieve response headers from URL.");
        }

        String contentTypeHeader = responseHeaders.getFirst("Content-Type");
        String contentType = contentTypeHeader != null ? contentTypeHeader.split(";")[0].trim().toLowerCase() : "";
        String contentLengthStr = responseHeaders.getFirst("Content-Length");

        boolean typeOk = false;
        if (!contentType.isEmpty() && contentType.startsWith("video/")) {
            typeOk = true;
        }
        if (!typeOk && !contentType.isEmpty()) {
            for (String p : VIDEO_CONTENT_TYPE_PREFIXES) {
                if (contentType.startsWith(p) || contentType.equals("video/quicktime")) {
                    typeOk = true;
                    break;
                }
            }
        }
        if (!typeOk) {
            String path = uri.getPath();
            if (path != null && path.contains(".")) {
                String ext = path.substring(path.lastIndexOf(".") + 1).toLowerCase();
                if (SAFE_EXTENSION.matcher("." + ext).matches() && VIDEO_EXTENSIONS.contains(ext)) {
                    typeOk = true;
                }
            }
        }
        if (!typeOk) {
            throw new IllegalArgumentException("URL does not point to a video file (Content-Type: " + (contentType.isEmpty() ? "unknown" : contentType) + "). Use a direct link to an mp4, webm, or mov file.");
        }

        if (contentLengthStr != null && !contentLengthStr.trim().isEmpty()) {
            try {
                long length = Long.parseLong(contentLengthStr.trim());
                if (length > maxVideoSizeBytes) {
                    throw new IllegalArgumentException("Video size (" + (length / 1024 / 1024) + " MB) exceeds maximum allowed (" + (maxVideoSizeBytes / 1024 / 1024) + " MB).");
                }
            } catch (NumberFormatException ignored) {
                // Content-Length not parseable; skip size check
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("valid", true);
        result.put("message", "URL is a valid video and can be imported.");
        result.put("contentType", contentType);
        if (contentLengthStr != null && !contentLengthStr.trim().isEmpty()) {
            try {
                result.put("contentLength", Long.parseLong(contentLengthStr.trim()));
            } catch (NumberFormatException ignored) {
                // ignore
            }
        }
        return result;
    }

    private static final Pattern SAFE_EXTENSION = Pattern.compile("^[a-zA-Z0-9.]+$");
    private static final Set<String> VIDEO_EXTENSIONS = Collections.unmodifiableSet(new HashSet<>(Arrays.asList("mp4", "webm", "mov", "avi", "m4v")));
    private static final Set<String> VIDEO_CONTENT_TYPE_PREFIXES = Collections.unmodifiableSet(new HashSet<>(Arrays.asList("video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/x-m4v")));

    // Video import (unlike the generic import-from-url path above, which is Google-Drive-only)
    // must accept arbitrary external hosts by design — that's the whole feature. Without this
    // check, an authenticated faculty/admin account could point either import-video-from-url or
    // validate-video-url at an internal address (a k8s service, localhost, or the cloud metadata
    // endpoint at 169.254.169.254) and the backend would fetch it before any content-type
    // validation ran, both leaking whether the internal endpoint exists (via timing/response) and
    // potentially exfiltrating its response. Resolves the hostname and rejects if ANY resolved
    // address is loopback/link-local/private/multicast — checking the resolved IP rather than
    // just the hostname string closes the DNS-rebinding gap a pure allowlist-of-hostnames misses.
    private void rejectInternalHost(URI uri) {
        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new IllegalArgumentException("URL must include a valid host");
        }
        java.net.InetAddress[] addresses;
        try {
            addresses = java.net.InetAddress.getAllByName(host);
        } catch (java.net.UnknownHostException e) {
            throw new IllegalArgumentException("Could not resolve host: " + host);
        }
        for (java.net.InetAddress address : addresses) {
            if (address.isLoopbackAddress() || address.isLinkLocalAddress() || address.isSiteLocalAddress()
                    || address.isMulticastAddress() || address.isAnyLocalAddress() || isIpv6UniqueLocal(address)) {
                throw new IllegalArgumentException("URL points to a restricted network address and cannot be imported");
            }
        }
    }

    // InetAddress#isSiteLocalAddress() only recognizes the deprecated IPv6 site-local prefix
    // (fec0::/10) — it does NOT recognize fc00::/7, the actual private-IPv6 range used in
    // practice (Docker/k8s dual-stack, Tailscale, etc.), so an internal address in that range
    // would otherwise sail straight through the check above.
    private static boolean isIpv6UniqueLocal(java.net.InetAddress address) {
        if (!(address instanceof java.net.Inet6Address)) return false;
        byte[] bytes = address.getAddress();
        return bytes.length == 16 && (bytes[0] & 0xfe) == 0xfc;
    }

    // Both fetchAndUploadVideoFromUrl and validateVideoUrlLightweight used a default RestTemplate,
    // which follows HTTP redirects transparently via HttpURLConnection's default
    // instanceFollowRedirects=true — rejectInternalHost only validated the URL the caller
    // supplied, never where a 3xx chain actually ends up. An attacker-controlled external host
    // redirecting to an internal address (cloud metadata, an internal service) would pass the
    // initial check and then have its response fetched — and in the video-import case, stored in
    // R2 and handed back to the caller as a downloadable "video". This walks the redirect chain
    // manually with redirects disabled at the HTTP layer, re-validating the host on every hop.
    private static final int MAX_IMPORT_REDIRECTS = 5;

    private static class NoRedirectRequestFactory extends SimpleClientHttpRequestFactory {
        @Override
        protected void prepareConnection(java.net.HttpURLConnection connection, String httpMethod) throws IOException {
            super.prepareConnection(connection, httpMethod);
            connection.setInstanceFollowRedirects(false);
        }
    }

    private RestTemplate newNonRedirectingRestTemplate(int connectTimeoutMs, int readTimeoutMs) {
        NoRedirectRequestFactory factory = new NoRedirectRequestFactory();
        factory.setConnectTimeout(connectTimeoutMs);
        factory.setReadTimeout(readTimeoutMs);
        return new RestTemplate(factory);
    }

    /**
     * Resolves urlString to the final URL it actually points to, validating every hop (including
     * the starting URL) against rejectInternalHost, and refusing to follow more than
     * MAX_IMPORT_REDIRECTS hops. Callers must issue their real request against the returned URI
     * using a RestTemplate built the same way (redirects disabled) — never the resolved URI with
     * a redirect-following client, which would reopen this exact gap on a race/second hop.
     */
    private URI resolveSafeRedirectTarget(URI initial, int connectTimeoutMs, int readTimeoutMs) {
        URI current = initial;
        RestTemplate probe = newNonRedirectingRestTemplate(connectTimeoutMs, readTimeoutMs);
        for (int hop = 0; hop <= MAX_IMPORT_REDIRECTS; hop++) {
            rejectInternalHost(current);
            if (hop == MAX_IMPORT_REDIRECTS) {
                throw new IllegalArgumentException("URL redirected too many times");
            }
            org.springframework.http.HttpHeaders requestHeaders = new org.springframework.http.HttpHeaders();
            ResponseEntity<Void> resp;
            try {
                resp = probe.exchange(current, org.springframework.http.HttpMethod.HEAD,
                        new org.springframework.http.HttpEntity<>(requestHeaders), Void.class);
            } catch (org.springframework.web.client.HttpClientErrorException e) {
                if (e.getStatusCode() == org.springframework.http.HttpStatus.METHOD_NOT_ALLOWED) {
                    // Server doesn't support HEAD — current URI is as far as we can safely probe
                    // without downloading; the caller's real GET (also non-redirecting) will
                    // surface any further redirect as an error rather than silently follow it.
                    return current;
                }
                throw e;
            }
            int status = resp.getStatusCodeValue();
            if (status >= 300 && status < 400) {
                String location = resp.getHeaders().getFirst("Location");
                if (location == null || location.isBlank()) {
                    throw new IllegalArgumentException("Redirect response had no Location header");
                }
                current = current.resolve(location);
                continue;
            }
            return current;
        }
        throw new IllegalArgumentException("URL redirected too many times");
    }

    private String normalizeImportUrl(String urlString) {
        String url = urlString != null ? urlString.trim() : "";
        if (url.isEmpty()) throw new IllegalArgumentException("url is required");
        if (!url.startsWith("https://")) throw new IllegalArgumentException("Only https URLs are allowed");
        URI uri = URI.create(url);
        String host = uri.getHost() != null ? uri.getHost().toLowerCase() : "";
        if (!URL_IMPORT_ALLOWED_HOSTS.contains(host)) {
            throw new IllegalArgumentException("Only Google Drive links are supported for upload by link");
        }
        String fileId = extractGoogleDriveFileId(uri);
        if (fileId == null || fileId.isBlank()) {
            throw new IllegalArgumentException("Could not read Google Drive file id from link");
        }
        return "https://drive.google.com/uc?export=download&id=" + fileId;
    }

    private String extractGoogleDriveFileId(URI uri) {
        String path = uri.getPath() != null ? uri.getPath() : "";
        Matcher fileMatcher = Pattern.compile("/file/d/([^/]+)").matcher(path);
        if (fileMatcher.find()) return fileMatcher.group(1);

        Matcher docMatcher = Pattern.compile("/(?:document|presentation|spreadsheets)/d/([^/]+)").matcher(path);
        if (docMatcher.find()) return docMatcher.group(1);

        String query = uri.getRawQuery();
        if (query != null) {
            for (String part : query.split("&")) {
                int idx = part.indexOf('=');
                if (idx <= 0) continue;
                String key = URLDecoder.decode(part.substring(0, idx), StandardCharsets.UTF_8);
                if ("id".equals(key)) {
                    return URLDecoder.decode(part.substring(idx + 1), StandardCharsets.UTF_8);
                }
            }
        }
        return null;
    }

    private void validateDownloadedFile(String typeNorm, String contentType, String extension, long size) {
        String type = typeNorm != null ? typeNorm.trim().toLowerCase() : "generic";
        String ct = contentType != null ? contentType.toLowerCase() : "";
        String ext = extension != null ? extension.toLowerCase() : "";
        switch (type) {
            case "video":
                if (!ct.startsWith("video/") && !ext.matches("\\.(mp4|webm|mov|m4v|avi)$")) {
                    throw new IllegalArgumentException("Video upload requires a video file");
                }
                if (size > maxVideoSizeBytes) throw new IllegalArgumentException("Video file size exceeds maximum allowed");
                break;
            case "lecture":
                if (!ct.equals("application/pdf")
                        && !ct.equals("application/msword")
                        && !ct.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
                        && !ext.matches("\\.(pdf|doc|docx)$")) {
                    throw new IllegalArgumentException("Lecture upload requires PDF or Word document");
                }
                if (size > maxLectureSizeBytes) throw new IllegalArgumentException("Lecture document size exceeds maximum allowed");
                break;
            case "ppt":
                if (!ct.equals("application/vnd.ms-powerpoint")
                        && !ct.equals("application/vnd.openxmlformats-officedocument.presentationml.presentation")
                        && !ext.matches("\\.(ppt|pptx)$")) {
                    throw new IllegalArgumentException("PPT upload requires PPT or PPTX presentation");
                }
                if (size > maxPptSizeBytes) throw new IllegalArgumentException("Presentation size exceeds maximum allowed");
                break;
            case "pdf":
                if (!ct.equals("application/pdf") && !".pdf".equals(ext)) {
                    throw new IllegalArgumentException("PDF upload requires a PDF file");
                }
                if (size > maxPdfSizeBytes) throw new IllegalArgumentException("PDF file size exceeds maximum allowed");
                break;
            case "image":
                if (!ct.startsWith("image/") && !ext.matches("\\.(jpg|jpeg|png|gif|webp)$")) {
                    throw new IllegalArgumentException("Image upload requires an image file");
                }
                // Reject SVG/HTML masquerading as an inline image (streamFile serves image/* inline,
                // so an SVG with <script> would execute same-origin) — mirrors the presign() image branch.
                if ((contentType != null && isDangerousInlineContentType(contentType)) || ext.equals(".svg")) {
                    throw new IllegalArgumentException("This file type is not allowed for upload");
                }
                if (size > maxImageSizeBytes) throw new IllegalArgumentException("Image file size exceeds maximum allowed");
                break;
            case "resume":
                if (!ct.equals("application/pdf")
                        && !ct.equals("application/msword")
                        && !ct.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
                        && !ext.matches("\\.(pdf|doc|docx)$")) {
                    throw new IllegalArgumentException("Resume upload requires a PDF or Word document");
                }
                if (size > maxPdfSizeBytes) throw new IllegalArgumentException("Resume file size exceeds maximum allowed");
                break;
            case "assignment":
            case "generic":
            default:
                if (size > maxGenericSizeBytes) throw new IllegalArgumentException("File size exceeds maximum allowed");
                break;
        }
    }

    private Map<String, Object> fetchAndUploadFileFromUrl(String sourceUrl,
                                                          String tenantPrefix,
                                                          String folder,
                                                          String type,
                                                          UserPrincipal principal,
                                                          Integer lessonContentId) throws IOException {
        String downloadUrl = normalizeImportUrl(sourceUrl);
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(15_000);
        factory.setReadTimeout(Math.max(30, importVideoTimeoutSeconds) * 1000);
        RestTemplate rest = new RestTemplate(factory);
        URI uri = URI.create(downloadUrl);
        ResponseEntity<org.springframework.core.io.Resource> resp = rest.exchange(
                uri,
                org.springframework.http.HttpMethod.GET,
                new org.springframework.http.HttpEntity<>(new org.springframework.http.HttpHeaders()),
                org.springframework.core.io.Resource.class
        );
        if (resp.getBody() == null) throw new IllegalArgumentException("Empty response from URL");

        String contentTypeHeader = resp.getHeaders().getFirst("Content-Type");
        String contentType = contentTypeHeader != null ? contentTypeHeader.split(";")[0].trim().toLowerCase() : "";
        String extension = getExtensionFromFileNameOrContentType(null, contentType);
        if (".bin".equals(extension)) {
            String cd = resp.getHeaders().getFirst("Content-Disposition");
            if (cd != null) {
                Matcher filenameMatcher = Pattern.compile("filename\\*?=(?:UTF-8''|\\\")?([^\\\";]+)").matcher(cd);
                if (filenameMatcher.find()) {
                    extension = getExtensionFromFileNameOrContentType(URLDecoder.decode(filenameMatcher.group(1), StandardCharsets.UTF_8), contentType);
                }
            }
        }

        long maxSize = maxGenericSizeBytes;
        String typeNorm = type != null ? type.trim().toLowerCase() : "generic";
        if ("video".equals(typeNorm)) maxSize = maxVideoSizeBytes;
        else if ("lecture".equals(typeNorm)) maxSize = maxLectureSizeBytes;
        else if ("ppt".equals(typeNorm)) maxSize = maxPptSizeBytes;
        else if ("pdf".equals(typeNorm)) maxSize = maxPdfSizeBytes;
        else if ("image".equals(typeNorm)) maxSize = maxImageSizeBytes;

        byte[] bytes;
        try (InputStream is = resp.getBody().getInputStream()) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            long total = 0;
            int n;
            while ((n = is.read(buf)) != -1) {
                total += n;
                if (total > maxSize) throw new IllegalArgumentException("File size exceeds maximum allowed");
                out.write(buf, 0, n);
            }
            bytes = out.toByteArray();
        }
        validateDownloadedFile(typeNorm, contentType, extension, bytes.length);

        Integer principalId = principal != null ? principal.getId() : null;
        boolean selfOwnedFolder = isSelfOwnedFolder(folder);
        String ownerPart = selfOwnedFolder ? ownerSegment(folder, principal) : "";
        String key = tenantPrefix + "/" + folder + ownerPart + "/" + UUID.randomUUID().toString() + extension;
        String publicUrl;
        if (isPrivateDocFolder(folder)) {
            // Identity documents imported from a link go to the private bucket too, never the public one.
            if (!privateDocsReady()) throw new IllegalArgumentException("Private document storage is not set up yet. Please try again later.");
            privateDocs.upload(key, new java.io.ByteArrayInputStream(bytes), bytes.length, contentType.isBlank() ? null : contentType);
            publicUrl = com._42students.lms.utils.PrivateDocStorage.refOf(key);
        } else {
            r2Storage.uploadFile(key, new java.io.ByteArrayInputStream(bytes));
            publicUrl = r2Storage.getPublicUrl(key);
        }
        Map<String, Object> result = new HashMap<>();
        result.put("key", key);
        result.put("publicUrl", publicUrl);
        result.put("originalName", "imported-file" + extension);
        result.put("size", (long) bytes.length);
        result.put("mimetype", contentType.isBlank() ? "application/octet-stream" : contentType);
        String receiptId = createAssignmentImportReceiptIfNeeded(folder, typeNorm, principal, lessonContentId, key, publicUrl, contentType, bytes.length);
        if (receiptId != null) {
            result.put("uploadReceiptId", receiptId);
        }
        return result;
    }

    private String createAssignmentImportReceiptIfNeeded(String folder,
                                                         String typeNorm,
                                                         UserPrincipal principal,
                                                         Integer lessonContentId,
                                                         String key,
                                                         String publicUrl,
                                                         String contentType,
                                                         long contentLength) {
        if (!"assignments".equals(folder) || !"assignment".equals(typeNorm)) return null;
        if (assignmentUploadReceiptRepository == null || principal == null || principal.getId() == null) return null;
        com._42students.lms.model.AssignmentUploadReceipt receipt = new com._42students.lms.model.AssignmentUploadReceipt();
        receipt.setReceiptId(UUID.randomUUID().toString());
        receipt.setStorageKey(key);
        receipt.setPublicUrl(publicUrl);
        receipt.setFolder(folder);
        receipt.setUploadType(typeNorm);
        receipt.setOwnerUserId(principal.getId());
        receipt.setOwnerUserType(principal.isLearner() ? "LEARNER" : (principal.isFaculty() ? "FACULTY" : "ADMIN"));
        receipt.setLessonContentId(lessonContentId);
        receipt.setDeclaredContentType(contentType);
        receipt.setDeclaredContentLength(contentLength);
        receipt.setActualContentType(contentType);
        receipt.setActualContentLength(contentLength);
        receipt.setExpiresAt(LocalDateTime.now().plusMinutes(PRESIGN_EXPIRY_MINUTES + 30L));
        return assignmentUploadReceiptRepository.save(receipt).getReceiptId();
    }

    /**
     * Fetch URL with timeout and size limit, validate video type, upload to R2. Returns map with key, originalName, size, mimetype.
     */
    private Map<String, Object> fetchAndUploadVideoFromUrl(String urlString, String tenantPrefix) throws IOException {
        int readTimeoutMs = Math.max(30, importVideoTimeoutSeconds) * 1000;
        URI uri = resolveSafeRedirectTarget(URI.create(urlString), 15_000, readTimeoutMs);
        RestTemplate rest = newNonRedirectingRestTemplate(15_000, readTimeoutMs);
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        org.springframework.http.HttpEntity<Void> entity = new org.springframework.http.HttpEntity<>(headers);
        ResponseEntity<org.springframework.core.io.Resource> resp = rest.exchange(uri, org.springframework.http.HttpMethod.GET, entity, org.springframework.core.io.Resource.class);
        // Redirects are disabled on this client — a 3xx here (the target changed between the
        // safety probe above and this real fetch) must be rejected, not silently treated as a
        // normal response with no real content.
        if (resp.getStatusCodeValue() >= 300 && resp.getStatusCodeValue() < 400) {
            throw new IllegalArgumentException("URL redirected unexpectedly during download. Please try again.");
        }
        if (resp.getBody() == null) {
            throw new IllegalArgumentException("Empty response from URL");
        }
        String contentTypeHeader = resp.getHeaders().getFirst("Content-Type");
        String contentType = contentTypeHeader != null ? contentTypeHeader.split(";")[0].trim().toLowerCase() : "";
        String extFromUrl = null;
        try {
            String path = uri.getPath();
            if (path != null && path.contains(".")) {
                String ext = path.substring(path.lastIndexOf(".") + 1).toLowerCase();
                if (SAFE_EXTENSION.matcher("." + ext).matches() && VIDEO_EXTENSIONS.contains(ext)) {
                    extFromUrl = "." + ext;
                }
            }
        } catch (Exception ignored) {}
        String ext = extFromUrl;
        if (ext == null) {
            if (contentType.contains("mp4")) ext = ".mp4";
            else if (contentType.contains("webm")) ext = ".webm";
            else if (contentType.contains("quicktime") || contentType.contains("x-m4v")) ext = ".mov";
            else if (contentType.startsWith("video/")) ext = ".mp4";
            else throw new IllegalArgumentException("URL does not point to a supported video type (mp4, webm, mov). Use a direct link to the video file.");
        }
        if (!contentType.isEmpty() && !contentType.startsWith("video/")) {
            boolean allowed = false;
            for (String p : VIDEO_CONTENT_TYPE_PREFIXES) {
                if (contentType.startsWith(p) || contentType.equals("video/quicktime")) {
                    allowed = true;
                    break;
                }
            }
            if (!allowed && !contentType.contains("octet-stream")) {
                throw new IllegalArgumentException("URL content type is not video. Got: " + contentTypeHeader);
            }
        }
        long maxSize = maxVideoSizeBytes;
        byte[] bytes;
        try (InputStream is = resp.getBody().getInputStream()) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            long total = 0;
            int n;
            while ((n = is.read(buf)) != -1) {
                total += n;
                if (total > maxSize) {
                    throw new IllegalArgumentException("Video size exceeds maximum allowed (" + (maxSize / 1024 / 1024) + " MB)");
                }
                out.write(buf, 0, n);
            }
            bytes = out.toByteArray();
        }
        String key = tenantPrefix + "/lesson-content/" + UUID.randomUUID().toString() + ext;
        r2Storage.uploadFile(key, new java.io.ByteArrayInputStream(bytes));
        String mimetype = contentType.startsWith("video/") ? contentType : "video/mp4";
        if (!mimetype.startsWith("video/")) mimetype = "video/mp4";
        Map<String, Object> result = new HashMap<>();
        result.put("key", key);
        // Video stores a plain public URL like every other direct upload (see presign()) — this
        // import-from-URL path was the one remaining place still handing back only a bare key.
        result.put("publicUrl", r2Storage.getPublicUrl(key));
        result.put("originalName", "imported-video" + ext);
        result.put("size", (long) bytes.length);
        result.put("mimetype", mimetype);
        return result;
    }

    // Content types that render as active/scriptable content when served back inline by
    // streamFile (SVG runs <script> tags; HTML/XHTML is arbitrary markup) — blocked specifically
    // for the assignment/generic upload branch, which otherwise has no content-type restriction.
    private static final java.util.Set<String> DANGEROUS_INLINE_CONTENT_TYPES = java.util.Set.of(
            "image/svg+xml", "text/html", "application/xhtml+xml"
    );

    private boolean isDangerousInlineContentType(String contentType) {
        String normalized = contentType.trim().toLowerCase();
        int semicolon = normalized.indexOf(';');
        if (semicolon >= 0) {
            normalized = normalized.substring(0, semicolon).trim();
        }
        return DANGEROUS_INLINE_CONTENT_TYPES.contains(normalized) || normalized.contains("javascript");
    }

    // Blocklist for the assignment/generic upload branch: this branch legitimately needs to accept
    // a wide range of document/archive formats, so it stays a blocklist (not a full allowlist) —
    // just close the gap that let executable/script file types through with zero enforcement.
    private static final java.util.Set<String> DANGEROUS_EXECUTABLE_EXTENSIONS = java.util.Set.of(
            ".exe", ".bat", ".cmd", ".sh", ".jar", ".msi", ".scr", ".com", ".ps1"
    );

    private static final java.util.Set<String> DANGEROUS_EXECUTABLE_CONTENT_TYPES = java.util.Set.of(
            "application/x-msdownload", "application/x-msdos-program", "application/x-executable",
            "application/x-sh", "application/x-bat", "application/x-msi", "application/java-archive",
            "application/x-powershell", "application/octet-stream-msdownload"
    );

    /**
     * Blocks known-dangerous executable/script file types for uploads (e.g. assignment/generic)
     * that otherwise accept a broad range of file types. Checks both the declared content type and
     * the file name's extension, since either can be spoofed independently by the caller.
     */
    private boolean isDangerousExecutableUpload(String contentType, String fileName) {
        if (contentType != null) {
            String normalized = contentType.trim().toLowerCase();
            int semicolon = normalized.indexOf(';');
            if (semicolon >= 0) {
                normalized = normalized.substring(0, semicolon).trim();
            }
            if (DANGEROUS_EXECUTABLE_CONTENT_TYPES.contains(normalized)) {
                return true;
            }
        }
        if (fileName != null) {
            String lower = fileName.trim().toLowerCase();
            for (String ext : DANGEROUS_EXECUTABLE_EXTENSIONS) {
                if (lower.endsWith(ext)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Validate that the file content matches the expected type by inspecting magic bytes.
     * Supported expectedType values: "pdf", "jpg", "png".
     * Returns null if valid, or an error message string if invalid.
     */
    private String validateMagicBytes(MultipartFile file, String expectedType) {
        try {
            byte[] header;
            try (InputStream is = file.getInputStream()) {
                header = is.readNBytes(8);
            }
            switch (expectedType.toLowerCase()) {
                case "pdf":
                    // %PDF = 0x25 0x50 0x44 0x46
                    if (header.length < 4 ||
                            (header[0] & 0xFF) != 0x25 ||
                            (header[1] & 0xFF) != 0x50 ||
                            (header[2] & 0xFF) != 0x44 ||
                            (header[3] & 0xFF) != 0x46) {
                        return "File content does not match PDF format (invalid magic bytes)";
                    }
                    break;
                case "jpg":
                case "jpeg":
                    // JPEG = 0xFF 0xD8
                    if (header.length < 2 ||
                            (header[0] & 0xFF) != 0xFF ||
                            (header[1] & 0xFF) != 0xD8) {
                        return "File content does not match JPEG format (invalid magic bytes)";
                    }
                    break;
                case "png":
                    // PNG = 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
                    if (header.length < 8 ||
                            (header[0] & 0xFF) != 0x89 ||
                            (header[1] & 0xFF) != 0x50 ||
                            (header[2] & 0xFF) != 0x4E ||
                            (header[3] & 0xFF) != 0x47 ||
                            (header[4] & 0xFF) != 0x0D ||
                            (header[5] & 0xFF) != 0x0A ||
                            (header[6] & 0xFF) != 0x1A ||
                            (header[7] & 0xFF) != 0x0A) {
                        return "File content does not match PNG format (invalid magic bytes)";
                    }
                    break;
                default:
                    // No magic-byte check for unsupported types
                    break;
            }
        } catch (IOException e) {
            return "Could not read file for magic byte validation";
        }
        return null;
    }

    private String getExtensionFromFileNameOrContentType(String fileName, String contentType) {
        if (fileName != null && fileName.contains(".")) {
            String ext = fileName.substring(fileName.lastIndexOf("."));
            if (SAFE_EXTENSION.matcher(ext).matches() && ext.length() <= 10) {
                return ext;
            }
        }
        if (contentType != null) {
            String ct = contentType.toLowerCase();
            if (ct.contains("pdf")) return ".pdf";
            if (ct.contains("jpeg") || ct.contains("jpg")) return ".jpg";
            if (ct.contains("png")) return ".png";
            if (ct.contains("gif")) return ".gif";
            if (ct.contains("webp")) return ".webp";
            if (ct.contains("msword") && !ct.contains("openxml")) return ".doc";
            if (ct.contains("wordprocessingml")) return ".docx";
            if (ct.contains("ms-powerpoint") && !ct.contains("openxml")) return ".ppt";
            if (ct.contains("presentationml")) return ".pptx";
            if (ct.contains("mp4")) return ".mp4";
            if (ct.contains("webm")) return ".webm";
            if (ct.contains("octet-stream")) return ".bin";
        }
        return ".bin";
    }

    /**
     * Upload a file to R2 storage.
     * @param type Optional: "video", "lecture", "ppt", or "pdf" to enforce MIME type and size limit
     * 
     * @param file The file to upload
     * @param folder Optional folder path (query param)
     * @return Response with the public URL of the uploaded file
     */
    @PostMapping(value = "/file/upload", consumes = "multipart/form-data")
    public ResponseEntity<?> uploadFile(
            HttpServletRequest request,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", required = false) String folder,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "courseId", required = false) Integer courseId,
            @RequestParam(value = "classId", required = false) Integer classId,
            @RequestParam(value = "lessonContentId", required = false) Integer lessonContentId,
            @RequestParam(value = "projectId", required = false) String projectId,
            @RequestParam(value = "userId", required = false) Integer userId,
            @RequestParam(value = "collegeId", required = false) Integer collegeId) {
        String typeNorm = type != null ? type.trim() : "";
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal == null) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null),
                    HttpStatus.UNAUTHORIZED
            );
        }
        // Unlike presign() and validateUploadAuthorization(), this endpoint never validated
        // `folder` at all — a caller could upload under any arbitrary folder name. Beyond being
        // inconsistent with the rest of this controller's tenant-scoping, an object stored under a
        // folder not in ALLOWED_FOLDERS becomes permanently unretrievable via /file/download or
        // /file/get, since enforceKeyAccess rejects any folder not in that same allowlist —
        // silent, unrecoverable data loss for the caller.
        if (folder == null || folder.isBlank() || folder.contains("..") || folder.startsWith("/") || folder.contains("//") || !ALLOWED_FOLDERS.contains(folder)) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.BAD_REQUEST.name(), "Folder not allowed", null),
                    HttpStatus.BAD_REQUEST
            );
        }
        String tenantPrefix = "college-branding".equals(folder)
                ? resolveTenantPrefixForCollegeBranding(principal, collegeId)
                : resolveTenantPrefix(principal, request);
        if (tenantPrefix == null) {
            String message = "college-branding".equals(folder)
                    ? "collegeId is required and must reference an existing college"
                    : "Tenant scope is required for uploads. Set org/college scope first.";
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.BAD_REQUEST.name(), message, null),
                    HttpStatus.BAD_REQUEST
            );
        }
        if ("video".equalsIgnoreCase(typeNorm)) {
            String contentType = file.getContentType();
            if (contentType == null || !contentType.toLowerCase().startsWith("video/")) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.BAD_REQUEST.name(), "Video upload requires a video file type", null),
                        HttpStatus.BAD_REQUEST
                );
            }
            if (file.getSize() > maxVideoSizeBytes) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.BAD_REQUEST.name(), "Video file size exceeds maximum allowed", null),
                        HttpStatus.BAD_REQUEST
                );
            }
        }
        if ("lecture".equalsIgnoreCase(typeNorm)) {
            String contentType = file.getContentType();
            if (contentType == null) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.BAD_REQUEST.name(), "Lecture upload requires a document type (PDF or Word)", null),
                        HttpStatus.BAD_REQUEST
                );
            }
            String ct = contentType.toLowerCase();
            boolean allowed = ct.equals("application/pdf")
                    || ct.equals("application/msword")
                    || ct.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
            if (!allowed) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.BAD_REQUEST.name(), "Lecture upload requires PDF or Word document", null),
                        HttpStatus.BAD_REQUEST
                );
            }
            if (file.getSize() > maxLectureSizeBytes) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.BAD_REQUEST.name(), "Lecture document size exceeds maximum allowed", null),
                        HttpStatus.BAD_REQUEST
                );
            }
        }
        if ("ppt".equalsIgnoreCase(typeNorm)) {
            String contentType = file.getContentType();
            if (contentType == null) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.BAD_REQUEST.name(), "PPT upload requires a presentation file (PPT or PPTX)", null),
                        HttpStatus.BAD_REQUEST
                );
            }
            String ct = contentType.toLowerCase();
            boolean allowed = ct.equals("application/vnd.ms-powerpoint")
                    || ct.equals("application/vnd.openxmlformats-officedocument.presentationml.presentation");
            if (!allowed) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.BAD_REQUEST.name(), "PPT upload requires PPT or PPTX presentation", null),
                        HttpStatus.BAD_REQUEST
                );
            }
            if (file.getSize() > maxPptSizeBytes) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.BAD_REQUEST.name(), "Presentation size exceeds maximum allowed", null),
                        HttpStatus.BAD_REQUEST
                );
            }
        }
        if ("pdf".equalsIgnoreCase(typeNorm)) {
            String contentType = file.getContentType();
            if (contentType == null || !"application/pdf".equals(contentType.toLowerCase())) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.BAD_REQUEST.name(), "PDF upload requires a PDF file", null),
                        HttpStatus.BAD_REQUEST
                );
            }
            if (file.getSize() > maxPdfSizeBytes) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.BAD_REQUEST.name(), "PDF file size exceeds maximum allowed", null),
                        HttpStatus.BAD_REQUEST
                );
            }
        }
        // Item 193: this is the actual multipart upload endpoint the resume UI posts to. "resume"
        // had no branch here at all, so it fell straight through to the generic 50MB size-only
        // check below with no content-type restriction whatsoever — any file type could be
        // uploaded as a "resume". Mirrors the "lecture" branch's PDF/Word allowlist above.
        if ("resume".equalsIgnoreCase(typeNorm)) {
            String contentType = file.getContentType();
            if (contentType == null) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.BAD_REQUEST.name(), "Resume upload requires a document type (PDF or Word)", null),
                        HttpStatus.BAD_REQUEST
                );
            }
            String ct = contentType.toLowerCase();
            boolean allowed = ct.equals("application/pdf")
                    || ct.equals("application/msword")
                    || ct.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
            if (!allowed) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.BAD_REQUEST.name(), "Resume upload requires PDF or Word document", null),
                        HttpStatus.BAD_REQUEST
                );
            }
            if (file.getSize() > maxPdfSizeBytes) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.BAD_REQUEST.name(), "Resume file size exceeds maximum allowed", null),
                        HttpStatus.BAD_REQUEST
                );
            }
        }
        // Generic 50 MB size cap for uploads that don't match a specific typed limit above
        if (typeNorm.isEmpty() || "assignment".equalsIgnoreCase(typeNorm) || "generic".equalsIgnoreCase(typeNorm)) {
            if (file.getSize() > 50L * 1024 * 1024) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.BAD_REQUEST.name(), "File too large (max 50 MB)", null),
                        HttpStatus.BAD_REQUEST
                );
            }
        }
        if ("assignments".equals(folder) && "assignment".equalsIgnoreCase(typeNorm)
                && (projectId == null || projectId.isBlank())) {
            if (lessonContentId == null || lessonContentId <= 0) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.BAD_REQUEST.name(), "lessonContentId is required for assignment uploads", null),
                        HttpStatus.BAD_REQUEST
                );
            }
            if (lessonContentsRepository == null) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.SERVICE_UNAVAILABLE.name(), "Assignment verification is not configured", null),
                        HttpStatus.SERVICE_UNAVAILABLE
                );
            }
            com._42students.lms.model.LessonContents lessonContent = lessonContentsRepository.findById(lessonContentId).orElse(null);
            if (lessonContent == null || Boolean.TRUE.equals(lessonContent.getIsDeleted())
                    || lessonContent.getContentType() == null
                    || !lessonContent.getContentType().equalsIgnoreCase("assignment")) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.BAD_REQUEST.name(), "Assignment lesson content not found", null),
                        HttpStatus.BAD_REQUEST
                );
            }
        }
        // Magic byte validation for content types that support it
        {
            String ct = file.getContentType() != null ? file.getContentType().toLowerCase() : "";
            String magicType = null;
            if (ct.equals("application/pdf") || "pdf".equalsIgnoreCase(typeNorm)) {
                magicType = "pdf";
            } else if (ct.equals("image/jpeg")) {
                magicType = "jpg";
            } else if (ct.equals("image/png")) {
                magicType = "png";
            }
            if (magicType != null) {
                String magicError = validateMagicBytes(file, magicType);
                if (magicError != null) {
                    return new ResponseEntity<>(
                            new Response<>(HttpStatus.BAD_REQUEST.name(), magicError, null),
                            HttpStatus.BAD_REQUEST
                    );
                }
            }
        }
        // "assignments" added here to match presign()'s intent — it's shared by course-assignment
        // submissions (learner-authored) and the Projects Resources/Delivery tabs (also
        // learner-writable, gated by validateFolderBinding below). Without it, a learner whose
        // direct-PUT upload fell back to this proxy endpoint (e.g. browser CORS blocked it) got a
        // 403 here even though the same upload would have succeeded via presign().
        boolean learnerAllowedFolder = "profile-images".equals(folder) || "video-intros".equals(folder) || "resumes".equals(folder) || isPrivateDocFolder(folder) || "assignments".equals(folder);
        boolean canUploadLesson = principal.isFaculty() || "ADMIN".equalsIgnoreCase(principal.getUserType());
        if (!learnerAllowedFolder && !canUploadLesson) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.FORBIDDEN.name(), "Only faculty or admin may upload lesson assets", null),
                    HttpStatus.FORBIDDEN
            );
        }
        ResponseEntity<?> bindingError = validateFolderBinding(principal, folder, courseId, classId, projectId, userId);
        if (bindingError != null) return bindingError;
        if (r2Storage == null) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.SERVICE_UNAVAILABLE.name(), "R2 storage is not configured", null),
                    HttpStatus.SERVICE_UNAVAILABLE
            );
        }
        try {
            String extension = getExtensionFromFileNameOrContentType(file.getOriginalFilename(), file.getContentType());
            if (extension == null || extension.isEmpty()) extension = ".bin";
            boolean selfOwnedFolder = "profile-images".equals(folder) || "video-intros".equals(folder) || isPrivateDocFolder(folder) || "resumes".equals(folder);
            String ownerPart = selfOwnedFolder ? ownerSegment(folder, principal) : "";
            String projectPart = "assignments".equals(folder) && projectId != null && !projectId.isBlank()
                    ? "/project-" + resolveProjectUploadId(projectId) : "";
            String key = tenantPrefix + "/" + folder + ownerPart + projectPart + "/" + UUID.randomUUID().toString() + extension;
            String publicUrl;
            if (isPrivateDocFolder(folder)) {
                if (!privateDocsReady()) return privateDocsNotReady();
                privateDocs.upload(key, file.getInputStream(), file.getSize(), file.getContentType());
                publicUrl = com._42students.lms.utils.PrivateDocStorage.refOf(key);
            } else {
                r2Storage.uploadFile(key, file.getInputStream());
                publicUrl = r2Storage.getPublicUrl(key);
            }
            String receiptId = createAssignmentImportReceiptIfNeeded(
                    folder,
                    typeNorm != null ? typeNorm.toLowerCase() : "",
                    principal,
                    lessonContentId,
                    key,
                    publicUrl,
                    file.getContentType(),
                    file.getSize());
            Map<String, Object> data = new HashMap<>();
            data.put("key", key);
            data.put("publicUrl", publicUrl);
            data.put("originalName", file.getOriginalFilename());
            data.put("size", file.getSize());
            data.put("mimetype", file.getContentType());
            if (receiptId != null) {
                data.put("uploadReceiptId", receiptId);
            }
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), data),
                    HttpStatus.OK
            );
        } catch (IOException e) {
            log.error("Error uploading file (tenantPrefix={}, folder={})", tenantPrefix, folder, e);
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.INTERNAL_SERVER_ERROR.name(), "Upload failed", null),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    private void enforceKeyAccess(UserPrincipal principal,
                                  String tenantPrefix,
                                  String fileKey,
                                  Integer learnerIdHint,
                                  Integer courseId,
                                  Integer classId) {
        if (principal == null) throw new org.springframework.security.access.AccessDeniedException("Authentication required");
        if (tenantPrefix == null || tenantPrefix.isBlank()) throw new IllegalArgumentException("Tenant scope is required for file access");
        if (fileKey == null || fileKey.isBlank()) throw new IllegalArgumentException("fileName is required");
        if (isPossiblyUnsafeKey(fileKey)) throw new IllegalArgumentException("Invalid fileName");
        boolean scopedKey = fileKey.startsWith(tenantPrefix + "/");
        String afterTenant = scopedKey ? fileKey.substring((tenantPrefix + "/").length()) : fileKey;
        int firstSlash = afterTenant.indexOf('/');
        String folder = firstSlash >= 0 ? afterTenant.substring(0, firstSlash) : afterTenant;
        if (!ALLOWED_FOLDERS.contains(folder)) throw new org.springframework.security.access.AccessDeniedException("Folder not allowed");
        boolean courseScopedFolder = "lesson-content".equals(folder) || "video-intros".equals(folder);
        boolean legacyAssignmentAsset = !scopedKey && "assignments".equals(folder);
        boolean legacyCourseAsset = !scopedKey && (courseScopedFolder || legacyAssignmentAsset);
        if (!scopedKey && !legacyCourseAsset) throw new org.springframework.security.access.AccessDeniedException("File does not belong to your tenant scope");

        if (courseScopedFolder || legacyAssignmentAsset) {
            // Course assets must be authorized by courseId or classId to prevent IDOR across the tenant.
            if (accessControlService == null) {
                throw new org.springframework.security.access.AccessDeniedException("Access control not configured");
            }
            // SECURITY FIX: courseId/classId here were previously trusted verbatim from the client,
            // and only ever checked as "can this principal access *some* course/class" — never
            // cross-validated against which course/class the requested fileKey actually belongs to.
            // Storage keys are bare random UUIDs (see the upload path) with no course info encoded
            // in them, so any learner/faculty legitimately enrolled in ANY course could stream/
            // download ANY other course's lesson-content file in the same tenant, simply by passing
            // their own legitimate courseId/classId alongside someone else's fileName. Resolve the
            // file's real owning course/class from the lesson_contents row that references it (the
            // common case — the file is attached to published content) and authorize against that
            // instead. Fall back to the client-supplied id only when no such row exists yet, which
            // covers the legitimate pre-save preview of a just-uploaded file that hasn't been
            // attached to a lesson content item via /lesson/contents/create yet.
            Integer resolvedCourseId = null;
            Integer resolvedClassId = null;
            if (lessonContentsRepository != null) {
                List<com._42students.lms.model.LessonContents> owners = lessonContentsRepository.findByContentDataKeyContaining(fileKey);
                if (owners != null && !owners.isEmpty()) {
                    com._42students.lms.model.LessonContents owner = owners.get(0);
                    resolvedCourseId = owner.getCourseId();
                    resolvedClassId = owner.getClassId();
                }
            }
            if (isPositiveId(resolvedClassId)) {
                accessControlService.requireAccessClass(principal, resolvedClassId);
            } else if (isPositiveId(resolvedCourseId)) {
                accessControlService.requireAccessCourse(principal, resolvedCourseId);
            } else if (isPositiveId(courseId)) {
                accessControlService.requireAccessCourse(principal, courseId);
            } else if (isPositiveId(classId)) {
                accessControlService.requireAccessClass(principal, classId);
            } else {
                throw new IllegalArgumentException("courseId or classId required for lesson-content access");
            }
        }

        // "assignments" is shared by course-assignment submissions (no project context) and the
        // Projects Resources/Delivery tabs (project-scoped). /upload/presign already re-verifies
        // active project membership when an "assignments" upload is bound to a projectId (see
        // the projectMemberRepository.existsActiveMembership check above), but that check was
        // never mirrored here: courseScopedFolder is false for "assignments", and
        // legacyAssignmentAsset only covers pre-tenant-prefix legacy keys, so a current-format
        // tenant-scoped assignments key skipped straight past to the "return" below with only the
        // tenant check applied. Any tenant member holding (or guessing) such a key — e.g. a
        // classmate never on the project, or someone removed from it — could download/stream/
        // delete another project's file. Re-derive the owning project from ProjectResource/
        // ProjectDelivery (the only tables that persist these keys) and require the same active
        // membership check /upload/presign enforces at upload time.
        if (scopedKey && "assignments".equals(folder)) {
            java.util.regex.Matcher scopedProjectMatcher = java.util.regex.Pattern
                    .compile("^assignments/project-([0-9]+)/[^/]+$").matcher(afterTenant);
            Integer scopedProjectId = scopedProjectMatcher.matches()
                    ? Integer.valueOf(scopedProjectMatcher.group(1)) : null;
            Integer boundProjectId = resolveAssignmentKeyProjectId(fileKey);
            if (scopedProjectId != null) {
                if (projectWorkspaceRepository == null || projectMemberRepository == null
                        || projectWorkspaceRepository.findActiveById(scopedProjectId).isEmpty()) {
                    throw new org.springframework.security.access.AccessDeniedException("Project file is not available");
                }
                String projectUserType = principal.isLearner() ? "LEARNER" : "FACULTY";
                com._42students.lms.model.ProjectMember scopedMember = projectMemberRepository
                        .findByProjectAndUserAndType(scopedProjectId, principal.getId(), projectUserType)
                        .filter(member -> !Boolean.TRUE.equals(member.getIsDeleted()))
                        .filter(member -> member.getMemberStatus() == null || member.getMemberStatus().isBlank()
                                || "ACTIVE".equalsIgnoreCase(member.getMemberStatus().trim()))
                        .orElse(null);
                if (scopedMember == null || (boundProjectId != null && !scopedProjectId.equals(boundProjectId))) {
                    throw new org.springframework.security.access.AccessDeniedException("Project file is not available to you");
                }
                if (boundProjectId == null) boundProjectId = scopedProjectId;
            }
            if (boundProjectId != null) {
                // Membership is necessary but not sufficient: a cached project file key
                // must not bypass a disabled Projects module via get/download/stream/delete.
                // Resolve the target project, not a user-provided college hint. A project's
                // college flag AND the caller's narrower effective flag must allow access.
                if (projectWorkspaceRepository == null) {
                    throw new org.springframework.security.access.AccessDeniedException("Project file authorization unavailable");
                }
                com._42students.lms.model.ProjectWorkspace targetProject = projectWorkspaceRepository
                        .findActiveById(boundProjectId)
                        .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Project file is not available"));
                featureFlagService.requireEnabledForCollege("module.projects.enabled", targetProject.getCollegeId());
                featureFlagService.requireEnabled("module.projects.enabled", principal, null);
                if (projectMemberRepository == null) {
                    throw new org.springframework.security.access.AccessDeniedException("Access control not configured");
                }
                String projectUserType = principal.isLearner() ? "LEARNER" : "FACULTY";
                com._42students.lms.model.ProjectMember member = projectMemberRepository
                        .findByProjectAndUserAndType(boundProjectId, principal.getId(), projectUserType)
                        .filter(row -> !Boolean.TRUE.equals(row.getIsDeleted()))
                        .filter(row -> row.getMemberStatus() == null || row.getMemberStatus().isBlank()
                                || "ACTIVE".equalsIgnoreCase(row.getMemberStatus().trim()))
                        .orElse(null);
                if (member == null) {
                    throw new org.springframework.security.access.AccessDeniedException("You are not an active member of this project");
                }
                // SECURITY: project membership alone isn't enough for a Resources-tab file — the
                // Resources LIST already hides "Mentor Only" rows from learners via
                // canViewResource/isLearnerVisible, but this endpoint (unlike the removed
                // resource-id download route) never re-checked visibility, so any learner member
                // who had ever seen/cached the raw key (before a toggle to Mentor Only, or via
                // dev tools) could keep fetching it forever, bypassing the list's own gate.
                if (principal.isLearner() && projectResourceRepository != null) {
                    List<com._42students.lms.model.ProjectResource> matches = projectResourceRepository.findActiveByFileKeySuffix(fileKey);
                    boolean mentorOnly = matches.stream().anyMatch(r -> {
                        String v = r.getVisibility();
                        if (v == null) return false;
                        String normalized = v.trim().toLowerCase(java.util.Locale.ROOT);
                        return normalized.equals("mentor") || normalized.contains("mentor only");
                    });
                    if (mentorOnly) {
                        throw new org.springframework.security.access.AccessDeniedException("This resource is not available to you");
                    }
                }
            }
            // boundProjectId == null: this key isn't referenced by any ProjectResource/
            // ProjectDelivery row. The common case here is a plain, non-project course-assignment
            // submission — which, until now, fell through with only the tenant check applied: any
            // authenticated same-college user (any other student, not just faculty) who obtained
            // the key could stream/download/delete another student's submission. Resolve the
            // owning StudentAssignment the same way the lesson-content branch above resolves its
            // owning course/class, and require either the submitting student themselves, or
            // faculty/admin with real access to that assignment's class/course.
            else if (studentAssignmentRepository != null) {
                List<com._42students.lms.model.StudentAssignment> owners = studentAssignmentRepository.findByFileKeyContaining(fileKey);
                if (!owners.isEmpty()) {
                    com._42students.lms.model.StudentAssignment owner = owners.get(0);
                    boolean isOwningStudent = principal.getId() != null && principal.getId() == owner.getStudentId();
                    if (!isOwningStudent) {
                        if (accessControlService == null) {
                            throw new org.springframework.security.access.AccessDeniedException("Access control not configured");
                        }
                        com._42students.lms.model.LessonContents lessonContent = lessonContentsRepository != null
                                ? lessonContentsRepository.getLessonContents(owner.getLessonContentId())
                                : null;
                        if (lessonContent != null && isPositiveId(lessonContent.getClassId())) {
                            accessControlService.requireAccessClass(principal, lessonContent.getClassId());
                        } else if (lessonContent != null && isPositiveId(lessonContent.getCourseId())) {
                            accessControlService.requireAccessCourse(principal, lessonContent.getCourseId());
                        } else {
                            // No resolvable class/course to authorize against and the caller
                            // isn't the submitting student — fail closed rather than let a
                            // same-tenant stranger through.
                            throw new org.springframework.security.access.AccessDeniedException("Access denied to this submission");
                        }
                    }
                }
                // No StudentAssignment match either: an orphaned/superseded key, or a file that
                // was never actually attached to a submission row. Fall through unchanged, same
                // as the boundProjectId==null case above — there's nothing left to check against.
            }
        }

        boolean selfOwnedFolder = "profile-images".equals(folder) || "resumes".equals(folder) || isPrivateDocFolder(folder);
        if (isPrivateDocFolder(folder)) {
            Matcher fm = FACULTY_SEGMENT_PATTERN.matcher(afterTenant);
            if (fm.find()) {
                // A staff member's own document: only them, a college admin of this college (the key is already inside the caller's
                // tenant) or a super admin.
                Integer facultyId = Integer.valueOf(fm.group(2));
                boolean self = principal.isFaculty() && facultyId.equals(principal.getId());
                boolean admin = accessControlService != null && (accessControlService.isSuperAdmin(principal)
                        || ("FACULTY".equalsIgnoreCase(principal.getUserType()) && "ADMIN".equalsIgnoreCase(principal.getFacultyType())));
                if (!self && !admin) throw new org.springframework.security.access.AccessDeniedException("Identity documents are restricted to their owner and college administrators");
                return;
            }
        }
        if (selfOwnedFolder) {
            Matcher m = USER_SEGMENT_PATTERN.matcher(afterTenant);
            Integer learnerIdInKey = null;
            if (m.find()) {
                try {
                    learnerIdInKey = Integer.parseInt(m.group(2));
                } catch (NumberFormatException ignored) {
                    learnerIdInKey = null;
                }
            }
            Integer effectiveLearnerId = learnerIdInKey != null ? learnerIdInKey : learnerIdHint;
            if (!isPositiveId(effectiveLearnerId)) {
                throw new IllegalArgumentException("userId is required for access to this file");
            }
            if (accessControlService != null) {
                accessControlService.requireAccessLearner(principal, effectiveLearnerId);
            } else if (principal.isLearner() && (principal.getId() == null || !principal.getId().equals(effectiveLearnerId))) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied to this learner");
            }
            // requireAccessLearner above collapses to a bare college match for any FACULTY
            // principal, so on its own it let every teacher and mentor in the college download a
            // student's Aadhaar/PAN scans. Identity documents follow the same rule as the identity
            // numbers themselves (LearnerProfileController.requireIdentityAccess): the owner, a
            // college admin, or a super-admin — teaching a student is not a reason to hold their
            // national ID. Left deliberately narrower than profile-images/resumes, which stay on
            // the ordinary scope check.
            if (isPrivateDocFolder(folder)) {
                // user-<id> is a student's id: a staff member with the same number is not the owner.
                boolean isOwner = principal.isLearner() && principal.getId() != null && principal.getId().equals(effectiveLearnerId);
                boolean isAdmin = accessControlService != null
                        && (accessControlService.isSuperAdmin(principal)
                            || ("FACULTY".equalsIgnoreCase(principal.getUserType())
                                && "ADMIN".equalsIgnoreCase(principal.getFacultyType())));
                // A placement cell admin the college allows to verify profiles opens what they verify (the learner's college
                // was already checked by requireAccessLearner above).
                if (!isAdmin && profileVerificationService != null && principal.getCollegeId() != null) {
                    isAdmin = profileVerificationService.canVerifyAt(principal, principal.getCollegeId());
                }
                if (!isOwner && !isAdmin) {
                    throw new org.springframework.security.access.AccessDeniedException(
                            "Identity documents are restricted to the learner and college administrators");
                }
            }
            if (learnerIdInKey != null && !learnerIdInKey.equals(effectiveLearnerId)) {
                throw new org.springframework.security.access.AccessDeniedException("File ownership mismatch");
            }
        }
    }

    // Looks up which project (if any) owns a tenant-scoped "assignments"-folder key, by checking
    // the two tables that persist such keys: ProjectResource (Resources tab) and ProjectDelivery
    // (submissions, including its attachments list). Returns null when the key isn't referenced
    // by either — see the fall-through comment at the call site in enforceKeyAccess.
    private Integer resolveAssignmentKeyProjectId(String fileKey) {
        if (projectResourceRepository != null) {
            List<Integer> fromResources = projectResourceRepository.findActiveProjectIdsByFileKeySuffix(fileKey);
            if (fromResources != null && !fromResources.isEmpty()) {
                return fromResources.get(0);
            }
        }
        if (projectDeliveryRepository != null) {
            List<Integer> fromDeliveries = projectDeliveryRepository.findActiveProjectIdsByFileKeySuffix(fileKey);
            if (fromDeliveries != null && !fromDeliveries.isEmpty()) {
                return fromDeliveries.get(0);
            }
        }
        return null;
    }

    private String normalizeStorageKey(String fileName) {
        if (fileName == null) return null;
        String key = fileName.trim();
        if (key.isEmpty()) return key;
        if (com._42students.lms.utils.PrivateDocStorage.isRef(key)) return com._42students.lms.utils.PrivateDocStorage.keyOf(key);
        if (key.startsWith("http://") || key.startsWith("https://")) {
            try {
                URI uri = URI.create(key);
                key = uri.getPath() != null ? uri.getPath() : "";
            } catch (Exception ignored) {
                int schemeIdx = key.indexOf("://");
                int pathIdx = schemeIdx >= 0 ? key.indexOf('/', schemeIdx + 3) : -1;
                key = pathIdx >= 0 ? key.substring(pathIdx) : "";
            }
        }
        while (key.startsWith("/")) key = key.substring(1);
        String bucketPrefix = "storagelms/";
        if (key.startsWith(bucketPrefix)) key = key.substring(bucketPrefix.length());
        int queryIdx = key.indexOf('?');
        if (queryIdx >= 0) key = key.substring(0, queryIdx);
        return key;
    }

    /** A signed link to one private document (the access check already ran), or an error response. */
    private ResponseEntity<?> privateDocLink(String fileKey) {
        if (folderOfKey(fileKey) == null) {
            return new ResponseEntity<>(new Response<>(HttpStatus.BAD_REQUEST.name(), "Not a private document", null), HttpStatus.BAD_REQUEST);
        }
        if (!privateDocsReady()) return privateDocsNotReady();
        if (!privateDocs.exists(fileKey)) {
            return new ResponseEntity<>(new Response<>(HttpStatus.NOT_FOUND.name(), "File not found", null), HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), privateDocs.presignedGet(fileKey)), HttpStatus.OK);
    }

    /**
     * Get a presigned/public URL for a file.
     * 
     * @param fileName The file key/name in R2
     * @return Response with the file URL
     */
    @GetMapping(value = "/file/download")
    public ResponseEntity<?> downloadFile(HttpServletRequest request,
                                          @RequestParam("fileName") String fileName,
                                          @RequestParam(value = "userId", required = false) Integer userId,
                                          @RequestParam(value = "courseId", required = false) Integer courseId,
                                          @RequestParam(value = "classId", required = false) Integer classId) {
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal == null) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null),
                    HttpStatus.UNAUTHORIZED
            );
        }
        String tenantPrefix = resolveTenantPrefix(principal, request);
        if (r2Storage == null) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.SERVICE_UNAVAILABLE.name(), "R2 storage is not configured", null),
                    HttpStatus.SERVICE_UNAVAILABLE
            );
        }
        try {
            String fileKey = normalizeStorageKey(fileName);
            enforceKeyAccess(principal, tenantPrefix, fileKey, userId, courseId, classId);
            if (com._42students.lms.utils.PrivateDocStorage.isRef(fileName)) {
                ResponseEntity<?> priv = privateDocLink(fileKey);
                if (priv != null) return priv;
            }
            if (!r2Storage.fileExists(fileKey)) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.NOT_FOUND.name(), "File not found", null),
                        HttpStatus.NOT_FOUND
                );
            }
            String fileUrl = r2Storage.getPublicUrl(fileKey);
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), fileUrl),
                    HttpStatus.OK
            );
        } catch (org.springframework.security.access.AccessDeniedException e) {
            // Not allowed is an answer, not a server error (and not an ERROR line in the logs).
            return new ResponseEntity<>(new Response<>(HttpStatus.FORBIDDEN.name(), e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error getting file URL (fileName={})", redactIfSignedUrl(fileName), e);
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.INTERNAL_SERVER_ERROR.name(), "Failed to get file URL", null),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Check if a file exists and get its public URL.
     * 
     * @param fileName The file key/name in R2
     * @return Response with the file URL if it exists
     */
    @GetMapping(value = "/file/get")
    public ResponseEntity<?> getFile(HttpServletRequest request,
                                     @RequestParam("fileName") String fileName,
                                     @RequestParam(value = "userId", required = false) Integer userId,
                                     @RequestParam(value = "courseId", required = false) Integer courseId,
                                     @RequestParam(value = "classId", required = false) Integer classId) {
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal == null) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null),
                    HttpStatus.UNAUTHORIZED
            );
        }
        String tenantPrefix = resolveTenantPrefix(principal, request);
        if (r2Storage == null) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.SERVICE_UNAVAILABLE.name(), "R2 storage is not configured", null),
                    HttpStatus.SERVICE_UNAVAILABLE
            );
        }
        try {
            String fileKey = normalizeStorageKey(fileName);
            enforceKeyAccess(principal, tenantPrefix, fileKey, userId, courseId, classId);
            if (com._42students.lms.utils.PrivateDocStorage.isRef(fileName)) {
                ResponseEntity<?> priv = privateDocLink(fileKey);
                if (priv != null) return priv;
            }
            if (!r2Storage.fileExists(fileKey)) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.NOT_FOUND.name(), "File not found", null),
                        HttpStatus.NOT_FOUND
                );
            }
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), 
                            r2Storage.getPublicUrl(fileKey)),
                    HttpStatus.OK
            );
        } catch (org.springframework.security.access.AccessDeniedException e) {
            // Not allowed is an answer, not a server error (and not an ERROR line in the logs).
            return new ResponseEntity<>(new Response<>(HttpStatus.FORBIDDEN.name(), e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error getting file (fileName={})", redactIfSignedUrl(fileName), e);
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.INTERNAL_SERVER_ERROR.name(), "Failed to get file", null),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Streams a file through the backend (same-origin) to avoid browser CORS limitations when accessing R2 directly.
     * This endpoint enforces tenant + scope checks via {@link #enforceKeyAccess}.
     */
    @GetMapping(value = "/file/stream")
    public ResponseEntity<Resource> streamFile(HttpServletRequest request,
                                               @RequestParam("fileName") String fileName,
                                               @RequestParam(value = "userId", required = false) Integer userId,
                                               @RequestParam(value = "courseId", required = false) Integer courseId,
                                               @RequestParam(value = "classId", required = false) Integer classId) {
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal == null) return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        String tenantPrefix = resolveTenantPrefix(principal, request);
        if (r2Storage == null) return new ResponseEntity<>(HttpStatus.SERVICE_UNAVAILABLE);

        try {
            String fileKey = normalizeStorageKey(fileName);
            enforceKeyAccess(principal, tenantPrefix, fileKey, userId, courseId, classId);
            boolean priv = com._42students.lms.utils.PrivateDocStorage.isRef(fileName);
            if (priv) {
                if (folderOfKey(fileKey) == null) return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
                if (!privateDocsReady()) return new ResponseEntity<>(HttpStatus.SERVICE_UNAVAILABLE);
                if (!privateDocs.exists(fileKey)) return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            } else if (!r2Storage.fileExists(fileKey)) return new ResponseEntity<>(HttpStatus.NOT_FOUND);

            com.amazonaws.services.s3.model.S3Object object = priv ? privateDocs.download(fileKey) : r2Storage.downloadFile(fileKey);
            if (object == null || object.getObjectContent() == null) return new ResponseEntity<>(HttpStatus.NOT_FOUND);

            InputStreamResource resource = new InputStreamResource(object.getObjectContent());

            String contentType = object.getObjectMetadata() != null ? object.getObjectMetadata().getContentType() : null;
            MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
            if (contentType != null && !contentType.trim().isEmpty()) {
                try {
                    mediaType = MediaType.parseMediaType(contentType);
                } catch (Exception ignored) {
                    mediaType = MediaType.APPLICATION_OCTET_STREAM;
                }
            }

            String safeName = fileKey;
            int lastSlash = safeName.lastIndexOf('/');
            if (lastSlash >= 0 && lastSlash < safeName.length() - 1) safeName = safeName.substring(lastSlash + 1);
            safeName = safeName.replace("\"", "");

            String disposition = object.getObjectMetadata() != null ? object.getObjectMetadata().getContentDisposition() : null;
            if (disposition == null || disposition.trim().isEmpty()) {
                // Defense-in-depth alongside the upload-time content-type block above: even if a
                // dangerous type somehow ended up stored (e.g. an object uploaded before that
                // check existed, or via a path outside this presign flow), never serve it inline —
                // SVG matches the "image" wildcard below but can carry a <script> payload that
                // would execute same-origin if rendered inline.
                boolean dangerousInline = isDangerousInlineContentType(mediaType.toString());
                boolean inline = !dangerousInline && (mediaType.getType().equalsIgnoreCase("image")
                        || mediaType.getType().equalsIgnoreCase("video")
                        || mediaType.equals(MediaType.APPLICATION_PDF));
                disposition = (inline ? "inline" : "attachment") + "; filename=\"" + safeName + "\"";
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CACHE_CONTROL, "no-store")
                    .header(HttpHeaders.PRAGMA, "no-cache")
                    // The Content-Type served here for direct-presigned-PUT uploads is whatever
                    // the client declared at upload time, not independently verified against the
                    // actual bytes — nosniff stops a browser from ignoring that declared type and
                    // re-sniffing the body as something renderable (e.g. HTML) if the two disagree.
                    .header("X-Content-Type-Options", "nosniff")
                    .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                    .contentType(mediaType)
                    .body(resource);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error streaming file (fileName={})", redactIfSignedUrl(fileName), e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete a file from R2 storage. Scope-bound: lesson-content/video-intros require courseId or classId; profile-images/resumes require userId matching principal.
     *
     * @param fileName The file key/name to delete
     * @param courseId Required when key is under lesson-content/ or video-intros/ (course scope)
     * @param classId  Alternative to courseId when key is under lesson-content/ or video-intros/ (class scope)
     * @param userId   Required when key is under profile-images/ or resumes/ (must match principal)
     */
    @DeleteMapping(value = "/file/delete")
    public ResponseEntity<?> deleteFile(
            HttpServletRequest request,
            @RequestParam("fileName") String fileName,
            @RequestParam(value = "courseId", required = false) Integer courseId,
            @RequestParam(value = "classId", required = false) Integer classId,
            @RequestParam(value = "userId", required = false) Integer userId,
            @RequestParam(value = "collegeId", required = false) Integer collegeId) {
        if (securityContextUtil == null) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.SERVICE_UNAVAILABLE.name(), "Auth not configured", null),
                    HttpStatus.SERVICE_UNAVAILABLE);
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null),
                    HttpStatus.UNAUTHORIZED);
        }
        // Try college-branding resolution first when collegeId is supplied — covers both a global
        // superadmin (no tenant scope of their own) and an org/college-scoped superadmin deleting a
        // branding asset for a *different* college within their scope, which resolveTenantPrefix's
        // own-scope-only resolution can't express.
        String tenantPrefix = collegeId != null ? resolveTenantPrefixForCollegeBranding(principal, collegeId) : null;
        if (tenantPrefix == null) {
            tenantPrefix = resolveTenantPrefix(principal, request);
        }
        if (tenantPrefix == null) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.BAD_REQUEST.name(), "Tenant scope is required for file delete. Set org/college scope first.", null),
                    HttpStatus.BAD_REQUEST
            );
        }
        String key = normalizeStorageKey(fileName);
        if (key == null || key.isEmpty() || isPossiblyUnsafeKey(key) || !key.startsWith(tenantPrefix + "/")) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.FORBIDDEN.name(), "File does not belong to your tenant scope", null),
                    HttpStatus.FORBIDDEN
            );
        }

        String afterTenant = key.substring((tenantPrefix + "/").length());
        int firstSlash = afterTenant.indexOf('/');
        String folder = firstSlash >= 0 ? afterTenant.substring(0, firstSlash) : afterTenant;

        if ("lesson-content".equals(folder) || "video-intros".equals(folder)) {
            if (accessControlService == null) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.SERVICE_UNAVAILABLE.name(), "Access control is not configured", null),
                        HttpStatus.SERVICE_UNAVAILABLE);
            }
            if (isPositiveId(courseId)) {
                accessControlService.requireAccessCourse(principal, courseId);
            } else if (isPositiveId(classId)) {
                accessControlService.requireAccessClass(principal, classId);
            } else {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.BAD_REQUEST.name(), "courseId or classId required for lesson/video keys", null),
                        HttpStatus.BAD_REQUEST);
            }
        } else if (isPrivateDocFolder(folder)) {
            // Identity documents and marksheets: the same rule as opening one (enforceKeyAccess), and only the owner or an admin
            // may delete (a placement cell verifier can open a document, never remove it).
            try {
                enforceKeyAccess(principal, tenantPrefix, key, userId, null, null);
            } catch (org.springframework.security.access.AccessDeniedException e) {
                return new ResponseEntity<>(new Response<>(HttpStatus.FORBIDDEN.name(), "You may only delete your own documents", null), HttpStatus.FORBIDDEN);
            } catch (IllegalArgumentException e) {
                return new ResponseEntity<>(new Response<>(HttpStatus.BAD_REQUEST.name(), e.getMessage(), null), HttpStatus.BAD_REQUEST);
            }
            Matcher um = USER_SEGMENT_PATTERN.matcher(afterTenant);
            Matcher fm = FACULTY_SEGMENT_PATTERN.matcher(afterTenant);
            boolean owner = (principal.isLearner() && um.find() && String.valueOf(principal.getId()).equals(um.group(2)))
                    || (principal.isFaculty() && fm.find() && String.valueOf(principal.getId()).equals(fm.group(2)));
            boolean admin = accessControlService != null && (accessControlService.isSuperAdmin(principal)
                    || ("FACULTY".equalsIgnoreCase(principal.getUserType()) && "ADMIN".equalsIgnoreCase(principal.getFacultyType())));
            if (!owner && !admin) {
                return new ResponseEntity<>(new Response<>(HttpStatus.FORBIDDEN.name(), "You may only delete your own documents", null), HttpStatus.FORBIDDEN);
            }
        } else if ("profile-images".equals(folder) || "resumes".equals(folder)) {
            Matcher m = USER_SEGMENT_PATTERN.matcher(afterTenant);
            Integer learnerIdInKey = null;
            if (m.find()) {
                try {
                    learnerIdInKey = Integer.parseInt(m.group(2));
                } catch (NumberFormatException ignored) {
                    learnerIdInKey = null;
                }
            }
            Integer effectiveLearnerId = learnerIdInKey != null ? learnerIdInKey : userId;
            if (!isPositiveId(effectiveLearnerId)) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.BAD_REQUEST.name(), "userId is required for deleting this file", null),
                        HttpStatus.BAD_REQUEST);
            }
            if (accessControlService != null) {
                accessControlService.requireAccessLearner(principal, effectiveLearnerId);
            } else if (principal.isLearner() && (principal.getId() == null || !principal.getId().equals(effectiveLearnerId))) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.FORBIDDEN.name(), "You may only delete your own files", null),
                        HttpStatus.FORBIDDEN);
            }
            if (learnerIdInKey != null && !learnerIdInKey.equals(effectiveLearnerId)) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.FORBIDDEN.name(), "File ownership mismatch", null),
                        HttpStatus.FORBIDDEN);
            }
        } else if ("assignments".equals(folder)) {
            // "assignments" is shared by course-assignment submissions (no project context) and the
            // Projects Resources/Delivery tabs (project-scoped). Previously this branch had no
            // additional check at all — unlike enforceKeyAccess (used by download/stream/get), which
            // re-derives the owning project from ProjectResource/ProjectDelivery and requires active
            // project membership. That meant any same-tenant user holding (or guessing) an
            // "assignments" key could delete another project's file with zero ownership check.
            // Mirror enforceKeyAccess's project-membership check here.
            Integer boundProjectId = resolveAssignmentKeyProjectId(key);
            if (boundProjectId != null) {
                if (projectMemberRepository == null) {
                    return new ResponseEntity<>(
                            new Response<>(HttpStatus.SERVICE_UNAVAILABLE.name(), "Access control not configured", null),
                            HttpStatus.SERVICE_UNAVAILABLE);
                }
                String projectUserType = principal.isLearner() ? "LEARNER" : "FACULTY";
                if (!projectMemberRepository.existsActiveMembership(boundProjectId, principal.getId(), projectUserType)) {
                    return new ResponseEntity<>(
                            new Response<>(HttpStatus.FORBIDDEN.name(), "You are not a member of this project", null),
                            HttpStatus.FORBIDDEN);
                }
            }
            // boundProjectId == null: this key isn't referenced by any ProjectResource/ProjectDelivery
            // row (e.g. a plain, non-project course-assignment submission). Fall through unchanged,
            // mirroring enforceKeyAccess.
        } else if ("course-images".equals(folder)) {
            // Previously this folder had NO branch here at all — course-images IS in
            // ALLOWED_FOLDERS, so it skipped the "folder not allowed" catch-all below too and
            // fell straight through to the delete with only the tenant-prefix check applied.
            // Course thumbnails are rendered as plain public <img src> on every course listing
            // page, so the key is visible in page source to any authenticated user at the
            // college — including a learner, who could delete any other course's image with
            // nothing to stop them. Resolve the actual owning course (if any) and require real
            // course access, same pattern as the lesson-content/assignments branches above.
            if (accessControlService == null) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.SERVICE_UNAVAILABLE.name(), "Access control is not configured", null),
                        HttpStatus.SERVICE_UNAVAILABLE);
            }
            if (principal.isLearner()) {
                return new ResponseEntity<>(
                        new Response<>(HttpStatus.FORBIDDEN.name(), "Learners cannot delete course images", null),
                        HttpStatus.FORBIDDEN);
            }
            if (courseRepository != null) {
                List<com._42students.lms.model.Course> owners = courseRepository.findByContentsKeyContaining(key);
                if (!owners.isEmpty()) {
                    accessControlService.requireAccessCourse(principal, owners.get(0).getId());
                }
                // No owning course found: an orphaned/superseded key, or an image uploaded but
                // never actually attached to a course record yet. Nothing further to check —
                // the learner-block above is still the real gate in that case.
            }
        } else if (!ALLOWED_FOLDERS.contains(folder)) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.FORBIDDEN.name(), "Folder not allowed", null),
                    HttpStatus.FORBIDDEN);
        }
        if (r2Storage == null) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.SERVICE_UNAVAILABLE.name(), "R2 storage is not configured", null),
                    HttpStatus.SERVICE_UNAVAILABLE
            );
        }
        try {
            if (com._42students.lms.utils.PrivateDocStorage.isRef(fileName)) {
                if (!isPrivateDocFolder(folder)) {
                    return new ResponseEntity<>(new Response<>(HttpStatus.BAD_REQUEST.name(), "Not a private document", null), HttpStatus.BAD_REQUEST);
                }
                if (!privateDocsReady()) return privateDocsNotReady();
                privateDocs.delete(key);
            } else {
                r2Storage.deleteFile(key);
            }
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.OK.name(), "File deleted successfully", null),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            log.error("Error deleting file (fileName={})", redactIfSignedUrl(fileName), e);
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.INTERNAL_SERVER_ERROR.name(), "Delete failed", null),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}

