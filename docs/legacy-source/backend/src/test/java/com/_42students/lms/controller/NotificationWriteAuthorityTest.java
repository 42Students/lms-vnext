package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.request.NotificationDTO;
import com._42students.lms.model.Notification;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.NotificationService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** LRN-P0-01/01A/01B/01C and LRN-T-01/T-02: only staff write notifications, and only their own. */
class NotificationWriteAuthorityTest {
    private NotificationService notifications;
    private SecurityContextUtil security;
    private NotificationController controller;

    // Same numeric id on purpose: a learner 21 must never pass for faculty 21.
    private final UserPrincipal learner = new UserPrincipal(21, "LEARNER", null, 2, 6, 0);
    private final UserPrincipal teacher = new UserPrincipal(21, "FACULTY", "LECTURER", 2, 6, 0);
    private final UserPrincipal otherTeacher = new UserPrincipal(22, "FACULTY", "LECTURER", 2, 6, 0);
    private final UserPrincipal collegeAdmin = new UserPrincipal(15, "FACULTY", "ADMIN", 2, 6, 0);

    @BeforeEach
    void setUp() {
        notifications = mock(NotificationService.class);
        security = mock(SecurityContextUtil.class);
        AccessControlService access = mock(AccessControlService.class); // scope checks pass; the role checks are under test
        controller = new NotificationController();
        ReflectionTestUtils.setField(controller, "notificationService", notifications);
        ReflectionTestUtils.setField(controller, "accessControlService", access);
        ReflectionTestUtils.setField(controller, "securityContextUtil", security);
    }

    private NotificationDTO classNotice() {
        NotificationDTO dto = new NotificationDTO();
        dto.setClassId(9);
        dto.setTitle("Test");
        dto.setHtmlContent("<p>Body</p>");
        return dto;
    }

    private Notification existing(Integer creatorFacultyId) {
        Notification n = new Notification();
        n.setId(5);
        n.setClassId(9);
        n.setCreatorFacultyId(creatorFacultyId);
        when(notifications.findById(5)).thenReturn(Optional.of(n));
        return n;
    }

    @Test
    void learnerCannotCreateUpdateOrDelete() {
        when(security.getAuthenticatedUserPrincipal()).thenReturn(learner);
        existing(21);
        assertThrows(AccessDeniedException.class, () -> controller.createNotification(classNotice()));
        assertThrows(AccessDeniedException.class, () -> controller.updateNotification(5, classNotice()));
        assertThrows(AccessDeniedException.class, () -> controller.deleteNotificationById(5));
        assertThrows(AccessDeniedException.class, () -> controller.deleteNotification(5));
        verify(notifications, never()).save(any());
        verify(notifications, never()).updateNotification(anyInt(), any());
        verify(notifications, never()).deleteNotification(anyInt());
    }

    @Test
    void recipientFeedReadsTheCallersOwnKindOfId() {
        // learner 21 and faculty 21 are different people: each gets only rows addressed to their own kind (V227)
        when(security.getAuthenticatedUserPrincipal()).thenReturn(learner);
        controller.getNotificationsForRecipient(21, null, null);
        verify(notifications).getNotificationsForRecipientAsDtos(21, Notification.RECIPIENT_LEARNER, null, null);

        when(security.getAuthenticatedUserPrincipal()).thenReturn(teacher);
        controller.getNotificationsForRecipient(21, null, null);
        verify(notifications).getNotificationsForRecipientAsDtos(21, Notification.RECIPIENT_FACULTY, null, null);
    }

    @Test
    void systemNotificationOnlyDeletableByAdmin() {
        existing(null);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(teacher);
        assertThrows(AccessDeniedException.class, () -> controller.deleteNotificationById(5));
        when(security.getAuthenticatedUserPrincipal()).thenReturn(collegeAdmin);
        assertEquals(200, controller.deleteNotificationById(5).getStatusCodeValue());
    }

    @Test
    void teacherChangesOnlyTheirOwn() {
        existing(21);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(otherTeacher);
        assertThrows(AccessDeniedException.class, () -> controller.updateNotification(5, classNotice()));
        assertThrows(AccessDeniedException.class, () -> controller.deleteNotificationById(5));
        when(security.getAuthenticatedUserPrincipal()).thenReturn(teacher);
        assertEquals(200, controller.deleteNotificationById(5).getStatusCodeValue());
    }

    @Test
    void creatorIsTheFacultyNeverAnotherNamespace() throws Exception {
        when(notifications.save(any())).thenReturn(new Notification());
        ArgumentCaptor<NotificationDTO> saved = ArgumentCaptor.forClass(NotificationDTO.class);

        when(security.getAuthenticatedUserPrincipal()).thenReturn(teacher);
        controller.createNotification(classNotice());
        verify(notifications).save(saved.capture());
        assertEquals(21, saved.getValue().getCreatorFacultyId());

        UserPrincipal superadmin = new UserPrincipal(0, "SUPERADMIN", null, null, null, 0);
        AccessControlService access = mock(AccessControlService.class);
        when(access.isSuperAdmin(superadmin)).thenReturn(true);
        ReflectionTestUtils.setField(controller, "accessControlService", access);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(superadmin);
        controller.createNotification(classNotice());
        verify(notifications, org.mockito.Mockito.times(2)).save(saved.capture());
        assertNull(saved.getValue().getCreatorFacultyId());
    }
}
