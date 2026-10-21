package com._42students.lms.repository;

import com._42students.lms.model.Notification;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;

import java.lang.reflect.Method;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Full test run, 15 Oct 2026 (finding #5): learner_id also held mentors' faculty ids, and learners and faculty are numbered
 * separately, so student #12 saw mentor #12's "You were assigned as mentor" and mentor #12's feed showed student #12's personal
 * notices. recipient_type (V227) says whose id it is; these guards keep every feed and sender honest about it.
 */
class NotificationRecipientTypeTest {

    private static String query(String method, Class<?>... params) throws NoSuchMethodException {
        return NotificationRepository.class.getMethod(method, params).getAnnotation(Query.class).value();
    }

    @Test
    void studentFeedsNeverMatchAFacultyRowByNumber() throws Exception {
        for (String q : List.of(
                query("fetchForLearner", int.class, int.class, int.class),
                query("getNotificationsByClassIdForLearner", int.class, int.class),
                query("getNotificationsByClassIdForLearner", int.class, int.class, Pageable.class))) {
            assertTrue(q.contains("learner_id=:learnerId and (recipient_type is null or recipient_type <> 'FACULTY')"), q);
        }
    }

    @Test
    void theRecipientFeedFiltersByKind() throws Exception {
        String q = query("findByRecipientId", int.class, String.class, Pageable.class);
        assertTrue(q.contains("coalesce(recipient_type, 'LEARNER')=:recipientType"), q);
    }

    @Test
    void staffClassFeedsShareClassZeroOnlyWhenItNamesNobody() throws Exception {
        for (String q : List.of(
                query("fetch", int.class, int.class),
                query("getNotificationsByClassId", int.class),
                query("getNotificationsByClassId", int.class, Pageable.class),
                query("countByClassId", int.class))) {
            assertTrue(q.contains("(class_id=0 and (learner_id is null or learner_id=0))"), q);
            assertFalse(q.contains("class_id=:classId or class_id=0)"), "every personal class-0 row open to all staff: " + q);
        }
    }

    @Test
    void aNamedRecipientIsALearnerUnlessTheSenderSaidFaculty() throws Exception {
        Method defaults = Notification.class.getDeclaredMethod("defaultRecipientType");
        defaults.setAccessible(true);

        Notification learnerNotice = new Notification();
        learnerNotice.setLearnerId(12);
        defaults.invoke(learnerNotice);
        assertEquals(Notification.RECIPIENT_LEARNER, learnerNotice.getRecipientType());

        Notification mentorNotice = new Notification();
        mentorNotice.setLearnerId(12);
        mentorNotice.setRecipientType(Notification.RECIPIENT_FACULTY);
        defaults.invoke(mentorNotice);
        assertEquals(Notification.RECIPIENT_FACULTY, mentorNotice.getRecipientType());

        Notification classNotice = new Notification();
        classNotice.setRecipientType(Notification.RECIPIENT_FACULTY);
        defaults.invoke(classNotice);
        assertNull(classNotice.getRecipientType(), "a notice that names nobody has no recipient type");
    }

    @Test
    void projectsNeverSendAMentorsIdAsALearners() throws Exception {
        String src = Files.readString(Path.of("src/main/java/com/_42students/lms/service/impl/ProjectWorkspaceServiceImpl.java"));
        Matcher m = Pattern.compile("notifyProjectLearners\\((.*?)\\);", Pattern.DOTALL).matcher(src);
        int calls = 0;
        while (m.find()) {
            calls++;
            String args = m.group(1);
            assertFalse(args.matches("(?s).*\\b(mentorIds|mentorId|mentor\\.getId\\(\\)|getPreviousMentorIds|getProjectMentorIds)\\b.*"),
                    "a mentor notice must go through notifyProjectFaculty: notifyProjectLearners(" + args + ")");
        }
        assertTrue(calls > 5, "the guard found the learner notices");
        assertFalse(Pattern.compile("createNotification\\([^;]*mentor\\.getId\\(\\)").matcher(src).find(),
                "the bulk mentor notices use createFacultyNotification");
    }
}
