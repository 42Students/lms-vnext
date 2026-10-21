package com._42students.lms.service;

import java.util.Map;

/**
 * Service interface for sending emails via ZeptoMail API.
 * All notification flows use NotificationDispatcherService.dispatch(); this service is used for
 * OTP verification email and for sending by template ID (dispatcher).
 */
public interface ZeptoMailService {



    /**
     * Send email by ZeptoMail template ID and merge variables (used by NotificationDispatcherService).
     *
     * @param zeptoTemplateId ZeptoMail template ID from config
     * @param toEmail        recipient email address
     * @param mergeInfo      template variables (key-value for placeholders in ZeptoMail template)
     * @throws Exception if email sending fails
     */
    void sendEmailWithTemplateId(String zeptoTemplateId, String toEmail, Map<String, String> mergeInfo) throws Exception;

    /** Same, with the sender name shown in the inbox (the address stays ours); null or blank keeps the platform's name. */
    default void sendEmailWithTemplateId(String zeptoTemplateId, String toEmail, Map<String, String> mergeInfo, String senderName) throws Exception {
        sendEmailWithTemplateId(zeptoTemplateId, toEmail, mergeInfo);
    }

    /** Same, with a Reply-To address (null keeps replies going to the sender address). */
    default void sendEmailWithTemplateId(String zeptoTemplateId, String toEmail, Map<String, String> mergeInfo, String senderName, String replyTo) throws Exception {
        sendEmailWithTemplateId(zeptoTemplateId, toEmail, mergeInfo, senderName);
    }

    /** Same, from another address on our verified domain (null keeps the platform's address). */
    default void sendEmailWithTemplateId(String zeptoTemplateId, String toEmail, Map<String, String> mergeInfo, String senderName, String replyTo, String fromAddress) throws Exception {
        sendEmailWithTemplateId(zeptoTemplateId, toEmail, mergeInfo, senderName, replyTo);
    }
}

