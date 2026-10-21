package com._42students.lms.controller.tpo;

import com._42students.lms.model.tpo.PlacementSeason;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.TpoAccessGuard;
import com._42students.lms.service.tpo.TpoSeasonService;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/tpo/season")
public class TpoSeasonController {

    private final TpoSeasonService seasonService;
    private final SecurityContextUtil securityContextUtil;
    private final TpoAccessGuard guard;

    public TpoSeasonController(TpoSeasonService seasonService, SecurityContextUtil securityContextUtil, TpoAccessGuard guard) {
        this.guard = guard;
        this.seasonService = seasonService;
        this.securityContextUtil = securityContextUtil;
    }

    private UserPrincipal principal() {
        return securityContextUtil.getAuthenticatedUserPrincipal();
    }

    @GetMapping
    public ResponseEntity<List<PlacementSeason>> list() {
        return ResponseEntity.ok(seasonService.seasonsFor(principal().getCollegeId()));
    }

    @GetMapping("/current")
    public ResponseEntity<PlacementSeason> current() {
        return ResponseEntity.ok(seasonService.current(principal().getCollegeId()));
    }

    public static class StartRequest {
        public String name;
        public LocalDate startDate;
        public LocalDate endDate;
    }

    @PostMapping
    public ResponseEntity<PlacementSeason> start(@RequestBody StartRequest req) {
        PlacementSeason season = seasonService.startSeason(principal().getCollegeId(), req.name, req.startDate, req.endDate);
        return ResponseEntity.status(HttpStatus.CREATED).body(season);
    }

    @PostMapping("/{seasonId}/open-registration")
    public ResponseEntity<PlacementSeason> openRegistration(@PathVariable Long seasonId, @RequestParam String deadline) {
        guard.requireSeason(principal(), seasonId);
        return ResponseEntity.ok(seasonService.openRegistration(seasonId, LocalDateTime.parse(deadline)));
    }
}
