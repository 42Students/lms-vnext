package com._42students.lms.controller;

import com._42students.lms.dto.request.MobileAuthVerifyRequest;
import com._42students.lms.model.Faculty;
import com._42students.lms.model.Learner;
import com._42students.lms.model.MobileLoginAttempt;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.MobileLoginAttemptRepository;
import com._42students.lms.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import javax.servlet.http.HttpServletResponse;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class PublicMobileAuthAccountStateTest {
    @Test
    void smsAndEmailCannotIssueTokensForSuspendedOrDeletedLearnersAndFaculty() throws Exception {
        for (boolean facultyAccount : new boolean[] {false, true}) {
            for (boolean emailChannel : new boolean[] {false, true}) {
                for (boolean deleted : new boolean[] {false, true}) {
                    assertAccountBlocked(facultyAccount, emailChannel, deleted);
                }
            }
        }
    }

    private void assertAccountBlocked(boolean facultyAccount, boolean emailChannel, boolean deleted) throws Exception {
        LearnerRepository learnerRepo = mock(LearnerRepository.class);
        FacultyRepository facultyRepo = mock(FacultyRepository.class);
        MobileLoginAttemptRepository attemptRepo = mock(MobileLoginAttemptRepository.class);
        JwtService jwt = mock(JwtService.class);
        int userId = facultyAccount ? 9 : 7;
        if (facultyAccount) {
            Faculty faculty = new Faculty();
            faculty.setId(userId);
            faculty.setIsDeleted(deleted);
            faculty.setSuspendedAt(deleted ? null : LocalDateTime.now().minusMinutes(1));
            when(facultyRepo.findById(userId)).thenReturn(Optional.of(faculty));
        } else {
            Learner learner = new Learner();
            learner.setId(userId);
            learner.setIsDeleted(deleted);
            learner.setSuspendedAt(deleted ? null : LocalDateTime.now().minusMinutes(1));
            when(learnerRepo.findById(userId)).thenReturn(Optional.of(learner));
        }
        MobileLoginAttempt attempt = new MobileLoginAttempt();
        attempt.setAttemptId("account-state-test");
        attempt.setUserType(facultyAccount ? "FACULTY" : "LEARNER");
        attempt.setUserId(userId);
        attempt.setPhone("9876543210");
        attempt.setOtp("123456");
        attempt.setEmailOtp("123456");
        attempt.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        attempt.setEmailOtpExpiresAt(LocalDateTime.now().plusMinutes(5));
        when(attemptRepo.findByAttemptId("account-state-test")).thenReturn(Optional.of(attempt));
        when(attemptRepo.reserveVerificationAttempt(eq("account-state-test"), any(LocalDateTime.class)))
                .thenReturn(1);
        PublicMobileAuthController controller = new PublicMobileAuthController(
                learnerRepo, facultyRepo, null, attemptRepo, null, jwt,
                null, null, null, null, null, null, null, null);
        MobileAuthVerifyRequest request = new MobileAuthVerifyRequest();
        request.setAttemptId("account-state-test");
        request.setOtp("123456");
        HttpServletResponse httpResponse = mock(HttpServletResponse.class);
        ResponseEntity<?> result = emailChannel
                ? controller.verifyEmailFallback(request, null, httpResponse)
                : controller.verify(request, null, httpResponse);
        assertEquals(403, result.getStatusCodeValue(), "Account state must block all OTP channels");
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) result.getBody();
        assertEquals(deleted ? "ACCOUNT_UNAVAILABLE" : "ACCOUNT_SUSPENDED", body.get("error"));
        verifyNoInteractions(jwt);
        verifyNoInteractions(httpResponse);
    }
}
