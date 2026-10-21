package com._42students.lms.emailtest;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.test.context.TestComponent;
import org.springframework.context.annotation.Import;

/**
* Minimal application for email template flow tests. Only loads the test config (no JPA, no exam, no other services).
 *
 * MUST stay in this package. It previously lived in com._42students.lms, where it shadowed the real
 * LmsApplication for every test slice in a sibling package: @WebMvcTest searches upward from the test
 * class for the nearest @SpringBootConfiguration, found this one first, and inherited its
 * scanBasePackages = "...emailtest" — so no @RestController was ever registered and every slice test
 * 404'd. Keeping it beside the tests it serves means controller slices resolve LmsApplication instead.
 *
 * @TestComponent keeps it out of LmsApplication's component scan in every @SpringBootTest. Without
 * it the full-context integration tests picked this class up, its @Import registered a Mockito
 * NotificationService named "notificationService", and every field named notificationService
 * (NotificationController, the scheduler, ...) silently got the mock instead of the real service.
 */
@TestComponent
@SpringBootApplication(scanBasePackages = "com._42students.lms.emailtest")
@Import(EmailTemplateFlowTestConfig.class)
public class EmailTemplateTestApplication {

    public static void main(String[] args) {
        SpringApplication.run(EmailTemplateTestApplication.class, args);
    }
}
