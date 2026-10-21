package com._42students.lms.repository;

import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Query;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Full test run, 15 Oct 2026: placement notifications were saved for the whole class with no learner, so every classmate read
 * "You have successfully applied for ..." and admin notes like "Rohit accepted the offer"; class-0 notifications with no learner
 * ("Project created") reached every student of every college. Two guards: the student feeds never show a learner-less JOB
 * notification or a class-0 one without a course, and every learner recipient carries the learner's id.
 */
class NotificationLearnerScopeTest {

    private static String query(String method, Class<?>... params) throws NoSuchMethodException {
        return NotificationRepository.class.getMethod(method, params).getAnnotation(Query.class).value();
    }

    @Test
    void studentFeedsKeepLearnerlessPlacementNoticesAndOtherClassesOut() throws Exception {
        List<String> feeds = List.of(
                query("fetchForLearner", int.class, int.class, int.class),
                query("getNotificationsByClassIdForLearner", int.class, int.class),
                query("getNotificationsByClassIdForLearner", int.class, int.class, org.springframework.data.domain.Pageable.class));
        for (String q : feeds) {
            assertTrue(q.contains("notification_type <> 'JOB'"), q);
            assertTrue(q.contains("learner_id=:learnerId"), q);
            assertFalse(q.contains("(class_id=:classId or class_id=0)) or learner_id"), "class 0 open to every student: " + q);
        }
        assertTrue(feeds.get(0).contains("class_id=0 and course_id > 0"), "a course-wide notice still reaches the course's students");
    }

    @Test
    void everyLearnerRecipientCarriesTheLearnersId() throws IOException {
        Pattern builder = Pattern.compile("NotificationRecipientDTO\\.builder\\(\\)(.*?)\\.build\\(\\)", Pattern.DOTALL);
        try (Stream<Path> files = Files.walk(Path.of("src/main/java"))) {
            for (Path f : files.filter(p -> p.toString().endsWith(".java")).toList()) {
                Matcher m = builder.matcher(Files.readString(f));
                while (m.find()) {
                    String chain = m.group(1);
                    if (chain.contains("learner.get")) {
                        assertTrue(chain.contains(".learnerId("), f + ": a learner's notification without .learnerId(...) goes to the whole class");
                    }
                }
            }
        }
    }
}
