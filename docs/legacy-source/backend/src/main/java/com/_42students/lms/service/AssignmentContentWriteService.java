package com._42students.lms.service;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.AssignmentResourceDTO;
import com._42students.lms.dto.request.ContentDataDTO;
import com._42students.lms.dto.request.FileDTO;
import com._42students.lms.dto.request.LessonContentsDTO;
import com._42students.lms.enums.ContentType;
import com._42students.lms.model.Lesson;
import com._42students.lms.model.LessonContents;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.repository.LessonContentsRepository;
import com._42students.lms.repository.SemesterCourseRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import com._42students.lms.utils.ContentUrlValidator;
import com._42students.lms.utils.R2StorageUtils;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.Objects;

/** Dedicated assignment write path. The generic lesson-content pipeline deliberately excludes ASSIGNMENT. */
@Service
public class AssignmentContentWriteService {
    private static final Set<String> RESOURCE_TYPES = Set.of("INSTRUCTIONS", "PDF", "FILE", "LINK");
    private static final Set<String> SUBMISSION_TYPES = Set.of(
            "WRITTEN_RESPONSE", "PDF_UPLOAD", "FILE_UPLOAD", "REPOSITORY_LINK", "EXTERNAL_LINK");
    private static final int MAX_RESOURCES = 30;

    private final LessonContentsRepository contents;
    private final LessonService lessons;
    private final AccessControlService access;
    private final ScopeResolutionService scopes;
    private final FacultyTeachingAssignmentRepository teaching;
    private final SemesterCourseRepository semesterCourses;
    private final SecurityContextUtil security;
    private final ContentUrlValidator urls;

    @Autowired(required = false)
    private R2StorageUtils storage;

    @Autowired
    private com._42students.lms.repository.StudentAssignmentRepository studentAssignments;

    @Value("${upload.pdf.max-size-bytes:52428800}")
    private long maxPdfBytes;
    @Value("${upload.lecture.max-size-bytes:52428800}")
    private long maxAttachmentBytes;

    public AssignmentContentWriteService(LessonContentsRepository contents, LessonService lessons,
                                         AccessControlService access, ScopeResolutionService scopes,
                                         FacultyTeachingAssignmentRepository teaching,
                                         SemesterCourseRepository semesterCourses,
                                         SecurityContextUtil security, ContentUrlValidator urls) {
        this.contents = contents;
        this.lessons = lessons;
        this.access = access;
        this.scopes = scopes;
        this.teaching = teaching;
        this.semesterCourses = semesterCourses;
        this.security = security;
        this.urls = urls;
    }

