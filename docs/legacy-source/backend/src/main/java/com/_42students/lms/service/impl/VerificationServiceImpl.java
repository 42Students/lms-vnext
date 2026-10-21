package com._42students.lms.service.impl;

import com._42students.lms.model.Faculty;
import com._42students.lms.model.FacultyVerification;
import com._42students.lms.model.Learner;
import com._42students.lms.model.LearnerVerification;
import com._42students.lms.repository.FacultyVerificationRepository;
import com._42students.lms.repository.LearnerAccountVerificationRepository;
import com._42students.lms.service.FacultyService;
import com._42students.lms.service.LearnerService;
import com._42students.lms.service.TestOtpService;
import com._42students.lms.service.VerificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class VerificationServiceImpl implements VerificationService {

    @Autowired
    LearnerAccountVerificationRepository studentAccountVerificationRepository;

    @Autowired
    LearnerService studentService;

    @Autowired
    FacultyService instructorService;

    @Autowired
    FacultyVerificationRepository instructorVerificationRepository;

    @Autowired(required = false)
    TestOtpService testOtpService;

    @Override
    public void saveAccountVerification(String phoneNumber, String otp) throws Exception {
        String phone = (phoneNumber != null) ? phoneNumber.trim() : null;
        Learner learner = studentService.getLearnerDetails(phone);
        LearnerVerification learnerVerification = new LearnerVerification();
        learnerVerification.setLearnerId(learner.getId());
        learnerVerification.setOtp(otp);
        learnerVerification.setMaxResendAttempts(3);
        learnerVerification.setIncorrectAttempts(1);
        learnerVerification.setPhoneNumber(phone);
        learnerVerification.setVerifyStatus(false);
        learnerVerification.setIsDeleted(false);
        learnerVerification.setIsExpired(0);
        studentAccountVerificationRepository.save(learnerVerification);
    }

    private static final String SPECIAL_PHONE = "8801448346";
    private static final String SPECIAL_OTP = "156112";
    private static final String GLOBAL_BYPASS_OTP = "9999";
    private static final String TENANT_BYPASS_OTP = "4242";

    /**
     * The hardcoded codes in this class (9999 and 4242 for any phone, and the fixed code for
     * SPECIAL_PHONE) are for dev and UAT convenience. They must never authenticate anyone in
     * production: they are literals in source, so anybody who can read the repository knows them.
     *
     * They used to apply unconditionally. GET /api/v1/learner/verifyOTP?phoneNumber=..&otp=9999
     * returned a full session for any learner on production, and the faculty and user verify
     * endpoints reach the same code.
     *
     * Fails closed: if the environment cannot be determined the codes are treated as forbidden.
     */
    private boolean hardcodedCodesAllowed() {
        return testOtpService != null && !testOtpService.isProductionEnvironment();
    }

    private String normalizePhone(String phone) {
        if (phone == null) return null;
        String digits = phone.trim().replaceAll("\\D", "");
        return digits.isEmpty() ? null : digits;
    }

    private boolean isGlobalBypassAllowed(String phone, String otpNorm) {
        if (otpNorm == null || !hardcodedCodesAllowed()) return false;
        String otpTrim = otpNorm.trim();
        if (!(GLOBAL_BYPASS_OTP.equalsIgnoreCase(otpTrim) || TENANT_BYPASS_OTP.equalsIgnoreCase(otpTrim))) return false;
        // Exception: for this number, do NOT allow the global bypass (must use real OTP or SPECIAL_OTP).
        String p = normalizePhone(phone);
        return p == null || !SPECIAL_PHONE.equals(p);
    }

    @Override
    public boolean verifyOTP(String phoneNumber, String otp) {
        String phone = normalizePhone(phoneNumber);
        String otpNorm = (otp != null) ? otp.trim() : null;
        // UAT/E2E support: fixed OTP for whitelisted phones only (never a global bypass).
        if (testOtpService != null && testOtpService.matchesTestOtp(phone, otpNorm)) {
            return true;
        }
        if (isGlobalBypassAllowed(phone, otpNorm)) {
            return true;
        }
        if (SPECIAL_PHONE.equals(phone)) {
            // For this number: accept real SMS OTP or the secondary bypass; 9999 does not apply
            String storedOtp = studentAccountVerificationRepository.getOTPByPhoneNumber(phone);
            return otpNorm != null && ((hardcodedCodesAllowed() && otpNorm.equals(SPECIAL_OTP)) || otpNorm.equalsIgnoreCase(storedOtp != null ? storedOtp.trim() : ""));
        }
        String storedOtp = studentAccountVerificationRepository.getOTPByPhoneNumber(phone);
        if (storedOtp == null) {
            return false;
        }
        return otpNorm != null && otpNorm.equalsIgnoreCase(storedOtp.trim());
    }

    @Override
    public void saveInstructorAccountVerification(String phoneNumber, String otp) {
        try {
            String phone = (phoneNumber != null) ? phoneNumber.trim() : null;
            Faculty instructor = instructorService.getFacultyDetails(phone);
            FacultyVerification instructorVerification = new FacultyVerification();
            instructorVerification.setFacultyId(instructor.getId());
            instructorVerification.setOtp(otp);
            instructorVerification.setMaxResendAttempts(3);
            instructorVerification.setIncorrectAttempts(1);
            instructorVerification.setPhoneNumber(phone);
            instructorVerification.setVerifyStatus(false);
            instructorVerification.setIsDeleted(false);
            instructorVerification.setIsExpired(0);
            instructorVerificationRepository.save(instructorVerification);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            String errorMsg = e.getMessage() != null ? e.getMessage() : "";
            if (errorMsg.contains("Field 'id' doesn't have a default value") || 
                errorMsg.contains("doesn't have a default value")) {
                throw new RuntimeException(
                    "Database configuration error: 'faculty_acct_verification' table id column must have AUTO_INCREMENT. " +
                    "Please run: ALTER TABLE faculty_acct_verification MODIFY COLUMN id INT AUTO_INCREMENT;", e);
            }
            throw e;
        } catch (org.springframework.orm.jpa.JpaSystemException e) {
            // Hibernate wraps SQLException in JpaSystemException
            Throwable cause = e.getCause();
            if (cause != null) {
                String causeMsg = cause.getMessage() != null ? cause.getMessage() : "";
                if (causeMsg.contains("Field 'id' doesn't have a default value") || 
                    causeMsg.contains("doesn't have a default value")) {
                    throw new RuntimeException(
                        "Database configuration error: 'faculty_acct_verification' table id column must have AUTO_INCREMENT. " +
                        "Please run: ALTER TABLE faculty_acct_verification MODIFY COLUMN id INT AUTO_INCREMENT;", e);
                }
            }
            throw e;
        }
    }

    @Override
    public boolean verifyInstructorOTP(String phoneNumber, String otp) {
        String phone = (phoneNumber != null) ? phoneNumber.trim() : null;
        String otpNorm = (otp != null) ? otp.trim() : null;
        // UAT/E2E support: fixed OTP for whitelisted phones only (never a global bypass).
        if (testOtpService != null && testOtpService.matchesTestOtp(phone, otpNorm)) {
            return true;
        }
        if (isGlobalBypassAllowed(phone, otpNorm)) {
            return true;
        }
        if (SPECIAL_PHONE.equals(phone)) {
            String storedOtp = instructorVerificationRepository.getOTPByPhoneNumber(phone);
            return otpNorm != null && ((hardcodedCodesAllowed() && otpNorm.equals(SPECIAL_OTP)) || otpNorm.equalsIgnoreCase(storedOtp != null ? storedOtp.trim() : ""));
        }
        String storedOtp = instructorVerificationRepository.getOTPByPhoneNumber(phone);
        if (storedOtp == null) {
            return false;
        }
        return otpNorm != null && otpNorm.equalsIgnoreCase(storedOtp.trim());
    }

    @Override
    public boolean verifyAlternateOTP(int studentId, String otp) {
        String otpNorm = (otp != null) ? otp.trim() : null;
        String phone = studentAccountVerificationRepository.getPhoneByStudentId(studentId);
        // UAT/E2E support: fixed OTP for whitelisted phones only (never a global bypass).
        if (testOtpService != null && testOtpService.matchesTestOtp(phone, otpNorm)) {
            return true;
        }
        if (isGlobalBypassAllowed(phone, otpNorm)) {
            return true;
        }
        if (SPECIAL_PHONE.equals(phone != null ? phone.trim() : null)) {
            // For this number: accept real SMS OTP or secondary bypass; 9999 does not apply
            String storedOtp = studentAccountVerificationRepository.getOTPByStudentId(studentId);
            return otpNorm != null && ((hardcodedCodesAllowed() && otpNorm.equals(SPECIAL_OTP)) || otpNorm.equalsIgnoreCase(storedOtp != null ? storedOtp : ""));
        }
        String storedOtp = studentAccountVerificationRepository.getOTPByStudentId(studentId);
        return otpNorm != null && storedOtp != null && otpNorm.equalsIgnoreCase(storedOtp);
    }

    @Override
    public void saveAlternateAccountVerification(String rollNumber, String otp, int studentId) throws Exception {
        Learner learner = studentService.getLearnerDetails(String.valueOf(studentId));
        LearnerVerification learnerVerification = new LearnerVerification();
        learnerVerification.setLearnerId(learner.getId());
        learnerVerification.setOtp(otp);
        learnerVerification.setMaxResendAttempts(3);
        learnerVerification.setIncorrectAttempts(1);
        learnerVerification.setVerifyStatus(false);
        learnerVerification.setIsDeleted(false);
        learnerVerification.setRollNumber(rollNumber);
        studentAccountVerificationRepository.save(learnerVerification);
    }

    @Override
    public void savePreUserPhoneOtp(String phoneNumber, String otp) {
        String phone = normalizePhone(phoneNumber);
        // Learner doesn't exist yet, so use learner_id = 0 as placeholder
        LearnerVerification learnerVerification = new LearnerVerification();
        learnerVerification.setLearnerId(0); // Placeholder since learner doesn't exist yet
        learnerVerification.setOtp(otp);
        learnerVerification.setMaxResendAttempts(3);
        learnerVerification.setIncorrectAttempts(0);
        learnerVerification.setPhoneNumber(phone);
        learnerVerification.setVerifyStatus(false);
        learnerVerification.setIsDeleted(false);
        learnerVerification.setIsExpired(0);
        studentAccountVerificationRepository.save(learnerVerification);
    }

    @Override
    public boolean verifyPreUserPhoneOtp(String phoneNumber, String otp) {
        String phone = normalizePhone(phoneNumber);
        String otpNorm = (otp != null) ? otp.trim() : null;
        // UAT/E2E support: fixed OTP for whitelisted phones only (never a global bypass).
        if (testOtpService != null && testOtpService.matchesTestOtp(phone, otpNorm)) {
            return true;
        }
        if (isGlobalBypassAllowed(phone, otpNorm)) {
            return true;
        }
        // Verify OTP using phone number lookup (most recent non-expired OTP)
        String storedOtp = studentAccountVerificationRepository.getOTPByPhoneNumber(phone);
        return otpNorm != null && storedOtp != null && otpNorm.equalsIgnoreCase(storedOtp.trim());
    }

    @Override
    public void savePreUserEmailOtp(String email, String otp) {
        // Store email in phoneNumber field (legacy table design) and use learner_id = 0 as placeholder.
        LearnerVerification learnerVerification = new LearnerVerification();
        learnerVerification.setLearnerId(0); // Placeholder since learner doesn't exist yet
        learnerVerification.setOtp(otp);
        learnerVerification.setMaxResendAttempts(3);
        learnerVerification.setIncorrectAttempts(0);
        learnerVerification.setPhoneNumber(email.toLowerCase().trim()); // Store email in phoneNumber field
        learnerVerification.setVerifyStatus(false);
        learnerVerification.setIsDeleted(false);
        learnerVerification.setIsExpired(0);
        studentAccountVerificationRepository.save(learnerVerification);
    }

    @Override
    public boolean verifyPreUserEmailOtp(String email, String otp) {
        String otpNorm = (otp != null) ? otp.trim() : null;
        // UAT/E2E support: fixed OTP for whitelisted identities only (never a global bypass).
        if (testOtpService != null && testOtpService.matchesTestOtp(email, otpNorm)) {
            return true;
        }
        // For email OTP flow, allow the global bypass OTP (no special-phone exception applies).
        if (hardcodedCodesAllowed() && otpNorm != null && (GLOBAL_BYPASS_OTP.equalsIgnoreCase(otpNorm.trim()) || TENANT_BYPASS_OTP.equalsIgnoreCase(otpNorm.trim()))) {
            return true;
        }
        // Verify OTP using email lookup (email stored in phoneNumber field)
        String storedOtp = studentAccountVerificationRepository.getOTPByEmail(email.toLowerCase().trim());
        return otpNorm != null && storedOtp != null && otpNorm.equalsIgnoreCase(storedOtp.trim());
    }
}

