package com._42students.lms.service;

import java.util.Map;

/**
 * Service interface for sending SMS messages.
 * Implementations can swap between different SMS providers.
 */
public interface SmsService {
    
    /**
     * Send an OTP SMS to the given phone number.
     * Uses template system if available, falls back to hardcoded template
     * Defaults to LMS context for backward compatibility
     * @param phoneNumber recipient phone number
     * @param otp the OTP code to send
     * @return true if SMS was sent successfully
     */
    boolean sendOtp(String phoneNumber, String otp);
    
    /**
     * Send an OTP SMS to the given phone number with specified context.
     * Uses template system if available, falls back to hardcoded template
     * @param phoneNumber recipient phone number
     * @param otp the OTP code to send
     * @param context template context
     * @return true if SMS was sent successfully
     */
    boolean sendOtp(String phoneNumber, String otp, NotificationTemplateContext context);
    
    /**
     * Send a notification SMS to the given phone number.
     * Uses template system if available
     * @param phoneNumber recipient phone number
     * @param message the message content
     * @return true if SMS was sent successfully
     */
    boolean sendNotification(String phoneNumber, String message);
    
    /**
     * Send SMS using template system (legacy; job-related events prefer sendJobUpdateSms).
     */
    boolean sendSmsWithTemplate(String templateKey, String phoneNumber, Map<String, Object> variables, NotificationTemplateContext context);

    /**
     * Send TRAI-approved job update SMS. Single template: {#var#} = recipient name.
     * Use for: job application confirmation, status, interview scheduled, offer extended, rejected, interview reminder, interview confirmed.
     */
    boolean sendJobUpdateSms(String phoneNumber, String recipientName);
}

