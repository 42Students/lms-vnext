package com._42students.lms.emailtest;

import com._42students.lms.config.ZeptoMailTemplateIdResolver;
import com._42students.lms.service.impl.NotificationDispatcherServiceImpl;
import com._42students.lms.service.impl.ZeptoMailServiceImpl;
import com._42students.lms.service.NotificationDispatcherService;
import com._42students.lms.service.NotificationService;
import com._42students.lms.service.SmsService;
import com._42students.lms.service.ZeptoMailService;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.web.client.RestTemplate;

import static org.mockito.Mockito.mock;

/**
 * Minimal context for email template flow tests: only notification dispatch + ZeptoMail.
 * No component scan; only these beans are registered.
 */
@TestConfiguration
public class EmailTemplateFlowTestConfig {

    @Bean
    public RestTemplate emailTestRestTemplate() {
        return new RestTemplate();
    }

    @Bean
    public ZeptoMailTemplateIdResolver zeptoMailTemplateIdResolver(Environment environment) {
        return new ZeptoMailTemplateIdResolver(environment);
    }

    @Bean
    public ZeptoMailService zeptoMailService(RestTemplate emailTestRestTemplate) {
        return new ZeptoMailServiceImpl(emailTestRestTemplate);
    }

    @Bean
    public NotificationService notificationService() {
        return mock(NotificationService.class);
    }

    @Bean
    public SmsService smsService() {
        return mock(SmsService.class);
    }

    @Bean
    public NotificationDispatcherService notificationDispatcherService(
            NotificationService notificationService,
            ZeptoMailService zeptoMailService,
            SmsService smsService,
            ZeptoMailTemplateIdResolver zeptoMailTemplateIdResolver) {
        return new NotificationDispatcherServiceImpl(
                notificationService,
                zeptoMailService,
                smsService,
                zeptoMailTemplateIdResolver);
    }
}
