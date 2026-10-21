package com._42students.lms.service.impl;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.model.ClassroomMessage;
import com._42students.lms.repository.ClassroomMessageRepository;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.FacultyService;
import com._42students.lms.service.LearnerService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** LRN-DISC-01 / LRN-T-06: learner N cannot own or delete faculty N's message. */
class ClassroomTypedOwnershipTest {
    private ClassroomMessageRepository messages;
    private SecurityContextUtil security;
    private ClassroomServiceImpl service;

    @BeforeEach
    void setUp() {
        messages = mock(ClassroomMessageRepository.class);
        security = mock(SecurityContextUtil.class);
        service = new ClassroomServiceImpl(messages, mock(AccessControlService.class), security,
                mock(FacultyTeachingAssignmentRepository.class), mock(LearnerService.class), mock(FacultyService.class));
    }

    private ClassroomMessage message(int senderId, String role) {
        ClassroomMessage m = new ClassroomMessage();
        m.setId(7);
        m.setCourseId(3);
        m.setClassId(9);
        m.setSenderId(senderId);
        m.setSenderRole(role);
        when(messages.findById(7)).thenReturn(Optional.of(m));
        return m;
    }

    @Test
    void learnerCannotDeleteFacultyMessageWithTheSameId() {
        message(21, "Faculty");
        when(security.getAuthenticatedUserPrincipal()).thenReturn(new UserPrincipal(21, "LEARNER", null, 2, 6, 0));
        assertThrows(ResponseStatusException.class, () -> service.deleteMessage(7));
        verify(messages, never()).save(any());
    }

    @Test
    void learnerDeletesTheirOwnMessage() {
        ClassroomMessage m = message(21, "Learner");
        when(security.getAuthenticatedUserPrincipal()).thenReturn(new UserPrincipal(21, "LEARNER", null, 2, 6, 0));
        service.deleteMessage(7);
        assertTrue(Boolean.TRUE.equals(m.getIsDeleted()));
    }
}
