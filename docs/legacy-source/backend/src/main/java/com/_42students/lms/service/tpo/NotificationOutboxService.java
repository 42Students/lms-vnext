package com._42students.lms.service.tpo;

import com._42students.lms.model.tpo.NotificationOutboxEntry;
import com._42students.lms.repository.tpo.NotificationOutboxRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Every student/recruiter notification goes through this outbox instead of being sent inline. A
 * 30-second hold on undoable bulk actions is what makes "Undo never lies" true; cascading
 * actions (offer release, accept, cancel, close) send immediately with no undo, per the
 * confirm-with-preview principle. See TPO V1 - Locked.docx §1 and §10, and the engineering
 * review's build-order item #2 (this + ApplicationTransitionService come before any UI).
 *
 * V1 honesty note: APP-channel entries are the notification itself (the frontend polls
 * status=SENT rows for the recipient — no separate "Notification" row needed). EMAIL uses
 * ZeptoMailServiceImpl's generic path where a template exists; SMS needs DLT-registered
 * templates that do not exist yet (see ExotelSmsServiceImpl's empty EXOTEL_*_DLT_TEMPLATE_ID
 * defaults) — until those are registered, SMS rows are marked FAILED with a clear reason
 * instead of silently pretending to have sent.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationOutboxService {

    private final NotificationOutboxRepository outboxRepository;
    private final NamedParameterJdbcTemplate jdbc;
    private final TpoMailService mail;
    private final Environment environment;
    private final ObjectProvider<com._42students.lms.service.SmsService> smsProvider;

    private static final int UNDO_WINDOW_SECONDS = 30;

    /** Notices the TPO can switch off (key = the switch name in Settings). Everything else is always on and never counts against the SMS cap. */
    public static final Map<String, String> OPTIONAL_EVENT_SWITCH = Map.of(
            "DRIVE_PUBLISHED", "driveOpenEmail",
            "APPLICATION_STATUS_CHANGED", "resultApplied",
            "NUDGE", "nudges",
            "PREP_ASSIGNED", "prepAssigned",
            "DRIVE_UPDATED", "driveOpenEmail",
            "NOW_INELIGIBLE", "resultApplied");
    /**
     * Channels added on top of App for an event (TPO V1 - Locked.docx §1 notifications table). Callers enqueue App once; the rest follows from here.
     * SMS is only ever one of the four fixed always-on notices (round change, offer released or expiring, deadline today, cancellation).
     * Email to a student only for an interview (see STUDENT_EMAIL_EVENTS).
     */
    public static final Map<String, List<String>> EXTRA_CHANNELS = Map.ofEntries(
            Map.entry("ROUND_SCHEDULED", List.of("SMS", "EMAIL")),
            Map.entry("ROUND_REMINDER", List.of("EMAIL")),
            Map.entry("OFFER_RELEASED", List.of("SMS")),
            Map.entry("OFFER_EXPIRING", List.of("SMS")),
            Map.entry("DEADLINE_TODAY", List.of("SMS")),
            Map.entry("DRIVE_CANCELLED", List.of("SMS")));

    /**
     * 13 Oct 2026, owner: email to students costs per send, so a student gets exactly two emails: the sign-in code and their
     * interviews (slot set or changed, and the reminder). Everything else reaches students in the app only. Enforced here for every
     * caller (announcements included), at queueing and again at sending, so a row queued before this rule is not sent either.
     */
    public static final Set<String> STUDENT_EMAIL_EVENTS = Set.of("ROUND_SCHEDULED", "ROUND_REMINDER");

    static boolean studentEmailBlocked(String event, String recipientType, String channel) {
        return "EMAIL".equals(channel) && "LEARNER".equals(recipientType) && !STUDENT_EMAIL_EVENTS.contains(event);
    }

    /** Optional notices whose email is a daily digest. */
    public static final Set<String> DIGEST_EVENTS = Set.of("APPLICATION_STATUS_CHANGED", "NUDGE", "PREP_ASSIGNED", "NOW_INELIGIBLE");

    /**
     * The next 8 am India time, as the server's UTC wall-clock (send_after is compared with LocalDateTime.now() on a UTC JVM).
     * It was 8 am UTC, so the daily digest went out at 1:30 pm (19 Oct 2026).
     */
    static LocalDateTime nextDigestAt(java.time.ZonedDateTime nowIndia) {
        java.time.ZonedDateTime next = nowIndia.withHour(8).withMinute(0).withSecond(0).withNano(0);
        if (!next.isAfter(nowIndia)) next = next.plusDays(1);
        return next.withZoneSameInstant(java.time.ZoneOffset.UTC).toLocalDateTime();
    }

    /** Queues a notification. Pass undoGroupId to make it cancellable within the Undo window. */
    @Transactional
    public NotificationOutboxEntry enqueue(String event, String recipientType, Integer recipientId,
                                            String channel, Object payload, String undoGroupId, boolean holdForUndo) {
        if (studentEmailBlocked(event, recipientType, channel)) return null; // students: email only for interviews
        NotificationOutboxEntry entry = new NotificationOutboxEntry();
        entry.setEvent(event);
        entry.setRecipientType(recipientType);
        entry.setRecipientId(recipientId);
        entry.setChannel(channel);
        entry.setPayloadJson(payload);
        // send_after is a whole-second DATETIME: a row stamped at :24.7 is stored as :25 and would not be
        // due until the next second. Immediate sends are stamped a second early so they are due at once.
        entry.setSendAfter(holdForUndo
                ? LocalDateTime.now().plusSeconds(UNDO_WINDOW_SECONDS)
                : LocalDateTime.now().minusSeconds(1));
        // Optional notices go out as one daily email per student instead of one email each (TPO V1 - Locked.docx §1 notifications table).
        if ("EMAIL".equals(channel) && DIGEST_EVENTS.contains(event)) {
            entry.setSendAfter(nextDigestAt(java.time.ZonedDateTime.now(java.time.ZoneId.of("Asia/Kolkata"))));
        }
        entry.setUndoGroupId(undoGroupId);
        entry.setStatus("PENDING");
        entry.setCreatedAt(LocalDateTime.now());
        NotificationOutboxEntry saved = outboxRepository.save(entry);
        if ("APP".equals(channel) && "LEARNER".equals(recipientType) && EXTRA_CHANNELS.containsKey(event)) {
            for (String extra : EXTRA_CHANNELS.get(event)) enqueue(event, recipientType, recipientId, extra, payload, undoGroupId, holdForUndo);
        }
        return saved;
    }

    /** Enqueues the same event on every requested channel. */
    @Transactional
    public void enqueueMulti(String event, String recipientType, Integer recipientId,
                              List<String> channels, Object payload, String undoGroupId, boolean holdForUndo) {
        for (String channel : channels) {
            enqueue(event, recipientType, recipientId, channel, payload, undoGroupId, holdForUndo);
        }
    }

    /** Cancels every still-pending row in an undo group (called by the Undo button). */
    @Transactional
    public int cancelUndoGroup(String undoGroupId) {
        List<NotificationOutboxEntry> pending = outboxRepository.findByUndoGroupIdAndStatus(undoGroupId, "PENDING");
        for (NotificationOutboxEntry e : pending) {
            e.setStatus("CANCELLED");
        }
        outboxRepository.saveAll(pending);
        return pending.size();
    }

    public String newUndoGroupId() {
        return UUID.randomUUID().toString();
    }

    /** Polls every 10s; SKIP LOCKED lets several pods run this without double-sending. */
    @Scheduled(fixedDelay = 10_000)
    @Transactional
    public void dispatchDue() {
        List<NotificationOutboxEntry> due;
        try {
            due = outboxRepository.claimDue(LocalDateTime.now(), 200);
        } catch (Exception e) {
            log.warn("notification_outbox: claim failed, will retry next tick", e);
            return;
        }
        // Digest emails: one per student, built from all their due rows.
        Map<String, List<NotificationOutboxEntry>> digests = new LinkedHashMap<>();
        for (NotificationOutboxEntry entry : due) {
            if ("EMAIL".equals(entry.getChannel()) && DIGEST_EVENTS.contains(entry.getEvent()) && !studentEmailBlocked(entry.getEvent(), entry.getRecipientType(), entry.getChannel())) {
                digests.computeIfAbsent(entry.getRecipientType() + ":" + entry.getRecipientId(), k -> new ArrayList<>()).add(entry);
            } else {
                dispatchOne(entry);
            }
        }
        for (List<NotificationOutboxEntry> group : digests.values()) dispatchDigest(group);
    }

    private record Contact(String email, String phone, String name, Integer collegeId) {}

    private Contact contactOf(String recipientType, Integer id) {
        String sql = switch (recipientType) {
            case "LEARNER" -> "SELECT contact_mail AS email, contact_mobile AS phone, first_name AS name, college_id AS college FROM learner WHERE id = :id";
            case "RECRUITER" -> "SELECT contact_mail AS email, contact_mobile AS phone, first_name AS name, NULL AS college FROM recruiter WHERE id = :id";
            case "FACULTY" -> "SELECT contact_mail AS email, contact_mobile AS phone, first_name AS name, college_id AS college FROM faculty WHERE id = :id";
            default -> null;
        };
        if (sql == null) return null;
        List<Map<String, Object>> rows = jdbc.queryForList(sql, new MapSqlParameterSource("id", id));
        if (rows.isEmpty()) return null;
        Map<String, Object> r = rows.get(0);
        return new Contact((String) r.get("email"), (String) r.get("phone"), (String) r.get("name"),
                r.get("college") == null ? null : ((Number) r.get("college")).intValue());
    }

    /** Merge variables for a template: the payload's values as text, plus the person's name. */
    private Map<String, String> mergeFor(NotificationOutboxEntry entry, Contact c) {
        Map<String, String> m = new LinkedHashMap<>();
        if (entry.getPayloadJson() instanceof Map<?, ?> p) p.forEach((k, v) -> m.put(String.valueOf(k), v == null ? "" : String.valueOf(v)));
        // A stage or decision code reads as words in an email too (the in-app notice does the same).
        if ("LEARNER".equals(entry.getRecipientType()) && m.get("status") != null) m.put("status", LearnerPlacementService.STATUS_WORDS.getOrDefault(m.get("status"), m.get("status").toLowerCase(java.util.Locale.ROOT)));
        m.put("name", c == null || c.name() == null ? "" : c.name());
        addDriveContext(m);
        return m;
    }

    /** Payloads that carry only an id (jobId, applicationId, offerId, roundId) still get company and role for the template. */
    private void addDriveContext(Map<String, String> m) {
        if (m.containsKey("company") && !m.get("company").isEmpty()) return;
        String sql;
        String id;
        if (m.get("jobId") != null) { sql = "SELECT company_name AS company, job_title AS role FROM job WHERE id = :id"; id = m.get("jobId"); }
        else if (m.get("applicationId") != null) { sql = "SELECT j.company_name AS company, j.job_title AS role FROM job_application a JOIN job j ON j.id = a.job_id WHERE a.id = :id"; id = m.get("applicationId"); }
        else if (m.get("offerId") != null) { sql = "SELECT j.company_name AS company, j.job_title AS role FROM job_offer o JOIN job_application a ON a.id = o.application_id JOIN job j ON j.id = a.job_id WHERE o.id = :id"; id = m.get("offerId"); }
        else if (m.get("roundId") != null) { sql = "SELECT j.company_name AS company, j.job_title AS role FROM job_round r JOIN job j ON j.id = r.job_id WHERE r.id = :id"; id = m.get("roundId"); }
        else return;
        try {
            List<Map<String, Object>> rows = jdbc.queryForList(sql, new MapSqlParameterSource("id", Long.parseLong(id)));
            if (!rows.isEmpty()) {
                m.put("company", String.valueOf(rows.get(0).get("company")));
                m.put("role", String.valueOf(rows.get(0).get("role")));
            }
        } catch (Exception ignored) {
            // The email still goes out with what the payload had.
        }
    }

    /** True when the college has switched this optional notice off in Settings. */
    private boolean switchedOff(String event, Integer collegeId) {
        String key = OPTIONAL_EVENT_SWITCH.get(event);
        if (key == null || collegeId == null) return false;
        List<String> raw = jdbc.queryForList("SELECT notify_toggles_json FROM tpo_college_settings WHERE college_id = :c", new MapSqlParameterSource("c", collegeId), String.class);
        if (raw.isEmpty() || raw.get(0) == null) return false;
        try {
            Object v = new com.fasterxml.jackson.databind.ObjectMapper().readValue(raw.get(0), Map.class).get(key);
            return Boolean.FALSE.equals(v);
        } catch (Exception e) {
            return false;
        }
    }

    /** Optional SMS stop when the college's monthly cap is used up. Always-on notices never count and are never blocked. */
    private boolean smsCapReached(String event, Integer collegeId) {
        if (!OPTIONAL_EVENT_SWITCH.containsKey(event) || collegeId == null) return false;
        List<Integer> cap = jdbc.queryForList("SELECT sms_monthly_cap FROM tpo_college_settings WHERE college_id = :c", new MapSqlParameterSource("c", collegeId), Integer.class);
        int limit = cap.isEmpty() ? 500 : cap.get(0);
        Long used = jdbc.queryForObject("SELECT COUNT(*) FROM notification_outbox o JOIN learner l ON o.recipient_type = 'LEARNER' AND l.id = o.recipient_id " +
                "WHERE l.college_id = :c AND o.channel = 'SMS' AND o.status = 'SENT' AND o.sent_at >= DATE_FORMAT(NOW(), '%Y-%m-01') AND o.event IN (:ev)",
                new MapSqlParameterSource("c", collegeId).addValue("ev", OPTIONAL_EVENT_SWITCH.keySet()), Long.class);
        return used != null && used >= limit;
    }

    private void fail(NotificationOutboxEntry e, String why) { e.setStatus("FAILED"); e.setFailureReason(why); }
    private void sent(NotificationOutboxEntry e) { e.setStatus("SENT"); e.setSentAt(LocalDateTime.now()); }

    private void dispatchOne(NotificationOutboxEntry entry) {
        try {
            if (studentEmailBlocked(entry.getEvent(), entry.getRecipientType(), entry.getChannel())) {
                entry.setStatus("CANCELLED");
                entry.setFailureReason("Students get email only for interviews; the in-app notice was shown");
                outboxRepository.save(entry);
                return;
            }
            Contact c = "APP".equals(entry.getChannel()) ? null : contactOf(entry.getRecipientType(), entry.getRecipientId());
            if (!"APP".equals(entry.getChannel()) && switchedOff(entry.getEvent(), c == null ? null : c.collegeId())) {
                entry.setStatus("CANCELLED");
                entry.setFailureReason("Switched off in Settings");
                outboxRepository.save(entry);
                return;
            }
            switch (entry.getChannel()) {
                case "APP" -> sent(entry); // The row itself is the in-app notification; nothing further to send.
                case "SMS" -> {
                    String smsName = "offer-expiring".equals(TpoMailService.nameForEvent(entry.getEvent())) ? "offer-released" : TpoMailService.nameForEvent(entry.getEvent());
                    String text = environment.getProperty("tpo.sms.text." + smsName);
                    if (text == null || text.isBlank()) {
                        fail(entry, "SMS DLT template not yet registered for event " + entry.getEvent()); // honest: nothing was sent
                    } else if (c == null || c.phone() == null || c.phone().isBlank()) {
                        fail(entry, "No phone number for this recipient");
                    } else if (smsCapReached(entry.getEvent(), c.collegeId())) {
                        fail(entry, "Monthly SMS cap reached");
                    } else {
                        String body = text;
                        for (Map.Entry<String, String> kv : mergeFor(entry, c).entrySet()) body = body.replace("{" + kv.getKey() + "}", kv.getValue());
                        com._42students.lms.service.SmsService sms = smsProvider.getIfAvailable();
                        if (sms != null && sms.sendNotification(c.phone(), body)) sent(entry); else fail(entry, "SMS provider did not accept the message");
                    }
                }
                case "EMAIL" -> {
                    if (c == null || c.email() == null || c.email().isBlank()) {
                        fail(entry, "No email address for this recipient");
                    } else {
                        String template = TpoMailService.nameForEvent(entry.getEvent());
                        // A student's interview emails come from their college (19 Oct 2026); others keep the platform's name.
                        TpoMailService.Result r = "LEARNER".equals(entry.getRecipientType()) && STUDENT_EMAIL_EVENTS.contains(entry.getEvent())
                                ? mail.sendToStudentAsCollege(template, c.email(), mergeFor(entry, c), c.collegeId())
                                : mail.send(template, c.email(), mergeFor(entry, c));
                        switch (r) {
                            case SENT -> sent(entry);
                            case NOT_CONFIGURED -> fail(entry, "No email template configured: zepto.template.tpo." + TpoMailService.nameForEvent(entry.getEvent()));
                            default -> fail(entry, "The email service did not accept the message");
                        }
                    }
                }
                default -> fail(entry, "Unknown channel " + entry.getChannel());
            }
        } catch (Exception e) {
            fail(entry, e.getMessage());
            log.error("notification_outbox dispatch failed for id={}", entry.getId(), e);
        }
        outboxRepository.save(entry);
    }

    /** One email for a student summarising everything optional that happened since the last digest. */
    private void dispatchDigest(List<NotificationOutboxEntry> group) {
        NotificationOutboxEntry first = group.get(0);
        try {
            Contact c = contactOf(first.getRecipientType(), first.getRecipientId());
            List<NotificationOutboxEntry> live = new ArrayList<>();
            for (NotificationOutboxEntry e : group) {
                if (switchedOff(e.getEvent(), c == null ? null : c.collegeId())) { e.setStatus("CANCELLED"); e.setFailureReason("Switched off in Settings"); outboxRepository.save(e); }
                else live.add(e);
            }
            if (live.isEmpty()) return;
            if (c == null || c.email() == null || c.email().isBlank()) {
                live.forEach(e -> { fail(e, "No email address for this recipient"); outboxRepository.save(e); });
                return;
            }
            String lines = live.stream().map(e -> TpoMailService.nameForEvent(e.getEvent()).replace('-', ' ')).distinct().collect(Collectors.joining(", "));
            Map<String, String> merge = new LinkedHashMap<>();
            merge.put("name", c.name() == null ? "" : c.name());
            merge.put("count", String.valueOf(live.size()));
            merge.put("summary", lines);
            TpoMailService.Result r = mail.send("student-digest", c.email(), merge);
            for (NotificationOutboxEntry e : live) {
                switch (r) {
                    case SENT -> sent(e);
                    case NOT_CONFIGURED -> fail(e, "No email template configured: zepto.template.tpo.student-digest");
                    default -> fail(e, "The email service did not accept the message");
                }
                outboxRepository.save(e);
            }
        } catch (Exception ex) {
            log.error("notification_outbox digest failed for {}:{}", first.getRecipientType(), first.getRecipientId(), ex);
            group.forEach(e -> { fail(e, ex.getMessage()); outboxRepository.save(e); });
        }
    }
}
