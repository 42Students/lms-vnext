package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.Notification;
import com._42students.lms.repository.NotificationRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * M2 in the super-admin audit: "schedule a notification ...; see delivery status, resend or
 * retry". The schedule half lives on the compose path (NotificationDTO.scheduledAt) and the
 * release job (NotificationSchedulerService#releaseScheduledNotifications); this is the operator
 * side of it — cancel a schedule that hasn't fired yet, or retry one that failed.
 *
 * <p>Its own controller rather than more methods on NotificationController: that one is the
 * shared faculty/learner notification API, while everything here requires admin rights on the
 * notification's college.
 */
@RestController
@RequestMapping("/api/v1/admin/notification-delivery")
@Slf4j
@Api(tags = "Admin Notification Delivery")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class AdminNotificationDeliveryController extends BaseController {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    private com._42students.lms.service.AdminAuditLogService audit;

    /**
     * Retry a notification whose release failed, or send a scheduled one immediately.
     *
     * <p>Sets it due now and back to SCHEDULED rather than delivering inline: the release job
     * already owns delivery, including the SSE push and the failure recording, and having one
     * code path do it means a resend behaves identically to the original send.
     */
    @PostMapping("/{id}/resend")
    @ApiOperation(value = "Resend or retry a notification",
            notes = "Requeues the notification for immediate release. Valid for a FAILED notification "
                    + "or one still SCHEDULED for the future; a notification already SENT is not resent.")
    public ResponseEntity<Response<Map<String, Object>>> resend(
            @PathVariable Integer id,
            @RequestParam Integer collegeId,
            HttpServletRequest httpRequest) {
        if (collegeId == null || collegeId <= 0) {
            return bad("collegeId must be a positive integer");
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);

        Notification n = notificationRepository.findById(id).orElse(null);
        if (n == null || Boolean.TRUE.equals(n.getIsDeleted())) {
            return new ResponseEntity<>(new Response<>("error", "Notification not found", null), HttpStatus.NOT_FOUND);
        }
        // The notification is addressed to a class or a course, so authorising the college alone
        // would let an admin for college A requeue college B's row. Re-check the class the same
        // way the compose path checks it.
        if (n.getClassId() > 0) {
            accessControlService.requireAccessClass(principal, n.getClassId());
        } else if (n.getCourseId() > 0) {
            accessControlService.requireAccessCourse(principal, n.getCourseId());
        }

        if ("SENT".equals(n.getDeliveryStatus()) && n.getScheduledAt() == null) {
            return bad("That notification was already delivered. Compose a new one instead of resending it.");
        }

        n.setDeliveryStatus("SCHEDULED");
        n.setScheduledAt(LocalDateTime.now().minusSeconds(1));
        n.setDeliveryError(null);
        notificationRepository.save(n);

        if (audit != null) {
            audit.log(httpRequest, "NOTIFICATION_RESEND", "notification",
                    String.valueOf(id), null, collegeId, Map.of("classId", String.valueOf(n.getClassId())));
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", n.getId());
        out.put("deliveryStatus", n.getDeliveryStatus());
        return new ResponseEntity<>(new Response<>(HttpStatus.OK.name(),
                "Queued for immediate delivery", out), HttpStatus.OK);
    }

    /**
     * Cancel a schedule that hasn't fired yet, leaving the notification composed but unsent.
     * Deliberately not a delete: the admin may want to fix the wording and resend.
     */
    @PostMapping("/{id}/cancel-schedule")
    @ApiOperation(value = "Cancel a pending scheduled notification")
    public ResponseEntity<Response<Map<String, Object>>> cancelSchedule(
            @PathVariable Integer id,
            @RequestParam Integer collegeId,
            HttpServletRequest httpRequest) {
        if (collegeId == null || collegeId <= 0) {
            return bad("collegeId must be a positive integer");
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);

        Notification n = notificationRepository.findById(id).orElse(null);
        if (n == null || Boolean.TRUE.equals(n.getIsDeleted())) {
            return new ResponseEntity<>(new Response<>("error", "Notification not found", null), HttpStatus.NOT_FOUND);
        }
        if (n.getClassId() > 0) {
            accessControlService.requireAccessClass(principal, n.getClassId());
        } else if (n.getCourseId() > 0) {
            accessControlService.requireAccessCourse(principal, n.getCourseId());
        }
        if (!"SCHEDULED".equals(n.getDeliveryStatus())) {
            return bad("Only a notification still waiting to be sent can have its schedule cancelled.");
        }

        // Far-future rather than null: null means "deliver immediately" to the recipient-facing
        // queries, so clearing the timestamp would publish the very notification being cancelled.
        n.setDeliveryStatus("CANCELLED");
        n.setScheduledAt(LocalDateTime.now().plusYears(100));
        notificationRepository.save(n);

        if (audit != null) {
            audit.log(httpRequest, "NOTIFICATION_SCHEDULE_CANCEL", "notification",
                    String.valueOf(id), null, collegeId, Map.of());
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", n.getId());
        out.put("deliveryStatus", n.getDeliveryStatus());
        return new ResponseEntity<>(new Response<>(HttpStatus.OK.name(), "Schedule cancelled", out), HttpStatus.OK);
    }

    private ResponseEntity<Response<Map<String, Object>>> bad(String message) {
        return new ResponseEntity<>(new Response<>("error", message, null), HttpStatus.BAD_REQUEST);
    }
}
