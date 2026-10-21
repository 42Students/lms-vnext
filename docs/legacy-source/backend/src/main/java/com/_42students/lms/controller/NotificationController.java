package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.NotificationDTO;
import com._42students.lms.dto.response.NotificationResponseDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.Notification;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.NotificationService;
import com._42students.lms.sse.SseEmitterRegistry;
import com._42students.lms.util.CourseSlugResolver;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import javax.validation.Valid;
import javax.validation.constraints.Min;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Objects;
import org.springframework.transaction.annotation.Transactional;
import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/v1/notification")
@Slf4j
@Validated
public class NotificationController extends BaseController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private CourseSlugResolver courseSlugResolver;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    private ScopeResolutionService scopeResolutionService;

    @Autowired
    private SseEmitterRegistry sseEmitterRegistry;

    @Transactional
    @RequestMapping(value = "/createNotification", method = RequestMethod.POST, produces = "application/json")
    @ApiOperation(value = "Create a notification", notes = "Requires access to the notification's class (or course if classId is 0).")
    public ResponseEntity createNotification(@Valid @RequestBody NotificationDTO notificationDTO) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        requireStaff(principal);
        if (notificationDTO.getClassId() > 0) {
            accessControlService.requireAccessClass(principal, notificationDTO.getClassId());
        } else if (notificationDTO.getCourseId() > 0) {
            accessControlService.requireAccessCourse(principal, notificationDTO.getCourseId());
        } else {
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), "classId or courseId required", null), HttpStatus.BAD_REQUEST);
        }
        try {
            // creatorFacultyId is a faculty id: never a learner's (or the superadmin's id 0), which would
            // mix id namespaces and let an unrelated person with that number "own" the notification.
            notificationDTO.setCreatorFacultyId(principal.isFaculty() ? principal.getId() : null);
            Notification notification1 = notificationService.save(notificationDTO);
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                    notification1), HttpStatus.OK);
        } catch (Exception e) {
            log.error("Failed to create notification", e);
            return new ResponseEntity(new Response(HttpStatus.INTERNAL_SERVER_ERROR.name(),
                    "Failed to create notification", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @RequestMapping(value = "/fetchAll", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get all notifications (paginated)", notes = "Allowed only for super-admin. Use pageNo and pageSize to paginate. NC-17: returns at most 200 per page.")
    public ResponseEntity fetchAllNotifications(
            @RequestParam(name = "pageNo", defaultValue = "0") int pageNo,
            @RequestParam(name = "pageSize", defaultValue = "50") int pageSize) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        if (!accessControlService.isSuperAdmin(principal)) {
            return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(),
                    "Use scoped endpoints: getNotificationsByClassId or getNotifications with classId", null), HttpStatus.FORBIDDEN);
        }
        // NC-17: DB-level pagination prevents loading all notifications into memory
        Integer orgId = principal.getOrganizationId();
        Integer collegeId = principal.getCollegeId();
        org.springframework.data.domain.Page<Notification> page = notificationService.findAllPagedScoped(orgId, collegeId, pageNo, pageSize);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), page), HttpStatus.OK);
    }

    @RequestMapping(value = "/fetch/{id}", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get notification by ID", notes = "Requires access to the notification's class or course.")
    public ResponseEntity fetchNotificationById(@PathVariable @Min(1) Integer id) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        return notificationService.findById(id)
                .map(notification -> {
                    accessControlService.requireAccessNotification(principal, notification);
                    requireScopedSuperadminNotificationWithinScope(principal, notification);
                    NotificationResponseDTO dto = new NotificationResponseDTO(notification);
                    return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), dto), HttpStatus.OK);
                })
                .orElse(new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Notification not found", null), HttpStatus.NOT_FOUND));
    }

    @RequestMapping(value = "/getNotifications", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get notifications by class and course", notes = "Use courseSlug or courseId; courseSlug takes precedence.")
    public ResponseEntity getNotifications(
            @RequestParam @Min(1) int classId,
            @RequestParam(required = false) String courseSlug,
            @RequestParam(required = false) @Min(1) Integer courseId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        accessControlService.requireAccessClass(principal, classId);
        int resolvedCourseId = courseSlugResolver.resolve(courseSlug, courseId);
        Integer learnerId = principal.isLearner() ? principal.getId() : null;
        List<NotificationResponseDTO> dtos = notificationService.fetchAsDtos(classId, resolvedCourseId, learnerId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), dtos), HttpStatus.OK);
    }

    @RequestMapping(value = "/getNotificationsByClassId", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get notifications by class ID", notes = "Optional page and size for pagination. Returns DTOs with created_at as [year, month, day].")
    public ResponseEntity getNotificationsByClassId(
            @RequestParam @Min(1) int classId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        accessControlService.requireAccessClass(principal, classId);
        Integer learnerId = principal.isLearner() ? principal.getId() : null;
        List<NotificationResponseDTO> dtos = notificationService.getNotificationsByClassIdAsDtos(classId, learnerId, page, size);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), dtos), HttpStatus.OK);
    }

    @RequestMapping(value = "/getNotificationsForRecipient", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get notifications for a recipient across classes", notes = "Self-service only: the caller may only fetch their own notifications. Surfaces notifications not scoped to a single class (e.g. mentor notifications on classless project workspaces). Optional page and size for pagination.")
    public ResponseEntity getNotificationsForRecipient(
            @RequestParam @Min(1) int recipientId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        if (!Objects.equals(principal.getId(), recipientId) && !accessControlService.isSuperAdmin(principal)) {
            throw new AccessDeniedException("You can only fetch your own notifications");
        }
        // Learners and faculty are numbered separately: the caller's own kind picks the rows, never a request value
        // (faculty #12 saw student #12's placement notices; full test run, 15 Oct 2026).
        String recipientType = principal.isLearner() ? Notification.RECIPIENT_LEARNER : Notification.RECIPIENT_FACULTY;
        List<NotificationResponseDTO> dtos = notificationService.getNotificationsForRecipientAsDtos(recipientId, recipientType, page, size);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), dtos), HttpStatus.OK);
    }

    @Transactional
    @RequestMapping(value = "/update/{id}", method = RequestMethod.PUT, produces = "application/json")
    @ApiOperation(value = "Update a notification", notes = "Requires access to the notification's class or course.")
    public ResponseEntity updateNotification(@PathVariable @Min(1) Integer id, @Valid @RequestBody NotificationDTO notificationDTO) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        try {
            Notification existing = notificationService.findById(id)
                    .orElseThrow(() -> new RuntimeException("Notification not found with id " + id));
            // Caller must have access to the notification's existing (pre-update) class/course...
            accessControlService.requireAccessNotification(principal, existing);
            requireScopedSuperadminNotificationWithinScope(principal, existing);
            requireMayChange(principal, existing, "edit");
            // ...AND access to the NEW class/course the request wants to reassign it to. Without
            // this, access was only ever validated against the old classId/courseId, and the new
            // one (fully client-controlled) was applied with no scope check — a college admin
            // could redirect a notification they own into another college's class feed.
            if (notificationDTO.getClassId() > 0) {
                accessControlService.requireAccessClass(principal, notificationDTO.getClassId());
            } else if (notificationDTO.getCourseId() > 0) {
                accessControlService.requireAccessCourse(principal, notificationDTO.getCourseId());
            }
            Notification updated = notificationService.updateNotification(id, notificationDTO);
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), new NotificationResponseDTO(updated)), HttpStatus.OK);
        } catch (RuntimeException e) {
            if (e instanceof AccessDeniedException) throw (AccessDeniedException) e; // a refusal is a 403, not "An error occurred"
            if (e instanceof NoSuchElementException || (e.getMessage() != null && e.getMessage().toLowerCase().contains("not found"))) {
                return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), e.getMessage(), null), HttpStatus.NOT_FOUND);
            }
            return new ResponseEntity(new Response(HttpStatus.INTERNAL_SERVER_ERROR.name(), "An error occurred", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional
    @RequestMapping(value = "/delete/{id}", method = RequestMethod.DELETE, produces = "application/json")
    @ApiOperation(value = "Delete a notification by ID", notes = "Requires access to the notification's class or course.")
    public ResponseEntity deleteNotificationById(@PathVariable @Min(1) Integer id) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        try {
            Notification existing = notificationService.findById(id)
                    .orElseThrow(() -> new RuntimeException("Notification not found with id " + id));
            accessControlService.requireAccessNotification(principal, existing);
            requireScopedSuperadminNotificationWithinScope(principal, existing);
            requireMayChange(principal, existing, "delete");
            notificationService.deleteNotification(id);
            return new ResponseEntity(new Response(HttpStatus.OK.name(), "Notification deleted successfully", null), HttpStatus.OK);
        } catch (Exception e) {
            if (e instanceof AccessDeniedException) throw (AccessDeniedException) e; // a refusal is a 403, not "An error occurred"
            if (e instanceof NoSuchElementException || (e.getMessage() != null && e.getMessage().toLowerCase().contains("not found"))) {
                return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), e.getMessage(), null), HttpStatus.NOT_FOUND);
            }
            return new ResponseEntity(new Response(HttpStatus.INTERNAL_SERVER_ERROR.name(), "An error occurred", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * SSE endpoint — client connects once and receives new notifications in real time.
     * GET /api/v1/notification/subscribe?classId={classId}
     * Requires authentication. Times out after 12 min; client auto-reconnects with fresh token.
     * Max 3 active SSE connections per user to prevent DoS.
     */
    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@RequestParam @Min(1) int classId, javax.servlet.http.HttpServletResponse response) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            return null;
        }
        try {
            accessControlService.requireAccessClass(principal, classId);
        } catch (AccessDeniedException e) {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            return null;
        } catch (Exception e) {
            response.setStatus(HttpStatus.BAD_REQUEST.value());
            return null;
        }
        // Per-person limit (3, oldest closed) lives in the registry; this is the per-class safety cap.
        if (sseEmitterRegistry.connectionCount(classId) > 3000) {
            // Hard cap per class — prevents one class from exhausting all threads
            log.warn("SSE: classId {} has too many active connections, rejecting new subscribe", classId);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            return null;
        }
        String userKey = (principal.getUserType() == null ? "USER" : principal.getUserType().toUpperCase()) + ":" + principal.getId();
        return sseEmitterRegistry.register(classId, userKey);
    }

    @Transactional
    @RequestMapping(value = "/deleteNotification", method = RequestMethod.DELETE, produces = "application/json")
    @ApiOperation(value = "Delete a notification (legacy)", notes = "Requires access to the notification's class or course.")
    public ResponseEntity deleteNotification(@RequestParam @Min(1) int notificationId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        try {
            Notification existing = notificationService.findById(notificationId)
                    .orElseThrow(() -> new RuntimeException("Notification not found with id " + notificationId));
            accessControlService.requireAccessNotification(principal, existing);
            requireScopedSuperadminNotificationWithinScope(principal, existing);
            requireMayChange(principal, existing, "delete");
            notificationService.deleteNotification(notificationId);
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), "Deleted notification successfully"), HttpStatus.OK);
        } catch (RuntimeException e) {
            if (e instanceof AccessDeniedException) throw (AccessDeniedException) e; // a refusal is a 403, not "An error occurred"
            if (e instanceof NoSuchElementException || (e.getMessage() != null && e.getMessage().toLowerCase().contains("not found"))) {
                return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), e.getMessage(), null), HttpStatus.NOT_FOUND);
            }
            return new ResponseEntity(new Response(HttpStatus.INTERNAL_SERVER_ERROR.name(), "An error occurred", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /** Only staff write notifications: faculty (including college admins) and the superadmin, never a learner. */
    private void requireStaff(UserPrincipal principal) {
        if (principal == null || !(principal.isFaculty() || accessControlService.isSuperAdmin(principal))) {
            throw new AccessDeniedException("Only staff can create or change notifications");
        }
    }

    /**
     * Editing or deleting needs staff, and a teacher may only change their own. A college admin or the
     * superadmin may change any notification in their scope, including system ones (no creator), which
     * nobody else may touch.
     */
    private void requireMayChange(UserPrincipal principal, Notification existing, String verb) {
        requireStaff(principal);
        if (accessControlService.isSuperAdmin(principal) || "ADMIN".equalsIgnoreCase(principal.getFacultyType())) return;
        Integer creatorFacultyId = existing.getCreatorFacultyId();
        if (creatorFacultyId == null || !creatorFacultyId.equals(principal.getId())) {
            throw new AccessDeniedException("You can only " + verb + " your own announcements");
        }
    }

    private void requireScopedSuperadminNotificationWithinScope(UserPrincipal principal, Notification notification) {
        if (principal == null || notification == null) return;
        if (!accessControlService.isSuperAdmin(principal)) return;
        if (principal.getCollegeId() == null && principal.getOrganizationId() == null) return; // GLOBAL mode
        if (scopeResolutionService == null) return;

        Integer resolvedCollegeId = null;
        if (notification.getClassId() > 0) {
            resolvedCollegeId = scopeResolutionService.resolveClassToCollegeId(notification.getClassId());
        } else if (notification.getCourseId() > 0) {
            resolvedCollegeId = scopeResolutionService.resolveCourseToCollegeId(notification.getCourseId());
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

