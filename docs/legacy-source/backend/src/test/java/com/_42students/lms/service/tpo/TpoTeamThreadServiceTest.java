package com._42students.lms.service.tpo;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Team module V1 (docs/tpo-team/TEAM-MODULE-DESIGN-2026-10-12.md): conversations, mentions, asks and who can read what. */
class TpoTeamThreadServiceTest {

    private final NamedParameterJdbcTemplate jdbc = mock(NamedParameterJdbcTemplate.class);
    private final TpoTeamService team = mock(TpoTeamService.class);
    private final TpoAuditService audit = mock(TpoAuditService.class);
    private final TpoTeamThreadService svc = new TpoTeamThreadService(jdbc, team, audit);

    @BeforeEach
    void setUp() {
        when(team.team(6)).thenReturn(List.of(Map.of("facultyId", 12), Map.of("facultyId", 13)));
        when(team.collegeAccounts(6)).thenReturn(List.of(Map.of("facultyId", 1)));
        when(jdbc.queryForObject(contains("LAST_INSERT_ID"), any(MapSqlParameterSource.class), eq(Long.class))).thenReturn(9L);
        when(jdbc.queryForList(contains("FROM faculty WHERE id = :f"), any(MapSqlParameterSource.class), eq(String.class))).thenReturn(List.of("Ravi Kumar"));
    }

    private void thread(String kind, boolean isPrivate, boolean member) {
        Map<String, Object> row = new HashMap<>();
        row.put("id", 9L); row.put("kind", kind); row.put("title", "Omega · SDE"); row.put("isPrivate", isPrivate ? 1 : 0);
        row.put("isMember", member ? 1 : 0); row.put("isOwner", 0); row.put("newCount", 0L); row.put("muted", 0);
        when(jdbc.queryForList(contains("AND t.id = :t"), any(MapSqlParameterSource.class))).thenReturn(List.of(row));
    }

    private TpoTeamThreadService.Send body(String text) {
        TpoTeamThreadService.Send s = new TpoTeamThreadService.Send();
        s.body = text;
        return s;
    }

    @Test
    void aTopicNeedsWordsAndAPrivateOneNeedsSomeoneElse() {
        TpoTeamThreadService.Start s = new TpoTeamThreadService.Start();
        s.title = " ";
        assertThrows(IllegalArgumentException.class, () -> svc.start(6, 12, s));
        s.title = "Training vendor";
        s.isPrivate = true;
        assertThrows(IllegalArgumentException.class, () -> svc.start(6, 12, s));
        s.isPrivate = false;
        assertEquals(9L, svc.start(6, 12, s).get("id"), "a whole-team topic needs nobody picked");
    }

    @Test
    void onlyThePlacementTeamTakesPartOrIsAdded() {
        TpoTeamThreadService.Start s = new TpoTeamThreadService.Start();
        s.title = "Topic";
        s.people = List.of(99);
        assertThrows(IllegalArgumentException.class, () -> svc.start(6, 12, s));
        assertThrows(IllegalArgumentException.class, () -> svc.threads(6, 77), "a faculty member outside the team sees nothing");
        verify(jdbc, never()).update(contains("INSERT INTO tpo_team_thread "), any(MapSqlParameterSource.class));
    }

    @Test
    void aConversationSomeoneCannotReadLooksLikeItDoesNotExist() {
        when(jdbc.queryForList(contains("AND t.id = :t"), any(MapSqlParameterSource.class))).thenReturn(List.of());
        assertThrows(IllegalArgumentException.class, () -> svc.open(6, 13, 9));
        assertThrows(IllegalArgumentException.class, () -> svc.send(6, 13, 9, body("hello")));
    }

    @Test
    void aMentionTellsThatPersonOnly() {
        thread("DRIVE", false, true);
        svc.send(6, 12, 9, body("@[Ravi Kumar](f:13) can you send the shortlist? @[Nobody](f:99) too"));
        verify(audit).bellTo(eq(6), eq(13), eq("TEAM_MENTION"), contains("mentioned you"), anyString(), contains("/tpo/team?c=9"));
        verify(audit, never()).bellTo(eq(6), eq(99), anyString(), anyString(), any(), anyString());
        verify(audit, never()).bellTo(eq(6), eq(12), anyString(), anyString(), any(), anyString());
    }

    @Test
    void mentioningSomeoneOutsideAPrivateTopicAsksFirst() {
        thread("TOPIC", true, true);
        when(jdbc.queryForList(contains("SELECT faculty_id FROM tpo_team_thread_member"), any(MapSqlParameterSource.class), eq(Integer.class))).thenReturn(List.of(12));
        TeamNeedsAddingException e = assertThrows(TeamNeedsAddingException.class, () -> svc.send(6, 12, 9, body("@[Ravi Kumar](f:13) see this")));
        assertEquals(List.of("Ravi Kumar"), e.getPeople());
        TpoTeamThreadService.Send again = body("@[Ravi Kumar](f:13) see this");
        again.addPeople = true;
        svc.send(6, 12, 9, again);
        verify(jdbc).update(contains("INSERT INTO tpo_team_thread_member (thread_id, faculty_id, following, joined_reason) VALUES (:t, :f, :fo, :r)"), any(MapSqlParameterSource.class));
    }

    @Test
    void anAskIsForATeamMemberWithADateStillAhead() {
        thread("DRIVE", false, true);
        TpoTeamThreadService.Send ask = body("Send the shortlist to the HODs");
        ask.askAssigneeId = 99;
        assertThrows(IllegalArgumentException.class, () -> svc.send(6, 12, 9, ask));
        ask.askAssigneeId = 13;
        ask.askDueAt = "2020-01-01T10:00";
        assertThrows(IllegalArgumentException.class, () -> svc.send(6, 12, 9, ask));
        ask.askDueAt = "2099-01-01T10:00";
        svc.send(6, 12, 9, ask);
        verify(audit).bellTo(eq(6), eq(13), eq("TEAM_ASK"), contains("asked you"), anyString(), anyString());
    }

