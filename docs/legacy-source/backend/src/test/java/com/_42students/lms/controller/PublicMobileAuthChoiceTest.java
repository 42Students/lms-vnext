package com._42students.lms.controller;

import com._42students.lms.dto.request.MobileAuthSendRequest;
import com._42students.lms.dto.request.MobileAuthStartRequest;
import com._42students.lms.model.Faculty;
import com._42students.lms.model.Learner;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.MobileLoginAttemptRepository;
import com._42students.lms.service.SmsService;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Login audit 2026-10-12: which account a phone's "Continue" signs in to, and suspended accounts in the list. */
class PublicMobileAuthChoiceTest {

    private static PublicMobileAuthController.AccountChoice choice(int position, String key) {
        PublicMobileAuthController.AccountChoice c = new PublicMobileAuthController.AccountChoice();
        c.choiceId = position;
        c.key = key;
        return c;
    }

    @Test
    void theKeyPicksTheSameAccountEvenWhenTheListComesBackInAnotherOrder() {
        // The list shown: learner first. The list rebuilt at Continue: faculty first.
        var faculty = choice(1, "acc:FACULTY:18:college:6:facultyType:PROFESSOR");
        var learner = choice(2, "acc:LEARNER:254:college:6");
        List<PublicMobileAuthController.AccountChoice> rebuilt = List.of(faculty, learner);

        assertSame(learner, PublicMobileAuthController.pickChoice(rebuilt, 1, "acc:LEARNER:254:college:6"),
                "position 1 is now the faculty account; the key still names the learner one");
    }

    @Test
    void aKeyThatNoLongerMatchesIsRefusedNotGuessed() {
        var only = choice(1, "acc:LEARNER:254:college:6");
        assertNull(PublicMobileAuthController.pickChoice(List.of(only), 1, "acc:FACULTY:18:college:6"));
    }

    @Test
    void oldClientsWithoutAKeyStillPickByPosition() {
        var a = choice(1, "acc:LEARNER:1:college:1");
        var b = choice(2, "acc:FACULTY:2:college:2");
        assertSame(b, PublicMobileAuthController.pickChoice(List.of(a, b), 2, null));
        assertSame(b, PublicMobileAuthController.pickChoice(List.of(a, b), 2, " "));
    }

    // ---------------------------------------------------------------- suspended accounts get no SMS

    private final LearnerRepository learners = mock(LearnerRepository.class);
    private final FacultyRepository faculty = mock(FacultyRepository.class);
    private final MobileLoginAttemptRepository attempts = mock(MobileLoginAttemptRepository.class);
    private final SmsService sms = mock(SmsService.class);

    private PublicMobileAuthController controller() {
        return new PublicMobileAuthController(learners, faculty, mock(CollegeRepository.class), attempts, sms, null,
                null, null, null, null, null, null, null, null);
    }

    private static Learner learner(int id, boolean suspended) {
        Learner l = new Learner();
        l.setId(id);
        l.setCollegeId(6);
        l.setSuspendedAt(suspended ? LocalDateTime.now().minusDays(1) : null);
        return l;
    }

    @Test
    void aSingleSuspendedAccountIsRefusedBeforeAnySmsIsSent() {
        when(learners.findAllByContactMobileAndNotDeleted("9876543210")).thenReturn(List.of(learner(254, true)));
        when(faculty.findAllByContactMobileAndNotDeleted("9876543210")).thenReturn(List.of());
        MobileAuthStartRequest req = new MobileAuthStartRequest();
        req.setPhone("9876543210");

        ResponseEntity<?> res = controller().start(req, mock(HttpServletRequest.class));

        assertEquals(403, res.getStatusCodeValue());
        assertEquals("ACCOUNT_SUSPENDED", ((Map<?, ?>) res.getBody()).get("error"));
        verify(attempts, never()).save(any());
        verify(sms, never()).sendOtp(anyString(), anyString(), any());
    }

    @Test
    void aSuspendedAccountIsListedAsSuspendedAndChoosingItSendsNothing() {
        Faculty f = new Faculty();
        f.setId(18);
        f.setCollegeId(6);
        when(learners.findAllByContactMobileAndNotDeleted("9876543210")).thenReturn(List.of(learner(254, true)));
        when(faculty.findAllByContactMobileAndNotDeleted("9876543210")).thenReturn(List.of(f));
        MobileAuthStartRequest start = new MobileAuthStartRequest();
        start.setPhone("9876543210");

        ResponseEntity<?> listed = controller().start(start, mock(HttpServletRequest.class));
        List<?> choices = (List<?>) ((Map<?, ?>) listed.getBody()).get("choices");
        Map<?, ?> first = (Map<?, ?>) choices.get(0);
        assertEquals(Boolean.TRUE, first.get("suspended"), "the list says which account is suspended");

        MobileAuthSendRequest send = new MobileAuthSendRequest();
        send.setPhone("9876543210");
        send.setChoiceId(1);
        send.setKey(String.valueOf(first.get("key")));
        ResponseEntity<?> res = controller().send(send, mock(HttpServletRequest.class));

        assertEquals(403, res.getStatusCodeValue());
        verify(attempts, never()).save(any());
        verify(sms, never()).sendOtp(anyString(), anyString(), any());
    }
}
