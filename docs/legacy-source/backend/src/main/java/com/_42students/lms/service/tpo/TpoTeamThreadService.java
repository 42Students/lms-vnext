package com._42students.lms.service.tpo;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * The placement team's conversations (Team module V1, docs/tpo-team/TEAM-MODULE-DESIGN-2026-10-12.md).
 *
 * Kinds: EVERYONE (one per college, everyone always follows), DRIVE / COMPANY / STUDENT (one per thing, also shown on that thing's
 * page) and TOPIC (free; may be private). Whole-team conversations are readable by every team member; following decides unread and
 * nothing else. You follow when you started, wrote, were mentioned or asked, pressed Follow, own the drive or company (computed, so
 * it moves with ownership), are in a private topic, or it is Everyone.
 *
 * A message body is plain text with two kinds of token the screen turns into chips: {@code @[Ravi Kumar](f:12)} (a person; also
 * {@code @[team](team)}) and {@code #[Omega · SDE](d:40)} / {@code #[Infosys](c:infosys)} / {@code #[Kiran Rao](s:991)}. Mentions are
 * read from the tokens on the server. Messages can be asks (one person, an optional "by" date) and decisions.
 * Nothing here is ever shown to recruiters or students: every endpoint is under /api/v1/tpo.
 */
@Service
@RequiredArgsConstructor
public class TpoTeamThreadService {

    public static final int MAX_BODY = 4000;
    public static final int EDIT_MINUTES = 15;
    public static final Set<String> KINDS = Set.of("EVERYONE", "DRIVE", "COMPANY", "STUDENT", "TOPIC");
    static final Pattern MENTION = Pattern.compile("@\\[([^\\]\\n]{1,80})\\]\\((f:(\\d{1,10})|team)\\)");
    static final Pattern CHIP = Pattern.compile("#\\[([^\\]\\n]{1,120})\\]\\(([dcs]):([^)\\n]{1,200})\\)");

    private final NamedParameterJdbcTemplate jdbc;
    private final TpoTeamService team;
    private final TpoAuditService audit;

    // ------------------------------------------------------------------------------------------------------------ who is in the team

    /** Everyone who is in the placement team at this college: TPO admins and the always-admin accounts. */
    public Set<Integer> teamIds(Integer collegeId) {
        Set<Integer> ids = new LinkedHashSet<>();
        for (Map<String, Object> m : team.team(collegeId)) if (m.get("facultyId") != null) ids.add(((Number) m.get("facultyId")).intValue());
        for (Map<String, Object> m : team.collegeAccounts(collegeId)) if (m.get("facultyId") != null) ids.add(((Number) m.get("facultyId")).intValue());
        return ids;
    }

    private void requireTeam(Integer collegeId, int me) {
        if (!teamIds(collegeId).contains(me)) throw new IllegalArgumentException("Only the placement team can use Team");
    }

    private String nameOf(int facultyId) {
        List<String> n = jdbc.queryForList("SELECT TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))) FROM faculty WHERE id = :f",
                new MapSqlParameterSource("f", facultyId), String.class);
        return n.isEmpty() || n.get(0) == null || n.get(0).isBlank() ? "Someone" : n.get(0);
    }

    private static String first(String name) {
        if (name == null || name.isBlank()) return "Someone";
        return name.trim().split("\\s+")[0];
    }

    // ------------------------------------------------------------------------------------------------------------ the list

    private static final String THREAD_ROWS =
            "SELECT t.id, t.kind, t.about_key AS aboutKey, t.is_private AS isPrivate, t.created_by_faculty_id AS createdBy, t.created_at AS createdAt, " +
            "  COALESCE(t.last_message_at, t.created_at) AS lastAt, t.title, " +
            "  CASE t.kind WHEN 'DRIVE' THEN (SELECT CONCAT(CASE WHEN j.company_name IS NULL OR j.company_name = '' THEN '' ELSE CONCAT(j.company_name, ' · ') END, j.job_title) " +
            "      FROM job j WHERE j.id = CAST(t.about_key AS UNSIGNED) AND j.college_id = t.college_id) " +
            "    WHEN 'STUDENT' THEN (SELECT TRIM(CONCAT(COALESCE(l.first_name, ''), ' ', COALESCE(l.last_name, ''))) FROM learner l " +
            "      WHERE l.id = CAST(t.about_key AS UNSIGNED) AND l.college_id = t.college_id) END AS liveTitle, " +
            "  tm.following AS followingSet, COALESCE(tm.muted, 0) AS muted, tm.last_read_at AS lastReadAt, (tm.faculty_id IS NOT NULL) AS isMember, " +
            "  CASE t.kind WHEN 'DRIVE' THEN COALESCE((SELECT j.owner_faculty_id = :me FROM job j WHERE j.id = CAST(t.about_key AS UNSIGNED)), 0) " +
            "    ELSE 0 END AS isOwner, " +
            "  (SELECT m.body FROM tpo_team_message m WHERE m.thread_id = t.id AND m.deleted_at IS NULL ORDER BY m.id DESC LIMIT 1) AS lastBody, " +
            "  (SELECT m.kind FROM tpo_team_message m WHERE m.thread_id = t.id AND m.deleted_at IS NULL ORDER BY m.id DESC LIMIT 1) AS lastKind, " +
            "  (SELECT f.first_name FROM tpo_team_message m JOIN faculty f ON f.id = m.author_faculty_id WHERE m.thread_id = t.id AND m.deleted_at IS NULL ORDER BY m.id DESC LIMIT 1) AS lastAuthor, " +
            "  (SELECT m.author_faculty_id FROM tpo_team_message m WHERE m.thread_id = t.id AND m.deleted_at IS NULL ORDER BY m.id DESC LIMIT 1) AS lastAuthorId, " +
            "  (SELECT COUNT(*) FROM tpo_team_message m WHERE m.thread_id = t.id AND m.kind = 'MESSAGE' AND m.deleted_at IS NULL AND m.author_faculty_id <> :me " +
            "     AND (tm.last_read_at IS NULL OR m.created_at > tm.last_read_at)) AS newCount, " +
            "  (SELECT COUNT(*) FROM tpo_team_mention x WHERE x.thread_id = t.id AND x.faculty_id = :me AND x.seen_at IS NULL) AS mentionsNew, " +
            "  (SELECT COUNT(*) FROM tpo_team_mention x WHERE x.thread_id = t.id AND x.faculty_id = :me) AS mentionsAll, " +
            "  (SELECT COUNT(*) FROM tpo_team_ask a WHERE a.thread_id = t.id AND a.done_at IS NULL AND a.cancelled_at IS NULL) AS openAsks, " +
            "  (SELECT COUNT(*) FROM tpo_team_ask a WHERE a.thread_id = t.id AND a.done_at IS NULL AND a.cancelled_at IS NULL AND a.assignee_faculty_id = :me) AS myOpenAsks, " +
            "  (SELECT COUNT(*) FROM tpo_team_message m WHERE m.thread_id = t.id AND m.is_decision = 1 AND m.deleted_at IS NULL) AS decisions " +
            "FROM tpo_team_thread t LEFT JOIN tpo_team_thread_member tm ON tm.thread_id = t.id AND tm.faculty_id = :me " +
            "WHERE t.college_id = :c AND t.archived_at IS NULL AND (t.is_private = 0 OR tm.faculty_id IS NOT NULL) ";

    /** Every conversation this person can read, Everyone first, then by last activity, with following / unread worked out. */
    @Transactional
    public List<Map<String, Object>> threads(Integer collegeId, int me) {
        requireTeam(collegeId, me);
        ensureEveryone(collegeId, me);
        List<Map<String, Object>> rows = jdbc.queryForList(THREAD_ROWS + "ORDER BY (t.kind = 'EVERYONE') DESC, lastAt DESC",
                new MapSqlParameterSource("c", collegeId).addValue("me", me));
        markCompanyOwner(collegeId, me, rows);
        for (Map<String, Object> r : rows) shape(r);
        return rows;
    }

    private void shape(Map<String, Object> r) {
        String kind = String.valueOf(r.get("kind"));
        boolean following = following(kind, r.get("followingSet"), truthy(r.get("isOwner")), truthy(r.get("isPrivate")), truthy(r.get("isMember")));
        boolean muted = truthy(r.get("muted"));
        long fresh = num(r.get("newCount"));
        r.put("following", following);
        r.put("muted", muted);
        r.put("unread", following && !muted ? fresh : 0);
        r.put("title", r.get("liveTitle") != null && !String.valueOf(r.get("liveTitle")).isBlank() ? r.get("liveTitle") : r.get("title"));
        String body = r.get("lastBody") == null ? null : preview(String.valueOf(r.get("lastBody")), 140);
        r.put("last", body == null ? null : ("SYSTEM".equals(r.get("lastKind")) || r.get("lastAuthor") == null ? body : r.get("lastAuthor") + ": " + body));
        r.put("isPrivate", truthy(r.get("isPrivate")));
        r.put("isOwner", truthy(r.get("isOwner")));
        r.remove("liveTitle");
        r.remove("lastBody");
        r.remove("lastKind");
        r.remove("followingSet");
        r.remove("isMember");
        r.remove("newCount");
    }

    /** A company's conversation is followed by whoever owns any of its contacts (names matched the way Engage matches them). */
    private void markCompanyOwner(Integer collegeId, int me, List<Map<String, Object>> rows) {
        if (rows.stream().noneMatch(r -> "COMPANY".equals(r.get("kind")))) return;
        Set<String> mine = new LinkedHashSet<>();
        for (String n : jdbc.queryForList("SELECT DISTINCT company_name FROM recruiter_lead WHERE college_id = :c AND owner_faculty_id = :me AND company_name IS NOT NULL",
                new MapSqlParameterSource("c", collegeId).addValue("me", me), String.class)) mine.add(TpoRecruiterLeadsHubService.companyKey(n));
        for (Map<String, Object> r : rows) if ("COMPANY".equals(r.get("kind"))) r.put("isOwner", mine.contains(String.valueOf(r.get("aboutKey"))) ? 1 : 0);
    }

    /**
     * Every way this college typed a company (trimmed, lower case) whose companyKey is this one: "Infosys", "Infosys Ltd" and
     * "infosys limited" are one company, as in Engage > Companies, so they are one conversation.
     */
    List<String> companySpellings(Integer collegeId, String key) {
        Set<String> out = new LinkedHashSet<>();
        for (String n : jdbc.queryForList("SELECT DISTINCT company_name FROM job WHERE college_id = :c AND company_name IS NOT NULL " +
                "UNION SELECT DISTINCT company_name FROM recruiter_lead WHERE college_id = :c AND company_name IS NOT NULL", new MapSqlParameterSource("c", collegeId), String.class)) {
            if (n != null && !n.isBlank() && key.equals(TpoRecruiterLeadsHubService.companyKey(n))) out.add(n.trim().toLowerCase());
        }
        return new ArrayList<>(out);
    }

    static boolean following(String kind, Object set, boolean owner, boolean isPrivate, boolean member) {
        if (set != null) return truthy(set);
        return "EVERYONE".equals(kind) || owner || (isPrivate && member);
    }

    /** The sidebar number: new messages in conversations you follow and haven't muted. */
    @Transactional
    public int unread(Integer collegeId, int me) {
        if (!teamIds(collegeId).contains(me)) return 0;
        int n = 0;
        for (Map<String, Object> r : threads(collegeId, me)) n += (int) num(r.get("unread"));
        return n;
    }

    /** Everyone: made the first time anyone at the college opens Team, with one line saying what it is for. */
    void ensureEveryone(Integer collegeId, int me) {
        int made = jdbc.update("INSERT IGNORE INTO tpo_team_thread (college_id, title, created_by_faculty_id, kind, about_key, is_private) " +
                "VALUES (:c, 'Everyone', :me, 'EVERYONE', 'everyone', 0)", new MapSqlParameterSource("c", collegeId).addValue("me", me));
        if (made == 1) {
            Long id = jdbc.queryForObject("SELECT id FROM tpo_team_thread WHERE college_id = :c AND kind = 'EVERYONE' AND about_key = 'everyone'",
                    new MapSqlParameterSource("c", collegeId), Long.class);
            system(id, me, "Everyone in the placement team is in this conversation, including people who join later. Use it for what the whole team should know.");
        }
    }

    /** Conversations whose topic, thing or messages match the words; each with the first matching line. */
    public List<Map<String, Object>> search(Integer collegeId, int me, String q) {
        requireTeam(collegeId, me);
        String words = q == null ? "" : q.trim();
        if (words.length() < 2) return List.of();
        String like = "%" + words.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT t.id AS threadId, (SELECT m.body FROM tpo_team_message m WHERE m.thread_id = t.id AND m.deleted_at IS NULL AND m.body LIKE :q ORDER BY m.id DESC LIMIT 1) AS hit " +
                "FROM tpo_team_thread t LEFT JOIN tpo_team_thread_member tm ON tm.thread_id = t.id AND tm.faculty_id = :me " +
                "WHERE t.college_id = :c AND t.archived_at IS NULL AND (t.is_private = 0 OR tm.faculty_id IS NOT NULL) AND (t.title LIKE :q " +
                "  OR EXISTS (SELECT 1 FROM tpo_team_message m WHERE m.thread_id = t.id AND m.deleted_at IS NULL AND m.body LIKE :q) " +
                "  OR (t.kind = 'DRIVE' AND EXISTS (SELECT 1 FROM job j WHERE j.id = CAST(t.about_key AS UNSIGNED) AND (j.job_title LIKE :q OR j.company_name LIKE :q))) " +
                "  OR (t.kind = 'STUDENT' AND EXISTS (SELECT 1 FROM learner l WHERE l.id = CAST(t.about_key AS UNSIGNED) AND (CONCAT(l.first_name, ' ', COALESCE(l.last_name, '')) LIKE :q OR l.roll_number LIKE :q)))) " +
                "ORDER BY COALESCE(t.last_message_at, t.created_at) DESC LIMIT 50",
                new MapSqlParameterSource("c", collegeId).addValue("me", me).addValue("q", like));
        for (Map<String, Object> r : rows) if (r.get("hit") != null) r.put("hit", preview(String.valueOf(r.get("hit")), 160));
        return rows;
    }

    // ------------------------------------------------------------------------------------------------------------ one conversation

    private Map<String, Object> threadRow(Integer collegeId, int me, long threadId) {
        List<Map<String, Object>> rows = jdbc.queryForList(THREAD_ROWS + "AND t.id = :t", new MapSqlParameterSource("c", collegeId).addValue("me", me).addValue("t", threadId));
        if (rows.isEmpty()) throw new IllegalArgumentException("Conversation not found");
        return rows.get(0);
    }

    /** A conversation someone can't read (another college's, or a private one they're not in) looks like it does not exist. */
    private Map<String, Object> requireReadable(Integer collegeId, int me, long threadId) {
        requireTeam(collegeId, me);
        Map<String, Object> row = threadRow(collegeId, me, threadId);
        markCompanyOwner(collegeId, me, List.of(row));
        shape(row);
        return row;
    }

    /** The conversation: its messages oldest first, people, open asks, decisions and what it is about. Reading marks it read. */
    @Transactional
    public Map<String, Object> open(Integer collegeId, int me, long threadId) {
        Map<String, Object> t = requireReadable(collegeId, me, threadId);
        String kind = String.valueOf(t.get("kind"));
        Set<Integer> teamNow = teamIds(collegeId);
        Map<String, Object> out = new LinkedHashMap<>();
        t.put("canLeave", "TOPIC".equals(kind) && truthy(t.get("isPrivate")));
        t.put("canRename", "TOPIC".equals(kind));
        out.put("thread", t);

        List<Map<String, Object>> messages = jdbc.queryForList(
                "SELECT * FROM (SELECT m.id, m.kind, m.author_faculty_id AS authorId, CASE WHEN m.deleted_at IS NULL THEN m.body END AS body, m.created_at AS createdAt, " +
                "  m.edited_at AS editedAt, (m.deleted_at IS NOT NULL) AS deleted, m.is_decision AS isDecision, (m.author_faculty_id = :me) AS mine, " +
                "  (m.kind = 'MESSAGE' AND m.deleted_at IS NULL AND m.author_faculty_id = :me AND m.created_at >= NOW() - INTERVAL " + EDIT_MINUTES + " MINUTE) AS canEdit, " +
                "  TRIM(CONCAT(COALESCE(f.first_name, ''), ' ', COALESCE(f.last_name, ''))) AS authorName, " +
                "  a.id AS askId, a.assignee_faculty_id AS askAssigneeId, a.asked_by_faculty_id AS askById, a.due_at AS askDueAt, a.done_at AS askDoneAt, a.cancelled_at AS askCancelledAt, " +
                "  (SELECT TRIM(CONCAT(COALESCE(x.first_name, ''), ' ', COALESCE(x.last_name, ''))) FROM faculty x WHERE x.id = a.assignee_faculty_id) AS askAssigneeName " +
                "FROM tpo_team_message m LEFT JOIN faculty f ON f.id = m.author_faculty_id LEFT JOIN tpo_team_ask a ON a.message_id = m.id " +
                "WHERE m.thread_id = :t ORDER BY m.id DESC LIMIT 500) x ORDER BY x.id",
                new MapSqlParameterSource("t", threadId).addValue("me", me));
        for (Map<String, Object> m : messages) {
            Object author = m.get("authorId");
            if ("MESSAGE".equals(m.get("kind")) && author != null && !teamNow.contains(((Number) author).intValue())) {
                m.put("authorName", (m.get("authorName") == null ? "Someone" : m.get("authorName")) + " (left the team)");
            }
            m.put("deleted", truthy(m.get("deleted")));
            m.put("isDecision", truthy(m.get("isDecision")));
            m.put("mine", truthy(m.get("mine")));
            m.put("canEdit", truthy(m.get("canEdit")));
            if (m.get("askId") != null) {
                Map<String, Object> ask = new LinkedHashMap<>();
                ask.put("id", m.get("askId"));
                ask.put("assigneeId", m.get("askAssigneeId"));
                ask.put("assigneeName", m.get("askAssigneeName"));
                ask.put("askedById", m.get("askById"));
                ask.put("dueAt", m.get("askDueAt"));
                ask.put("doneAt", m.get("askDoneAt"));
                ask.put("cancelledAt", m.get("askCancelledAt"));
                m.put("ask", ask);
            }
            for (String k : List.of("askId", "askAssigneeId", "askById", "askDueAt", "askDoneAt", "askCancelledAt", "askAssigneeName")) m.remove(k);
        }
        out.put("messages", messages);
        out.put("people", people(collegeId, threadId, kind, String.valueOf(t.get("aboutKey")), teamNow));
        out.put("asks", openAsks(collegeId, threadId));
        out.put("decisions", jdbc.queryForList("SELECT m.id, m.body, m.decided_at AS decidedAt, m.created_at AS createdAt, " +
                "TRIM(CONCAT(COALESCE(f.first_name, ''), ' ', COALESCE(f.last_name, ''))) AS decidedBy FROM tpo_team_message m " +
                "LEFT JOIN faculty f ON f.id = COALESCE(m.decided_by, m.author_faculty_id) WHERE m.thread_id = :t AND m.is_decision = 1 AND m.deleted_at IS NULL " +
                "ORDER BY COALESCE(m.decided_at, m.created_at) DESC", new MapSqlParameterSource("t", threadId)));
        out.put("context", context(collegeId, kind, t.get("aboutKey") == null ? null : String.valueOf(t.get("aboutKey"))));

        jdbc.update("INSERT INTO tpo_team_thread_member (thread_id, faculty_id, following, joined_reason, last_read_at) VALUES (:t, :me, NULL, 'OPENED', NOW()) " +
                "ON DUPLICATE KEY UPDATE last_read_at = NOW()", new MapSqlParameterSource("t", threadId).addValue("me", me));
        jdbc.update("UPDATE tpo_team_mention SET seen_at = NOW() WHERE thread_id = :t AND faculty_id = :me AND seen_at IS NULL",
                new MapSqlParameterSource("t", threadId).addValue("me", me));
        return out;
    }

    /** The conversation about a drive, company or student, for that thing's own page: the conversation if there is one, else just the context. */
    @Transactional
    public Map<String, Object> about(Integer collegeId, int me, String kind, String key) {
        requireTeam(collegeId, me);
        String k = objectKind(kind);
        String aboutKey = normalizeKey(k, key);
        objectLabel(collegeId, k, aboutKey); // refuses a thing that isn't this college's
        List<Long> ids = jdbc.queryForList("SELECT id FROM tpo_team_thread WHERE college_id = :c AND kind = :k AND about_key = :a",
                new MapSqlParameterSource("c", collegeId).addValue("k", k).addValue("a", aboutKey), Long.class);
        if (!ids.isEmpty()) return open(collegeId, me, ids.get(0));
        Map<String, Object> out = new LinkedHashMap<>();
        Map<String, Object> thread = new LinkedHashMap<>();
        thread.put("id", null);
        thread.put("kind", k);
        thread.put("aboutKey", aboutKey);
        thread.put("title", objectLabel(collegeId, k, aboutKey));
        out.put("thread", thread);
        out.put("messages", List.of());
        out.put("people", List.of());
        out.put("asks", List.of());
        out.put("decisions", List.of());
        out.put("context", context(collegeId, k, aboutKey));
        return out;
    }

    private List<Map<String, Object>> people(Integer collegeId, long threadId, String kind, String aboutKey, Set<Integer> teamNow) {
        if ("EVERYONE".equals(kind)) {
            // Everyone is the whole team, always: list them all, not just who has written.
            List<Map<String, Object>> all = new ArrayList<>();
            for (Integer id : teamNow) {
                Map<String, Object> r = new LinkedHashMap<>();
                r.put("facultyId", id);
                r.put("name", nameOf(id));
                r.put("reason", "TEAM");
                r.put("owner", false);
                r.put("awayUntil", awayUntil(collegeId, id));
                all.add(r);
            }
            all.sort((x, y) -> String.valueOf(x.get("name")).compareToIgnoreCase(String.valueOf(y.get("name"))));
            return all;
        }
        List<Map<String, Object>> rows = new ArrayList<>(jdbc.queryForList(
                "SELECT x.faculty_id AS facultyId, TRIM(CONCAT(COALESCE(f.first_name, ''), ' ', COALESCE(f.last_name, ''))) AS name, x.joined_reason AS reason, x.following " +
                "FROM tpo_team_thread_member x JOIN faculty f ON f.id = x.faculty_id WHERE x.thread_id = :t " +
                "AND (x.joined_reason IS NULL OR x.joined_reason <> 'OPENED' OR x.following = 1) ORDER BY f.first_name",
                new MapSqlParameterSource("t", threadId)));
        Integer owner = ownerOf(collegeId, kind, aboutKey);
        boolean ownerListed = false;
        for (Map<String, Object> r : rows) {
            int id = ((Number) r.get("facultyId")).intValue();
            r.put("owner", owner != null && owner == id);
            if (owner != null && owner == id) ownerListed = true;
            r.put("leftTeam", !teamNow.contains(id));
            r.put("awayUntil", awayUntil(collegeId, id));
        }
        rows.removeIf(r -> truthy(r.get("leftTeam")));
        if (owner != null && !ownerListed && teamNow.contains(owner)) {
            Map<String, Object> o = new LinkedHashMap<>();
            o.put("facultyId", owner);
            o.put("name", nameOf(owner));
            o.put("reason", "OWNER");
            o.put("following", null);
            o.put("owner", true);
            o.put("awayUntil", awayUntil(collegeId, owner));
            rows.add(0, o);
        }
        return rows;
    }

    private Object awayUntil(Integer collegeId, int facultyId) {
        List<Object> a = jdbc.queryForList("SELECT DATE_FORMAT(away_until, '%Y-%m-%d') FROM tpo_team_away WHERE college_id = :c AND faculty_id = :f AND away_until >= CURDATE()",
                new MapSqlParameterSource("c", collegeId).addValue("f", facultyId), Object.class);
        return a.isEmpty() ? null : a.get(0);
    }

    private Integer ownerOf(Integer collegeId, String kind, String aboutKey) {
        if (aboutKey == null) return null;
        if ("DRIVE".equals(kind)) {
            List<Integer> o = jdbc.queryForList("SELECT owner_faculty_id FROM job WHERE id = :j AND college_id = :c AND owner_faculty_id IS NOT NULL",
                    new MapSqlParameterSource("j", parseId(aboutKey)).addValue("c", collegeId), Integer.class);
            return o.isEmpty() ? null : o.get(0);
        }
        if ("COMPANY".equals(kind)) {
            List<String> names = companySpellings(collegeId, aboutKey);
            if (names.isEmpty()) return null;
            List<Integer> o = jdbc.queryForList("SELECT owner_faculty_id FROM recruiter_lead WHERE college_id = :c AND LOWER(TRIM(company_name)) IN (:k) AND owner_faculty_id IS NOT NULL " +
                    "GROUP BY owner_faculty_id ORDER BY COUNT(*) DESC LIMIT 1", new MapSqlParameterSource("c", collegeId).addValue("k", names), Integer.class);
            return o.isEmpty() ? null : o.get(0);
        }
        return null;
    }

    private List<Map<String, Object>> openAsks(Integer collegeId, long threadId) {
        return jdbc.queryForList("SELECT a.id, a.message_id AS messageId, a.assignee_faculty_id AS assigneeId, a.asked_by_faculty_id AS askedById, a.due_at AS dueAt, " +
                "m.body, TRIM(CONCAT(COALESCE(f.first_name, ''), ' ', COALESCE(f.last_name, ''))) AS assigneeName, " +
                "TRIM(CONCAT(COALESCE(b.first_name, ''), ' ', COALESCE(b.last_name, ''))) AS askedByName, (a.due_at IS NOT NULL AND a.due_at < UTC_TIMESTAMP()) AS overdue " +
                "FROM tpo_team_ask a JOIN tpo_team_message m ON m.id = a.message_id LEFT JOIN faculty f ON f.id = a.assignee_faculty_id LEFT JOIN faculty b ON b.id = a.asked_by_faculty_id " +
                "WHERE a.thread_id = :t AND a.college_id = :c AND a.done_at IS NULL AND a.cancelled_at IS NULL ORDER BY a.due_at IS NULL, a.due_at, a.id",
                new MapSqlParameterSource("t", threadId).addValue("c", collegeId));
    }

    // ------------------------------------------------------------------------------------------------------------ what it is about

    private static String objectKind(String kind) {
        String k = kind == null ? "" : kind.trim().toUpperCase();
        if (!List.of("DRIVE", "COMPANY", "STUDENT").contains(k)) throw new IllegalArgumentException("Pick a drive, a company or a student");
        return k;
    }

    static String normalizeKey(String kind, String key) {
        if (key == null || key.isBlank()) throw new IllegalArgumentException("Pick which one");
        if ("COMPANY".equals(kind)) return TpoRecruiterLeadsHubService.companyKey(key);
        return String.valueOf(parseId(key));
    }

    private static long parseId(String key) {
        try { return Long.parseLong(key.trim()); } catch (NumberFormatException e) { throw new IllegalArgumentException("Not found"); }
    }

    /** The thing's name; refuses one that isn't this college's. */
    String objectLabel(Integer collegeId, String kind, String aboutKey) {
        List<String> n = switch (kind) {
            case "DRIVE" -> jdbc.queryForList("SELECT CONCAT(CASE WHEN company_name IS NULL OR company_name = '' THEN '' ELSE CONCAT(company_name, ' · ') END, job_title) FROM job " +
                    "WHERE id = :k AND college_id = :c AND (is_deleted = 0 OR is_deleted IS NULL)", new MapSqlParameterSource("k", parseId(aboutKey)).addValue("c", collegeId), String.class);
            case "STUDENT" -> jdbc.queryForList("SELECT TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))) FROM learner " +
                    "WHERE id = :k AND college_id = :c AND (is_deleted = 0 OR is_deleted IS NULL)", new MapSqlParameterSource("k", parseId(aboutKey)).addValue("c", collegeId), String.class);
            case "COMPANY" -> {
                List<String> names = companySpellings(collegeId, aboutKey);
                yield names.isEmpty() ? List.of() : jdbc.queryForList("SELECT name FROM (SELECT TRIM(company_name) AS name, COUNT(*) AS n FROM recruiter_lead WHERE college_id = :c AND LOWER(TRIM(company_name)) IN (:k) " +
                        "GROUP BY TRIM(company_name) UNION ALL SELECT TRIM(company_name), COUNT(*) FROM job WHERE college_id = :c AND LOWER(TRIM(company_name)) IN (:k) GROUP BY TRIM(company_name)) x " +
                        "ORDER BY n DESC LIMIT 1", new MapSqlParameterSource("k", names).addValue("c", collegeId), String.class);
            }
            default -> List.of();
        };
        if (n.isEmpty() || n.get(0) == null) throw new IllegalArgumentException("Not found");
        return n.get(0);
    }

    /** What the right-hand panel shows: the thing's facts and a link to it. */
    Map<String, Object> context(Integer collegeId, String kind, String aboutKey) {
        Map<String, Object> c = new LinkedHashMap<>();
        c.put("kind", kind);
        if (aboutKey == null || "TOPIC".equals(kind) || "EVERYONE".equals(kind)) return c;
        MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId).addValue("k", "COMPANY".equals(kind) ? aboutKey : (Object) parseIdQuiet(aboutKey));
        switch (kind) {
            case "DRIVE" -> {
                List<Map<String, Object>> j = jdbc.queryForList("SELECT j.id, j.company_name AS company, j.job_title AS title, j.lifecycle_status AS status, j.application_deadline AS deadline, " +
                        "j.drive_mode AS mode, j.owner_faculty_id AS ownerId, (j.is_deleted = 1) AS deleted, " +
                        "(SELECT TRIM(CONCAT(COALESCE(f.first_name, ''), ' ', COALESCE(f.last_name, ''))) FROM faculty f WHERE f.id = j.owner_faculty_id) AS owner, " +
                        "(SELECT COUNT(*) FROM job_application a WHERE a.job_id = j.id AND (a.is_deleted = 0 OR a.is_deleted IS NULL) AND a.application_status <> 'WITHDRAWN') AS applicants, " +
                        "(SELECT COUNT(*) FROM job_offer o JOIN job_application a ON a.id = o.application_id WHERE a.job_id = j.id AND o.status IN ('RELEASED','ACCEPTED')) AS offers " +
                        "FROM job j WHERE j.id = :k AND j.college_id = :c", p);
                if (j.isEmpty()) { c.put("gone", true); return c; }
                c.putAll(j.get(0));
                c.put("deleted", truthy(c.get("deleted")));
                c.put("link", "/tpo/drives/" + aboutKey);
            }
            case "COMPANY" -> {
                List<String> names = companySpellings(collegeId, aboutKey);
                if (names.isEmpty()) { c.put("gone", true); return c; }
                MapSqlParameterSource q = new MapSqlParameterSource("c", collegeId).addValue("k", names).addValue("key", aboutKey);
                c.put("name", objectLabelQuiet(collegeId, kind, aboutKey));
                // Where the placement cell is with the company (Engage > Companies), when it has been set.
                List<String> status = jdbc.queryForList("SELECT status FROM tpo_company_outreach WHERE college_id = :c AND company_key = :key", q, String.class);
                c.put("communication", status.isEmpty() ? null : status.get(0));
                c.put("owners", jdbc.queryForList("SELECT DISTINCT TRIM(CONCAT(COALESCE(f.first_name, ''), ' ', COALESCE(f.last_name, ''))) FROM recruiter_lead rl JOIN faculty f ON f.id = rl.owner_faculty_id " +
                        "WHERE rl.college_id = :c AND LOWER(TRIM(rl.company_name)) IN (:k)", q, String.class));
                c.put("contacts", jdbc.queryForObject("SELECT COUNT(*) FROM recruiter_lead WHERE college_id = :c AND LOWER(TRIM(company_name)) IN (:k)", q, Long.class));
                c.put("drives", jdbc.queryForObject("SELECT COUNT(*) FROM job WHERE college_id = :c AND LOWER(TRIM(company_name)) IN (:k) AND (is_deleted = 0 OR is_deleted IS NULL)", q, Long.class));
                c.put("liveDrives", jdbc.queryForObject("SELECT COUNT(*) FROM job WHERE college_id = :c AND LOWER(TRIM(company_name)) IN (:k) AND lifecycle_status = 'PUBLISHED' AND (is_deleted = 0 OR is_deleted IS NULL)", q, Long.class));
                List<Object> next = jdbc.queryForList("SELECT MIN(fu.due_at) FROM follow_up fu JOIN recruiter_lead rl ON rl.id = fu.recruiter_lead_id " +
                        "WHERE rl.college_id = :c AND LOWER(TRIM(rl.company_name)) IN (:k) AND fu.done_at IS NULL", q, Object.class);
                c.put("nextFollowUp", next.isEmpty() ? null : next.get(0));
                c.put("link", "/tpo/companies?name=" + java.net.URLEncoder.encode(String.valueOf(c.get("name")), java.nio.charset.StandardCharsets.UTF_8));
            }
            case "STUDENT" -> {
                List<Map<String, Object>> s = jdbc.queryForList("SELECT l.id, TRIM(CONCAT(COALESCE(l.first_name, ''), ' ', COALESCE(l.last_name, ''))) AS name, l.roll_number AS roll, " +
                        "l.department AS branch, r.cgpa, bt.batch_name AS batch, " +
                        "(SELECT COUNT(*) FROM job_application a WHERE a.learner_id = l.id AND (a.is_deleted = 0 OR a.is_deleted IS NULL)) AS applications, " +
                        "(SELECT COUNT(*) FROM job_offer o JOIN job_application a ON a.id = o.application_id WHERE a.learner_id = l.id AND o.status IN ('RELEASED','ACCEPTED')) AS offers " +
                        "FROM learner l LEFT JOIN learner_academic_record r ON r.learner_id = l.id LEFT JOIN class cl ON cl.id = l.class_id LEFT JOIN batch bt ON bt.id = cl.batch_id " +
                        "WHERE l.id = :k AND l.college_id = :c LIMIT 1", p);
                if (s.isEmpty()) { c.put("gone", true); return c; }
                c.putAll(s.get(0));
                c.put("link", "/tpo/students?student=" + aboutKey);
            }
            default -> { }
        }
        return c;
    }

    private Object parseIdQuiet(String key) {
        try { return Long.parseLong(key.trim()); } catch (Exception e) { return -1L; }
    }

    private String objectLabelQuiet(Integer collegeId, String kind, String key) {
        try { return objectLabel(collegeId, kind, key); } catch (IllegalArgumentException e) { return key; }
    }

    // ------------------------------------------------------------------------------------------------------------ starting

    public static class Start {
        public String kind;
        public String aboutKey;
        public String title;
        public List<Integer> people;
        public Boolean isPrivate;
        public String body;
    }

    /** A new conversation: about a thing (one per thing: an existing one is returned) or a topic (whole team, or private with picked people). */
    @Transactional
    public Map<String, Object> start(Integer collegeId, int me, Start in) {
        requireTeam(collegeId, me);
        if (in == null) throw new IllegalArgumentException("Pick what it is about");
        String kind = in.kind == null ? "TOPIC" : in.kind.trim().toUpperCase();
        Set<Integer> allowed = teamIds(collegeId);
        Set<Integer> picked = new LinkedHashSet<>();
        if (in.people != null) for (Integer p : in.people) {
            if (p == null || p == me) continue;
            if (!allowed.contains(p)) throw new IllegalArgumentException("Only placement team members can be in a conversation");
            picked.add(p);
        }
        long id;
        String title;
        if ("TOPIC".equals(kind)) {
            title = clean(in.title, 200);
            if (title == null) throw new IllegalArgumentException("Give it a topic");
            boolean priv = Boolean.TRUE.equals(in.isPrivate);
            if (priv && picked.isEmpty()) throw new IllegalArgumentException("A private conversation needs at least one other person");
            jdbc.update("INSERT INTO tpo_team_thread (college_id, title, created_by_faculty_id, kind, is_private) VALUES (:c, :t, :me, 'TOPIC', :p)",
                    new MapSqlParameterSource("c", collegeId).addValue("t", title).addValue("me", me).addValue("p", priv ? 1 : 0));
            id = jdbc.queryForObject("SELECT LAST_INSERT_ID()", new MapSqlParameterSource(), Long.class);
            member(id, me, 1, "STARTED");
        } else if (List.of("DRIVE", "COMPANY", "STUDENT").contains(kind)) {
            id = ensureObjectThread(collegeId, me, kind, in.aboutKey);
            title = String.valueOf(jdbc.queryForObject("SELECT title FROM tpo_team_thread WHERE id = :t", new MapSqlParameterSource("t", id), String.class));
            if (!truthy(jdbc.queryForObject("SELECT COUNT(*) FROM tpo_team_thread_member WHERE thread_id = :t AND faculty_id = :me AND following = 1",
                    new MapSqlParameterSource("t", id).addValue("me", me), Integer.class))) member(id, me, 1, "STARTED");
        } else {
            throw new IllegalArgumentException("Pick what it is about");
        }
        for (Integer p : picked) {
            member(id, p, 1, "PICKED");
            audit.bellTo(collegeId, p, "TEAM_ADDED", first(nameOf(me)) + " added you to " + title, null, link(id, null));
        }
        if (!picked.isEmpty()) system(id, me, first(nameOf(me)) + " added " + names(picked));
        if (in.body != null && !in.body.isBlank()) send(collegeId, me, id, new Send(in.body));
        return Map.of("id", id);
    }

    /** The one conversation about a drive, company or student: made the first time someone writes about it. */
    long ensureObjectThread(Integer collegeId, int me, String kind, String key) {
        String k = objectKind(kind);
        String aboutKey = normalizeKey(k, key);
        String label = objectLabel(collegeId, k, aboutKey);
        jdbc.update("INSERT IGNORE INTO tpo_team_thread (college_id, title, created_by_faculty_id, kind, about_key, is_private) VALUES (:c, :t, :me, :k, :a, 0)",
                new MapSqlParameterSource("c", collegeId).addValue("t", label.length() > 200 ? label.substring(0, 200) : label).addValue("me", me).addValue("k", k).addValue("a", aboutKey));
        return jdbc.queryForObject("SELECT id FROM tpo_team_thread WHERE college_id = :c AND kind = :k AND about_key = :a",
                new MapSqlParameterSource("c", collegeId).addValue("k", k).addValue("a", aboutKey), Long.class);
    }

    // ------------------------------------------------------------------------------------------------------------ writing

    public static class Send {
        public String body;
        public Integer askAssigneeId;
        public String askDueAt;
        public Boolean decision;
        public Boolean addPeople;

        public Send() { }

        Send(String body) {
            this.body = body;
        }
    }

    /** Write about a drive, company or student from its page: the conversation is made on the first message. */
    @Transactional
    public Map<String, Object> sendAbout(Integer collegeId, int me, String kind, String key, Send in) {
        requireTeam(collegeId, me);
        long id = ensureObjectThread(collegeId, me, kind, key);
        Map<String, Object> out = new LinkedHashMap<>(send(collegeId, me, id, in));
        out.put("threadId", id);
        return out;
    }

    @Transactional
    public Map<String, Object> send(Integer collegeId, int me, long threadId, Send in) {
        Map<String, Object> t = requireReadable(collegeId, me, threadId);
        String body = in == null ? null : clean(in.body, Integer.MAX_VALUE);
        if (body == null) throw new IllegalArgumentException("Write something first");
        if (body.length() > MAX_BODY) throw new IllegalArgumentException("Keep a message under " + MAX_BODY + " characters");
        Set<Integer> allowed = teamIds(collegeId);
        Mentions mentions = mentions(body, allowed, me);
        Integer assignee = in.askAssigneeId;
        if (assignee != null && !allowed.contains(assignee)) throw new IllegalArgumentException("Ask someone from the placement team");
        LocalDateTime due = parseDue(in.askDueAt);
        boolean priv = truthy(t.get("isPrivate"));
        Set<Integer> recipients = new LinkedHashSet<>(mentions.people);
        if (mentions.team) recipients.addAll(priv ? membersOf(threadId) : allowed);
        recipients.remove(me);
        if (priv) {
            Set<Integer> outside = new LinkedHashSet<>(mentions.people);
            if (assignee != null) outside.add(assignee);
            outside.removeAll(membersOf(threadId));
            outside.remove(me);
            if (!outside.isEmpty()) {
                if (!Boolean.TRUE.equals(in.addPeople)) throw new TeamNeedsAddingException(outside.stream().map(this::nameOf).toList());
                for (Integer p : outside) member(threadId, p, 1, "PICKED");
                system(threadId, me, first(nameOf(me)) + " added " + names(outside));
            }
        }
        boolean decision = Boolean.TRUE.equals(in.decision);
        jdbc.update("INSERT INTO tpo_team_message (thread_id, author_faculty_id, body, kind, is_decision, decided_by, decided_at) VALUES (:t, :me, :b, 'MESSAGE', :d, :db, :da)",
                new MapSqlParameterSource("t", threadId).addValue("me", me).addValue("b", body).addValue("d", decision ? 1 : 0)
                        .addValue("db", decision ? me : null).addValue("da", decision ? LocalDateTime.now(ZoneOffset.UTC) : null));
        Long messageId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", new MapSqlParameterSource(), Long.class);
        String title = String.valueOf(t.get("title"));
        String who = first(nameOf(me));
        String preview = preview(body, 140);
        // Writing follows the conversation unless you had stopped following it on purpose.
        jdbc.update("INSERT INTO tpo_team_thread_member (thread_id, faculty_id, following, joined_reason, last_read_at) VALUES (:t, :me, 1, 'WROTE', NOW()) " +
                "ON DUPLICATE KEY UPDATE following = COALESCE(following, 1), joined_reason = CASE WHEN joined_reason IS NULL OR joined_reason = 'OPENED' THEN 'WROTE' ELSE joined_reason END, last_read_at = NOW()",
                new MapSqlParameterSource("t", threadId).addValue("me", me));
        for (Integer p : recipients) {
            jdbc.update("INSERT IGNORE INTO tpo_team_mention (message_id, faculty_id, thread_id, college_id) VALUES (:m, :f, :t, :c)",
                    new MapSqlParameterSource("m", messageId).addValue("f", p).addValue("t", threadId).addValue("c", collegeId));
            if (mentions.people.contains(p)) follow(threadId, p, "MENTIONED");
            audit.bellTo(collegeId, p, "TEAM_MENTION", who + (mentions.team && !mentions.people.contains(p) ? " wrote to the team in " : " mentioned you in ") + title, preview, link(threadId, messageId));
        }
        if (assignee != null) {
            jdbc.update("INSERT INTO tpo_team_ask (college_id, thread_id, message_id, assignee_faculty_id, asked_by_faculty_id, due_at) VALUES (:c, :t, :m, :a, :me, :d)",
                    new MapSqlParameterSource("c", collegeId).addValue("t", threadId).addValue("m", messageId).addValue("a", assignee).addValue("me", me).addValue("d", due));
            follow(threadId, assignee, "ASKED");
            if (assignee != me) audit.bellTo(collegeId, assignee, "TEAM_ASK", who + " asked you, in " + title, preview, link(threadId, messageId));
        }
        if (decision) system(threadId, me, who + " marked this as a decision");
        touch(threadId);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", messageId);
        out.put("notified", recipients.size());
        return out;
    }

    /** Your own message, within {@value #EDIT_MINUTES} minutes. Only people newly mentioned are told. */
    @Transactional
    public void edit(Integer collegeId, int me, long messageId, String rawBody, boolean addPeople) {
        Map<String, Object> m = ownMessage(collegeId, me, messageId);
        if (!truthy(jdbc.queryForObject("SELECT COUNT(*) FROM tpo_team_message WHERE id = :m AND created_at >= NOW() - INTERVAL " + EDIT_MINUTES + " MINUTE",
                new MapSqlParameterSource("m", messageId), Integer.class))) {
            throw new IllegalStateException("A message can be edited for " + EDIT_MINUTES + " minutes after it is sent");
        }
        long threadId = ((Number) m.get("thread_id")).longValue();
        Map<String, Object> t = requireReadable(collegeId, me, threadId);
        String body = clean(rawBody, Integer.MAX_VALUE);
        if (body == null) throw new IllegalArgumentException("Write something, or delete the message");
        if (body.length() > MAX_BODY) throw new IllegalArgumentException("Keep a message under " + MAX_BODY + " characters");
        Set<Integer> allowed = teamIds(collegeId);
        Mentions before = mentions(String.valueOf(m.get("body")), allowed, me);
        Mentions after = mentions(body, allowed, me);
        Set<Integer> fresh = new LinkedHashSet<>(after.people);
        fresh.removeAll(before.people);
        fresh.remove(me);
        boolean priv = truthy(t.get("isPrivate"));
        if (priv) {
            Set<Integer> outside = new LinkedHashSet<>(fresh);
            outside.removeAll(membersOf(threadId));
            if (!outside.isEmpty()) {
                if (!addPeople) throw new TeamNeedsAddingException(outside.stream().map(this::nameOf).toList());
                for (Integer p : outside) member(threadId, p, 1, "PICKED");
                system(threadId, me, first(nameOf(me)) + " added " + names(outside));
            }
        }
        jdbc.update("UPDATE tpo_team_message SET body = :b, edited_at = NOW() WHERE id = :m", new MapSqlParameterSource("b", body).addValue("m", messageId));
        Set<Integer> gone = new LinkedHashSet<>(before.people);
        gone.removeAll(after.people);
        for (Integer p : gone) jdbc.update("DELETE FROM tpo_team_mention WHERE message_id = :m AND faculty_id = :f", new MapSqlParameterSource("m", messageId).addValue("f", p));
        for (Integer p : fresh) {
            jdbc.update("INSERT IGNORE INTO tpo_team_mention (message_id, faculty_id, thread_id, college_id) VALUES (:m, :f, :t, :c)",
                    new MapSqlParameterSource("m", messageId).addValue("f", p).addValue("t", threadId).addValue("c", collegeId));
            follow(threadId, p, "MENTIONED");
            audit.bellTo(collegeId, p, "TEAM_MENTION", first(nameOf(me)) + " mentioned you in " + t.get("title"), preview(body, 140), link(threadId, messageId));
        }
    }

    /** Your own message; it leaves "Message removed". Its open ask is cancelled and its decision mark goes with it. */
    @Transactional
    public void delete(Integer collegeId, int me, long messageId) {
        Map<String, Object> m = ownMessage(collegeId, me, messageId);
        jdbc.update("UPDATE tpo_team_message SET deleted_at = NOW(), body = '', is_decision = 0 WHERE id = :m", new MapSqlParameterSource("m", messageId));
        jdbc.update("UPDATE tpo_team_ask SET cancelled_at = NOW() WHERE message_id = :m AND done_at IS NULL AND cancelled_at IS NULL", new MapSqlParameterSource("m", messageId));
        jdbc.update("DELETE FROM tpo_team_mention WHERE message_id = :m", new MapSqlParameterSource("m", messageId));
        touch(((Number) m.get("thread_id")).longValue());
    }

    private Map<String, Object> ownMessage(Integer collegeId, int me, long messageId) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT m.* FROM tpo_team_message m JOIN tpo_team_thread t ON t.id = m.thread_id " +
                "WHERE m.id = :m AND t.college_id = :c AND m.author_faculty_id = :me AND m.kind = 'MESSAGE' AND m.deleted_at IS NULL",
                new MapSqlParameterSource("m", messageId).addValue("c", collegeId).addValue("me", me));
        if (rows.isEmpty()) throw new IllegalArgumentException("Message not found");
        requireReadable(collegeId, me, ((Number) rows.get(0).get("thread_id")).longValue());
        return rows.get(0);
    }

    /** Anyone in the conversation marks a message as a decision, or takes the mark off; either leaves a line. */
    @Transactional
    public void decision(Integer collegeId, int me, long messageId, boolean on) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT m.thread_id, m.is_decision FROM tpo_team_message m JOIN tpo_team_thread t ON t.id = m.thread_id " +
                "WHERE m.id = :m AND t.college_id = :c AND m.kind = 'MESSAGE' AND m.deleted_at IS NULL", new MapSqlParameterSource("m", messageId).addValue("c", collegeId));
        if (rows.isEmpty()) throw new IllegalArgumentException("Message not found");
        long threadId = ((Number) rows.get(0).get("thread_id")).longValue();
        requireReadable(collegeId, me, threadId);
        if (truthy(rows.get(0).get("is_decision")) == on) return;
        jdbc.update("UPDATE tpo_team_message SET is_decision = :d, decided_by = :me, decided_at = :at WHERE id = :m",
                new MapSqlParameterSource("d", on ? 1 : 0).addValue("me", on ? me : null).addValue("at", on ? LocalDateTime.now(ZoneOffset.UTC) : null).addValue("m", messageId));
        system(threadId, me, first(nameOf(me)) + (on ? " marked a message as a decision" : " took the decision mark off a message"));
        touch(threadId);
    }

    // ------------------------------------------------------------------------------------------------------------ asks

    /** The person asked marks it done, optionally with a note (posted as their reply); the asker is told. */
    @Transactional
    public void askDone(Integer collegeId, int me, long askId, String note) {
        Map<String, Object> a = openAsk(collegeId, askId);
        long threadId = ((Number) a.get("thread_id")).longValue();
        Map<String, Object> t = requireReadable(collegeId, me, threadId);
        if (((Number) a.get("assignee_faculty_id")).intValue() != me) throw new IllegalArgumentException("Only the person asked can mark it done");
        int n = jdbc.update("UPDATE tpo_team_ask SET done_at = NOW(), done_by = :me WHERE id = :a AND done_at IS NULL AND cancelled_at IS NULL",
                new MapSqlParameterSource("me", me).addValue("a", askId));
        if (n != 1) throw new IllegalStateException("This ask is already settled");
        String who = first(nameOf(me));
        system(threadId, me, who + " marked the ask done");
        if (note != null && !note.isBlank()) send(collegeId, me, threadId, new Send(note));
        int asker = ((Number) a.get("asked_by_faculty_id")).intValue();
        if (asker != me) audit.bellTo(collegeId, asker, "TEAM_ASK_DONE", who + " did what you asked, in " + t.get("title"),
                preview(String.valueOf(a.get("body")), 140), link(threadId, ((Number) a.get("message_id")).longValue()));
        touch(threadId);
    }

    /** The asker takes it back. */
    @Transactional
    public void askCancel(Integer collegeId, int me, long askId) {
        Map<String, Object> a = openAsk(collegeId, askId);
        long threadId = ((Number) a.get("thread_id")).longValue();
        requireReadable(collegeId, me, threadId);
        if (((Number) a.get("asked_by_faculty_id")).intValue() != me) throw new IllegalArgumentException("Only the person who asked can cancel it");
        int n = jdbc.update("UPDATE tpo_team_ask SET cancelled_at = NOW() WHERE id = :a AND done_at IS NULL AND cancelled_at IS NULL", new MapSqlParameterSource("a", askId));
        if (n != 1) throw new IllegalStateException("This ask is already settled");
        system(threadId, me, first(nameOf(me)) + " cancelled the ask");
        touch(threadId);
    }

    private Map<String, Object> openAsk(Integer collegeId, long askId) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT a.*, m.body FROM tpo_team_ask a JOIN tpo_team_message m ON m.id = a.message_id " +
                "WHERE a.id = :a AND a.college_id = :c", new MapSqlParameterSource("a", askId).addValue("c", collegeId));
        if (rows.isEmpty()) throw new IllegalArgumentException("Ask not found");
        Map<String, Object> a = rows.get(0);
        if (a.get("done_at") != null || a.get("cancelled_at") != null) throw new IllegalStateException("This ask is already settled");
        return a;
    }

    /** Open asks on this person, overdue first: Home and the @ Me / Asks filters. */
    public List<Map<String, Object>> asksOn(Integer collegeId, int me) {
        return jdbc.queryForList("SELECT a.id, a.thread_id AS threadId, a.message_id AS messageId, a.due_at AS dueAt, m.body, t.title, t.kind, " +
                "TRIM(CONCAT(COALESCE(b.first_name, ''), ' ', COALESCE(b.last_name, ''))) AS askedByName, (a.due_at IS NOT NULL AND a.due_at < UTC_TIMESTAMP()) AS overdue " +
                "FROM tpo_team_ask a JOIN tpo_team_message m ON m.id = a.message_id JOIN tpo_team_thread t ON t.id = a.thread_id LEFT JOIN faculty b ON b.id = a.asked_by_faculty_id " +
                "WHERE a.college_id = :c AND a.assignee_faculty_id = :me AND a.done_at IS NULL AND a.cancelled_at IS NULL " +
                "ORDER BY (a.due_at IS NOT NULL AND a.due_at < UTC_TIMESTAMP()) DESC, a.due_at IS NULL, a.due_at, a.id",
                new MapSqlParameterSource("c", collegeId).addValue("me", me));
    }

    /** Recent mentions of this person (30 days), newest first. */
    public List<Map<String, Object>> mentionsOf(Integer collegeId, int me) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT x.message_id AS messageId, x.thread_id AS threadId, x.seen_at AS seenAt, m.body, m.created_at AS createdAt, t.title, " +
                "TRIM(CONCAT(COALESCE(f.first_name, ''), ' ', COALESCE(f.last_name, ''))) AS authorName FROM tpo_team_mention x " +
                "JOIN tpo_team_message m ON m.id = x.message_id AND m.deleted_at IS NULL JOIN tpo_team_thread t ON t.id = x.thread_id LEFT JOIN faculty f ON f.id = m.author_faculty_id " +
                "WHERE x.college_id = :c AND x.faculty_id = :me AND x.created_at >= NOW() - INTERVAL 30 DAY ORDER BY x.created_at DESC LIMIT 30",
                new MapSqlParameterSource("c", collegeId).addValue("me", me));
        for (Map<String, Object> r : rows) r.put("body", preview(String.valueOf(r.get("body")), 160));
        return rows;
    }

    /** What Home says about Team: asks on you (and how many are overdue), mentions you haven't seen, the most urgent ask. */
    public Map<String, Object> summary(Integer collegeId, int me) {
        Map<String, Object> out = new LinkedHashMap<>();
        if (!teamIds(collegeId).contains(me)) return out;
        List<Map<String, Object>> asks = asksOn(collegeId, me);
        long overdue = asks.stream().filter(a -> truthy(a.get("overdue"))).count();
        Integer mentions = jdbc.queryForObject("SELECT COUNT(*) FROM tpo_team_mention x JOIN tpo_team_message m ON m.id = x.message_id AND m.deleted_at IS NULL " +
                "WHERE x.college_id = :c AND x.faculty_id = :me AND x.seen_at IS NULL", new MapSqlParameterSource("c", collegeId).addValue("me", me), Integer.class);
        out.put("asksOpen", asks.size());
        out.put("asksOverdue", overdue);
        out.put("mentionsNew", mentions == null ? 0 : mentions);
        out.put("unread", unread(collegeId, me));
        if (!asks.isEmpty()) {
            Map<String, Object> top = asks.get(0);
            out.put("topAsk", Map.of("text", preview(String.valueOf(top.get("body")), 120), "by", String.valueOf(top.get("askedByName")),
                    "threadId", top.get("threadId"), "overdue", truthy(top.get("overdue"))));
        }
        return out;
    }

    // ------------------------------------------------------------------------------------------------------------ following, people, settings

    @Transactional
    public void setFollowing(Integer collegeId, int me, long threadId, boolean on) {
        Map<String, Object> t = requireReadable(collegeId, me, threadId);
        if ("EVERYONE".equals(t.get("kind")) && !on) throw new IllegalStateException("Everyone can't be unfollowed. Mute it instead.");
        jdbc.update("INSERT INTO tpo_team_thread_member (thread_id, faculty_id, following, joined_reason) VALUES (:t, :me, :f, 'FOLLOWED') " +
                "ON DUPLICATE KEY UPDATE following = :f", new MapSqlParameterSource("t", threadId).addValue("me", me).addValue("f", on ? 1 : 0));
    }

    @Transactional
    public void setMuted(Integer collegeId, int me, long threadId, boolean on) {
        requireReadable(collegeId, me, threadId);
        jdbc.update("INSERT INTO tpo_team_thread_member (thread_id, faculty_id, following, muted, joined_reason) VALUES (:t, :me, NULL, :m, 'OPENED') " +
                "ON DUPLICATE KEY UPDATE muted = :m", new MapSqlParameterSource("t", threadId).addValue("me", me).addValue("m", on ? 1 : 0));
    }

    /** Leave a private topic (you can no longer read it). Whole-team conversations are unfollowed instead; Everyone can only be muted. */
    @Transactional
    public void leave(Integer collegeId, int me, long threadId) {
        Map<String, Object> t = requireReadable(collegeId, me, threadId);
        if (!"TOPIC".equals(t.get("kind")) || !truthy(t.get("isPrivate"))) throw new IllegalStateException("Only a private conversation can be left. Stop following this one instead.");
        system(threadId, me, first(nameOf(me)) + " left");
        jdbc.update("DELETE FROM tpo_team_thread_member WHERE thread_id = :t AND faculty_id = :me", new MapSqlParameterSource("t", threadId).addValue("me", me));
        touch(threadId);
    }

    /** Rename a topic, or switch it between whole team and private (private: the people in it now, minus those who only looked). */
    @Transactional
    public void updateTopic(Integer collegeId, int me, long threadId, String title, Boolean isPrivate) {
        Map<String, Object> t = requireReadable(collegeId, me, threadId);
        if (!"TOPIC".equals(t.get("kind"))) throw new IllegalStateException("Only a topic can be renamed or made private");
        String who = first(nameOf(me));
        if (title != null) {
            String clean = clean(title, 200);
            if (clean == null) throw new IllegalArgumentException("Give it a topic");
            if (!clean.equals(t.get("title"))) {
                jdbc.update("UPDATE tpo_team_thread SET title = :n WHERE id = :t", new MapSqlParameterSource("n", clean).addValue("t", threadId));
                system(threadId, me, who + " renamed this to " + clean);
            }
        }
        if (isPrivate != null && isPrivate != truthy(t.get("isPrivate"))) {
            if (isPrivate) {
                jdbc.update("DELETE FROM tpo_team_thread_member WHERE thread_id = :t AND joined_reason = 'OPENED' AND (following IS NULL OR following = 0) AND faculty_id <> :me",
                        new MapSqlParameterSource("t", threadId).addValue("me", me));
                member(threadId, me, 1, "STARTED");
                if (membersOf(threadId).size() < 2) throw new IllegalArgumentException("Add at least one other person before making it private");
            }
            jdbc.update("UPDATE tpo_team_thread SET is_private = :p WHERE id = :t", new MapSqlParameterSource("p", isPrivate ? 1 : 0).addValue("t", threadId));
            system(threadId, me, who + (isPrivate ? " made this private: only the people in it can read it" : " opened this to the whole team"));
        }
        touch(threadId);
    }

    @Transactional
    public void addPeople(Integer collegeId, int me, long threadId, Collection<Integer> people) {
        Map<String, Object> t = requireReadable(collegeId, me, threadId);
        Set<Integer> allowed = teamIds(collegeId);
        if (people == null || people.isEmpty()) throw new IllegalArgumentException("Pick someone");
        Set<Integer> added = new LinkedHashSet<>();
        for (Integer p : people) {
            if (p == null || p == me) continue;
            if (!allowed.contains(p)) throw new IllegalArgumentException("Only placement team members can be in a conversation");
            member(threadId, p, 1, "PICKED");
            added.add(p);
            audit.bellTo(collegeId, p, "TEAM_ADDED", first(nameOf(me)) + " added you to " + t.get("title"), null, link(threadId, null));
        }
        if (!added.isEmpty()) {
            system(threadId, me, first(nameOf(me)) + " added " + names(added));
            touch(threadId);
        }
    }

    // ------------------------------------------------------------------------------------------------------------ "#" lookup

    /** Drives, companies and students matching the words, for "#" in the composer and for a new conversation about a thing. */
    public Map<String, Object> lookup(Integer collegeId, int me, String q) {
        requireTeam(collegeId, me);
        String words = q == null ? "" : q.trim();
        String like = "%" + words.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
        MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId).addValue("q", like);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("drives", jdbc.queryForList("SELECT id, CONCAT(CASE WHEN company_name IS NULL OR company_name = '' THEN '' ELSE CONCAT(company_name, ' · ') END, job_title) AS label, " +
                "lifecycle_status AS status FROM job WHERE college_id = :c AND (is_deleted = 0 OR is_deleted IS NULL) AND (job_title LIKE :q OR company_name LIKE :q) " +
                "ORDER BY (lifecycle_status IN ('PUBLISHED','REQUEST','DRAFT')) DESC, id DESC LIMIT 6", p));
        // One row per company the way Engage groups them (companyKey), named by its most used spelling.
        Map<String, String> companies = new LinkedHashMap<>();
        for (String n : jdbc.queryForList("SELECT name FROM (SELECT TRIM(company_name) AS name FROM recruiter_lead WHERE college_id = :c AND company_name LIKE :q " +
                "UNION ALL SELECT TRIM(company_name) FROM job WHERE college_id = :c AND company_name LIKE :q AND (is_deleted = 0 OR is_deleted IS NULL)) x " +
                "WHERE name IS NOT NULL AND name <> '' GROUP BY name ORDER BY COUNT(*) DESC, name LIMIT 60", p, String.class)) {
            companies.putIfAbsent(TpoRecruiterLeadsHubService.companyKey(n), n);
        }
        List<Map<String, Object>> companyRows = new ArrayList<>();
        companies.forEach((k, label) -> { if (companyRows.size() < 6) companyRows.add(Map.of("key", k, "label", label)); });
        out.put("companies", companyRows);
        out.put("students", words.length() < 2 ? List.of() : jdbc.queryForList("SELECT id, TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))) AS label, roll_number AS roll " +
                "FROM learner WHERE college_id = :c AND (is_deleted = 0 OR is_deleted IS NULL) AND (CONCAT(first_name, ' ', COALESCE(last_name, '')) LIKE :q OR roll_number LIKE :q) " +
                "ORDER BY first_name LIMIT 6", p));
        return out;
    }

    // ------------------------------------------------------------------------------------------------------------ helpers

    private Set<Integer> membersOf(long threadId) {
        return new LinkedHashSet<>(jdbc.queryForList("SELECT faculty_id FROM tpo_team_thread_member WHERE thread_id = :t AND (joined_reason IS NULL OR joined_reason <> 'OPENED' OR following = 1)",
                new MapSqlParameterSource("t", threadId), Integer.class));
    }

    private void member(long threadId, int facultyId, int following, String reason) {
        jdbc.update("INSERT INTO tpo_team_thread_member (thread_id, faculty_id, following, joined_reason) VALUES (:t, :f, :fo, :r) " +
                "ON DUPLICATE KEY UPDATE following = :fo, joined_reason = CASE WHEN joined_reason IS NULL OR joined_reason = 'OPENED' THEN :r ELSE joined_reason END",
                new MapSqlParameterSource("t", threadId).addValue("f", facultyId).addValue("fo", following).addValue("r", reason));
    }

    /** Mentioned or asked: you follow it now, unless you had stopped following it on purpose. */
    private void follow(long threadId, int facultyId, String reason) {
        jdbc.update("INSERT INTO tpo_team_thread_member (thread_id, faculty_id, following, joined_reason) VALUES (:t, :f, 1, :r) " +
                "ON DUPLICATE KEY UPDATE following = COALESCE(following, 1), joined_reason = CASE WHEN joined_reason IS NULL OR joined_reason = 'OPENED' THEN :r ELSE joined_reason END",
                new MapSqlParameterSource("t", threadId).addValue("f", facultyId).addValue("r", reason));
    }

    private void system(Long threadId, int me, String text) {
        jdbc.update("INSERT INTO tpo_team_message (thread_id, author_faculty_id, body, kind) VALUES (:t, :me, :b, 'SYSTEM')",
                new MapSqlParameterSource("t", threadId).addValue("me", me).addValue("b", text.length() > MAX_BODY ? text.substring(0, MAX_BODY) : text));
    }

    private void touch(long threadId) {
        jdbc.update("UPDATE tpo_team_thread SET last_message_at = NOW() WHERE id = :t", new MapSqlParameterSource("t", threadId));
    }

    private String names(Collection<Integer> ids) {
        List<String> n = ids.stream().map(i -> first(nameOf(i))).toList();
        if (n.size() <= 1) return String.join("", n);
        return String.join(", ", n.subList(0, n.size() - 1)) + " and " + n.get(n.size() - 1);
    }

    static String link(long threadId, Long messageId) {
        return "/tpo/team?c=" + threadId + (messageId == null ? "" : "&m=" + messageId);
    }

    record Mentions(Set<Integer> people, boolean team) { }

    /** People mentioned by token (team members only; anything else stays words) and whether @team was used. */
    static Mentions mentions(String body, Set<Integer> allowed, int me) {
        Set<Integer> people = new LinkedHashSet<>();
        boolean team = false;
        Matcher m = MENTION.matcher(body == null ? "" : body);
        while (m.find()) {
            if ("team".equals(m.group(2))) { team = true; continue; }
            try {
                int id = Integer.parseInt(m.group(3));
                if (allowed.contains(id) && id != me) people.add(id);
            } catch (NumberFormatException ignored) { }
        }
        return new Mentions(people, team);
    }

    /** A body as words: "@[Ravi Kumar](f:12)" reads "@Ravi Kumar", "#[Infosys](c:infosys)" reads "Infosys". */
    public static String preview(String body, int max) {
        if (body == null) return null;
        String t = MENTION.matcher(body).replaceAll(r -> Matcher.quoteReplacement("@" + r.group(1)));
        t = CHIP.matcher(t).replaceAll(r -> Matcher.quoteReplacement(r.group(1)));
        t = t.replaceAll("\\s+", " ").trim();
        return t.length() > max ? t.substring(0, max - 1) + "…" : t;
    }

    static LocalDateTime parseDue(String raw) {
        if (raw == null || raw.isBlank()) return null;
        LocalDateTime d;
        try {
            String v = raw.trim().replace("Z", "");
            d = LocalDateTime.parse(v.length() == 16 ? v + ":00" : v.length() == 10 ? v + "T23:59:00" : v);
        } catch (Exception e) {
            throw new IllegalArgumentException("Give the date as a date and time");
        }
        if (d.isBefore(LocalDateTime.now(ZoneOffset.UTC).minusMinutes(1))) throw new IllegalArgumentException("That date has passed");
        return d;
    }

    /** Stored as typed: the screen escapes text when it shows it. */
    static String clean(String value, int max) {
        if (value == null) return null;
        String v = value.trim();
        if (v.isEmpty()) return null;
        return v.length() > max ? v.substring(0, max) : v;
    }

    static boolean truthy(Object v) {
        if (v == null) return false;
        if (v instanceof Boolean b) return b;
        if (v instanceof Number n) return n.longValue() != 0;
        return "true".equalsIgnoreCase(String.valueOf(v)) || "1".equals(String.valueOf(v));
    }

    private static long num(Object v) {
        return v instanceof Number n ? n.longValue() : 0;
    }
}