    private static ResponseStatusException invalid(String reason) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, reason);
    }

    private void checkAccess(UserPrincipal principal, Integer courseId, Integer classId,
                             Integer collegeId, boolean requireCurrentTarget) {
        if (collegeId == null || !access.canAccessCollege(principal, collegeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Course is outside your college scope");
        }
        access.requireAccessCourse(principal, courseId);
        if (classId != null && classId > 0) {
            access.requireAccessClass(principal, classId);
            Integer classCollege = scopes.resolveClassToCollegeId(classId);
            if (!collegeId.equals(classCollege)) throw invalid("Class and course must belong to the same college");
            if (requireCurrentTarget) {
                access.requireCurrentCourseAudienceClass(classId, courseId);
            }
        }
        if (!principal.isFaculty() || access.isSuperAdmin(principal)
                || "ADMIN".equalsIgnoreCase(principal.getFacultyType())) return;
        if (principal.getId() == null || classId == null || classId <= 0 ||
                !teaching.existsByFacultyIdAndCourseIdAndClassIdAndIsActive(
                        principal.getId(), courseId, classId, true)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Faculty is not assigned to this course/class");
        }
    }

    private void validateFile(FileDTO file, String type, Integer collegeId, Integer orgId,
                              LessonContents existing) {
        if (file == null || file.getCloudStorageObject() == null || file.getCloudStorageObject().isBlank()) {
            throw invalid("Attachment upload is incomplete");
        }
        String source = file.getCloudStorageObject().trim();
        String key = source.contains("://") ? urls.urlToKey(source) : source;
        if (key == null || key.isBlank() || key.contains("..") || key.contains("\\") || key.contains("?")
                || key.contains("#") || key.startsWith("/") || key.contains("://")) {
            throw invalid("Invalid attachment storage key");
        }
        // Legacy assignment files may have a different key prefix. Only unchanged files on the
        // same authenticated, course-scoped assignment may retain that historical reference.
        boolean unchangedLegacy = existing != null && existing.getContentDataDTO() != null
                && existing.getContentDataDTO().getAssignmentResources() != null
                && existing.getContentDataDTO().getAssignmentResources().stream().anyMatch(r ->
                    r != null && r.getFileDTO() != null
                    && Objects.equals(source, r.getFileDTO().getCloudStorageObject()));
        String tenantPrefix = "org-" + orgId + "/college-" + collegeId + "/assignments/";
        if (!unchangedLegacy && (orgId == null || !key.startsWith(tenantPrefix))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Attachment is outside the course tenant");
        }
        if ("PDF".equals(type) && (file.getOriginalName() == null
                || !file.getOriginalName().toLowerCase(java.util.Locale.ROOT).endsWith(".pdf"))) {
            throw invalid("PDF resources must have a PDF filename");
        }
        long limit = "PDF".equals(type) ? maxPdfBytes : maxAttachmentBytes;
        if (limit <= 0) limit = 52428800;
        if (file.getSize() < 0 || file.getSize() > limit) throw invalid("Attachment exceeds upload size limit");
        if (storage != null && !unchangedLegacy) {
            try {
                long actual = storage.getObjectMetadata(key).getContentLength();
                if (actual <= 0 || actual > limit) throw invalid("Attachment is empty or exceeds upload size limit");
            } catch (ResponseStatusException e) {
                throw e;
            } catch (Exception e) {
                // Do not publish a broken resource if the file cannot be verified.
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "Cannot verify uploaded attachment; retry shortly");
            }
        }
        if (file.getOriginalName() != null) {
            String basename = file.getOriginalName().replaceAll("[\\\\/\\p{Cntrl}]", "_");
            file.setOriginalName(basename.substring(0, Math.min(basename.length(), 255)));
        }
    }

    private void validateData(ContentDataDTO data, Integer collegeId, Integer orgId, LessonContents existing) {
        if (data == null) throw invalid("Assignment content is required");
        List<AssignmentResourceDTO> resources = data.getAssignmentResources();
        if (resources == null || resources.isEmpty() || resources.size() > MAX_RESOURCES) {
            throw invalid("Assignment requires 1 to 30 resources");
        }
        List<String> submissions = data.getAllowedSubmissionTypes();
        if (submissions == null || submissions.isEmpty()
                || submissions.size() > SUBMISSION_TYPES.size()
                || submissions.stream().anyMatch(t -> t == null || !SUBMISSION_TYPES.contains(t))
                || new HashSet<>(submissions).size() != submissions.size()) {
            throw invalid("Choose distinct valid submission methods");
        }
        boolean instructions = false;
        Set<String> resourceIds = new HashSet<>();
        for (AssignmentResourceDTO resource : resources) {
            if (resource == null || resource.getType() == null || !RESOURCE_TYPES.contains(resource.getType())) {
                throw invalid("Unknown assignment resource type");
            }
            if (resource.getId() != null && !resourceIds.add(resource.getId())) throw invalid("Duplicate assignment resource ID");
            if (resource.getTitle() == null || resource.getTitle().isBlank() || resource.getTitle().length() > 255) {
                throw invalid("Every assignment resource needs a title of at most 255 characters");
            }
            switch (resource.getType()) {
                case "INSTRUCTIONS":
                    if (instructions) throw invalid("Only one instruction resource is permitted");
                    instructions = true;
                    if (resource.getText() == null || Jsoup.parse(resource.getText()).text().isBlank()) {
                        throw invalid("Instructions cannot be empty");
                    }
                    resource.setText(Jsoup.clean(resource.getText(), Safelist.relaxed()));
                    break;
                case "LINK":
                    if (resource.getLink() == null || resource.getLink().isBlank()) {
                        throw invalid("Links require a valid HTTPS URL");
                    }
                    try {
                        URI uri = URI.create(resource.getLink());
                        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null) throw invalid("Links require HTTPS");
                    } catch (IllegalArgumentException e) {
                        throw invalid("Links require a valid HTTPS URL");
                    }
                    break;
                case "PDF":
                case "FILE":
                    validateFile(resource.getFileDTO(), resource.getType(), collegeId, orgId, existing);
                    break;
                default: throw invalid("Unsupported resource type");
            }
        }
        if (data.getHtmlContent() != null) {
            data.setHtmlContent(Jsoup.clean(data.getHtmlContent(), Safelist.relaxed()));
        }
    }

    @Transactional
    public LessonContents save(LessonContentsDTO dto) {
        UserPrincipal principal = security.getAuthenticatedUserPrincipal();
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        if (principal.isLearner()) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Learners cannot create assignments");
        if (dto == null || dto.getContentType() != ContentType.ASSIGNMENT) throw invalid("Assignment content type required");
        if (dto.getLessonId() == null || dto.getLessonId() <= 0) throw invalid("Valid lesson required");
        Lesson lesson = lessons.fetchCourseId(dto.getLessonId());
        if (lesson == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found");
        Integer courseId = lesson.getCourseId();
        if (dto.getCourseId() != null && !dto.getCourseId().equals(courseId)) {
            throw invalid("Assignment lesson/course mismatch");
        }
        Integer collegeId = scopes.resolveCourseToCollegeId(courseId);
        Integer classId = dto.getClassId() != null && dto.getClassId() > 0 ? dto.getClassId() : null;
        LessonContents existing = null;
        if (dto.getLessonContentId() != null) {
            existing = contents.findById(dto.getLessonContentId()).orElseThrow(
                    () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
            if (!"assignment".equalsIgnoreCase(existing.getContentType())
                    || existing.getLessonId() != dto.getLessonId()
                    || !Objects.equals(existing.getCourseId(), courseId)) {
                throw invalid("Assignment identity cannot be changed");
            }
            checkAccess(principal, existing.getCourseId(), existing.getClassId(), collegeId, false);
            // Legacy faculty disable calls omit the class; retain its original scope.
            if (dto.getClassId() == null) classId = existing.getClassId();
            // A regular faculty member must never change an assignment's class visibility.
            if (!access.isSuperAdmin(principal)
                    && !"ADMIN".equalsIgnoreCase(principal.getFacultyType())
                    && !Objects.equals(existing.getClassId(), classId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Faculty cannot change assignment scope");
            }
        }
        if (existing != null && studentAssignments == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Cannot verify assignment submissions; retry shortly");
        }
        boolean hasSubmissions = existing != null
                && studentAssignments.countActiveByLessonContentId(existing.getId()) > 0;
        if (hasSubmissions) {
            if (Boolean.FALSE.equals(dto.getActive()) || Boolean.FALSE.equals(dto.getEnabled())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "An assignment with learner submissions cannot be disabled");
            }
            if (!Objects.equals(existing.getClassId(), classId)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Assignment scope cannot be changed after learner submissions exist");
            }
            if (dto.getPoints() != existing.getPoints()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Assignment points cannot be changed after learner submissions exist");
            }
            java.time.LocalDateTime requestedDeadline = Boolean.TRUE.equals(dto.getClearDeadline())
                    ? null : (dto.getDeadline() != null ? dto.getDeadline() : existing.getDeadline());
            if (!Objects.equals(existing.getDeadline(), requestedDeadline)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Assignment deadline cannot be changed after learner submissions exist");
            }
            ContentDataDTO oldData = existing.getContentDataDTO();
            ContentDataDTO newData = dto.getContentDataDTO();
            if (newData != null && oldData != null
                    && (!Objects.equals(oldData.getAssignmentResources(), newData.getAssignmentResources())
                        || !Objects.equals(oldData.getAllowedSubmissionTypes(), newData.getAllowedSubmissionTypes()))) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Assignment instructions, resources and submission methods cannot change after learner submissions exist");
            }
        }
        boolean scopeChanged = existing == null || !Objects.equals(existing.getClassId(), classId);
        checkAccess(principal, courseId, classId, collegeId, scopeChanged);
        // The faculty list's legacy Delete action sends enabled=false without the full resource
        // schema. Treat this as a soft-disable, never as permission to overwrite resource data.
        if (existing != null && Boolean.FALSE.equals(dto.getEnabled()) &&
                (dto.getContentDataDTO() == null || dto.getContentDataDTO().getAssignmentResources() == null)) {
            existing.setEnabled(false);
            return contents.save(existing);
        }
        if (dto.getContentTitle() == null || dto.getContentTitle().isBlank() || dto.getContentTitle().trim().length() > 255) {
            throw invalid("Assignment title must be 1 to 255 characters");
        }
        if (Boolean.TRUE.equals(dto.getClearDeadline())) {
            throw invalid("Assignment due date cannot be cleared");
        }
        java.time.LocalDateTime effectiveDeadline = dto.getDeadline() != null
                ? dto.getDeadline()
                : (existing != null ? existing.getDeadline() : null);
        if (effectiveDeadline == null) {
            throw invalid("Assignment due date is required");
        }
        if ((existing == null || !Objects.equals(existing.getDeadline(), effectiveDeadline))
                && effectiveDeadline.isBefore(java.time.LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")))) {
            throw invalid("Assignment due date must be in the future");
        }
        if (dto.getPoints() < 0 || dto.getPoints() > 1000) {
            throw invalid("Points must be between 0 and 1000");
        }
        Integer orgId = collegeId != null ? scopes.resolveCollegeToOrganizationId(collegeId) : null;
        validateData(dto.getContentDataDTO(), collegeId, orgId, existing);
        LessonContents content = existing != null ? existing : new LessonContents();
        content.setLessonId(dto.getLessonId());
        content.setCourseId(courseId);
        content.setClassId(classId);
        content.setContentType("assignment");
        content.setContentTitle(dto.getContentTitle().trim());
        content.setContentDataDTO(dto.getContentDataDTO());
        content.setPoints(dto.getPoints());
        if (dto.getDeadline() != null) content.setDeadline(dto.getDeadline());
        if (existing == null) {
            // A global super-admin has id=0 and is not a Faculty DB row. Store no fake faculty id.
            content.setFacultyId(access.isSuperAdmin(principal) ? null : principal.getId());
            content.setSequence(dto.getSequence());
        }
        if (dto.getActive() != null) content.setActive(dto.getActive());
        else if (existing == null) content.setActive(true);
        if (dto.getEnabled() != null) content.setEnabled(dto.getEnabled());
        else if (existing == null) content.setEnabled(true);
        return contents.save(content);
    }
}
