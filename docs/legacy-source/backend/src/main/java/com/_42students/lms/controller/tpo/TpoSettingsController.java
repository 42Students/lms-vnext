package com._42students.lms.controller.tpo;

import com._42students.lms.model.tpo.CollegePlacementRules;
import com._42students.lms.model.tpo.CollegeWhatCompaniesSee;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.TpoSettingsService;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tpo/settings")
public class TpoSettingsController {

    private final TpoSettingsService settingsService;
    private final SecurityContextUtil securityContextUtil;

    public TpoSettingsController(TpoSettingsService settingsService, SecurityContextUtil securityContextUtil) {
        this.settingsService = settingsService;
        this.securityContextUtil = securityContextUtil;
    }

    private UserPrincipal principal() {
        return securityContextUtil.getAuthenticatedUserPrincipal();
    }

    @GetMapping("/placement-rules")
    public ResponseEntity<CollegePlacementRules> rules() {
        return ResponseEntity.ok(settingsService.rules(principal().getCollegeId()));
    }

    public static class RulesRequest {
        public String countsAsPlacedAt;
        public Integer maxHeldOffers;
        public Integer upliftPct;
        public Integer minResponseHours;
    }

    @PutMapping("/placement-rules")
    public ResponseEntity<CollegePlacementRules> saveRules(@RequestBody RulesRequest req) {
        return ResponseEntity.ok(settingsService.saveRules(principal().getCollegeId(),
                req.countsAsPlacedAt, req.maxHeldOffers, req.upliftPct, req.minResponseHours));
    }

    @GetMapping("/what-companies-see")
    public ResponseEntity<CollegeWhatCompaniesSee> whatCompaniesSee() {
        return ResponseEntity.ok(settingsService.whatCompaniesSee(principal().getCollegeId()));
    }

    @PutMapping("/what-companies-see")
    public ResponseEntity<CollegeWhatCompaniesSee> saveWhatCompaniesSee(@RequestBody CollegeWhatCompaniesSee body) {
        body.setCollegeId(principal().getCollegeId());
        return ResponseEntity.ok(settingsService.saveWhatCompaniesSee(body));
    }
}
