package com._42students.lms.service;


public interface VerificationService {
    void saveAccountVerification(String phoneNumber, String otp) throws Exception;

    boolean verifyOTP(String phoneNumber, String otp);

    void saveInstructorAccountVerification(String phoneNumber, String otp);

    boolean verifyInstructorOTP(String phoneNumber, String otp);

    boolean verifyAlternateOTP(int studentId, String otp);

    void saveAlternateAccountVerification(String rollNumber, String otp, int studentId) throws Exception;

    // Pre-user OTP (for flows where a Learner/Faculty record may not exist yet)
    void savePreUserPhoneOtp(String phoneNumber, String otp);

    boolean verifyPreUserPhoneOtp(String phoneNumber, String otp);

    void savePreUserEmailOtp(String email, String otp);

    boolean verifyPreUserEmailOtp(String email, String otp);
}

