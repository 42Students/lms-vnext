package com._42students.lms.controller;

import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.PlacementAnnouncementService;
import com._42students.lms.util.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** 42 writes to every placement cell (N12). Restricted to ROLE_SUPER_ADMIN in WebSecurityConfig. */
@RestController
@RequestMapping("/api/v1/superadmin/announcements")
@RequiredArgsConstructor
public class SuperAdminAnnouncementController {

    private final PlacementAnnouncementService announcements;
    private final SecurityContextUtil securityContextUtil;

    /** 42's announcements to placement cells, with "N of M placement cells read". */
    @GetMapping
    public List<Map<String, Object>> list() {
        return announcements.allFrom42();
    }

    /** The colleges that have a placement cell, for picking some. */
    @GetMapping("/placement-cells")
    public List<Map<String, Object>> placementCells() {
        return announcements.placementCells();
    }

    @PostMapping
    public Map<String, Object> post(@RequestBody PlacementAnnouncementService.Draft d) {
        UserPrincipal me = securityContextUtil.getAuthenticatedUserPrincipal();
        return announcements.postToTpos(d, new PlacementAnnouncementService.Author("SUPER_ADMIN", me.getId()));
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable long id, @RequestBody PlacementAnnouncementService.Draft d) {
        announcements.updateFrom42(id, d);
        return Map.of("status", "UPDATED");
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable long id) {
        announcements.deleteFrom42(id);
        return Map.of("status", "DELETED");
    }
}
