package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ResolvedLearnerScope;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.AnnouncementCreateRequest;
import com._42students.lms.dto.response.AnnouncementResponseDTO;
import com._42students.lms.dto.response.PageDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.enums.AnnouncementType;
import com._42students.lms.model.Announcement;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AdminAuditLogService;
import com._42students.lms.service.AnnouncementService;
import com._42students.lms.service.FacultyService;
import com._42students.lms.util.SecurityContextUtil;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;
import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/v1/announcements")
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    private FacultyService facultyService;

    @Autowired(required = false)
    private ScopeResolutionService scopeResolutionService;

    @Autowired(required = false)
    private AdminAuditLogService auditLogService;

    @Autowired
    public AnnouncementController(AnnouncementService announcementService) {
        this.announcementService = announcementService;
    }

    @Transactional
    @PostMapping("/create")
    public ResponseEntity createAnnouncement(@Valid @RequestBody AnnouncementCreateRequest request, HttpServletRequest httpRequest) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireAccessForReceiver(principal, request.getReceiverType(), request.getReceiverValue());
        // Override any client-supplied senderId with the authenticated user's ID
        if (principal != null && principal.getId() != null) {
            request.setSenderId(principal.getId().longValue());
        }
        if (request.getMessage() != null) {
            request.setMessage(Jsoup.clean(request.getMessage(), Safelist.relaxed()));
        }
        if (request.getTitle() != null) {
            request.setTitle(Jsoup.clean(request.getTitle(), Safelist.none()));
        }
        Announcement announcement = announcementService.createAnnouncement(request);
        if (auditLogService != null) {
            Integer collegeId = resolveCollegeIdForReceiver(announcement.getReceiverType(), announcement.getReceiverValue());
            auditLogService.log(httpRequest, "ANNOUNCEMENT_CREATE", "announcement", String.valueOf(announcement.getId()), null, collegeId, Map.of());
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                new AnnouncementResponseDTO(announcement)), HttpStatus.OK);
    }

    @GetMapping("/fetchAll")
    public ResponseEntity fetchAllAnnouncements(
            @RequestParam(defaultValue = "0") int pageNumber,
            @RequestParam(defaultValue = "20") int pageSize
    ) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        // College admins may also list their own college's announcements this way — collegeId is
        // always taken from the authenticated principal below, never from client input, so this
        // cannot be used to list another college's announcements.
        boolean allowed = accessControlService.isSuperAdmin(principal)
                || accessControlService.canPerformAdminActionForCollege(principal, principal != null ? principal.getCollegeId() : null);
        if (!allowed) {
            return new ResponseEntity(
                    new Response(HttpStatus.FORBIDDEN.name(),
                            "Admin access required", null),
                    HttpStatus.FORBIDDEN);
        }
        Integer orgId = principal != null ? principal.getOrganizationId() : null;
        Integer collegeId = principal != null ? principal.getCollegeId() : null;
        PageDTO<AnnouncementResponseDTO> pageDTO = announcementService.findAllScopedPaged(orgId, collegeId, pageNumber, pageSize);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), pageDTO), HttpStatus.OK);
    }

    @GetMapping("/fetch/{id}")
    public ResponseEntity fetchAnnouncementById(@PathVariable Long id) {
        return announcementService.findById(id)
                .map(announcement -> {
                    requireAccessForAnnouncement(announcement);
                    return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), 
                            new AnnouncementResponseDTO(announcement)), HttpStatus.OK);
                })
                .orElse(new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Announcement not found", null), HttpStatus.NOT_FOUND));
    }

    @Transactional
    @PutMapping("/update/{id}")
    public ResponseEntity updateAnnouncement(@PathVariable Long id, @Valid @RequestBody AnnouncementCreateRequest request, HttpServletRequest httpRequest) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        announcementService.findById(id).ifPresent(announcement -> {
            // Caller must have had access to the announcement's existing (pre-update) target...
            requireAccessForAnnouncement(announcement);
            requireAdminForBroadcastReceiver(principal, announcement.getReceiverType(), announcement.getReceiverValue());
        });
        // ...AND access to the NEW target the request wants to retarget it to. Without this,
        // access was only ever validated against the old receiverType/receiverValue, and the new
        // ones were applied with no scope check — a college admin could redirect an announcement
        // they own into another college/department/program/class/learner.
        requireAccessForReceiver(principal, request.getReceiverType(), request.getReceiverValue());
        // Override any client-supplied senderId with the authenticated user's ID, same as create,
        // to prevent sender-attribution spoofing on edit.
        if (principal != null && principal.getId() != null) {
            request.setSenderId(principal.getId().longValue());
        }
        if (request.getMessage() != null) {
            request.setMessage(Jsoup.clean(request.getMessage(), Safelist.relaxed()));
        }
        if (request.getTitle() != null) {
            request.setTitle(Jsoup.clean(request.getTitle(), Safelist.none()));
        }
        try {
            Announcement updatedAnnouncement = announcementService.updateAnnouncement(id, request);
            if (auditLogService != null) {
                Integer collegeId = resolveCollegeIdForReceiver(updatedAnnouncement.getReceiverType(), updatedAnnouncement.getReceiverValue());
                auditLogService.log(httpRequest, "ANNOUNCEMENT_UPDATE", "announcement", String.valueOf(id), null, collegeId, Map.of());
            }
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                    new AnnouncementResponseDTO(updatedAnnouncement)), HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), e.getMessage(), null), HttpStatus.NOT_FOUND);
        }
    }

    @Transactional
    @DeleteMapping("/delete/{id}")
    public ResponseEntity deleteAnnouncement(@PathVariable Long id, HttpServletRequest httpRequest) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        Integer[] collegeIdForAudit = new Integer[1];
        announcementService.findById(id).ifPresent(announcement -> {
            requireAccessForAnnouncement(announcement);
            requireAdminForBroadcastReceiver(principal, announcement.getReceiverType(), announcement.getReceiverValue());
            collegeIdForAudit[0] = resolveCollegeIdForReceiver(announcement.getReceiverType(), announcement.getReceiverValue());
        });
        try {
            announcementService.deleteAnnouncement(id);
            if (auditLogService != null) {
                auditLogService.log(httpRequest, "ANNOUNCEMENT_DELETE", "announcement", String.valueOf(id), null, collegeIdForAudit[0], Map.of());
            }
            return new ResponseEntity(new Response(HttpStatus.OK.name(), "Announcement deleted successfully", null), HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), e.getMessage(), null), HttpStatus.NOT_FOUND);
        }
    }

    // A deleted announcement had no recovery path through the product at all — these two back
    // the restore screen.

    @GetMapping("/deleted")
    public ResponseEntity fetchDeletedAnnouncements() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        List<Announcement> visible = announcementService.findAllDeleted().stream()
                .filter(a -> {
                    try {
                        requireAccessForAnnouncement(a);
                        return true;
                    } catch (RuntimeException e) {
                        return false;
                    }
                })
                .collect(java.util.stream.Collectors.toList());
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                visible.stream().map(AnnouncementResponseDTO::new).collect(java.util.stream.Collectors.toList())),
                HttpStatus.OK);
    }

    @PostMapping("/restore/{id}")
    public ResponseEntity restoreAnnouncement(@PathVariable Long id, HttpServletRequest httpRequest) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        Integer[] collegeIdForAudit = new Integer[1];
        Announcement existing = announcementService.findById(id).orElse(null);
        if (existing == null) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Announcement not found", null), HttpStatus.NOT_FOUND);
        }
        requireAccessForAnnouncement(existing);
        requireAdminForBroadcastReceiver(principal, existing.getReceiverType(), existing.getReceiverValue());
        collegeIdForAudit[0] = resolveCollegeIdForReceiver(existing.getReceiverType(), existing.getReceiverValue());
        try {
            Announcement restored = announcementService.restoreAnnouncement(id);
            if (auditLogService != null) {
                auditLogService.log(httpRequest, "ANNOUNCEMENT_RESTORE", "announcement", String.valueOf(id), null, collegeIdForAudit[0], Map.of());
            }
            return new ResponseEntity(new Response(HttpStatus.OK.name(), "Announcement restored",
                    new AnnouncementResponseDTO(restored)), HttpStatus.OK);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            return new ResponseEntity(new Response(e.getStatus().name(), e.getReason(), null), e.getStatus());
        }
    }

    /**
     * Get LMS announcements for the authenticated learner (college, program, class, or learner-scoped).
     * Resolves scope from learner hierarchy. Learners use this; faculty use fetchFacultyAnnouncements.
     */
    @GetMapping("/forLearner")
    public ResponseEntity<Response<List<AnnouncementResponseDTO>>> getAnnouncementsForLearner() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null || !principal.isLearner()) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.FORBIDDEN.name(), "Learners only", null),
                    HttpStatus.FORBIDDEN);
        }
        Integer learnerId = principal.getId();
        if (learnerId == null) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.BAD_REQUEST.name(), "Learner ID not found", null),
                    HttpStatus.BAD_REQUEST);
        }
        if (scopeResolutionService == null) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), List.of()),
                    HttpStatus.OK);
        }
        ResolvedLearnerScope scope = scopeResolutionService.resolveFullScope(learnerId);
        Long collegeId = scope.getCollegeId() != null ? scope.getCollegeId().longValue() : null;
        Long programId = scope.getProgramId() != null ? scope.getProgramId().longValue() : null;
        Long classId = scope.getClassId() != null ? scope.getClassId().longValue() : null;
        Long learnerIdLong = learnerId.longValue();
        if (collegeId == null && programId == null && classId == null) {
            return new ResponseEntity<>(
                    new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), List.of()),
                    HttpStatus.OK);
        }
        List<AnnouncementResponseDTO> responseDTOs = announcementService.fetchLearnerAnnouncements(
                collegeId != null ? collegeId : 0L,
                programId != null ? programId : 0L,
                classId != null ? classId : 0L,
                learnerIdLong);
        return new ResponseEntity<>(
                new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), responseDTOs),
                HttpStatus.OK);
    }

    @GetMapping("/fetchLearnerAnnouncements")
    public ResponseEntity<PageDTO<AnnouncementResponseDTO>> fetchLearnerAnnouncements(
            @RequestParam Long collegeId,
            @RequestParam Long programId,
            @RequestParam Long classId,
            @RequestParam Long learnerId,
            @RequestParam(defaultValue = "0") int pageNumber, 
            @RequestParam(defaultValue = "10") int pageSize
    ) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) return ResponseEntity.status(401).build();
        accessControlService.requireAccessCollege(principal, collegeId != null ? collegeId.intValue() : null);
        // A learner may only ever read their own feed. college/program/class/learner all arrive as
        // client-supplied params, so for a learner caller we discard them and re-derive the whole
        // scope from the authenticated principal — otherwise any learner could read a classmate's
        // (or another class's / another program's) announcements by editing the query string.
        // Admins keep the explicit params so they can inspect a specific learner's feed.
        if (principal.isLearner()) {
            if (principal.getId() == null || scopeResolutionService == null) {
                return new ResponseEntity<>(emptyPage(pageNumber, pageSize), HttpStatus.OK);
            }
            ResolvedLearnerScope scope = scopeResolutionService.resolveFullScope(principal.getId());
            collegeId = scope.getCollegeId() != null ? scope.getCollegeId().longValue() : 0L;
            programId = scope.getProgramId() != null ? scope.getProgramId().longValue() : 0L;
            classId = scope.getClassId() != null ? scope.getClassId().longValue() : 0L;
            learnerId = principal.getId().longValue();
        } else if (!accessControlService.isSuperAdmin(principal)
                && !accessControlService.canPerformAdminActionForCollege(principal, collegeId != null ? collegeId.intValue() : null)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Cannot view another learner's announcements");
        }
        PageDTO<AnnouncementResponseDTO> pageDTO = announcementService.fetchLearnerAnnouncementsPaged(collegeId, programId, classId, learnerId, pageNumber, pageSize);
        return new ResponseEntity<>(pageDTO, HttpStatus.OK);
    }

    private static PageDTO<AnnouncementResponseDTO> emptyPage(int pageNumber, int pageSize) {
        PageDTO<AnnouncementResponseDTO> dto = new PageDTO<>();
        dto.setPageNumber(Math.max(pageNumber, 0));
        dto.setPageSize(pageSize);
        dto.setTotalRecords(0);
        dto.setRecords(List.of());
        return dto;
    }

    @GetMapping("/fetchFacultyAnnouncements")
    public ResponseEntity<PageDTO<AnnouncementResponseDTO>> fetchFacultyAnnouncements(
            @RequestParam Long collegeId,
            @RequestParam Long deptId,
            @RequestParam Long facultyId,
            @RequestParam(defaultValue = "0") int pageNumber,
            @RequestParam(defaultValue = "10") int pageSize
    ) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) return ResponseEntity.status(401).build();
        accessControlService.requireAccessCollege(principal, collegeId != null ? collegeId.intValue() : null);
        // Prevent faculty from viewing another faculty's announcements unless admin
        boolean privileged = accessControlService.isSuperAdmin(principal)
                || accessControlService.canPerformAdminActionForCollege(principal, collegeId != null ? collegeId.intValue() : null);
        if (!privileged) {
            if (facultyId != null && principal.getId() != null && !facultyId.equals(principal.getId().longValue())) {
                throw new org.springframework.security.access.AccessDeniedException("Cannot view another faculty's announcements");
            }
            // Doc 11: deptId was taken from the request and never checked. The query ORs the
            // COLLEGE, DEPARTMENT and FACULTY buckets together, so a faculty member passing a
            // different department's id -- their own college's, which is all requireAccessCollege
            // proves -- received that department's announcements alongside their own.
            //
            // requireAccessDepartment would not have caught it: canAccessDepartment resolves the
            // department to its college and defers to canAccessCollege, so every department in
            // the caller's own college passes. The check has to be against the caller's OWN
            // department, which is the same shape as the facultyId guard above.
            if (deptId != null && facultyService != null && principal.getId() != null) {
                Integer ownDeptId = facultyService.findById(principal.getId())
                        .map(com._42students.lms.model.Faculty::getDeptId)
                        .orElse(null);
                if (ownDeptId == null || !deptId.equals(ownDeptId.longValue())) {
                    throw new org.springframework.security.access.AccessDeniedException(
                            "Cannot view another department's announcements");
                }
            }
        }
        PageDTO<AnnouncementResponseDTO> pageDTO = announcementService.fetchFacultyAnnouncementsPaged(collegeId, deptId, facultyId, pageNumber, pageSize);
        return new ResponseEntity<>(pageDTO, HttpStatus.OK);
    }

    /**
     * Validates that {@code principal} has access to send/retarget an announcement to
     * {@code receiverType}/{@code receiverValue}. Used for both the new-record checks on create
     * and (critically) the new-target checks on update, so a retarget can never bypass scoping.
     */
    private void requireAccessForReceiver(UserPrincipal principal, AnnouncementType receiverType, Long receiverValue) {
        requireScopedSuperadminReceiverWithinScope(principal, receiverType, receiverValue);
        requireAdminForBroadcastReceiver(principal, receiverType, receiverValue);
        if (receiverType == null || receiverValue == null) return;
        switch (receiverType) {
            case COLLEGE:
                accessControlService.requireAccessCollege(principal, receiverValue.intValue());
                break;
            case DEPARTMENT:
                accessControlService.requireAccessDepartment(principal, receiverValue.intValue());
                break;
            case PROGRAM:
                accessControlService.requireAccessProgram(principal, receiverValue);
                break;
            case CLASS:
                accessControlService.requireAccessClass(principal, receiverValue.intValue());
                break;
            case LEARNER:
                accessControlService.requireAccessLearner(principal, receiverValue.intValue());
                break;
            case FACULTY:
                if (facultyService != null) {
                    facultyService.findById(receiverValue.intValue())
                            .ifPresent(f -> accessControlService.requireAccessCollege(principal, f.getCollegeId()));
                }
                break;
            default:
                break;
        }
    }

    /** Resolves a receiver's owning collegeId, for audit-log scoping. Best-effort; may return null. */
    private Integer resolveCollegeIdForReceiver(AnnouncementType receiverType, Long receiverValue) {
        if (receiverType == null || receiverValue == null || scopeResolutionService == null) return null;
        switch (receiverType) {
            case COLLEGE:
                return receiverValue.intValue();
            case DEPARTMENT:
                return scopeResolutionService.resolveDepartmentToCollegeId(receiverValue.intValue());
            case PROGRAM:
                return scopeResolutionService.resolveProgramToCollegeId(receiverValue);
            case CLASS:
                return scopeResolutionService.resolveClassToCollegeId(receiverValue.intValue());
            case LEARNER:
                return scopeResolutionService.resolveLearnerToCollegeId(receiverValue.intValue());
            case FACULTY:
                return scopeResolutionService.resolveFacultyToCollegeId(receiverValue.intValue());
            default:
                return null;
        }
    }

    private void requireAccessForAnnouncement(Announcement announcement) {
        if (announcement.getReceiverType() == null || announcement.getReceiverValue() == null) return;
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminReceiverWithinScope(principal, announcement.getReceiverType(), announcement.getReceiverValue());
        switch (announcement.getReceiverType()) {
            case COLLEGE:
                accessControlService.requireAccessCollege(principal, announcement.getReceiverValue().intValue());
                break;
            case DEPARTMENT:
                accessControlService.requireAccessDepartment(principal, announcement.getReceiverValue().intValue());
                break;
            case PROGRAM:
                accessControlService.requireAccessProgram(principal, announcement.getReceiverValue());
                break;
            case CLASS:
                accessControlService.requireAccessClass(principal, announcement.getReceiverValue().intValue());
                break;
            case LEARNER:
                accessControlService.requireAccessLearner(principal, announcement.getReceiverValue().intValue());
                break;
            case FACULTY:
                if (facultyService != null && announcement.getReceiverValue() != null) {
                    facultyService.findById(announcement.getReceiverValue().intValue())
                            .ifPresent(f -> accessControlService.requireAccessCollege(principal, f.getCollegeId()));
                }
                break;
            default:
                break;
        }
    }

    /**
     * College-wide/department/program/class-scoped announcements are broadcasts that reach many
     * recipients at once, so only a college admin (or super-admin) may create/update/delete them.
     * Single-recipient receiver types (LEARNER, FACULTY) are not gated here.
     */
    private void requireAdminForBroadcastReceiver(UserPrincipal principal, AnnouncementType receiverType, Long receiverValue) {
        if (receiverType == null || receiverValue == null) return;
        Integer resolvedCollegeId;
        switch (receiverType) {
            case COLLEGE:
                resolvedCollegeId = receiverValue.intValue();
                break;
            case DEPARTMENT:
                resolvedCollegeId = scopeResolutionService != null
                        ? scopeResolutionService.resolveDepartmentToCollegeId(receiverValue.intValue()) : null;
                break;
            case PROGRAM:
                resolvedCollegeId = scopeResolutionService != null
                        ? scopeResolutionService.resolveProgramToCollegeId(receiverValue) : null;
                break;
            case CLASS:
                resolvedCollegeId = scopeResolutionService != null
                        ? scopeResolutionService.resolveClassToCollegeId(receiverValue.intValue()) : null;
                break;
            default:
                return;
        }
        if (resolvedCollegeId != null) {
            accessControlService.requirePerformAdminActionForCollege(principal, resolvedCollegeId);
        }
    }

    private void requireScopedSuperadminReceiverWithinScope(UserPrincipal principal, AnnouncementType receiverType, Long receiverValue) {
        if (principal == null) return;
        if (!accessControlService.isSuperAdmin(principal)) return;
        if (principal.getCollegeId() == null && principal.getOrganizationId() == null) return; // GLOBAL mode
        if (receiverType == null || receiverValue == null) return;
        if (scopeResolutionService == null) return;

        Integer resolvedCollegeId = null;
        switch (receiverType) {
            case COLLEGE:
                resolvedCollegeId = receiverValue.intValue();
                break;
            case DEPARTMENT:
                resolvedCollegeId = scopeResolutionService.resolveDepartmentToCollegeId(receiverValue.intValue());
                break;
            case PROGRAM:
                resolvedCollegeId = scopeResolutionService.resolveProgramToCollegeId(receiverValue);
                break;
            case CLASS:
                resolvedCollegeId = scopeResolutionService.resolveClassToCollegeId(receiverValue.intValue());
                break;
            case LEARNER:
                resolvedCollegeId = scopeResolutionService.resolveLearnerToCollegeId(receiverValue.intValue());
                break;
            case FACULTY:
                resolvedCollegeId = scopeResolutionService.resolveFacultyToCollegeId(receiverValue.intValue());
                break;
            default:
                break;
        }

        if (resolvedCollegeId == null) return;

        if (principal.getCollegeId() != null) {
            if (!Objects.equals(principal.getCollegeId(), resolvedCollegeId)) {
                throw new org.springframework.security.access.AccessDeniedException("Superadmin is college-scoped and cannot access other colleges");
            }
            return;
        }

        Integer resolvedOrgId = scopeResolutionService.resolveCollegeToOrganizationId(resolvedCollegeId);
        if (resolvedOrgId != null && principal.getOrganizationId() != null && !Objects.equals(principal.getOrganizationId(), resolvedOrgId)) {
            throw new org.springframework.security.access.AccessDeniedException("Superadmin is org-scoped and cannot access other organizations");
        }
    }

}

