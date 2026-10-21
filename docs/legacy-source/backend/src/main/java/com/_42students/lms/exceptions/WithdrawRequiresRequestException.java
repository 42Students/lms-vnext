package com._42students.lms.exceptions;

import org.springframework.http.HttpStatus;

/**
 * Student V1 §5 "Withdrawing": self-service withdrawal is only available until the student is
 * scheduled into a round. Once an active (SCHEDULED/CONFIRMED/RESCHEDULE_REQUESTED) interview
 * exists for the application — or when declining an interview outright — the student must ask
 * the placement cell instead (a WITHDRAWAL student_request), not withdraw immediately.
 */
public class WithdrawRequiresRequestException extends CustomException {
    public WithdrawRequiresRequestException(String message) {
        super(message, HttpStatus.CONFLICT);
    }
}
