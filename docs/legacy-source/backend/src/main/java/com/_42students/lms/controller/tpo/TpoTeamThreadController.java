package com._42students.lms.controller.tpo;

import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.TeamNeedsAddingException;
import com._42students.lms.service.tpo.TpoTeamPeopleService;
import com._42students.lms.service.tpo.TpoTeamThreadService;
import com._42students.lms.util.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Team module V1 (docs/tpo-team/TEAM-MODULE-DESIGN-2026-10-12.md): the placement team's conversations, asks, decisions and People.
 * Under /api/v1/tpo, so the TPO access filter applies; the services also check the caller is in this college's placement team.
 */
@RestController
@RequestMapping("/api/v1/tpo/team")
@RequiredArgsConstructor
public class TpoTeamThreadController {

    private final TpoTeamThreadService threads;
    private final TpoTeamPeopleService people;
    private final SecurityContextUtil securityContextUtil;

    public static class PeopleBody { public List<Integer> people; }
    public static class OnBody { public Boolean on; }
    public static class NoteBody { public String note; }
    public static class EditBody { public String body; public Boolean addPeople; }
    public static class TopicBody { public String title; public Boolean isPrivate; }
    public static class AwayBody { public String until; }
    public static class AssignBody { public List<Integer> driveIds; public List<String> companies; public Integer to; }

    private UserPrincipal p() {
        return securityContextUtil.getAuthenticatedUserPrincipal();
    }

    private Integer c() {
        return p().getCollegeId();
    }

    private int me() {
        return p().getId();
    }

    // ---------------------------------------------------------------- conversations
    @GetMapping("/threads")
    public List<Map<String, Object>> list() { return threads.threads(c(), me()); }

    @GetMapping("/threads/unread")
    public Map<String, Object> unread() { return Map.of("unread", threads.unread(c(), me())); }

    @GetMapping("/threads/search")
    public List<Map<String, Object>> search(@RequestParam(required = false) String q) { return threads.search(c(), me(), q); }

    @GetMapping("/threads/about")
    public Map<String, Object> about(@RequestParam String kind, @RequestParam String key) { return threads.about(c(), me(), kind, key); }

    @PostMapping("/threads/about/messages")
    public Map<String, Object> sendAbout(@RequestParam String kind, @RequestParam String key, @RequestBody TpoTeamThreadService.Send body) {
        return threads.sendAbout(c(), me(), kind, key, body);
    }

    @PostMapping("/threads")
    public Map<String, Object> start(@RequestBody TpoTeamThreadService.Start body) { return threads.start(c(), me(), body); }

    @GetMapping("/threads/{threadId}")
    public Map<String, Object> open(@PathVariable long threadId) { return threads.open(c(), me(), threadId); }

    @PostMapping("/threads/{threadId}/messages")
    public Map<String, Object> send(@PathVariable long threadId, @RequestBody TpoTeamThreadService.Send body) { return threads.send(c(), me(), threadId, body); }

    @PostMapping("/threads/{threadId}/people")
    public Map<String, Object> addPeople(@PathVariable long threadId, @RequestBody PeopleBody b) {
        threads.addPeople(c(), me(), threadId, b == null ? null : b.people);
        return Map.of("status", "ADDED");
    }

    @PostMapping("/threads/{threadId}/follow")
    public Map<String, Object> follow(@PathVariable long threadId, @RequestBody OnBody b) {
        threads.setFollowing(c(), me(), threadId, b != null && Boolean.TRUE.equals(b.on));
        return Map.of("status", "OK");
    }

    @PostMapping("/threads/{threadId}/mute")
    public Map<String, Object> mute(@PathVariable long threadId, @RequestBody OnBody b) {
        threads.setMuted(c(), me(), threadId, b != null && Boolean.TRUE.equals(b.on));
        return Map.of("status", "OK");
    }

    @PostMapping("/threads/{threadId}/leave")
    public Map<String, Object> leave(@PathVariable long threadId) {
        threads.leave(c(), me(), threadId);
        return Map.of("status", "LEFT");
    }

    @PutMapping("/threads/{threadId}")
    public Map<String, Object> updateTopic(@PathVariable long threadId, @RequestBody TopicBody b) {
        threads.updateTopic(c(), me(), threadId, b == null ? null : b.title, b == null ? null : b.isPrivate);
        return Map.of("status", "OK");
    }

    // ---------------------------------------------------------------- messages
    @PutMapping("/messages/{messageId}")
    public Map<String, Object> edit(@PathVariable long messageId, @RequestBody EditBody b) {
        threads.edit(c(), me(), messageId, b == null ? null : b.body, b != null && Boolean.TRUE.equals(b.addPeople));
        return Map.of("status", "EDITED");
    }

    @DeleteMapping("/messages/{messageId}")
    public Map<String, Object> delete(@PathVariable long messageId) {
        threads.delete(c(), me(), messageId);
        return Map.of("status", "DELETED");
    }

    @PostMapping("/messages/{messageId}/decision")
    public Map<String, Object> decision(@PathVariable long messageId, @RequestBody OnBody b) {
        threads.decision(c(), me(), messageId, b == null || !Boolean.FALSE.equals(b.on));
        return Map.of("status", "OK");
    }

    // ---------------------------------------------------------------- asks and mentions
    @PostMapping("/asks/{askId}/done")
    public Map<String, Object> askDone(@PathVariable long askId, @RequestBody(required = false) NoteBody b) {
        threads.askDone(c(), me(), askId, b == null ? null : b.note);
        return Map.of("status", "DONE");
    }

    @PostMapping("/asks/{askId}/cancel")
    public Map<String, Object> askCancel(@PathVariable long askId) {
        threads.askCancel(c(), me(), askId);
        return Map.of("status", "CANCELLED");
    }

    @GetMapping("/asks/mine")
    public List<Map<String, Object>> myAsks() { return threads.asksOn(c(), me()); }

    @GetMapping("/mentions")
    public List<Map<String, Object>> mentions() { return threads.mentionsOf(c(), me()); }

    @GetMapping("/summary")
    public Map<String, Object> summary() { return threads.summary(c(), me()); }

    @GetMapping("/lookup")
    public Map<String, Object> lookup(@RequestParam(required = false) String q) { return threads.lookup(c(), me(), q); }

    // ---------------------------------------------------------------- people
    @GetMapping("/people")
    public Map<String, Object> people() { return people.people(c(), me()); }

    @PutMapping("/people/{facultyId}/away")
    public Map<String, Object> away(@PathVariable int facultyId, @RequestBody(required = false) AwayBody b) {
        people.setAway(c(), me(), facultyId, b == null ? null : b.until);
        return Map.of("status", "OK");
    }

    @PostMapping("/assign")
    public Map<String, Object> assign(@RequestBody AssignBody b) {
        return people.assign(c(), me(), b == null ? null : b.driveIds, b == null ? null : b.companies, b == null ? null : b.to);
    }

    /** Mentioning or asking someone outside a private conversation: the screen asks "Add them?" and sends again. */
    @ExceptionHandler(TeamNeedsAddingException.class)
    public ResponseEntity<Map<String, Object>> needsAdding(TeamNeedsAddingException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", "ADD_PEOPLE", "people", e.getPeople(), "error", e.getMessage(), "message", e.getMessage()));
    }
}
