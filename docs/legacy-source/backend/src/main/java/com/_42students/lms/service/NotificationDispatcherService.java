package com._42students.lms.service;

import com._42students.lms.dto.request.NotificationRecipientDTO;
import com._42students.lms.enums.NotificationEvent;

import java.util.Map;

/**
 * Central dispatcher for notifications: In-App, Email (ZeptoMail), and TRAI SMS.
 * Uses NotificationEventRegistry for channel and in-code templates. OTP is not dispatched;
 * controllers call SmsService.sendOtp directly.
 */
public interface NotificationDispatcherService {

    /**
     * Dispatch notification for the given event to all configured channels (In-App, Email, SMS per registry).
     *
     * @param event     notification event (must not be SYSTEM_OTP_SMS)
     * @param context   template context
     * @param recipient recipient email, phone, name, classId, courseId
     * @param variables template variables for rendering and Zepto merge_info
     */
    void dispatch(NotificationEvent event, NotificationTemplateContext context,
                  NotificationRecipientDTO recipient, Map<String, Object> variables);
}