    @Test
    void onlyThePersonAskedMarksItDoneAndOnlyTheAskerCancels() {
        thread("DRIVE", false, true);
        Map<String, Object> ask = new HashMap<>();
        ask.put("thread_id", 9L); ask.put("assignee_faculty_id", 13); ask.put("asked_by_faculty_id", 12); ask.put("message_id", 5L); ask.put("body", "Call Infosys");
        when(jdbc.queryForList(contains("FROM tpo_team_ask a JOIN tpo_team_message m ON m.id = a.message_id WHERE a.id = :a"), any(MapSqlParameterSource.class))).thenReturn(List.of(ask));
        assertThrows(IllegalArgumentException.class, () -> svc.askDone(6, 12, 3, null));
        assertThrows(IllegalArgumentException.class, () -> svc.askCancel(6, 13, 3));
        when(jdbc.update(contains("UPDATE tpo_team_ask SET done_at"), any(MapSqlParameterSource.class))).thenReturn(1);
        svc.askDone(6, 13, 3, null);
        verify(audit).bellTo(eq(6), eq(12), eq("TEAM_ASK_DONE"), contains("did what you asked"), anyString(), anyString());
        when(jdbc.update(contains("UPDATE tpo_team_ask SET done_at"), any(MapSqlParameterSource.class))).thenReturn(0);
        assertThrows(IllegalStateException.class, () -> svc.askDone(6, 13, 3, null), "settled twice at once: the second is told");
    }

    @Test
    void everyoneCanOnlyBeMutedAndOnlyAPrivateTopicCanBeLeft() {
        thread("EVERYONE", false, false);
        assertThrows(IllegalStateException.class, () -> svc.setFollowing(6, 12, 9, false));
        assertThrows(IllegalStateException.class, () -> svc.leave(6, 12, 9));
        svc.setMuted(6, 12, 9, true);
        thread("DRIVE", false, true);
        assertThrows(IllegalStateException.class, () -> svc.leave(6, 12, 9));
        assertThrows(IllegalStateException.class, () -> svc.updateTopic(6, 12, 9, "New name", null), "a drive's conversation is named after the drive");
    }

    @Test
    void anOldMessageCantBeEdited() {
        Map<String, Object> m = new HashMap<>();
        m.put("thread_id", 9L); m.put("body", "hi");
        when(jdbc.queryForList(contains("m.author_faculty_id = :me AND m.kind = 'MESSAGE'"), any(MapSqlParameterSource.class))).thenReturn(List.of(m));
        thread("DRIVE", false, true);
        when(jdbc.queryForObject(contains("INTERVAL 15 MINUTE"), any(MapSqlParameterSource.class), eq(Integer.class))).thenReturn(0);
        assertThrows(IllegalStateException.class, () -> svc.edit(6, 12, 5, "hi there", false));
    }

    @Test
    void followingFollowsTheRules() {
        assertTrue(TpoTeamThreadService.following("EVERYONE", null, false, false, false));
        assertTrue(TpoTeamThreadService.following("DRIVE", null, true, false, false), "the drive's owner follows it");
        assertFalse(TpoTeamThreadService.following("DRIVE", null, false, false, true), "opening it is not following it");
        assertTrue(TpoTeamThreadService.following("TOPIC", null, false, true, true), "a private topic's members follow it");
        assertFalse(TpoTeamThreadService.following("DRIVE", 0, true, false, true), "an owner who stopped following is not nagged");
    }

    @Test
    void mentionsAndChipsReadAsWords() {
        assertEquals("@Ravi Kumar ask Infosys about Omega · SDE", TpoTeamThreadService.preview("@[Ravi Kumar](f:13) ask #[Infosys](c:infosys) about #[Omega · SDE](d:40)", 200));
        TpoTeamThreadService.Mentions m = TpoTeamThreadService.mentions("@[Ravi](f:13) @[Me](f:12) @[team](team) @[X](f:99)", Set.of(12, 13), 12);
        assertEquals(Set.of(13), m.people());
        assertTrue(m.team());
        // One company however it was typed, the way Engage > Companies groups them.
        assertEquals("infosys", TpoTeamThreadService.normalizeKey("COMPANY", "  Infosys   Ltd "));
        assertEquals(TpoTeamThreadService.normalizeKey("COMPANY", "Infosys Limited"), TpoTeamThreadService.normalizeKey("COMPANY", "infosys"));
        assertThrows(IllegalArgumentException.class, () -> TpoTeamThreadService.normalizeKey("DRIVE", "abc"));
    }

    @Test
    void textIsStoredAsTyped() {
        assertEquals("Tom & Jerry <3", TpoTeamThreadService.clean("  Tom & Jerry <3 ", 100));
    }

    @Test
    void writingAboutADriveOfAnotherCollegeIsRefused() {
        when(jdbc.queryForList(contains("FROM job WHERE id = :k AND college_id = :c"), any(MapSqlParameterSource.class), eq(String.class))).thenReturn(List.of());
        assertThrows(IllegalArgumentException.class, () -> svc.sendAbout(6, 12, "DRIVE", "40", body("hello")));
        verify(jdbc, never()).update(contains("INSERT IGNORE INTO tpo_team_thread "), any(MapSqlParameterSource.class));
        verify(audit, never()).bellTo(anyInt(), anyInt(), anyString(), anyString(), isNull(), anyString());
    }
}
